# Chatbot Node Proxy

A lightweight Node.js/Express proxy service for chatbotadmin intelligent customer service APIs.

## Features

- ✅ Stateless proxy to Java Spring Boot backend
- ✅ Clean RESTful API with simplified paths
- ✅ SSE streaming support for real-time chat
- ✅ TypeScript with strict type checking
- ✅ Comprehensive error handling and logging
- ✅ File download support (Excel exports)
- ✅ JWT-based Coze OAuth support

## Quick Start

### Prerequisites

- Node.js 18+
- chatbotadmin backend running on `http://localhost:48080`

### Installation

```bash
cd /Users/mac/Sync/project/drsell/chatbot-node
npm install
```

### Configuration

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
npm run dev
```

Server will start on `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## API Reference

### Authentication

All endpoints require these headers:
```http
Authorization: Bearer <access_token>
tenant-id: 1
```

Get access token:
```bash
curl -X POST "http://localhost:48080/admin-api/system/auth/login" \
  -H "Content-Type: application/json" \
  -H "tenant-id: 1" \
  -d '{"username":"admin","password":"admin123"}'
```

### API Groups

| Group | Base Path | Endpoints | Description |
|-------|-----------|-----------|-------------|
| Coze API | `/api/coze` | 7 | Bot management, chat, dataset updates |
| Coze OAuth | `/api/coze/oauth` | 5 | Coze authorization flow |
| Bot Settings | `/api/bot-settings` | 7 | Shopify bot configuration |
| Chat History | `/api/chat-history` | 9 | Chat history and statistics |
| Coze Info | `/api/coze-info` | 6 | Coze bot information |
| Inquiries | `/api/inquiries` | 6 | Customer service inquiries |
| Inbox Users | `/api/inbox-users` | 8 | Chat inbox user management |

### Example Requests

#### 1. Chat with Coze Bot (SSE Streaming)

```bash
curl -X POST "http://localhost:3000/api/coze/chat" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "message": "Hello",
    "userId": "user-001"
  }'
```

#### 2. Get Bot Settings by Shop Name

```bash
curl "http://localhost:3000/api/bot-settings/shop/name/myshop" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "tenant-id: 1"
```

#### 3. Get Chat History Statistics

```bash
curl "http://localhost:3000/api/chat-history/statistics/today" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "tenant-id: 1"
```

#### 4. Create Customer Inquiry

```bash
curl -X POST "http://localhost:3000/api/inquiries" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "message": "I need help with my order"
  }'
```

#### 5. Get Inbox Users Page

```bash
curl "http://localhost:3000/api/inbox-users/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "tenant-id: 1"
```

## API Path Mapping

| Proxy Path | Backend Path |
|------------|--------------|
| `POST /api/coze/bot/updateDataset/:type` | `POST /admin-api/mail/coze/api/updateDataset/:type` |
| `POST /api/coze/bot/getOrCreateBot` | `POST /admin-api/mail/coze/api/getOrCreateBot` |
| `POST /api/coze/chat` | `POST /admin-api/mail/coze/api/chat` |
| `GET /api/coze/bot/datasetStatistic/:shopId/:type` | `GET /admin-api/mail/coze/api/getDatasetStatisticByType/:shopId/:type` |
| `GET /api/coze/bot/datasetStatistic/:shopId` | `GET /admin-api/mail/coze/api/datasetStatistic/:shopId` |
| `POST /api/coze/oauth/tokenForSdk` | `POST /admin-api/mail/coze/oauth/tokenForSdk` |
| `GET /api/coze/oauth/token` | `GET /admin-api/mail/coze/oauth/token` |
| `GET /api/coze/oauth/callback` | `GET /admin-api/mail/coze/oauth/callback` |
| `GET /api/coze/oauth/authorize` | `GET /admin-api/mail/coze/oauth/authorize` |
| `GET /api/coze/oauth/authorize-url` | `GET /admin-api/mail/coze/oauth/authorize-url` |
| `GET/POST/PUT/DELETE /api/bot-settings/**` | `GET/POST/PUT/DELETE /admin-api/mail/shopify/botSettings/**` |
| `GET/POST/PUT/DELETE /api/chat-history/**` | `GET/POST/PUT/DELETE /admin-api/mail/coze-chat-history/**` |
| `GET/POST/PUT/DELETE /api/coze-info/**` | `GET/POST/PUT/DELETE /admin-api/mail/coze-info/**` |
| `GET/POST/PUT/DELETE /api/inquiries/**` | `GET/POST/PUT/DELETE /admin-api/mail/customerServiceInquiries/**` |
| `GET/POST/PUT/DELETE /api/inbox-users/**` | `GET/POST/PUT/DELETE /admin-api/mail/shopify/inboxUser/**` |

