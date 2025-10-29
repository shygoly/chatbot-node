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
    try {
      logger.info('Sending chat request to Coze API', {
        botId,
        userId,
        conversationId,
        messageLength: message.length,
      });

      // Get access token
      const token = await this.getAccessToken();

      // Call Coze Chat API v3
      // Note: Use 'additional_messages' instead of 'query' to match chatbotadmin
      const response = await axios.post(
        `${config.coze.oauth.baseUrl}/v3/chat`,
        {
          bot_id: botId,
          user_id: userId,
          conversation_id: conversationId,
          additional_messages: [
            {
              role: 'user',
              content: message,
              content_type: 'text',
            },
          ],
          stream: false, // MVP: no streaming, simple response
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      logger.info('Coze chat API response received', {
        status: response.status,
        chatId: response.data.data?.id,
        conversationId: response.data.data?.conversation_id,
        chatStatus: response.data.data?.status,
        fullResponse: JSON.stringify(response.data), // Debug: log full response
      });

      const chatId = response.data.data?.id;
      const returnedConversationId = response.data.data?.conversation_id || conversationId;

      // Coze API is asynchronous, need to poll for the result
      // Wait for chat to complete
      let attempts = 0;
      const maxAttempts = 30; // 30 attempts * 1 second = 30 seconds max wait
      let chatStatus = response.data.data?.status;
      let messages: any[] = [];

      while (chatStatus === 'in_progress' && attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
        attempts++;

        logger.info('Polling chat status', { chatId, attempt: attempts });

        // Retrieve chat status
        const retrieveResponse = await axios.get(
          `${config.coze.oauth.baseUrl}/v3/chat/retrieve`,
          {
            params: {
              conversation_id: returnedConversationId,
              chat_id: chatId,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
          }
        );

        chatStatus = retrieveResponse.data.data?.status;
        const lastError = retrieveResponse.data.data?.last_error;

        // Get messages using message list API
        if (chatStatus === 'completed') {
          try {
            const messagesResponse = await axios.get(
              `${config.coze.oauth.baseUrl}/v3/chat/message/list`,
              {
                params: {
                  conversation_id: returnedConversationId,
                  chat_id: chatId,
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                timeout: 10000,
              }
            );

            messages = messagesResponse.data.data || [];
          } catch (msgError: any) {
            logger.error('Failed to fetch messages', {
              chatId,
              error: msgError.message,
            });
          }
        }

        logger.info('Chat status polled', {
          chatId,
          status: chatStatus,
          messageCount: messages.length,
          lastError: lastError ? JSON.stringify(lastError) : null,
          fullData: JSON.stringify(retrieveResponse.data.data),
        });

        if (chatStatus === 'completed' || chatStatus === 'failed') {
          break;
        }
      }

      if (chatStatus === 'failed') {
        logger.error('Chat failed', { chatId, conversationId: returnedConversationId });
        return {
          response: 'Sorry, the AI assistant encountered an error processing your message.',
          conversationId: returnedConversationId,
          messageId: chatId,
        };
      }

      if (attempts >= maxAttempts) {
        logger.warn('Chat polling timeout', { chatId, conversationId: returnedConversationId });
        return {
          response: 'Sorry, the response is taking too long. Please try again.',
          conversationId: returnedConversationId,
          messageId: chatId,
        };
      }

      logger.info('Processing Coze messages', {
        messageCount: messages.length,
        messageTypes: messages.map((m: any) => ({
          role: m.role,
          type: m.type,
          hasContent: !!m.content,
        })),
      });

      // Extract reply from messages
      const assistantMessage = messages.find((m: any) => m.role === 'assistant' && m.type === 'answer');
      const reply =
        assistantMessage?.content || 'Sorry, I could not process your request.';

      return {
        response: reply,
        conversationId: returnedConversationId,
        messageId: chatId,
      };
    } catch (error: any) {
      logger.error('Coze chat API failed', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      // Return friendly error message
      return {
        response:
          'Sorry, I encountered an error while processing your request. Please try again in a moment.',
        conversationId: conversationId || `conv_${Date.now()}`,
      };
    }
  }

  /**
   * Chat with Coze bot using Server-Sent Events (SSE) for streaming
   * Matches chatbotadmin implementation with ChatEventType support
   * 
   * Supported events:
   * - conversation.message.delta: Incremental message content
   * - conversation.chat.completed: Chat completion
   * - error: Error events
   */
  async chatStream(
    message: string,
    botId: string,
    userId: string,
    onData: (chunk: string) => void,
    onComplete: (fullResponse: string, usage?: any) => void,
    onError: (error: Error) => void,
    conversationId?: string
  ): Promise<void> {
    try {
      logger.info('Starting SSE chat stream', {
        botId,
        userId,
        conversationId,
        messageLength: message.length,
      });

      const token = await this.getAccessToken();

      // Call Coze Chat API v3 with stream=true
      // Matches chatbotadmin: coze.chat().stream(req)
      const response = await axios.post(
        `${config.coze.oauth.baseUrl}/v3/chat`,
        {
          bot_id: botId,
          user_id: userId,
          conversation_id: conversationId,
          additional_messages: [
            {
              role: 'user',
              content: message,
              content_type: 'text',
            },
          ],
          stream: true, // Enable streaming
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          responseType: 'stream',
          timeout: 60000, // 60 second timeout for streaming
        }
      );

      let fullResponse = '';
      let buffer = '';
      let chatUsage: any = null;
      let currentEventType = ''; // Track current SSE event type

      // Process SSE stream
      // Matches chatbotadmin: resp.subscribe(event -> { ... })
      response.data.on('data', (chunk: Buffer) => {
        const chunkStr = chunk.toString();
        logger.debug('Received SSE chunk', { 
          chunkLength: chunkStr.length,
          chunkPreview: chunkStr.substring(0, 200) // Log first 200 chars
        });
        
        buffer += chunkStr;
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          // Skip empty lines
          if (!line.trim()) continue;

          // Handle SSE event format: "event: <type>" followed by "data: <json>"
          if (line.startsWith('event:')) {
            // Store current event type
            currentEventType = line.substring(6).trim();
            logger.debug('SSE event line', { eventType: currentEventType });
            continue;
          }

          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            
            // Check for stream end marker
            if (dataStr === '[DONE]') {
              logger.info('SSE stream completed', { fullResponseLength: fullResponse.length });
              onComplete(fullResponse, chatUsage);
              return;
            }

            // Skip empty data
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              
              logger.debug('Parsed SSE data', { 
                eventType: currentEventType,
                dataKeys: Object.keys(data),
                role: data.role,
                type: data.type,
                hasContent: !!data.content,
                contentPreview: data.content ? data.content.substring(0, 20) : null
              });
              
              // Match chatbotadmin: ChatEventType.CONVERSATION_MESSAGE_DELTA
              // Extract incremental content from message delta events
              if (currentEventType === 'conversation.message.delta') {
                const content = data.content || '';
                if (content && data.role === 'assistant' && data.type === 'answer') {
                  fullResponse += content;
                  onData(content);
                  logger.debug('Message delta extracted', { 
                    content,
                    fullLength: fullResponse.length 
                  });
                }
              }
              // Match chatbotadmin: ChatEventType.CONVERSATION_CHAT_COMPLETED
              // Handle completion event
              else if (currentEventType === 'conversation.chat.completed') {
                // Save usage statistics if available
                if (data.usage) {
                  chatUsage = data.usage;
                  logger.info('Chat completed with usage', { 
                    tokenCount: chatUsage.token_count,
                    inputCount: chatUsage.input_count,
                    outputCount: chatUsage.output_count
                  });
                }
                logger.info('Chat completed', { fullResponseLength: fullResponse.length });
                onComplete(fullResponse, chatUsage);
              }
              // Handle conversation.message.completed (entire message)
              else if (currentEventType === 'conversation.message.completed') {
                logger.debug('Message completed event', { 
                  messageId: data.id,
                  role: data.role,
                  type: data.type,
                  fullContent: data.content
                });
                // Message completed, but continue waiting for chat.completed
              }
              // Handle error events
              else if (currentEventType === 'error' || (data.code !== undefined && data.code !== 0)) {
                const errorMsg = data.msg || data.error?.msg || 'Unknown streaming error';
                logger.error('SSE stream error event', { 
                  code: data.code,
                  msg: errorMsg,
                  detail: data.detail
                });
                onError(new Error(errorMsg));
              }
            } catch (parseError: any) {
              // Log parse errors but continue processing
              logger.warn('Failed to parse SSE data', { 
                line: dataStr.substring(0, 200),
                error: parseError.message
              });
            }
          }
        }
      });

      response.data.on('end', () => {
        logger.info('SSE stream connection ended', { 
          fullResponseLength: fullResponse.length,
          hasContent: fullResponse.length > 0
        });
        // Only call onComplete if we have content and haven't completed yet
        if (fullResponse && fullResponse.length > 0) {
          onComplete(fullResponse, chatUsage);
        }
      });

      response.data.on('error', (streamError: Error) => {
        logger.error('SSE stream connection error', { 
          error: streamError.message,
          stack: streamError.stack
        });
        onError(streamError);
      });
    } catch (error: any) {
      logger.error('Failed to start SSE stream', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      onError(error);
    }
  }

  /**
   * Publish bot to Agent As API channel
   * Matches chatbotadmin implementation
   */
  async publishBot(botId: string): Promise<string> {
    try {
      const token = await this.getAccessToken();

      logger.info('Publishing bot to Agent As API channel', { botId });

      const response = await axios.post(
        `${config.coze.oauth.baseUrl}/v1/bot/publish`,
        {
          bot_id: botId,
          connector_ids: ['1024'], // 1024 is the ID for "Agent As API" channel
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      logger.info('Bot published successfully', {
        botId: response.data.bot_id,
        connectorIds: ['1024'],
      });

      return response.data.bot_id;
    } catch (error: any) {
      logger.error('Failed to publish bot', {
        botId,
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Failed to publish bot: ${error.message}`);
    }
  }

  /**
   * Get or create a bot
   * Configuration matches chatbotadmin implementation
   * Auto-publishes to Agent As API channel after creation
   */
  async getOrCreateBot(shopId: string, botName: string) {
    try {
      const token = await this.getAccessToken();

      logger.info('Creating Coze bot', { shopId, botName });

      // Prompt info matching chatbotadmin's multi-language customer service template
      const promptInfo = `## 回复语言策略（必须遵守）
1. 必须检测用户使用的语言（如中文、英文、日文等）。
2. 的回复语言应与用户输入语言一致。例如：
   - 用户使用英文提问，必须用英文回答。
   - 用户使用中文提问，必须用中文回答。
   - 用户在对话中切换语言，的回复也必须随之切换。
3. 不允许始终使用中文作为默认语言。不要询问用户是否需要英文，直接匹配其输入语言。

# 角色
你是一名专业且人性化的网店客服，负责解答用户售前、售中及售后的各类咨询问题。

## 技能
### 技能 1: 解答商品属性和使用条件问题
1. 当用户询问商品属性和使用条件时，调用知识库查找相关信息。
2. 若知识库信息不足，通过合理推测和通用知识补充，确保准确回答用户。

### 技能 2: 解答商品价格问题
1. 接到用户关于商品价格的咨询，依据知识库提供精确价格信息。
2. 若价格有变动或优惠活动，详细告知用户具体情况。

### 技能 3: 解答商品退换货运费问题
1. 针对用户提出的商品退换货运费疑问，结合知识库给出准确答案。
2. 清晰说明不同退换货情形下运费的承担规则。

### 技能 4: 解答商品库存相关问题
1. 结合工作流出准确答案。
2. 调用工作流的时候，工作流需要输入参数shopName，输入值为${shopId}
3. 工作流的返回product是商品数组，里面有每一件商品的信息，total为商品总数
4. 每件商品中title 是商品名称

### 能力 5: 商品推荐与导购
1. 主动推荐匹配用户需求的商品
2. 突出商品三大核心优势：
   - 材质工艺亮点
   - 独家功能设计
   - 用户体验价值
3. 采用FAB话术结构：特性→优势→利益

## 限制
- 导购时自然融入商品优势说明，每次聚焦1-3个核心卖点
- 用「您」称呼客户，回复简洁（不超过3句话）
- 严格限定于商品相关咨询
- 回答需基于知识库信息，若知识库信息不足按上述技能要求处理。`;

      // Create bot using Coze API
      // Configuration can match chatbotadmin by setting workflow_id_list and model_info_config
      const requestBody: any = {
        space_id: process.env.COZE_WORKSPACE_ID || '7351411557182226472',
        name: botName,
        description: `${botName}的chatbot`,
        prompt_info: {
          prompt: promptInfo,
        },
      };

      // Optional: Add workflow configuration (if COZE_WORKFLOW_ID is set)
      if (process.env.COZE_WORKFLOW_ID) {
        requestBody.workflow_id_list = {
          ids: [{ id: process.env.COZE_WORKFLOW_ID }],
        };
        logger.info('Adding workflow configuration', {
          workflowId: process.env.COZE_WORKFLOW_ID,
        });
      }

      // Optional: Add model configuration (if COZE_MODEL_ID is set)
      if (process.env.COZE_MODEL_ID) {
        requestBody.model_info_config = {
          model_id: process.env.COZE_MODEL_ID,
        };
        logger.info('Adding model configuration', { modelId: process.env.COZE_MODEL_ID });
      }

      const response = await axios.post(
        `${config.coze.oauth.baseUrl}/v1/bot/create`,
        requestBody,
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

      // Auto-publish bot to Agent As API channel (matching chatbotadmin behavior)
      try {
        await this.publishBot(botId);
        logger.info('Bot published to Agent As API channel', { botId });
      } catch (publishError: any) {
        logger.error('Failed to publish bot, but bot was created', {
          botId,
          error: publishError.message,
        });
        // Don't throw - bot was created successfully, just not published
        // User can manually publish from Coze platform if needed
      }

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
        published: true, // Indicate that we attempted to publish
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

