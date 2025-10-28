import prisma from './database';
import { randomUUID } from 'crypto';

class ConversationService {
  /**
   * Get or create a conversation
   */
  async getOrCreate(inboxUserId: number, shopId: string, botId?: string) {
    // Try to find existing active conversation
    const existing = await prisma.cozeConversation.findFirst({
      where: {
        inboxUserId,
        shopId,
        deleted: 0,
      },
      orderBy: { lastChatDate: 'desc' },
    });

    if (existing) {
      // Update last activity
      await this.updateActivity(existing.conversationId);
      return existing;
    }

    // Create new conversation
    const conversationId = `conv_${randomUUID()}`;
    return await prisma.cozeConversation.create({
      data: {
        inboxUserId,
        conversationId,
        shopId,
        botId,
        lastChatDate: new Date(),
      },
    });
  }

  /**
   * Update conversation activity timestamp
   */
  async updateActivity(conversationId: string) {
    return await prisma.cozeConversation.updateMany({
      where: { conversationId, deleted: 0 },
      data: { lastChatDate: new Date() },
    });
  }

  /**
   * Get conversation by ID
   */
  async getByConversationId(conversationId: string) {
    return await prisma.cozeConversation.findFirst({
      where: { conversationId, deleted: 0 },
    });
  }

  /**
   * Get all conversations for a user
   */
  async getByInboxUser(inboxUserId: number) {
    return await prisma.cozeConversation.findMany({
      where: { inboxUserId, deleted: 0 },
      orderBy: { lastChatDate: 'desc' },
    });
  }
}

export default new ConversationService();

