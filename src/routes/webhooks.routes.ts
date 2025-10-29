import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../lib/logger';
import webhookQueue from '../services/webhook-queue.service';

const router = Router();

/**
 * Middleware to validate webhook signature
 */
function validateSignature(req: Request, res: Response, next: NextFunction): void {
  const signature = req.headers['x-evershop-signature'] as string;
  const secret = process.env.EVERSHOP_WEBHOOK_SECRET;

  // In development, allow webhooks without signature for testing
  if (process.env.NODE_ENV === 'development' && !signature) {
    logger.warn('Webhook signature validation skipped (development mode)');
    next();
    return;
  }

  if (!signature) {
    logger.warn('Webhook signature missing');
    res.status(401).json({
      code: 1,
      msg: 'Missing webhook signature',
    });
    return;
  }

  if (!secret) {
    logger.error('EVERSHOP_WEBHOOK_SECRET not configured');
    res.status(500).json({
      code: 1,
      msg: 'Webhook secret not configured',
    });
    return;
  }

  try {
    // Calculate expected signature
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Compare signatures
    if (signature !== expectedSignature) {
      logger.warn('Invalid webhook signature', {
        received: signature,
        expected: expectedSignature.substring(0, 10) + '...',
      });
      res.status(401).json({
        code: 1,
        msg: 'Invalid webhook signature',
      });
      return;
    }

    logger.debug('Webhook signature validated successfully');
    next();
  } catch (error: any) {
    logger.error('Webhook signature validation error', {
      error: error.message,
    });
    res.status(500).json({
      code: 1,
      msg: 'Signature validation failed',
    });
  }
}

/**
 * POST /api/webhooks/evershop/product
 * Receive product events from EverShop
 */
router.post('/evershop/product', validateSignature, async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data, timestamp } = req.body;

    if (!event || !data) {
      res.status(400).json({
        code: 1,
        msg: 'Missing event or data in webhook payload',
      });
      return;
    }

    logger.info('Product webhook received', {
      event,
      productId: data.id || data.productId,
      timestamp,
    });

    // Queue for processing
    await webhookQueue.addJob('product', {
      event,
      data,
      receivedAt: timestamp || new Date().toISOString(),
    });

    // Acknowledge immediately (queue will process async)
    res.json({
      code: 0,
      msg: 'Webhook received and queued',
      data: { event, queued: true },
    });
  } catch (error: any) {
    logger.error('Failed to process product webhook', {
      error: error.message,
    });
    res.status(500).json({
      code: 1,
      msg: 'Failed to process webhook',
      data: { error: error.message },
    });
  }
});

/**
 * POST /api/webhooks/evershop/order
 * Receive order events from EverShop
 */
router.post('/evershop/order', validateSignature, async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data, timestamp } = req.body;

    if (!event || !data) {
      res.status(400).json({
        code: 1,
        msg: 'Missing event or data in webhook payload',
      });
      return;
    }

    logger.info('Order webhook received', {
      event,
      orderId: data.id || data.orderId,
      orderNumber: data.orderNumber || data.order_number,
      timestamp,
    });

    // Queue for processing
    await webhookQueue.addJob('order', {
      event,
      data,
      receivedAt: timestamp || new Date().toISOString(),
    });

    // Acknowledge immediately
    res.json({
      code: 0,
      msg: 'Webhook received and queued',
      data: { event, queued: true },
    });
  } catch (error: any) {
    logger.error('Failed to process order webhook', {
      error: error.message,
    });
    res.status(500).json({
      code: 1,
      msg: 'Failed to process webhook',
      data: { error: error.message },
    });
  }
});

/**
 * POST /api/webhooks/evershop/customer
 * Receive customer events from EverShop
 */
router.post('/evershop/customer', validateSignature, async (req: Request, res: Response): Promise<void> => {
  try {
    const { event, data, timestamp } = req.body;

    if (!event || !data) {
      res.status(400).json({
        code: 1,
        msg: 'Missing event or data in webhook payload',
      });
      return;
    }

    logger.info('Customer webhook received', {
      event,
      customerId: data.id || data.customerId,
      customerEmail: data.email,
      timestamp,
    });

    // Queue for processing
    await webhookQueue.addJob('customer', {
      event,
      data,
      receivedAt: timestamp || new Date().toISOString(),
    });

    // Acknowledge immediately
    res.json({
      code: 0,
      msg: 'Webhook received and queued',
      data: { event, queued: true },
    });
  } catch (error: any) {
    logger.error('Failed to process customer webhook', {
      error: error.message,
    });
    res.status(500).json({
      code: 1,
      msg: 'Failed to process webhook',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/webhooks/stats
 * Get webhook queue statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await webhookQueue.getStats();

    res.json({
      code: 0,
      msg: 'success',
      data: stats,
    });
  } catch (error: any) {
    logger.error('Failed to get webhook stats', {
      error: error.message,
    });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get stats',
      data: { error: error.message },
    });
  }
});

/**
 * POST /api/webhooks/test
 * Test webhook (development only)
 */
router.post('/test', async (req: Request, res: Response): Promise<void> => {
  if (process.env.NODE_ENV !== 'development') {
    res.status(404).json({
      code: 1,
      msg: 'Not found',
    });
    return;
  }

  try {
    const { type, event, data } = req.body;

    if (!type || !event || !data) {
      res.status(400).json({
        code: 1,
        msg: 'Missing type, event, or data',
      });
      return;
    }

    await webhookQueue.addJob(type, {
      event,
      data,
      receivedAt: new Date().toISOString(),
    });

    res.json({
      code: 0,
      msg: 'Test webhook queued successfully',
      data: { type, event },
    });
  } catch (error: any) {
    logger.error('Failed to queue test webhook', {
      error: error.message,
    });
    res.status(500).json({
      code: 1,
      msg: 'Failed to queue test webhook',
      data: { error: error.message },
    });
  }
});

export default router;

