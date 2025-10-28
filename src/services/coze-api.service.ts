import logger from '../lib/logger';
import config from '../config';
import { getCozeJWTAccessToken, CozeOAuthToken } from '../lib/coze-jwt';
import axios from 'axios';

class CozeApiService {
  private token: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Get Coze access token using JWT OAuth
   */
  async getAccessToken(): Promise<string> {
    // Check if current token is still valid (with 5 minute buffer)
    if (this.token && Date.now() < this.tokenExpiry - 300000) {
      return this.token;
    }

    try {
      logger.info('Getting Coze access token via JWT OAuth');

      const tokenResponse: CozeOAuthToken = await getCozeJWTAccessToken(
        config.coze.oauth.clientId,
        config.coze.oauth.privateKeyPath,
        config.coze.oauth.publicKey,
        config.coze.oauth.baseUrl
      );

      this.token = tokenResponse.access_token;
      this.tokenExpiry = Date.now() + tokenResponse.expires_in * 1000;

      logger.info('Coze access token obtained successfully', {
        expires_in: tokenResponse.expires_in,
        token_type: tokenResponse.token_type,
      });

      return this.token;
    } catch (error: any) {
      logger.error('Failed to get Coze access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Chat with Coze bot
   * @param message User message
   * @param botId Coze bot ID
   * @param userId User identifier
   * @param conversationId Conversation ID
   * @returns Stream of bot responses
   */
  async chat(
    message: string,
    botId: string,
    userId: string,
    conversationId?: string
  ): Promise<any> {
    await this.getAccessToken(); // Ensure token is valid

    // TODO: Implement actual Coze API call with SSE streaming
    logger.info('Coze chat request', { botId, userId, conversationId, messageLength: message.length });

    // Placeholder response
    return {
      response: 'This is a placeholder response. Integrate with Coze API for real responses.',
      conversationId: conversationId || `conv_${Date.now()}`,
    };
  }

  /**
   * Get or create a bot
   */
  async getOrCreateBot(shopId: string, botName: string) {
    try {
      const token = await this.getAccessToken();

      logger.info('Creating Coze bot', { shopId, botName });

      // Create bot using Coze API
      const response = await axios.post(
        `${config.coze.oauth.baseUrl}/v1/bot/create`,
        {
          space_id: process.env.COZE_WORKSPACE_ID || '7351411557182226472',
          name: botName,
          description: `AI customer service bot for shop ${shopId}`,
          prompt_info: {
            prompt: 'You are a helpful AI customer service assistant. Help customers with their questions about products, orders, and shop policies.',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Coze API response received', {
        status: response.status,
        data: response.data,
        has_bot_id: !!response.data.data?.bot_id,
      });

      const botId = response.data.data?.bot_id || `bot_${Date.now()}`;

      if (!response.data.data?.bot_id) {
        logger.warn('Coze API did not return bot_id, using fallback', {
          responseData: response.data,
          fallbackBotId: botId,
        });
      }

      logger.info('Bot created successfully', {
        botId,
        botName,
        shopId,
      });

      // Save bot to database
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();

      try {
        await prisma.shopifyBotSetting.upsert({
          where: {
            id: 0, // will use shopId + botName as unique identifier
          },
          create: {
            shopId,
            botName,
            botId,
            shopName: shopId,
            creator: 'system',
          },
          update: {
            botId,
            botName,
          },
        });

        logger.info('Bot saved to database', { botId, botName, shopId });
      } catch (dbError: any) {
        logger.warn('Failed to save bot to database', { error: dbError.message });
        // Continue even if database save fails
      } finally {
        await prisma.$disconnect();
      }

      return {
        botId,
        botName,
        created: true,
        ...response.data.data,
      };
    } catch (error: any) {
      logger.error('Failed to create bot', {
        error: error.message,
        response: error.response?.data,
      });
      throw error;
    }
  }

  /**
   * Update dataset
   * @param type 1=product, 2=order, 3=customer
   */
  async updateDataset(type: number, shopId: string, _data: any) {
    const datasetTypes = { 1: 'product', 2: 'order', 3: 'customer' };
    logger.info('Update dataset', { type: datasetTypes[type as 1 | 2 | 3], shopId });

    // TODO: Implement Coze dataset update API
    return {
      success: true,
      datasetType: datasetTypes[type as 1 | 2 | 3],
      shopId,
    };
  }

  /**
   * Get dataset statistics
   */
  async getDatasetStatistics(shopId: string, type?: number) {
    // TODO: Implement Coze dataset statistics API
    logger.info('Get dataset statistics', { shopId, type });

    return {
      shopId,
      type,
      documentCount: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export default new CozeApiService();

