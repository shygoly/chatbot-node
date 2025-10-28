import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import logger from '../lib/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  (req as any).requestId = requestId;

  const startTime = Date.now();

  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}

