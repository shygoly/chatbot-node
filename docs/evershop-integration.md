# EverShop Integration Guide

## Overview

This guide explains how to integrate the Chatbot Widget with your EverShop store.

## Prerequisites

1. EverShop store (local or deployed)
2. Chatbot-node backend running
3. Admin access to EverShop

## Configuration

### 1. Environment Variables

Add these variables to your `.env` file:

```bash
# EverShop Configuration
EVERSHOP_URL=https://your-evershop-store.com
EVERSHOP_EMAIL=admin@example.com
EVERSHOP_PASSWORD=your-secure-password

# Optional: CORS configuration to allow your EverShop domain
CORS_ORIGIN=https://your-evershop-store.com
```

### 2. Start the Backend

```bash
cd chatbot-node
npm run dev
```

The backend will:
- Serve the widget at `http://localhost:3000/widget/chatbot-widget.js`
- Serve the admin dashboard at `http://localhost:3000/admin`
- Provide API endpoints for EverShop integration

## Widget Integration

### Method 1: Direct Script Tag (Recommended)

Add this script tag to your EverShop theme's layout file:

```html
<!-- Usually in themes/[your-theme]/pages/all/layout/layout.html -->
<script 
  src="http://localhost:3000/widget/chatbot-widget.js"
  data-api-url="http://localhost:3000"
  data-bot-id="your-bot-id"
  data-shop-id="your-shop-id"
  data-position="bottom-right"
></script>
```

**Production URL:**
```html
<script 
  src="https://your-chatbot-domain.com/widget/chatbot-widget.js"
  data-api-url="https://your-chatbot-domain.com"
  data-bot-id="your-bot-id"
  data-shop-id="your-shop-id"
></script>
```

### Method 2: EverShop Extension

Create a custom EverShop extension:

1. Create extension directory:
```bash
mkdir -p extensions/chatbot-widget
```

2. Create `extensions/chatbot-widget/bootstrap.js`:
```javascript
module.exports = (app) => {
  // Register the widget script
  app.on('bodyEnd', async (html) => {
    return html + `
      <script 
        src="http://localhost:3000/widget/chatbot-widget.js"
        data-api-url="http://localhost:3000"
        data-bot-id="${process.env.CHATBOT_BOT_ID || 'default'}"
        data-shop-id="${process.env.CHATBOT_SHOP_ID || 'default'}"
      ></script>
    `;
  });
};
```

3. Create `extensions/chatbot-widget/package.json`:
```json
{
  "name": "chatbot-widget",
  "version": "1.0.0",
  "description": "AI Chatbot Widget for EverShop",
  "main": "bootstrap.js",
  "evershop": {
    "priority": 10,
    "enabled": true
  }
}
```

4. Restart EverShop to load the extension.

## Widget Configuration Options

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-api-url` | Yes | - | Backend API URL |
| `data-bot-id` | Yes | - | Coze bot identifier |
| `data-shop-id` | Yes | - | Your shop identifier |
| `data-customer-id` | No | - | EverShop customer ID (for logged-in users) |
| `data-position` | No | `bottom-right` | Widget position (`bottom-right` or `bottom-left`) |

## Logged-in Customer Integration

To pass the logged-in customer information to the widget:

### In EverShop Theme

Modify your theme to include customer data:

```javascript
// In your theme's JavaScript
document.addEventListener('DOMContentLoaded', function() {
  const widget = document.querySelector('[src*="chatbot-widget.js"]');
  
  // Get customer data from EverShop session
  fetch('/api/customer/session')
    .then(res => res.json())
    .then(data => {
      if (data.customer) {
        widget.setAttribute('data-customer-id', data.customer.customerId);
        widget.setAttribute('data-customer-email', data.customer.email);
      }
    });
});
```

## Data Synchronization

### Automatic Sync (Backend Configuration)

The backend can be configured to automatically sync EverShop data to Coze:

```javascript
// In your backend startup script
import { getEverShopService } from './services/evershop-api.service';
import { cozeApiService } from './services/coze-api.service';

// Schedule daily sync at 2 AM
cron.schedule('0 2 * * *', async () => {
  const evershopService = getEverShopService(evershopConfig);
  const { products } = await evershopService.getProducts(1000, 1);
  const csv = evershopService.productsToCSV(products);
  await cozeApiService.updateDataset('your-shop-id', 'products', csv);
});
```

### Manual Sync (Admin Dashboard)

1. Navigate to `http://localhost:3000/admin`
2. Go to "AI Assistant" tab
3. Click "Sync Products" to sync product catalog
4. Click "Sync Orders" to fetch recent orders
5. Click "Sync Customers" to fetch customer data

### API-based Sync

Use the REST API to trigger sync:

