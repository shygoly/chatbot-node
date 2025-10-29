import { createServer } from 'http';
import app from './app';
import config from './config';
import logger from './lib/logger';
import websocketService from './services/websocket.service';
import webhookQueue from './services/webhook-queue.service';
import webhookHandler from './services/webhook-handler.service';

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
websocketService.initialize(httpServer);

// Initialize Webhook Queue (only if Redis is configured)
try {
  webhookQueue.initialize();
  
  // Setup webhook processors
  webhookQueue.process('product', async (job) => {
    return await webhookHandler.handleProductEvent(job);
  });
  
  webhookQueue.process('order', async (job) => {
    return await webhookHandler.handleOrderEvent(job);
  });
  
  webhookQueue.process('customer', async (job) => {
    return await webhookHandler.handleCustomerEvent(job);
  });
  
  logger.info('Webhook queue initialized and processors registered');
} catch (error: any) {
  logger.warn('Webhook queue initialization failed (Redis not available?)', {
    error: error.message,
  });
  logger.info('Webhooks will be processed synchronously without queue');
}

// Start server
const server = httpServer.listen(config.server.port, () => {
  logger.info('Server started', {
    port: config.server.port,
    env: config.server.env,
    database: config.database.url.includes('file:') ? 'SQLite' : 'PostgreSQL',
    websocket: 'enabled',
  });
  console.log(`⚡ WebSocket: Enabled`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
  process.exit(1);
});

