import app from './app';
import config from './config';
import logger from './lib/logger';

const server = app.listen(config.server.port, () => {
  logger.info('Server started', {
    port: config.server.port,
    env: config.server.env,
    database: config.database.url.includes('file:') ? 'SQLite' : 'PostgreSQL',
  });
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

