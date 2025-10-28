import { Router, Request, Response } from 'express';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticate);

// Customer Service Inquiries routes - Simplified placeholder implementation
// These could be stored in database if needed, or just logged

// PUT /api/inquiries - Update customer service inquiry
router.put(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    // TODO: Implement inquiry storage if needed
    res.json({ success: true, message: 'Inquiry updated' });
  })
);

// POST /api/inquiries - Create customer service inquiry
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { email, message } = req.body;
    // TODO: Store inquiry or send notification
    res.json({
      success: true,
      email,
      message,
      receivedAt: new Date().toISOString(),
    });
  })
);

// GET /api/inquiries/page - Get inquiries page
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

// GET /api/inquiries/:id - Get inquiry by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    res.json({ id: req.params.id, message: 'Inquiry - to be implemented' });
  })
);

// GET /api/inquiries/export - Export inquiries to Excel
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

// DELETE /api/inquiries/:id - Delete inquiry
router.delete(
  '/:id',
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, message: 'Inquiry deleted' });
  })
);

export default router;
