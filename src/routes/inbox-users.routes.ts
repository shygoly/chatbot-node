import { Router, Request, Response } from 'express';
import inboxUsersService from '../services/inbox-users.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticate);

// PUT /api/inbox-users - Update inbox user
router.put(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const { id, ...data } = req.body;
    const result = await inboxUsersService.update(parseInt(id), data);
    res.json(result);
  })
);

// POST /api/inbox-users/login - Login inbox user
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { userEmail, shopId } = req.body;
    const result = await inboxUsersService.login(userEmail, shopId);
    res.json(result);
  })
);

// POST /api/inbox-users - Create inbox user
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await inboxUsersService.create(req.body);
    res.json(result);
  })
);

// GET /api/inbox-users/shop/:id - Get inbox users by shop ID
router.get(
  '/shop/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await inboxUsersService.getByShopId(id);
    res.json(result);
  })
);

// GET /api/inbox-users/page - Get inbox users page
router.get(
  '/page',
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      ...req.query,
      pageNo: parseInt(req.query.pageNo as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 10,
    };
    const result = await inboxUsersService.list(filters);
    res.json(result);
  })
);

// GET /api/inbox-users/:id - Get inbox user by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await inboxUsersService.getById(parseInt(req.params.id));
    res.json(result);
  })
);

// GET /api/inbox-users/export - Export inbox users to Excel
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

// DELETE /api/inbox-users/:id - Delete inbox user
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const result = await inboxUsersService.delete(parseInt(req.params.id));
    res.json({ success: true, deleted: result });
  })
);

export default router;

