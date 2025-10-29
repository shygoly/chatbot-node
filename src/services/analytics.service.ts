import prisma from './database';
import logger from '../lib/logger';
import { format } from 'date-fns';

export interface AnalyticsOverview {
  period: { start: Date; end: Date };
  totalConversations: number;
  activeConversations: number;
  resolvedConversations: number;
  avgResponseTime: number; // seconds
  avgResolutionTime: number; // seconds
  csatScore: number; // 1-5 scale (placeholder for now)
  resolutionRate: number; // percentage
}

export interface ConversationVolume {
  date: string;
  count: number;
  comparison?: {
    previousCount: number;
    percentChange: number;
  };
}

export interface ResponseTimeMetrics {
  avg: number;
  median: number;
  min: number;
  max: number;
  distribution: Array<{ range: string; count: number }>;
}

export interface AgentPerformance {
  agentId: number;
  agentName: string;
  conversationsHandled: number;
  avgResponseTime: number;
  messagesCount: number;
}

class AnalyticsService {
  /**
   * Get overview metrics
   */
  async getOverview(startDate: Date, endDate: Date): Promise<AnalyticsOverview> {
    try {
      logger.info('Calculating overview metrics', { startDate, endDate });

      // Total conversations in period
      const totalConversations = await prisma.cozeConversation.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          deleted: 0,
        },
      });

      // Active conversations (with messages in period)
      const activeConversations = await prisma.cozeConversation.count({
        where: {
          updatedAt: {
            gte: startDate,
            lte: endDate,
          },
          deleted: 0,
        },
      });

      // Calculate response times (simplified for MVP)
      const overviewMessages = await prisma.cozeChatHistory.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          deleted: 0,
        },
        select: {
          conversationId: true,
          sender: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Calculate average response time
      let totalResponseTime = 0;
      let responseCount = 0;

      for (let i = 1; i < overviewMessages.length; i++) {
        if (
          overviewMessages[i].sender === 'assistant' &&
          overviewMessages[i - 1].sender === 'user' &&
          overviewMessages[i].conversationId === overviewMessages[i - 1].conversationId
        ) {
          const responseTime =
            (overviewMessages[i].createdAt.getTime() - overviewMessages[i - 1].createdAt.getTime()) / 1000;
          totalResponseTime += responseTime;
          responseCount++;
        }
      }

      const avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount : 0;

      return {
        period: { start: startDate, end: endDate },
        totalConversations,
        activeConversations,
        resolvedConversations: 0, // TODO: Implement when status table exists
        avgResponseTime,
        avgResolutionTime: 0, // TODO: Calculate from status changes
        csatScore: 4.2, // Placeholder
        resolutionRate: totalConversations > 0 ? (activeConversations / totalConversations) * 100 : 0,
      };
    } catch (error: any) {
      logger.error('Failed to calculate overview metrics', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get conversation volume over time
   */
  async getConversationVolume(
    startDate: Date,
    endDate: Date,
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<ConversationVolume[]> {
    try {
      logger.info('Calculating conversation volume', {
        startDate,
        endDate,
        granularity,
      });

      // For MVP, only support daily granularity
      const conversations = await prisma.cozeConversation.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          deleted: 0,
        },
        select: {
          createdAt: true,
        },
      });

      // Group by date
      const volumeMap = new Map<string, number>();

      conversations.forEach((conv) => {
        const dateKey = format(conv.createdAt, 'yyyy-MM-dd');
        volumeMap.set(dateKey, (volumeMap.get(dateKey) || 0) + 1);
      });

      // Convert to array
      const result: ConversationVolume[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        result.push({
          date: dateKey,
          count: volumeMap.get(dateKey) || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return result;
    } catch (error: any) {
      logger.error('Failed to calculate conversation volume', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get response time metrics
   */
  async getResponseTimeMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<ResponseTimeMetrics> {
    try {
      logger.info('Calculating response time metrics', { startDate, endDate });

      const messages = await prisma.cozeChatHistory.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          deleted: 0,
        },
        select: {
          conversationId: true,
          sender: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Calculate response times
      const responseTimes: number[] = [];

      for (let i = 1; i < messages.length; i++) {
        if (
          messages[i].sender === 'assistant' &&
          messages[i - 1].sender === 'user' &&
          messages[i].conversationId === messages[i - 1].conversationId
        ) {
          const responseTime =
            (messages[i].createdAt.getTime() - messages[i - 1].createdAt.getTime()) / 1000;
          responseTimes.push(responseTime);
        }
      }

      if (responseTimes.length === 0) {
        return {
          avg: 0,
          median: 0,
          min: 0,
          max: 0,
          distribution: [],
        };
      }

      // Calculate statistics
      responseTimes.sort((a, b) => a - b);
      const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const median = responseTimes[Math.floor(responseTimes.length / 2)];
      const min = responseTimes[0];
      const max = responseTimes[responseTimes.length - 1];

      // Distribution (0-30s, 30-60s, 60-300s, 300+s)
      const distribution = [
        { range: '0-30s', count: responseTimes.filter((t) => t < 30).length },
        { range: '30-60s', count: responseTimes.filter((t) => t >= 30 && t < 60).length },
        { range: '1-5min', count: responseTimes.filter((t) => t >= 60 && t < 300).length },
        { range: '5min+', count: responseTimes.filter((t) => t >= 300).length },
      ];

      return {
        avg,
        median,
        min,
        max,
        distribution,
      };
    } catch (error: any) {
      logger.error('Failed to calculate response time metrics', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get agent performance metrics
   */
  async getAgentPerformance(
    startDate: Date,
    endDate: Date
  ): Promise<AgentPerformance[]> {
    try {
      logger.info('Calculating agent performance', { startDate, endDate });

      // For MVP, we'll calculate based on message counts
      // Future: Use conversation_assignments table

      const messages = await prisma.cozeChatHistory.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          sender: 'assistant',
          deleted: 0,
        },
        select: {
          conversationId: true,
          createdAt: true,
        },
      });

      // For MVP, simulate agent performance
      // In production, this would query actual agent assignments
      const agentStats: AgentPerformance[] = [
        {
          agentId: 1,
          agentName: 'Admin',
          conversationsHandled: new Set(messages.map((m) => m.conversationId)).size,
          avgResponseTime: 45, // seconds (simulated)
          messagesCount: messages.length,
        },
      ];

      return agentStats;
    } catch (error: any) {
      logger.error('Failed to calculate agent performance', {
        error: error.message,
      });
      throw error;
    }
  }
}

// Export singleton instance
export default new AnalyticsService();

