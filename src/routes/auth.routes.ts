import { Router, Request, Response } from 'express';
import authService from '../services/auth.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// POST /api/auth/login - Login with username/password
router.post(
  '/login',
  asyncHandler(async (req: Request, res: Response) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Username and password are required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const authResponse = await authService.login(username, password);
    res.json(authResponse);
  })
);

// POST /api/auth/refresh - Refresh access token
router.post(
  '/refresh',
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Refresh token is required',
        statusCode: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const authResponse = await authService.refreshToken(refreshToken);
    res.json(authResponse);
  })
);

// GET /api/auth/me - Get current user info
router.get(
  '/me',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization!;
    const token = authHeader.substring(7);

    const user = await authService.getCurrentUser(token);
    res.json(user);
  })
);

// POST /api/auth/logout - Logout (client-side only, just return success)
router.post('/logout', (_req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;