## Response Format

### Success Response
```json
{
  "id": 123,
  "name": "Example",
  ...
}
```

The proxy automatically unwraps the Java `CommonResult<T>` wrapper and returns just the data.

### Error Response
```json
{
  "error": "Error",
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2025-10-28T12:34:56.789Z",
  "path": "/api/bot-settings"
}
```

## Configuration

Environment variables in `.env`:

| Variable | Default | Description |
|----------|---------|-------------|
| `BACKEND_URL` | `http://localhost:48080` | chatbotadmin backend URL |
| `PORT` | `3000` | Proxy server port |
| `NODE_ENV` | `development` | Environment (development/production) |
| `LOG_LEVEL` | `info` | Logging level (debug/info/warn/error) |
| `CORS_ORIGIN` | `*` | CORS allowed origins |
| `REQUEST_TIMEOUT` | `30000` | Backend request timeout (ms) |
| `DEFAULT_TENANT_ID` | `1` | Default tenant ID if not provided |
| `COZE_CLIENT_ID` | (see .env.example) | Coze OAuth client ID |
| `COZE_PUBLIC_KEY` | (see .env.example) | Coze OAuth public key |
| `COZE_PRIVATE_KEY_PATH` | `config/coze-private-key.pem` | Path to Coze private key |

## Project Structure

```
chatbot-node/
├── config/
│   └── coze-private-key.pem    # Coze OAuth private key
├── docs/
│   └── chatbot-api-spec.md     # API specification
├── memory/
│   └── constitution.md         # Project architecture guide
├── src/
│   ├── config/
│   │   └── index.ts           # Configuration management
│   ├── lib/
│   │   ├── backend-client.ts  # Backend HTTP client
│   │   └── logger.ts          # Winston logger
│   ├── middleware/
│   │   ├── error-handler.ts   # Error handling
│   │   └── request-logger.ts  # Request logging
│   ├── routes/
│   │   ├── bot-settings.routes.ts
│   │   ├── chat-history.routes.ts
│   │   ├── coze-api.routes.ts
│   │   ├── coze-info.routes.ts
│   │   ├── coze-oauth.routes.ts
│   │   ├── inbox-users.routes.ts
│   │   └── inquiries.routes.ts
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── app.ts                 # Express app setup
│   └── index.ts               # Server entry point
├── .eslintrc.json
├── .gitignore
├── .prettierrc.json
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Testing Endpoints

Health check:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T12:34:56.789Z",
  "uptime": 123.456,
  "backend": "http://localhost:48080"
}
```

## Special Features

### SSE Streaming for Chat

The `/api/coze/chat` endpoint supports Server-Sent Events streaming:

```javascript
const eventSource = new EventSource('http://localhost:3000/api/coze/chat', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'tenant-id': '1'
  },
  method: 'POST',
  body: JSON.stringify({
    shopId: '123',
    message: 'Hello'
  })
});

eventSource.onmessage = (event) => {
  console.log('Chat response:', event.data);
};
```

### File Downloads

Excel export endpoints return binary streams:

```bash
curl "http://localhost:3000/api/chat-history/export?pageNo=1&pageSize=100" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "tenant-id: 1" \
  -o chat-history.xlsx
```

## Error Handling

The proxy handles errors gracefully:

- **401 Unauthorized**: Invalid or expired token
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Backend error
- **503 Service Unavailable**: Backend not reachable

## Logging

Logs include:
- Request ID for tracing
- HTTP method and path
- Response status and duration
- Error stack traces

Example log:
```
2025-10-28 12:34:56 [info]: Incoming request {"requestId":"uuid","method":"GET","path":"/api/bot-settings/page"}
2025-10-28 12:34:56 [info]: Request completed {"requestId":"uuid","statusCode":200,"duration":"45ms"}
```

## Production Deployment

### Docker Support

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
COPY config ./config
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Build and run:
```bash
npm run build
docker build -t chatbot-node .
docker run -p 3000:3000 --env-file .env chatbot-node
```

### Environment Variables

In production:
- Set `NODE_ENV=production`
- Set `LOG_LEVEL=warn`
- Configure `CORS_ORIGIN` to specific domains
- Use HTTPS (terminate at reverse proxy like nginx)

## License

MIT

## Support

For issues and questions, refer to the chatbotadmin backend documentation.

