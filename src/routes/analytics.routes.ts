import { Router, Request, Response } from 'express';
import { subDays, startOfDay, endOfDay } from 'date-fns';
import analyticsService from '../services/analytics.service';
import logger from '../lib/logger';

const router = Router();

/**
 * GET /api/analytics/overview
 * Get overview metrics
 */
router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : startOfDay(subDays(new Date(), 30));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : endOfDay(new Date());

    const overview = await analyticsService.getOverview(startDate, endDate);

    res.json({
      code: 0,
      msg: 'success',
      data: overview,
    });
  } catch (error: any) {
    logger.error('Failed to get overview analytics', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get analytics',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/analytics/conversations/volume
 * Get conversation volume trend
 */
router.get('/conversations/volume', async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : startOfDay(subDays(new Date(), 30));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : endOfDay(new Date());
    const granularity = (req.query.granularity as 'hour' | 'day' | 'week') || 'day';

    const volume = await analyticsService.getConversationVolume(
      startDate,
      endDate,
      granularity
    );

    res.json({
      code: 0,
      msg: 'success',
      data: volume,
    });
  } catch (error: any) {
    logger.error('Failed to get conversation volume', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get volume data',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/analytics/conversations/response-time
 * Get response time metrics
 */
router.get('/conversations/response-time', async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : startOfDay(subDays(new Date(), 30));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : endOfDay(new Date());

    const metrics = await analyticsService.getResponseTimeMetrics(startDate, endDate);

    res.json({
      code: 0,
      msg: 'success',
      data: metrics,
    });
  } catch (error: any) {
    logger.error('Failed to get response time metrics', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get metrics',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/analytics/agents/performance
 * Get agent performance metrics
 */
router.get('/agents/performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const startDate = req.query.startDate
      ? new Date(req.query.startDate as string)
      : startOfDay(subDays(new Date(), 30));
    const endDate = req.query.endDate
      ? new Date(req.query.endDate as string)
      : endOfDay(new Date());

    const agents = await analyticsService.getAgentPerformance(startDate, endDate);

    res.json({
      code: 0,
      msg: 'success',
      data: agents,
    });
  } catch (error: any) {
    logger.error('Failed to get agent performance', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get agent data',
      data: { error: error.message },
    });
  }
});

export default router;

