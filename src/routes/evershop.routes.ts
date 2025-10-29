import { Router, Request, Response } from 'express';
import { getEverShopService } from '../services/evershop-api.service';
import cozeApiService from '../services/coze-api.service';
import logger from '../lib/logger';
import config from '../config';

const router = Router();

/**
 * Initialize EverShop service with configuration
 */
function initEverShopService() {
  if (!config.evershop.baseUrl || !config.evershop.email || !config.evershop.password) {
    throw new Error('EverShop configuration is missing. Please set EVERSHOP_URL, EVERSHOP_EMAIL, and EVERSHOP_PASSWORD environment variables.');
  }

  return getEverShopService({
    baseUrl: config.evershop.baseUrl,
    email: config.evershop.email,
    password: config.evershop.password,
  });
}

/**
 * GET /api/evershop/status
 * Check EverShop connection status
 */
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const evershopService = initEverShopService();
    await evershopService.authenticate();

    res.json({
      code: 0,
      msg: 'EverShop connection successful',
      data: {
        connected: true,
        baseUrl: config.evershop.baseUrl,
      },
    });
  } catch (error: any) {
    logger.error('EverShop status check failed', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'EverShop connection failed',
      data: {
        connected: false,
        error: error.message,
      },
    });
  }
});

/**
 * POST /api/evershop/sync/products
 * Sync products from EverShop to Coze knowledge base
 */
router.post('/sync/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { shopId, botId, limit = 100 } = req.body;

    if (!shopId || !botId) {
      res.status(400).json({
        code: 1,
        msg: 'shopId and botId are required',
      });
      return;
    }

    logger.info('Starting EverShop products sync', { shopId, botId, limit });

    // Fetch products from EverShop
    const evershopService = initEverShopService();
    const { products, total } = await evershopService.getProducts(limit, 1);

    logger.info('Fetched products from EverShop', { count: products.length, total });

    // Transform to CSV format
    const csvContent = evershopService.productsToCSV(products);

    // Upload to Coze knowledge base (type: 1=product, 2=order, 3=customer)
    const datasetResult = await cozeApiService.updateDataset(1, shopId, csvContent);

    logger.info('Products synced to Coze knowledge base', {
      shopId,
      botId,
      productsCount: products.length,
      success: datasetResult.success,
    });

    res.json({
      code: 0,
      msg: 'Products synced successfully',
      data: {
        productsCount: products.length,
        totalProducts: total,
        success: datasetResult.success,
        syncedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to sync products', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to sync products',
      data: { error: error.message },
    });
  }
});

/**
 * POST /api/evershop/sync/orders
 * Fetch orders from EverShop (for customer context)
 */
router.post('/sync/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 100, page = 1 } = req.body;

    logger.info('Fetching orders from EverShop', { limit, page });

    const evershopService = initEverShopService();
    const { orders, total } = await evershopService.getOrders(limit, page);

    logger.info('Orders fetched from EverShop', { count: orders.length, total });

    res.json({
      code: 0,
      msg: 'Orders fetched successfully',
      data: {
        orders,
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch orders', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch orders',
      data: { error: error.message },
    });
  }
});

/**
 * POST /api/evershop/sync/customers
 * Fetch customers from EverShop
 */
router.post('/sync/customers', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 100, page = 1 } = req.body;

    logger.info('Fetching customers from EverShop', { limit, page });

    const evershopService = initEverShopService();
    const { customers, total } = await evershopService.getCustomers(limit, page);

    logger.info('Customers fetched from EverShop', { count: customers.length, total });

    res.json({
      code: 0,
      msg: 'Customers fetched successfully',
      data: {
        customers,
        total,
        page,
        limit,
      },
    });
  } catch (error: any) {
    logger.error('Failed to fetch customers', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to fetch customers',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/evershop/products
 * Get products from EverShop
 */
router.get('/products', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const page = parseInt(req.query.page as string) || 1;

    const evershopService = initEverShopService();
    const { products, total } = await evershopService.getProducts(limit, page);

    res.json({
      code: 0,
      msg: 'success',
      data: {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    logger.error('Failed to get products', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get products',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/evershop/products/:id
 * Get product by ID
 */
router.get('/products/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const evershopService = initEverShopService();
    const product = await evershopService.getProductById(id);

    if (!product) {
      res.status(404).json({
        code: 1,
        msg: 'Product not found',
      });
      return;
    }

    res.json({
      code: 0,
      msg: 'success',
      data: product,
    });
  } catch (error: any) {
    logger.error('Failed to get product', { id: req.params.id, error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get product',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/evershop/products/search
 * Search products
 */
router.get('/products/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!query) {
      res.status(400).json({
        code: 1,
        msg: 'Search query is required',
      });
      return;
    }

    const evershopService = initEverShopService();
    const products = await evershopService.searchProducts(query, limit);

    res.json({
      code: 0,
      msg: 'success',
      data: {
        products,
        query,
        count: products.length,
      },
    });
  } catch (error: any) {
    logger.error('Failed to search products', { query: req.query.q, error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to search products',
      data: { error: error.message },
    });
  }
});

/**
 * GET /api/evershop/statistics
 * Get EverShop data statistics
 */
router.get('/statistics', async (_req: Request, res: Response) => {
  try {
    const evershopService = initEverShopService();

    // Fetch counts
    const [productsData, ordersData, customersData] = await Promise.all([
      evershopService.getProducts(1, 1),
      evershopService.getOrders(1, 1),
      evershopService.getCustomers(1, 1),
    ]);

    res.json({
      code: 0,
      msg: 'success',
      data: {
        products: productsData.total,
        orders: ordersData.total,
        customers: customersData.total,
        lastSync: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Failed to get statistics', { error: error.message });
    res.status(500).json({
      code: 1,
      msg: 'Failed to get statistics',
      data: { error: error.message },
    });
  }
});

export default router;