```bash
# Sync products
curl -X POST http://localhost:3000/api/evershop/sync/products \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "your-shop-id",
    "botId": "your-bot-id",
    "limit": 100
  }'

# Fetch orders
curl -X POST http://localhost:3000/api/evershop/sync/orders \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "page": 1
  }'

# Fetch customers
curl -X POST http://localhost:3000/api/evershop/sync/customers \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 100,
    "page": 1
  }'
```

## Testing the Integration

### 1. Test Widget Loading

1. Open your EverShop store in a browser
2. Look for the red chat button in the bottom-right corner
3. Click the button to open the chat window
4. Send a test message

### 2. Test Backend Connection

```bash
# Health check
curl http://localhost:3000/health

# EverShop connection
curl http://localhost:3000/api/evershop/status

# Get products
curl http://localhost:3000/api/evershop/products?limit=10
```

### 3. Test Admin Dashboard

1. Open `http://localhost:3000/admin` in a browser
2. Check the "AI Assistant" page for EverShop statistics
3. Try syncing products

## Deployment

### Backend Deployment

**Option 1: Docker**

```bash
cd chatbot-node
docker build -t chatbot-node .
docker run -p 3000:3000 \
  -e EVERSHOP_URL=https://your-store.com \
  -e EVERSHOP_EMAIL=admin@example.com \
  -e EVERSHOP_PASSWORD=your-password \
  chatbot-node
```

**Option 2: Fly.io**

```bash
fly launch --name chatbot-node
fly secrets set EVERSHOP_URL=https://your-store.com
fly secrets set EVERSHOP_EMAIL=admin@example.com
fly secrets set EVERSHOP_PASSWORD=your-password
fly deploy
```

### Update Widget URL

After deployment, update the widget script URL in your EverShop theme:

```html
<script 
  src="https://chatbot-node.fly.dev/widget/chatbot-widget.js"
  data-api-url="https://chatbot-node.fly.dev"
  data-bot-id="your-bot-id"
  data-shop-id="your-shop-id"
></script>
```

## Customization

### Widget Appearance

The widget can be customized by modifying `/public/widget/chatbot-widget.css`:

```css
/* Change button color */
.chatbot_button {
  background-color: #007bff; /* Blue instead of red */
}

/* Change button position */
.chatbot_button {
  bottom: 20px;
  left: 20px; /* Left instead of right */
  right: auto;
}

/* Change chat window size */
.chatbot_container {
  width: 400px;
  height: 650px;
}
```

### Custom Welcome Message

Modify `/public/widget/chatbot-iframe.html`:

```html
<div class="chat-welcome">
  <div class="chat-welcome-icon">🎉</div>
  <div class="chat-welcome-title">Custom Welcome!</div>
  <div class="chat-welcome-text">
    Your custom welcome message here.
  </div>
</div>
```

## Troubleshooting

### Widget Not Appearing

1. **Check browser console for errors**
   - Open DevTools (F12) → Console tab
   - Look for script loading errors

2. **Verify script URL**
   - Ensure `data-api-url` is correct
   - Check network tab for 404 errors

3. **Check CORS configuration**
   - Backend must allow your EverShop domain
   - Set `CORS_ORIGIN` environment variable

### Widget Loads But Doesn't Connect

1. **Check backend logs**
   ```bash
   cd chatbot-node
   tail -f logs/app.log
   ```

2. **Verify API endpoints**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/evershop/status
   ```

3. **Check EverShop credentials**
   - Ensure `EVERSHOP_EMAIL` and `EVERSHOP_PASSWORD` are correct
   - Test login via EverShop admin panel

### Data Sync Fails

1. **Check EverShop API access**
   ```bash
   curl -X POST https://your-store.com/api/admin/user/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "your-password"}'
   ```

2. **Verify Coze credentials**
   - Check `COZE_CLIENT_ID`, `COZE_PUBLIC_KEY`, `COZE_PRIVATE_KEY_PATH`
   - Ensure private key file exists

3. **Check backend logs for specific errors**

## Security Considerations

### Production Deployment

1. **Use HTTPS** for both backend and EverShop
2. **Set strong JWT secret**: `JWT_SECRET=your-long-random-string`
3. **Restrict CORS**: `CORS_ORIGIN=https://your-store.com`
4. **Use environment variables** for all sensitive data
5. **Enable rate limiting** on API endpoints
6. **Regularly update dependencies**

### Customer Data Privacy

- Anonymous sessions are stored with UUID only
- Customer emails are only stored if explicitly provided
- All data is encrypted in transit (HTTPS)
- Configure data retention policies in database

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-repo/chatbot-node/issues
- Documentation: https://github.com/your-repo/chatbot-node/wiki
- Email: support@your-domain.com

## License

MIT License - See LICENSE file for details

