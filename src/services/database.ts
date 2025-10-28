import { PrismaClient } from '@prisma/client';
import logger from '../lib/logger';

// Singleton Prisma client
let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      (prisma as any).$on('query', (e: any) => {
        logger.debug('Database query', {
          query: e.query,
          params: e.params,
          duration: `${e.duration}ms`,
        });
      });
    }

    (prisma as any).$on('error', (e: any) => {
      logger.error('Database error', { error: e.message });
    });

    (prisma as any).$on('warn', (e: any) => {
      logger.warn('Database warning', { message: e.message });
    });
  }

  return prisma;
}

export async function disconnectDatabase(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  }
}

export default getPrismaClient();

