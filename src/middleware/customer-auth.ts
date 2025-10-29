import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import inboxUsersService from '../services/inbox-users.service';

/**
 * Customer authentication middleware
 * Supports both anonymous sessions and logged-in EverShop customers
 */

declare global {
  namespace Express {
    interface Request {
      customer?: {
        id: string;
        sessionId: string;
        customerId?: string;
        email?: string;
        isAnonymous: boolean;
      };
    }
  }
}

/**
 * Middleware to handle customer authentication
 * Creates or retrieves inbox user based on session or customer ID
 */
export async function customerAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get session ID from header or query
    const sessionId = req.headers['x-session-id'] as string || req.query.sessionId as string;
    
    // Get customer ID from header or query (optional)
    const customerId = req.headers['x-customer-id'] as string || req.query.customerId as string;
    
    // Get customer email from header (optional)
    const customerEmail = req.headers['x-customer-email'] as string;

    if (!sessionId) {
      res.status(401).json({
        code: 1,
        msg: 'Session ID is required',
      });
      return;
    }

    // Determine if this is an anonymous or logged-in session
    const isAnonymous = !customerId;
    const userId = customerId || sessionId;

    // Generate email for inbox user
    const userEmail = customerEmail || `${userId}@guest.local`;
    const shopId = req.body.shopId || req.query.shopId as string || 'default';

    // Get or create inbox user
    let inboxUser = await inboxUsersService.login(userEmail, shopId);

    logger.info('Customer inbox user retrieved', {
      userId,
      inboxUserId: inboxUser.id,
      sessionId,
      isAnonymous,
      email: userEmail,
    });

    // Attach customer info to request
    req.customer = {
      id: userId,
      sessionId,
      customerId: customerId || undefined,
      email: inboxUser.userEmail || undefined,
      isAnonymous,
    };

    logger.debug('Customer authenticated', {
      userId: req.customer.id,
      isAnonymous: req.customer.isAnonymous,
    });

    next();
  } catch (error: any) {
    logger.error('Customer authentication error', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Authentication error',
      data: { error: error.message },
    });
  }
}

/**
 * Middleware to validate EverShop customer token (optional)
 * Can be used if you want to verify logged-in customers
 */
export async function validateCustomerToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.headers['x-customer-token'] as string;

    if (!token) {
      res.status(401).json({
        code: 1,
        msg: 'Customer token is required',
      });
      return;
    }

    // TODO: Implement token validation with EverShop API
    // For now, we'll just pass through
    logger.info('Customer token validation not implemented yet', { token });

    next();
  } catch (error: any) {
    logger.error('Token validation error', { error: error.message });
    res.status(401).json({
      code: 1,
      msg: 'Invalid customer token',
      data: { error: error.message },
    });
  }
}

/**
 * Optional middleware to require authenticated (non-anonymous) customers
 */
export function requireAuthenticatedCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.customer || req.customer.isAnonymous) {
    res.status(403).json({
      code: 1,
      msg: 'This action requires an authenticated customer',
    });
    return;
  }

  next();
}

