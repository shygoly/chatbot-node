# Phase 2.4: EverShop Webhook Integration Requirements

**Version**: 2.0  
**Date**: October 28, 2025  
**Status**: Planning

---

## Overview

Integrate with EverShop webhooks to automatically sync data and trigger proactive customer communications based on e-commerce events.

## Business Goals

1. **Real-time Sync**: Keep knowledge base updated automatically
2. **Proactive Support**: Reach out to customers at key moments
3. **Operational Efficiency**: Reduce manual data sync operations
4. **Customer Experience**: Timely notifications and assistance

## MVP Core Webhooks

### 1. Product Events
- **product.created** → Add to knowledge base
- **product.updated** → Update knowledge base
- **product.deleted** → Remove from knowledge base

### 2. Order Events
- **order.created** → Send confirmation message (optional)
- **order.updated** → Send status update to customer

### 3. Customer Events  
- **customer.created** → Send welcome message (optional)

## Webhook Architecture

### Event Flow
```
EverShop → Webhook Endpoint → Validate → Queue → Process → Action
```

### Components

1. **Webhook Receivers** (`src/routes/webhooks.routes.ts`)
   - Receive HTTP POST requests
   - Validate signatures
   - Queue events for processing

2. **Event Queue** (Bull + Redis)
   - Reliable message queue
   - Retry failed jobs
   - Dead letter queue

3. **Event Processors** (`src/services/webhook-handler.service.ts`)
   - Process queued events
   - Execute business logic
   - Handle errors

4. **Actions** (`src/services/evershop-webhook.service.ts`)
   - Update Coze knowledge base
   - Send proactive messages
   - Log events

## MVP Implementation

### Webhook Endpoints

**File**: `src/routes/webhooks.routes.ts`

```typescript
router.post('/evershop/product', 
  validateSignature,
  async (req, res) => {
    const { event, data } = req.body;
    
    // Queue for processing
    await webhookQueue.add('product', {
      event,
      data,
      receivedAt: new Date()
    });
    
    // Acknowledge immediately
    res.json({ code: 0, msg: 'Webhook received' });
  }
);

router.post('/evershop/order', 
  validateSignature,
  async (req, res) => {
    const { event, data } = req.body;
    
    await webhookQueue.add('order', {
      event,
      data,
      receivedAt: new Date()
    });
    
    res.json({ code: 0, msg: 'Webhook received' });
  }
);

router.post('/evershop/customer',
  validateSignature,
  async (req, res) => {
    const { event, data } = req.body;
    
    await webhookQueue.add('customer', {
      event,
      data,
      receivedAt: new Date()
    });
    
    res.json({ code: 0, msg: 'Webhook received' });
  }
);
```

### Signature Validation Middleware

```typescript
function validateSignature(req, res, next) {
  const signature = req.headers['x-evershop-signature'];
  const secret = process.env.EVERSHOP_WEBHOOK_SECRET;
  
  if (!signature) {
    return res.status(401).json({ 
      code: 1, 
      msg: 'Missing signature' 
    });
  }
  
  const payload = JSON.stringify(req.body);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  if (signature !== expected) {
    return res.status(401).json({ 
      code: 1, 
      msg: 'Invalid signature' 
    });
  }
  
  next();
}
```

### Event Queue Setup

**File**: `src/services/webhook-queue.service.ts`

```typescript
import Bull from 'bull';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const webhookQueue = new Bull('webhooks', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Process product events
webhookQueue.process('product', async (job) => {
  await webhookHandler.handleProductEvent(job.data);
});

// Process order events
webhookQueue.process('order', async (job) => {
  await webhookHandler.handleOrderEvent(job.data);
});

// Process customer events
webhookQueue.process('customer', async (job) => {
  await webhookHandler.handleCustomerEvent(job.data);
});

// Error handling
webhookQueue.on('failed', (job, err) => {
  logger.error('Webhook job failed', {
    jobId: job.id,
    event: job.data.event,
    error: err.message
  });
});

export default webhookQueue;
```

### Event Handlers

**File**: `src/services/webhook-handler.service.ts`

```typescript
class WebhookHandlerService {
  async handleProductEvent(data: any) {
    const { event, data: product } = data;
    
    switch (event) {
      case 'product.created':
      case 'product.updated':
        await this.syncProductToKnowledgeBase(product);
        break;
        
      case 'product.deleted':
        await this.removeProductFromKnowledgeBase(product.id);
        break;
    }
  }
  
  async handleOrderEvent(data: any) {
    const { event, data: order } = data;
    
    switch (event) {
      case 'order.created':
        // Optional: Send confirmation message
        await this.sendOrderConfirmation(order);
        break;
        
      case 'order.updated':
        // Send status update
        await this.sendOrderStatusUpdate(order);
        break;
    }
  }
  
  async handleCustomerEvent(data: any) {
    const { event, data: customer } = data;
    
    switch (event) {
      case 'customer.created':
        // Optional: Send welcome message
        await this.sendWelcomeMessage(customer);
        break;
    }
  }
  
  private async syncProductToKnowledgeBase(product: any) {
    // Get all products and regenerate CSV
    const products = await evershopService.getProducts(1000, 1);
    const csv = evershopService.productsToCSV(products.products);
    await cozeApiService.updateDataset('default', 'products', csv);
    
    logger.info('Product synced to knowledge base', {
      productId: product.id,
      productName: product.name
    });
  }
  
  private async sendOrderStatusUpdate(order: any) {
    // Find customer conversation
    const customer = await inboxUsersService.login(
      order.customerEmail,
      'default'
    );
    
    // Create or get conversation
    const conversation = await conversationService.getOrCreate(
      customer.id,
      'default'
    );
    
    // Send proactive message
    const message = `Hi! Your order #${order.orderNumber} status has been updated to: ${order.status}. ${this.getStatusMessage(order.status)}`;
    
    await chatHistoryService.createMessage({
      conversationId: conversation.id,
      inboxUserId: customer.id,
      content: message,
      role: 'assistant',
      messageType: 'text'
    });
    
    // Notify via WebSocket if connected
    websocketService.sendMessage(conversation.id, {
      content: message,
      sender: 'system',
      timestamp: new Date()
    });
  }
  
  private getStatusMessage(status: string): string {
    const messages = {
      'processing': 'We are preparing your order.',
      'shipped': 'Your order is on the way!',
      'delivered': 'Your order has been delivered. Enjoy!',
      'cancelled': 'Your order has been cancelled.'
    };
    return messages[status] || '';
  }
}

