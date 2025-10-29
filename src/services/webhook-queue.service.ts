import Bull, { Queue, Job } from 'bull';
import logger from '../lib/logger';

interface WebhookJobData {
  event: string;
  data: any;
  receivedAt: string;
}

class WebhookQueueService {
  private queue: Queue<WebhookJobData> | null = null;

  /**
   * Initialize webhook queue
   */
  initialize(): void {
    if (this.queue) {
      logger.warn('Webhook queue already initialized');
      return;
    }

    const redisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    };

    this.queue = new Bull('webhooks', {
      redis: redisConfig,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // 2s, 4s, 8s
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: false, // Keep failed jobs for debugging
      },
    });

    this.setupEventListeners();

    logger.info('Webhook queue initialized', {
      redis: `${redisConfig.host}:${redisConfig.port}`,
    });
  }

  /**
   * Setup queue event listeners
   */
  private setupEventListeners(): void {
    if (!this.queue) return;

    // Job completed
    this.queue.on('completed', (job: Job, result: any) => {
      logger.info('Webhook job completed', {
        jobId: job.id,
        event: job.data.event,
        duration: Date.now() - new Date(job.data.receivedAt).getTime(),
        result,
      });
    });

    // Job failed
    this.queue.on('failed', (job: Job, err: Error) => {
      logger.error('Webhook job failed', {
        jobId: job.id,
        event: job.data.event,
        error: err.message,
        attemptsMade: job.attemptsMade,
        maxAttempts: job.opts.attempts,
      });

      // If all retries exhausted, move to dead letter queue
      if (job.attemptsMade >= (job.opts.attempts || 3)) {
        logger.error('Webhook job exhausted all retries', {
          jobId: job.id,
          event: job.data.event,
          data: job.data,
        });
        // TODO: Implement dead letter queue or alerting
      }
    });

    // Job is active
    this.queue.on('active', (job: Job) => {
      logger.debug('Webhook job started processing', {
        jobId: job.id,
        event: job.data.event,
      });
    });

    // Queue error
    this.queue.on('error', (error: Error) => {
      logger.error('Webhook queue error', { error: error.message });
    });
  }

  /**
   * Add webhook job to queue
   */
  async addJob(
    type: 'product' | 'order' | 'customer',
    data: WebhookJobData
  ): Promise<Job<WebhookJobData> | null> {
    if (!this.queue) {
      logger.error('Cannot add job: queue not initialized');
      return null;
    }

    try {
      const job = await this.queue.add(type, data, {
        priority: this.getJobPriority(data.event),
      });

      logger.info('Webhook job queued', {
        jobId: job.id,
        type,
        event: data.event,
      });

      return job;
    } catch (error: any) {
      logger.error('Failed to queue webhook job', {
        type,
        event: data.event,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Get job priority based on event type
   */
  private getJobPriority(event: string): number {
    // Higher number = higher priority
    const priorities: Record<string, number> = {
      'order.created': 10, // Highest priority
      'order.updated': 9,
      'customer.created': 8,
      'product.created': 5,
      'product.updated': 4,
      'product.deleted': 4,
    };

    return priorities[event] || 1;
  }

  /**
   * Process webhook jobs
   */
  process(
    type: 'product' | 'order' | 'customer',
    processor: (job: Job<WebhookJobData>) => Promise<any>
  ): void {
    if (!this.queue) {
      logger.error('Cannot process jobs: queue not initialized');
      return;
    }

    this.queue.process(type, async (job) => {
      logger.info('Processing webhook job', {
        jobId: job.id,
        type,
        event: job.data.event,
      });

      return await processor(job);
    });
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    if (!this.queue) {
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      };
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.queue.getWaitingCount(),
      this.queue.getActiveCount(),
      this.queue.getCompletedCount(),
      this.queue.getFailedCount(),
      this.queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Clean old jobs
   */
  async clean(grace: number = 86400000): Promise<void> {
    if (!this.queue) return;

    // Clean completed jobs older than grace period (default: 24 hours)
    await this.queue.clean(grace, 'completed');
    logger.info('Cleaned old webhook jobs', { grace });
  }

  /**
   * Close queue connection
   */
  async close(): Promise<void> {
    if (this.queue) {
      await this.queue.close();
      this.queue = null;
      logger.info('Webhook queue closed');
    }
  }

  /**
   * Get queue instance (for testing)
   */
  getQueue(): Queue<WebhookJobData> | null {
    return this.queue;
  }
}

// Export singleton instance
export default new WebhookQueueService();

