import prisma from './database';
import { Prisma } from '@prisma/client';

export interface ChatMessageInput {
  inboxUserId?: number;
  conversationId?: string;
  shopId?: string;
  botId?: string;
  content?: string;
  sender?: string;
  sessionId?: string;
  replyId?: number;
}

export interface ChatHistoryFilters {
  inboxUserId?: string;
  conversationId?: string;
  shopId?: string;
  botId?: string;
  content?: string;
  sender?: string;
  sessionId?: string;
  pageNo: number;
  pageSize: number;
}

class ChatHistoryService {
  /**
   * Create chat message
   */
  async createMessage(data: ChatMessageInput) {
    return await prisma.cozeChatHistory.create({
      data: {
        inboxUserId: data.inboxUserId,
        conversationId: data.conversationId,
        shopId: data.shopId,
        botId: data.botId,
        content: data.content,
        sender: data.sender,
        sessionId: data.sessionId,
        replyId: data.replyId,
      },
    });
  }

  /**
   * Update chat message
   */
  async update(id: number, data: Partial<ChatMessageInput>) {
    return await prisma.cozeChatHistory.update({
      where: { id },
      data,
    });
  }

  /**
   * Get chat message by ID
   */
  async getById(id: number) {
    const chat = await prisma.cozeChatHistory.findFirst({
      where: { id, deleted: 0 },
    });

    if (!chat) {
      const error: any = new Error('Chat history not found');
      error.statusCode = 404;
      throw error;
    }

    return chat;
  }

  /**
   * List chat history with filters and pagination
   */
  async list(filters: ChatHistoryFilters) {
    const where: Prisma.CozeChatHistoryWhereInput = {
      deleted: 0,
    };

    if (filters.inboxUserId) {
      where.inboxUserId = parseInt(filters.inboxUserId);
    }
    if (filters.conversationId) {
      where.conversationId = filters.conversationId;
    }
    if (filters.shopId) {
      where.shopId = filters.shopId;
    }
    if (filters.botId) {
      where.botId = filters.botId;
    }
    if (filters.content) {
      where.content = { contains: filters.content };
    }
    if (filters.sender) {
      where.sender = filters.sender;
    }
    if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    const skip = (filters.pageNo - 1) * filters.pageSize;
    const take = Math.min(filters.pageSize, 100);

    const [list, total] = await Promise.all([
      prisma.cozeChatHistory.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.cozeChatHistory.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo: filters.pageNo,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Get today's chat statistics
   */
  async getTodayStatistics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalChats, uniqueUsers, userMessages, botMessages] = await Promise.all([
      // Total chats today
      prisma.cozeChatHistory.count({
        where: {
          createdAt: { gte: today },
          deleted: 0,
        },
      }),
      // Unique users who chatted today
      prisma.cozeChatHistory.findMany({
        where: {
          createdAt: { gte: today },
          deleted: 0,
          sender: 'user',
        },
        select: { inboxUserId: true },
        distinct: ['inboxUserId'],
      }),
      // User messages
      prisma.cozeChatHistory.count({
        where: {
          createdAt: { gte: today },
          deleted: 0,
          sender: 'user',
        },
      }),
      // Bot messages
      prisma.cozeChatHistory.count({
        where: {
          createdAt: { gte: today },
          deleted: 0,
          sender: 'bot',
        },
      }),
    ]);

    return {
      totalChats,
      totalUsers: uniqueUsers.length,
      userMessages,
      botMessages,
      avgMessagesPerUser: uniqueUsers.length > 0 ? totalChats / uniqueUsers.length : 0,
    };
  }

  /**
   * Get reply rate statistics
   */
  async getReplyRateStatistics() {
    const [userMessages, botMessages] = await Promise.all([
      prisma.cozeChatHistory.count({
        where: { sender: 'user', deleted: 0 },
      }),
      prisma.cozeChatHistory.count({
        where: { sender: 'bot', deleted: 0 },
      }),
    ]);

    const replyRate = userMessages > 0 ? botMessages / userMessages : 0;

    return {
      totalUserMessages: userMessages,
      totalBotReplies: botMessages,
      replyRate: Math.round(replyRate * 100) / 100, // Round to 2 decimals
    };
  }

  /**
   * Get list of users who have chatted
   */
  async getChatUsers(filters: { pageNo: number; pageSize: number; email?: string; userName?: string }) {
    // Get unique inbox user IDs from chat history
    const chatUsers = await prisma.cozeChatHistory.findMany({
      where: {
        deleted: 0,
        sender: 'user',
      },
      select: { inboxUserId: true },
      distinct: ['inboxUserId'],
    });

    const userIds = chatUsers
      .map((c) => {
        const id = c.inboxUserId;
        return id !== null && id !== undefined ? Number(id) : null;
      })
      .filter((id): id is number => id !== null);

    const where: Prisma.ShopifyInboxUserWhereInput = {
      id: { in: userIds },
      deleted: 0,
    };

    if (filters.email) {
      where.userEmail = { contains: filters.email };
    }
    if (filters.userName) {
      where.userName = { contains: filters.userName };
    }

    const skip = (filters.pageNo - 1) * filters.pageSize;
    const take = Math.min(filters.pageSize, 100);

    const [list, total] = await Promise.all([
      prisma.shopifyInboxUser.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shopifyInboxUser.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo: filters.pageNo,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Delete chat history (soft delete)
   */
  async delete(id: number) {
    return await prisma.cozeChatHistory.update({
      where: { id },
      data: { deleted: 1 },
    });
  }
}

export default new ChatHistoryService();