export default new WebhookHandlerService();
```

## Webhook Payload Examples

### Product Created
```json
{
  "event": "product.created",
  "timestamp": "2025-10-28T12:00:00Z",
  "data": {
    "id": "123",
    "name": "New Product",
    "description": "Product description",
    "price": 99.99,
    "sku": "PROD-123",
    "qty": 100
  }
}
```

### Order Updated
```json
{
  "event": "order.updated",
  "timestamp": "2025-10-28T12:00:00Z",
  "data": {
    "id": "456",
    "orderNumber": "ORD-456",
    "customerId": "789",
    "customerEmail": "customer@example.com",
    "status": "shipped",
    "previousStatus": "processing",
    "items": [...]
  }
}
```

## Database Schema

### Table: `webhook_events`
```sql
CREATE TABLE webhook_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type VARCHAR(50) NOT NULL,
  event_data TEXT NOT NULL, -- JSON
  status VARCHAR(20) NOT NULL, -- pending, processing, completed, failed
  attempts INTEGER DEFAULT 0,
  last_error TEXT,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at TIMESTAMP
);

CREATE INDEX idx_webhook_events_status ON webhook_events(status);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
```

## Configuration

### Environment Variables
```bash
# Webhook Configuration
EVERSHOP_WEBHOOK_SECRET=your-webhook-secret
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Feature Flags
WEBHOOK_SEND_ORDER_CONFIRMATION=false
WEBHOOK_SEND_WELCOME_MESSAGE=false
WEBHOOK_AUTO_SYNC_PRODUCTS=true
```

### EverShop Webhook Setup

In EverShop admin, configure webhooks:
```
Product Events:
URL: https://your-domain.com/api/webhooks/evershop/product
Events: product.created, product.updated, product.deleted
Secret: [your-webhook-secret]

Order Events:
URL: https://your-domain.com/api/webhooks/evershop/order
Events: order.created, order.updated
Secret: [your-webhook-secret]

Customer Events:
URL: https://your-domain.com/api/webhooks/evershop/customer
Events: customer.created
Secret: [your-webhook-secret]
```

## Error Handling

### Retry Strategy
```typescript
const retryOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000 // 2s, 4s, 8s
  }
};
```

### Dead Letter Queue
```typescript
webhookQueue.on('failed', async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    // Move to dead letter queue
    await deadLetterQueue.add({
      originalJob: job.data,
      error: err.message,
      failedAt: new Date()
    });
    
    // Alert admins
    await alertService.notifyWebhookFailure(job.data, err);
  }
});
```

## Testing

### Webhook Test Endpoint
```typescript
// For development/testing only
router.post('/test/webhook', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ msg: 'Not found' });
  }
  
  await webhookQueue.add('product', req.body);
  res.json({ code: 0, msg: 'Test webhook queued' });
});
```

### Manual Testing
```bash
# Test product webhook
curl -X POST http://localhost:3000/api/webhooks/evershop/product \
  -H "Content-Type: application/json" \
  -H "x-evershop-signature: <calculated-signature>" \
  -d '{
    "event": "product.created",
    "data": {
      "id": "123",
      "name": "Test Product",
      "price": 99.99
    }
  }'
```

## Monitoring

### Metrics to Track
- Webhook success rate
- Average processing time
- Queue depth
- Failed jobs count
- Retry rate

### Logging
```typescript
logger.info('Webhook received', {
  event: data.event,
  source: 'evershop',
  timestamp: data.timestamp
});

logger.info('Webhook processed successfully', {
  event: data.event,
  duration: processingTime,
  action: 'product_synced'
});

logger.error('Webhook processing failed', {
  event: data.event,
  error: err.message,
  attempt: job.attemptsMade
});
```

## MVP Scope

**Included**:
- ✅ Product webhooks (create, update, delete)
- ✅ Order webhooks (create, update)
- ✅ Customer webhooks (create)
- ✅ Signature validation
- ✅ Event queue with retries
- ✅ Knowledge base auto-sync
- ✅ Order status proactive messages

**Not Included** (Future):
- ❌ Inventory low alerts
- ❌ Price change alerts
- ❌ Cart abandonment webhooks
- ❌ Webhook management UI
- ❌ Webhook replay functionality
- ❌ Advanced routing rules
- ❌ Webhook analytics dashboard

## Dependencies

```json
{
  "bull": "^4.12.0",
  "ioredis": "^5.3.0"
}
```

## Success Metrics (MVP)

- 99% webhook delivery success
- <5 second average processing time
- <100 events in queue at any time
- Zero data loss on failures
- Automatic recovery from outages

---

**Document Owner**: Development Team  
**Last Updated**: October 28, 2025  
**Status**: Ready for MVP Implementation

