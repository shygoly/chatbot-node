import { Router, Request, Response } from 'express';
import botSettingsService from '../services/bot-settings.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// PUT /api/bot-settings - Update bot setting
router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...data } = req.body;
    const result = await botSettingsService.update(parseInt(id), data);
    res.json(result);
  })
);

// POST /api/bot-settings - Create bot setting
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await botSettingsService.create(req.body);
    res.json(result);
  })
);

// GET /api/bot-settings/shop/name/:shopName - Get bot setting by shop name
router.get(
  '/shop/name/:shopName',
  asyncHandler(async (req: Request, res: Response) => {
    const { shopName } = req.params;
    const result = await botSettingsService.getByShopName(shopName);
    res.json(result);
  })
);

// GET /api/bot-settings/shop/:id - Get bot setting by shop ID
router.get(
  '/shop/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await botSettingsService.getByShopId(id);
    res.json(result);
  })
);

// GET /api/bot-settings/page - Get bot settings page
router.get(
  '/page',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      ...req.query,
      pageNo: parseInt(req.query.pageNo as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    };
    const result = await botSettingsService.list(filters);
    res.json(result);
  })
);

// GET /api/bot-settings/:id - Get bot setting by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await botSettingsService.getById(parseInt(req.params.id));
    res.json(result);
  })
);

// DELETE /api/bot-settings/:id - Delete bot setting
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await botSettingsService.delete(parseInt(req.params.id));
    res.json({ success: true, deleted: result });
  })
);

export default router;

