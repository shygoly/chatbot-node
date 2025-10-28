import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import logger from '../lib/logger';

export interface AuthRequest extends Request {
  userId?: number;
  username?: string;
}

/**
 * Middleware to verify JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization token provided',
        statusCode: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const payload = authService.verifyToken(token);

    // Attach user info to request
    (req as AuthRequest).userId = payload.userId;
    (req as AuthRequest).username = payload.username;

    next();
  } catch (error: any) {
    logger.warn('Authentication failed', {
      error: error.message,
      path: req.path,
    });

    res.status(401).json({
      error: 'Unauthorized',
      message: error.message || 'Invalid or expired token',
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional auth - don't fail if no token, just don't set user
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const payload = authService.verifyToken(token);
      (req as AuthRequest).userId = payload.userId;
      (req as AuthRequest).username = payload.username;
    }

    next();
  } catch (error) {
    // Silently ignore auth errors for optional auth
    next();
  }
}

