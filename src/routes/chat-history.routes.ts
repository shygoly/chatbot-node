import { Router, Request, Response } from 'express';
import chatHistoryService from '../services/chat-history.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticate);

// PUT /api/chat-history - Update chat history
router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...data } = req.body;
    const result = await chatHistoryService.update(parseInt(id), data);
    res.json(result);
  })
);

// POST /api/chat-history - Create chat history
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await chatHistoryService.createMessage(req.body);
    res.json(result);
  })
);

// GET /api/chat-history/users - Get chat users
router.get(
  '/users',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      pageNo: parseInt(req.query.pageNo as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
      email: req.query.email as string,
      userName: req.query.userName as string,
    };
    const result = await chatHistoryService.getChatUsers(filters);
    res.json(result);
  })
);

// GET /api/chat-history/statistics/today - Today's chat statistics
router.get(
  '/statistics/today',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await chatHistoryService.getTodayStatistics();
    res.json(result);
  })
);

// GET /api/chat-history/statistics/reply-rate - Reply rate statistics
router.get(
  '/statistics/reply-rate',
  asyncHandler(async (_req: Request, res: Response) => {
    const result = await chatHistoryService.getReplyRateStatistics();
    res.json(result);
  })
);

// GET /api/chat-history/page - Get chat history page
router.get(
  '/page',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      ...req.query,
      pageNo: parseInt(req.query.pageNo as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    };
    const result = await chatHistoryService.list(filters);
    res.json(result);
  })
);

// GET /api/chat-history/:id - Get chat history by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await chatHistoryService.getById(parseInt(req.params.id));
    res.json(result);
  })
);

// GET /api/chat-history/export - Export chat history to Excel
router.get(
  '/export',
  asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Implement Excel export using ExcelJS
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Excel export will be implemented soon',
      statusCode: 501,
    });
  })
);

// DELETE /api/chat-history/:id - Delete chat history
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await chatHistoryService.delete(parseInt(req.params.id));
    res.json({ success: true, deleted: result });
  })
);

export default router;

