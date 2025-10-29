# Quick Reference - EverShop Chatbot UI

## 🚀 Quick Start

```bash
# Start development server
cd chatbot-node
npm run dev

# Build for production
npm run build
```

## 🌐 Access Points

| Resource | URL | Description |
|----------|-----|-------------|
| **Widget Test** | http://localhost:3000/widget-test.html | Demo page with widget |
| **Widget Script** | http://localhost:3000/widget/chatbot-widget.js | Embeddable JS |
| **Admin Dashboard** | http://localhost:3000/admin | Management interface |
| **Health Check** | http://localhost:3000/health | API status |

## 🔌 Widget Integration

### Basic Embed
```html
<script src="http://localhost:3000/widget/chatbot-widget.js"
        data-api-url="http://localhost:3000"
        data-bot-id="your-bot-id"
        data-shop-id="your-shop-id">
</script>
```

### With Customer ID (Logged-in)
```html
<script src="http://localhost:3000/widget/chatbot-widget.js"
        data-api-url="http://localhost:3000"
        data-bot-id="your-bot-id"
        data-shop-id="your-shop-id"
        data-customer-id="customer-123">
</script>
```

### JavaScript API
```javascript
// Open chat
window.ChatbotWidget.open();

// Close chat
window.ChatbotWidget.close();

// Toggle chat
window.ChatbotWidget.toggle();

// Send message programmatically
window.ChatbotWidget.sendMessage("Hello!");
```

## 🔗 API Endpoints

### EverShop Integration

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/evershop/status` | Check connection |
| POST | `/api/evershop/sync/products` | Sync products |
| POST | `/api/evershop/sync/orders` | Fetch orders |
| POST | `/api/evershop/sync/customers` | Fetch customers |
| GET | `/api/evershop/products` | List products |
| GET | `/api/evershop/products/:id` | Get product |
| GET | `/api/evershop/products/search?q=query` | Search products |
| GET | `/api/evershop/statistics` | Get statistics |

### Quick Test Commands
```bash
# Health check
curl http://localhost:3000/health

# EverShop status
curl http://localhost:3000/api/evershop/status

# Get products
curl http://localhost:3000/api/evershop/products?limit=10

# Sync products
curl -X POST http://localhost:3000/api/evershop/sync/products \
  -H "Content-Type: application/json" \
  -d '{"shopId":"default","botId":"default","limit":100}'
```

## ⚙️ Configuration

### Environment Variables
```bash
# EverShop
EVERSHOP_URL=https://your-store.com
EVERSHOP_EMAIL=admin@example.com
EVERSHOP_PASSWORD=your-password

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Database
DATABASE_URL=file:./prisma/dev.db
```

### Widget Configuration Options

| Attribute | Required | Default | Description |
|-----------|----------|---------|-------------|
| `data-api-url` | Yes | - | Backend API URL |
| `data-bot-id` | Yes | - | Bot identifier |
| `data-shop-id` | Yes | - | Shop identifier |
| `data-customer-id` | No | - | Customer ID (logged-in) |
| `data-position` | No | `bottom-right` | Position (`bottom-left` or `bottom-right`) |

## 📁 Project Structure

```
chatbot-node/
├── public/
│   ├── widget/
│   │   ├── chatbot-widget.js        # Embeddable widget
│   │   └── chatbot-iframe.html      # Chat interface
│   ├── admin/
│   │   └── index.html               # Admin dashboard
│   └── widget-test.html             # Test page
├── src/
│   ├── services/
│   │   └── evershop-api.service.ts  # EverShop client
│   ├── routes/
│   │   └── evershop.routes.ts       # API endpoints
│   ├── middleware/
│   │   └── customer-auth.ts         # Customer auth
│   └── app.ts                       # Express app
├── docs/
│   └── evershop-integration.md      # Integration guide
└── memory/
    ├── ui-requirements.md           # Requirements
    └── ui-constitution.md           # Architecture
```

## 🛠️ Common Tasks

### Update EverShop Credentials
```bash
# Edit .env file
nano .env

# Restart server
npm run dev
```

### Test Widget Locally
1. Open http://localhost:3000/widget-test.html
2. Click red chat button
3. Send test message

### Check EverShop Connection
```bash
curl http://localhost:3000/api/evershop/status
```

### Sync Products Manually
1. Open http://localhost:3000/admin
2. Click "AI Assistant" tab
3. Click "Sync Products" button

### View Server Logs
```bash
tail -f dev.log
```

## 🐛 Troubleshooting

### Widget Not Appearing
- Check browser console for errors
- Verify script URL is correct
- Check CORS settings

### Connection Failed
- Verify EverShop URL in `.env`
- Check credentials
- Test EverShop API manually

### Sync Errors
- Check backend logs: `tail -f dev.log`
- Verify Coze credentials
- Check network connectivity

## 📚 Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| **Implementation Summary** | `EVERSHOP_UI_IMPLEMENTATION_COMPLETE.md` | Complete overview |
| **Integration Guide** | `docs/evershop-integration.md` | Setup & deployment |
| **UI Requirements** | `memory/ui-requirements.md` | Feature specs |
| **UI Constitution** | `memory/ui-constitution.md` | Architecture |
| **Verification Report** | `IMPLEMENTATION_VERIFICATION.md` | Test results |
| **Quick Reference** | `QUICK_REFERENCE.md` | This document |

## 🎨 Customization

### Change Widget Color
Edit `/public/widget/chatbot-widget.js`:
```css
.chatbot_button {
  background-color: #007bff; /* Blue instead of red */
}
```

### Change Position
Add to embed code:
```html
data-position="bottom-left"
```

### Modify Welcome Message
Edit `/public/widget/chatbot-iframe.html`:
```html
<div class="chat-welcome-text">
  Your custom message here
</div>
```

## 🚢 Deployment

### Docker
```bash
docker build -t chatbot-node .
docker run -p 3000:3000 \
  -e EVERSHOP_URL=https://your-store.com \
  -e EVERSHOP_EMAIL=admin@example.com \
  -e EVERSHOP_PASSWORD=your-password \
  chatbot-node
```

### Fly.io
```bash
fly deploy
fly secrets set EVERSHOP_URL=https://your-store.com
fly secrets set EVERSHOP_EMAIL=admin@example.com
fly secrets set EVERSHOP_PASSWORD=your-password
```

## 💡 Tips

1. **Always use HTTPS in production**
2. **Set strong JWT secret**: `JWT_SECRET=long-random-string`
3. **Restrict CORS**: `CORS_ORIGIN=https://your-domain.com`
4. **Monitor logs**: Check for errors regularly
5. **Backup database**: Schedule regular backups
6. **Update dependencies**: Keep packages current

## 📞 Support

- GitHub: https://github.com/your-repo/chatbot-node
- Documentation: See files above
- Issues: GitHub Issues

---

**Last Updated**: October 28, 2025  
**Version**: 1.0.0

