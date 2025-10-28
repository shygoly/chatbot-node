import { Router, Request, Response } from 'express';
import cozeApiService from '../services/coze-api.service';
import { asyncHandler } from '../middleware/error-handler';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication
router.use(authenticate);

// POST /api/coze/oauth/tokenForSdk - Get token for SDK
router.post(
  '/tokenForSdk',
  asyncHandler(async (_req: Request, res: Response) => {
    const token = await cozeApiService.getAccessToken();
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  })
);

// GET /api/coze/oauth/token - Get JWT access token
router.get(
  '/token',
  asyncHandler(async (_req: Request, res: Response) => {
    const token = await cozeApiService.getAccessToken();
    res.json({
      access_token: token,
      token_type: 'Bearer',
      expires_in: 3600,
    });
  })
);

// GET /api/coze/oauth/callback - Handle OAuth callback
router.get(
  '/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.query;
    // TODO: Implement OAuth callback handling
    res.json({
      success: true,
      code,
      message: 'OAuth callback handler - to be implemented',
    });
  })
);

// GET /api/coze/oauth/authorize - Redirect to authorization page
router.get(
  '/authorize',
  asyncHandler(async (req: Request, res: Response) => {
    const { redirectUri } = req.query;
    // TODO: Implement OAuth authorization redirect
    res.json({
      authorizeUrl: `https://api.coze.cn/oauth/authorize?redirect_uri=${redirectUri}`,
      message: 'OAuth authorization - to be implemented',
    });
  })
);

// GET /api/coze/oauth/authorize-url - Get authorization URL
router.get(
  '/authorize-url',
  asyncHandler(async (req: Request, res: Response) => {
    const { redirectUri } = req.query;
    res.json({
      authorizeUrl: `https://api.coze.cn/oauth/authorize?redirect_uri=${redirectUri}`,
    });
  })
);

export default router;
