import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticate);

// Coze Info routes - These are placeholder implementations
// In chatbotadmin, these are managed differently. For now, return simple responses.

// PUT /api/coze-info - Update coze info
router.put(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Implement coze info storage if needed
    res.json({ success: true, message: 'Coze info management - to be implemented' });
  })
);

// POST /api/coze-info - Create coze info
router.post(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Coze info management - to be implemented' });
  })
);

// GET /api/coze-info/page - Get coze info page
router.get(
  '/page',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({
      list: [],
      total: 0,
      pageNo: parseInt(req.query.pageNo as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    });
  })
);

// GET /api/coze-info/:id - Get coze info by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ id: req.params.id, message: 'Coze info - to be implemented' });
  })
);

// GET /api/coze-info/export - Export coze info to Excel
router.get(
  '/export',
  asyncHandler(async (_req: Request, res: Response) => {
    res.status(501).json({
      error: 'Not Implemented',
      message: 'Excel export will be implemented soon',
      statusCode: 501,
    });
  })
);

// DELETE /api/coze-info/:id - Delete coze info
router.delete(
  '/:id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Coze info deletion - to be implemented' });
  })
);

export default router;
