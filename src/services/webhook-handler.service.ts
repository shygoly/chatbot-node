import { Job } from 'bull';
import logger from '../lib/logger';
import { getEverShopService } from './evershop-api.service';
import cozeApiService from './coze-api.service';
import inboxUsersService from './inbox-users.service';
import conversationService from './conversation.service';
import chatHistoryService from './chat-history.service';
import websocketService from './websocket.service';
import config from '../config';

interface WebhookJobData {
  event: string;
  data: any;
  receivedAt: string;
}

class WebhookHandlerService {
  /**
   * Handle product events
   */
  async handleProductEvent(job: Job<WebhookJobData>): Promise<any> {
    const { event, data: product } = job.data;

    logger.info('Processing product webhook', {
      event,
      productId: product.id || product.productId,
      productName: product.name,
    });

    try {
      switch (event) {
        case 'product.created':
        case 'product.updated':
          await this.syncProductToKnowledgeBase(product);
          break;

        case 'product.deleted':
          await this.removeProductFromKnowledgeBase(product.id || product.productId);
          break;

        default:
          logger.warn('Unknown product event', { event });
      }

      return { success: true, event };
    } catch (error: any) {
      logger.error('Failed to handle product event', {
        event,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle order events
   */
  async handleOrderEvent(job: Job<WebhookJobData>): Promise<any> {
    const { event, data: order } = job.data;

    logger.info('Processing order webhook', {
      event,
      orderId: order.id || order.orderId,
      orderNumber: order.orderNumber,
    });

    try {
      switch (event) {
        case 'order.created':
          // Optional: Send confirmation
          if (process.env.WEBHOOK_SEND_ORDER_CONFIRMATION === 'true') {
            await this.sendOrderConfirmation(order);
          }
          break;

        case 'order.updated':
          // Send status update to customer
          await this.sendOrderStatusUpdate(order);
          break;

        default:
          logger.warn('Unknown order event', { event });
      }

      return { success: true, event };
    } catch (error: any) {
      logger.error('Failed to handle order event', {
        event,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Handle customer events
   */
  async handleCustomerEvent(job: Job<WebhookJobData>): Promise<any> {
    const { event, data: customer } = job.data;

    logger.info('Processing customer webhook', {
      event,
      customerId: customer.id || customer.customerId,
      customerEmail: customer.email,
    });

    try {
      switch (event) {
        case 'customer.created':
          // Optional: Send welcome message
          if (process.env.WEBHOOK_SEND_WELCOME_MESSAGE === 'true') {
            await this.sendWelcomeMessage(customer);
          }
          break;

        default:
          logger.warn('Unknown customer event', { event });
      }

      return { success: true, event };
    } catch (error: any) {
      logger.error('Failed to handle customer event', {
        event,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Sync single product to knowledge base
   */
  private async syncProductToKnowledgeBase(product: any): Promise<void> {
    try {
      // For MVP, we'll re-sync all products
      // Future optimization: incremental update
      const evershopService = getEverShopService({
        baseUrl: config.evershop.baseUrl,
        email: config.evershop.email,
        password: config.evershop.password,
      });

      const { products } = await evershopService.getProducts(1000, 1);
      const csv = evershopService.productsToCSV(products);

      // Type: 1=product, 2=order, 3=customer
      await cozeApiService.updateDataset(1, 'default', csv);

      logger.info('Product synced to knowledge base via webhook', {
        productId: product.id || product.productId,
        productName: product.name,
        totalProducts: products.length,
      });
    } catch (error: any) {
      logger.error('Failed to sync product to knowledge base', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Remove product from knowledge base
   */
  private async removeProductFromKnowledgeBase(productId: string): Promise<void> {
    try {
      // For MVP, we'll re-sync all products (excluding deleted ones)
      const evershopService = getEverShopService({
        baseUrl: config.evershop.baseUrl,
        email: config.evershop.email,
        password: config.evershop.password,
      });

      const { products } = await evershopService.getProducts(1000, 1);
      const csv = evershopService.productsToCSV(products);

      // Type: 1=product, 2=order, 3=customer
      await cozeApiService.updateDataset(1, 'default', csv);

      logger.info('Product removed from knowledge base via webhook', {
        productId,
        remainingProducts: products.length,
      });
    } catch (error: any) {
      logger.error('Failed to remove product from knowledge base', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Send order confirmation message
   */
  private async sendOrderConfirmation(order: any): Promise<void> {
    try {
      const customerEmail = order.customerEmail || order.customer_email;
      if (!customerEmail) {
        logger.warn('No customer email for order confirmation', {
          orderId: order.id || order.orderId,
        });
        return;
      }

      // Get or create inbox user
      const inboxUser = await inboxUsersService.login(customerEmail, 'default');

      // Get or create conversation
      const conversation = await conversationService.getOrCreate(inboxUser.id, 'default');

      // Create confirmation message
      const message = `Thank you for your order #${order.orderNumber || order.order_number}! We've received your order and will process it shortly. You can track your order status here.`;

      await chatHistoryService.createMessage({
        conversationId: conversation.conversationId,
        inboxUserId: inboxUser.id,
        shopId: 'default',
        botId: conversation.botId || 'default',
        content: message,
        sender: 'assistant',
      });

      // Send via WebSocket if customer is online
      websocketService.sendMessage(conversation.conversationId, {
        conversationId: conversation.conversationId,
        content: message,
        sender: {
          userId: 'system',
          userName: 'Order System',
          role: 'bot',
        },
        timestamp: new Date().toISOString(),
      });

      logger.info('Order confirmation sent', {
        orderId: order.id || order.orderId,
        customerId: inboxUser.id,
      });
    } catch (error: any) {
      logger.error('Failed to send order confirmation', {
        error: error.message,
      });
      // Don't throw - this is optional
    }
  }

  /**
   * Send order status update message
   */
  private async sendOrderStatusUpdate(order: any): Promise<void> {
    try {
      const customerEmail = order.customerEmail || order.customer_email;
      if (!customerEmail) {
        logger.warn('No customer email for order status update', {
          orderId: order.id || order.orderId,
        });
        return;
      }

      const status = order.status;
      const previousStatus = order.previousStatus || order.previous_status;

      // Only send update if status actually changed
      if (status === previousStatus) {
        return;
      }

      // Get or create inbox user
      const inboxUser = await inboxUsersService.login(customerEmail, 'default');

      // Get or create conversation
      const conversation = await conversationService.getOrCreate(Number(inboxUser.id), 'default');

      // Create status update message
      const statusMessage = this.getOrderStatusMessage(status);
      const message = `Hi! Your order #${order.orderNumber || order.order_number} status has been updated to: ${status}. ${statusMessage}`;

      await chatHistoryService.createMessage({
        conversationId: conversation.conversationId,
        inboxUserId: inboxUser.id,
        shopId: 'default',
        botId: conversation.botId || 'default',
        content: message,
        sender: 'assistant',
      });

      // Send via WebSocket
      websocketService.sendMessage(conversation.conversationId, {
        conversationId: conversation.conversationId,
        content: message,
        sender: {
          userId: 'system',
          userName: 'Order System',
          role: 'bot',
        },
        timestamp: new Date().toISOString(),
      });

      logger.info('Order status update sent', {
        orderId: order.id || order.orderId,
        status,
        previousStatus,
        customerId: inboxUser.id,
      });
    } catch (error: any) {
      logger.error('Failed to send order status update', {
        error: error.message,
      });
      // Don't throw - proactive messaging is optional
    }
  }

  /**
   * Send welcome message to new customer
   */
  private async sendWelcomeMessage(customer: any): Promise<void> {
    try {
      const customerEmail = customer.email;
      if (!customerEmail) {
        logger.warn('No customer email for welcome message', {
          customerId: customer.id || customer.customerId,
        });
        return;
      }

      // Get or create inbox user
      const inboxUser = await inboxUsersService.login(customerEmail, 'default');

      // Get or create conversation
      const conversation = await conversationService.getOrCreate(inboxUser.id, 'default');

      // Create welcome message
      const message = `Welcome to our store! 🎉 We're thrilled to have you here. If you have any questions about our products or need assistance, feel free to ask. We're here to help!`;

      await chatHistoryService.createMessage({
        conversationId: conversation.conversationId,
        inboxUserId: inboxUser.id,
        shopId: 'default',
        botId: conversation.botId || 'default',
        content: message,
        sender: 'assistant',
      });

      // Send via WebSocket
      websocketService.sendMessage(conversation.conversationId, {
        conversationId: conversation.conversationId,
        content: message,
        sender: {
          userId: 'system',
          userName: 'Welcome Bot',
          role: 'bot',
        },
        timestamp: new Date().toISOString(),
      });

      logger.info('Welcome message sent', {
        customerId: customer.id || customer.customerId,
        inboxUserId: inboxUser.id,
      });
    } catch (error: any) {
      logger.error('Failed to send welcome message', {
        error: error.message,
      });
      // Don't throw - welcome message is optional
    }
  }

  /**
   * Get friendly message for order status
   */
  private getOrderStatusMessage(status: string): string {
    const messages: Record<string, string> = {
      pending: 'Your order is being reviewed.',
      processing: 'We are preparing your order for shipment.',
      shipped: 'Your order is on the way! 📦',
      delivered: 'Your order has been delivered. Enjoy! 🎉',
      cancelled: 'Your order has been cancelled. If you have questions, please contact us.',
      refunded: 'Your refund has been processed.',
    };

    return messages[status.toLowerCase()] || '';
  }
}

// Export singleton instance
export default new WebhookHandlerService();

