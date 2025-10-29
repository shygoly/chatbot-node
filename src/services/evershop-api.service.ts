import axios, { AxiosInstance } from 'axios';
import logger from '../lib/logger';

export interface EverShopConfig {
  baseUrl: string;
  email: string;
  password: string;
}

export interface EverShopProduct {
  productId: string;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  qty?: number;
  status?: number;
  image?: string;
  url?: string;
}

export interface EverShopOrder {
  orderId: string;
  orderNumber: string;
  customerId?: string;
  customerEmail?: string;
  customerFullName?: string;
  grandTotal: number;
  status: string;
  createdAt: string;
  items?: Array<{
    productName: string;
    qty: number;
    price: number;
  }>;
}

export interface EverShopCustomer {
  customerId: string;
  email: string;
  fullName?: string;
  status?: number;
  createdAt?: string;
}

class EverShopAPIService {
  private client: AxiosInstance;
  private token: string | null = null;
  private config: EverShopConfig;

  constructor(config: EverShopConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to re-authenticate
          logger.info('EverShop token expired, re-authenticating...');
          this.token = null;
          await this.authenticate();
          
          // Retry the original request
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${this.token}`;
          return this.client.request(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Authenticate with EverShop and get access token
   */
  async authenticate(): Promise<string> {
    if (this.token && this.token.length > 0) {
      return this.token;
    }

    try {
      logger.info('Authenticating with EverShop...', {
        baseUrl: this.config.baseUrl,
        email: this.config.email,
      });

      const response = await this.client.post('/api/admin/user/login', {
        email: this.config.email,
        password: this.config.password,
      });

      if (response.data && response.data.data && response.data.data.token) {
        const token = response.data.data.token;
        this.token = token;
        logger.info('EverShop authentication successful');
        return token;
      } else {
        throw new Error('Invalid authentication response from EverShop');
      }
    } catch (error: any) {
      this.token = null;
      logger.error('EverShop authentication failed', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`EverShop authentication failed: ${error.message}`);
    }
  }

  /**
   * Get authenticated headers
   */
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const token = await this.authenticate();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Fetch products from EverShop
   */
  async getProducts(
    limit: number = 50,
    page: number = 1
  ): Promise<{ products: EverShopProduct[]; total: number }> {
    try {
      const headers = await this.getAuthHeaders();

      logger.info('Fetching products from EverShop', { limit, page });

      const response = await this.client.get('/api/products', {
        headers,
        params: {
          limit,
          page,
        },
      });

      const products = response.data.data?.items || [];
      const total = response.data.data?.total || products.length;

      logger.info('EverShop products fetched successfully', {
        count: products.length,
        total,
      });

      // Transform to our format
      const transformedProducts: EverShopProduct[] = products.map((p: any) => ({
        productId: p.product_id || p.productId,
        name: p.name || p.product_name,
        description: p.description || p.product_description,
        price: parseFloat(p.price || 0),
        sku: p.sku,
        qty: p.qty || 0,
        status: p.status,
        image: p.image?.url || p.image,
        url: p.url || `${this.config.baseUrl}/product/${p.url_key || p.product_id}`,
      }));

      return {
        products: transformedProducts,
        total,
      };
    } catch (error: any) {
      logger.error('Failed to fetch EverShop products', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  /**
   * Fetch orders from EverShop
   */
  async getOrders(
    limit: number = 50,
    page: number = 1
  ): Promise<{ orders: EverShopOrder[]; total: number }> {
    try {
      const headers = await this.getAuthHeaders();

      logger.info('Fetching orders from EverShop', { limit, page });

      const response = await this.client.get('/api/orders', {
        headers,
        params: {
          limit,
          page,
        },
      });

      const orders = response.data.data?.items || [];
      const total = response.data.data?.total || orders.length;

      logger.info('EverShop orders fetched successfully', {
        count: orders.length,
        total,
      });

      // Transform to our format
      const transformedOrders: EverShopOrder[] = orders.map((o: any) => ({
        orderId: o.order_id || o.orderId,
        orderNumber: o.order_number || o.orderNumber,
        customerId: o.customer_id || o.customerId,
        customerEmail: o.customer_email || o.email,
        customerFullName: o.customer_full_name || o.fullName,
        grandTotal: parseFloat(o.grand_total || o.total || 0),
        status: o.status || 'pending',
        createdAt: o.created_at || o.createdAt,
        items: o.items || [],
      }));

      return {
        orders: transformedOrders,
        total,
      };
    } catch (error: any) {
      logger.error('Failed to fetch EverShop orders', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }
  }

  /**
   * Fetch customers from EverShop
   */
  async getCustomers(
    limit: number = 50,
    page: number = 1
  ): Promise<{ customers: EverShopCustomer[]; total: number }> {
    try {
      const headers = await this.getAuthHeaders();

      logger.info('Fetching customers from EverShop', { limit, page });

      const response = await this.client.get('/api/customers', {
        headers,
        params: {
          limit,
          page,
        },
      });

      const customers = response.data.data?.items || [];
      const total = response.data.data?.total || customers.length;

      logger.info('EverShop customers fetched successfully', {
        count: customers.length,
        total,
      });

      // Transform to our format
      const transformedCustomers: EverShopCustomer[] = customers.map((c: any) => ({
        customerId: c.customer_id || c.customerId,
        email: c.email,
        fullName: c.full_name || c.fullName,
        status: c.status,
        createdAt: c.created_at || c.createdAt,
      }));

      return {
        customers: transformedCustomers,
        total,
      };
    } catch (error: any) {
      logger.error('Failed to fetch EverShop customers', {
        error: error.message,
        response: error.response?.data,
      });
      throw new Error(`Failed to fetch customers: ${error.message}`);
    }
  }

  /**
   * Transform products to CSV format for Coze knowledge base
   */
  productsToCSV(products: EverShopProduct[]): string {
    const headers = ['Product ID', 'Name', 'Description', 'Price', 'SKU', 'Quantity', 'URL'];
    const rows = products.map((p) => [
      p.productId,
      p.name,
      p.description || '',
      p.price.toString(),
      p.sku || '',
      p.qty?.toString() || '0',
      p.url || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<EverShopProduct | null> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await this.client.get(`/api/products/${productId}`, {
        headers,
      });

      if (response.data && response.data.data) {
        const p = response.data.data;
        return {
          productId: p.product_id || p.productId,
          name: p.name || p.product_name,
          description: p.description || p.product_description,
          price: parseFloat(p.price || 0),
          sku: p.sku,
          qty: p.qty || 0,
          status: p.status,
          image: p.image?.url || p.image,
          url: p.url || `${this.config.baseUrl}/product/${p.url_key || p.product_id}`,
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to fetch product by ID', {
        productId,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Search products
   */
  async searchProducts(query: string, limit: number = 10): Promise<EverShopProduct[]> {
    try {
      const headers = await this.getAuthHeaders();

      const response = await this.client.get('/api/products', {
        headers,
        params: {
          search: query,
          limit,
        },
      });

      const products = response.data.data?.items || [];

      return products.map((p: any) => ({
        productId: p.product_id || p.productId,
        name: p.name || p.product_name,
        description: p.description || p.product_description,
        price: parseFloat(p.price || 0),
        sku: p.sku,
        qty: p.qty || 0,
        status: p.status,
        image: p.image?.url || p.image,
        url: p.url || `${this.config.baseUrl}/product/${p.url_key || p.product_id}`,
      }));
    } catch (error: any) {
      logger.error('Failed to search products', {
        query,
        error: error.message,
      });
      return [];
    }
  }
}

// Export singleton instance
let evershopService: EverShopAPIService | null = null;

export function getEverShopService(config?: EverShopConfig): EverShopAPIService {
  if (!evershopService && config) {
    evershopService = new EverShopAPIService(config);
  }

  if (!evershopService) {
    throw new Error('EverShop service not initialized. Provide config on first call.');
  }

  return evershopService;
}

export { EverShopAPIService };

