import { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import { ErrorResponse } from '../types';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  const errorResponse: ErrorResponse = {
    error: err.name || 'Error',
    message,
    statusCode,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  // Log error with context
  logger.error('Request error', {
    requestId: (req as any).requestId,
    method: req.method,
    path: req.path,
    statusCode,
    error: message,
    stack: err.stack,
    backendCode: err.backendCode,
  });

  res.status(statusCode).json(errorResponse);
}

// Async error wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

