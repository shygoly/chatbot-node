import { Router, Request, Response } from 'express';
import cozeApiService from '../services/coze-api.service';
import chatHistoryService from '../services/chat-history.service';
import conversationService from '../services/conversation.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticate);

// POST /api/coze/bot/updateDataset/:type - Update dataset (1=product, 2=order, 3=customer)
router.post(
  '/bot/updateDataset/:type',
  asyncHandler(async (req: Request, res: Response) => {
    const type = parseInt(req.params.type);
    const result = await cozeApiService.updateDataset(type, req.body.shopId, req.body);
    res.json(result);
  })
);

// POST /api/coze/bot/getOrCreateBot - Get or create bot
router.post(
  '/bot/getOrCreateBot',
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId, botName } = req.body;
    const result = await cozeApiService.getOrCreateBot(shopId, botName);
    res.json(result);
  })
);

// POST /api/coze/chat - Chat with Coze bot (SSE streaming)
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

    // For now, return simple JSON response (TODO: implement SSE streaming)
    res.json({
      conversationId: conversation.conversationId,
      response: chatResponse.response,
    });
  })
);

// GET /api/coze/bot/datasetStatistic/:shopId/:type - Get dataset statistics by type
router.get(
  '/bot/datasetStatistic/:shopId/:type',
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId, type } = req.params;
    const result = await cozeApiService.getDatasetStatistics(shopId, parseInt(type));
    res.json(result);
  })
);

// GET /api/coze/bot/datasetStatistic/:shopId - Get dataset statistics
router.get(
  '/bot/datasetStatistic/:shopId',
  asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const result = await cozeApiService.getDatasetStatistics(shopId);
    res.json(result);
  })
);

export default router;

