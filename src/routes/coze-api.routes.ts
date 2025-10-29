import { Router, Request, Response } from 'express';
import cozeApiService from '../services/coze-api.service';
import chatHistoryService from '../services/chat-history.service';
import conversationService from '../services/conversation.service';
import websocketService from '../services/websocket.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Note: Authentication applied per route, not globally
// Customer chat endpoints should be public

// POST /api/coze/bot/updateDataset/:type - Update dataset (1=product, 2=order, 3=customer)
router.post(
  '/bot/updateDataset/:type',
  authenticate, // Admin only
  asyncHandler(async (req: Request, res: Response) => {
    const type = parseInt(req.params.type);
    const result = await cozeApiService.updateDataset(type, req.body.shopId, req.body);
    res.json(result);
  })
);

// POST /api/coze/bot/getOrCreateBot - Get or create bot
router.post(
  '/bot/getOrCreateBot',
  authenticate, // Admin only
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId, botName } = req.body;
    const result = await cozeApiService.getOrCreateBot(shopId, botName);
    res.json(result);
  })
);

// POST /api/coze/chat - Chat with Coze bot (PUBLIC - for customer widget)
router.post(
  '/chat',
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId, message, userId, conversationId, botId } = req.body;

    // Get or create conversation
    const conversation = conversationId
      ? await conversationService.getByConversationId(conversationId)
      : await conversationService.getOrCreate(parseInt(userId), shopId, botId);

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }

    // Save user message
    await chatHistoryService.createMessage({
      inboxUserId: parseInt(userId),
      conversationId: conversation.conversationId,
      shopId,
      botId: conversation.botId || botId,
      content: message,
      sender: 'user',
    });

    // Get response from Coze (placeholder for now)
    const chatResponse = await cozeApiService.chat(
      message,
      conversation.botId || botId || '',
      userId,
      conversation.conversationId
    );

    // Save bot response
    await chatHistoryService.createMessage({
      inboxUserId: parseInt(userId),
      conversationId: conversation.conversationId,
      shopId,
      botId: conversation.botId || botId,
      content: chatResponse.response,
      sender: 'bot',
    });

    // Send WebSocket notification for real-time delivery
    websocketService.sendMessage(conversation.conversationId, {
      conversationId: conversation.conversationId,
      content: chatResponse.response,
      sender: {
        userId: 'bot',
        userName: 'AI Assistant',
        role: 'bot',
      },
      timestamp: new Date().toISOString(),
    });

    // For now, return simple JSON response (TODO: implement SSE streaming)
    res.json({
      conversationId: conversation.conversationId,
      response: chatResponse.response,
    });
  })
);

// POST /api/coze/chat/stream - Chat with Coze bot using SSE streaming (PUBLIC)
router.post(
  '/chat/stream',
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId, message, userId, conversationId, botId } = req.body;

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Get or create conversation
    const conversation = conversationId
      ? await conversationService.getByConversationId(conversationId)
      : await conversationService.getOrCreate(parseInt(userId), shopId, botId);

    if (!conversation) {
      res.write(`data: ${JSON.stringify({ event: 'error', error: 'Conversation not found' })}\n\n`);
      res.end();
      return;
    }

    // Save user message
    await chatHistoryService.createMessage({
      inboxUserId: parseInt(userId),
      conversationId: conversation.conversationId,
      shopId,
      botId: conversation.botId || botId,
      content: message,
      sender: 'user',
    });

    // Send initial event
    res.write(`data: ${JSON.stringify({ event: 'started', conversationId: conversation.conversationId })}\n\n`);

    let fullResponse = '';

    // Start streaming chat
    await cozeApiService.chatStream(
      message,
      conversation.botId || botId || '',
      userId,
      // onData callback - send each chunk to client
      (chunk: string) => {
        res.write(`data: ${JSON.stringify({ event: 'message', content: chunk })}\n\n`);
      },
      // onComplete callback - save to database and close stream
      async (response: string, usage?: any) => {
        fullResponse = response;

        // Save bot response
        await chatHistoryService.createMessage({
          inboxUserId: parseInt(userId),
          conversationId: conversation.conversationId,
          shopId,
          botId: conversation.botId || botId,
          content: fullResponse,
          sender: 'bot',
        });

        // Send WebSocket notification
        websocketService.sendMessage(conversation.conversationId, {
          conversationId: conversation.conversationId,
          content: fullResponse,
          sender: {
            userId: 'bot',
            userName: 'AI Assistant',
            role: 'bot',
          },
          timestamp: new Date().toISOString(),
        });

        // Send completion event with usage stats
        res.write(`data: ${JSON.stringify({ 
          event: 'completed', 
          conversationId: conversation.conversationId,
          usage: usage || null
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      },
      // onError callback
      (error: Error) => {
        res.write(`data: ${JSON.stringify({ event: 'error', error: error.message })}\n\n`);
        res.end();
      },
      // conversationId (optional parameter must be last)
      conversation.conversationId
    );
  })
);

// GET /api/coze/bot/datasetStatistic/:shopId/:type - Get dataset statistics by type
router.get(
  '/bot/datasetStatistic/:shopId/:type',
  authenticate, // Admin only
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId, type } = req.params;
    const result = await cozeApiService.getDatasetStatistics(shopId, parseInt(type));
    res.json(result);
  })
);

// GET /api/coze/bot/datasetStatistic/:shopId - Get dataset statistics
router.get(
  '/bot/datasetStatistic/:shopId',
  authenticate, // Admin only
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const result = await cozeApiService.getDatasetStatistics(shopId);
    res.json(result);
  })
);

export default router;

