# API Reference

Complete reference for all 48 chatbot-node proxy endpoints.

**Base URL**: `http://localhost:3000`

---

## Table of Contents

1. [Coze Bot Management API](#1-coze-bot-management-api) (7 endpoints)
2. [Coze OAuth API](#2-coze-oauth-api) (5 endpoints)
3. [Bot Settings API](#3-bot-settings-api) (7 endpoints)
4. [Chat History API](#4-chat-history-api) (9 endpoints)
5. [Coze Info API](#5-coze-info-api) (6 endpoints)
6. [Customer Inquiries API](#6-customer-inquiries-api) (6 endpoints)
7. [Inbox Users API](#7-inbox-users-api) (8 endpoints)

---

## 1. Coze Bot Management API

### 1.1 Update Product Dataset

```http
POST /api/coze/bot/updateDataset/1
```

**Headers:**
- `Authorization: Bearer <token>` (required)
- `tenant-id: 1` (required)

**Request Body:**
```json
{
  "shopId": "string",
  "datasetId": "string"
}
```

**Response:** `200 OK`

### 1.2 Update Order Dataset

```http
POST /api/coze/bot/updateDataset/2
```

Same as 1.1, type = 2 for orders

### 1.3 Update Customer Dataset

```http
POST /api/coze/bot/updateDataset/3
```

Same as 1.1, type = 3 for customers

### 1.4 Get or Create Bot

```http
POST /api/coze/bot/getOrCreateBot
```

**Request Body:**
```json
{
  "shopId": "string",
  "shopName": "string",
  "botName": "string"
}
```

### 1.5 Chat (SSE Streaming)

```http
POST /api/coze/chat
```

**Headers:**
- `Authorization: Bearer <token>` (required)
- `tenant-id: 1` (required)
- `Accept: text/event-stream`

**Request Body:**
```json
{
  "shopId": "string",
  "botId": "string",
  "userId": "string",
  "message": "string",
  "conversationId": "string"
}
```

**Response:** Server-Sent Events stream

### 1.6 Get Dataset Statistics by Type

```http
GET /api/coze/bot/datasetStatistic/:shopId/:type
```

**Path Parameters:**
- `shopId` - Shop ID
- `type` - Dataset type (1=product, 2=order, 3=customer)

### 1.7 Get Dataset Statistics

```http
GET /api/coze/bot/datasetStatistic/:shopId
```

**Path Parameters:**
- `shopId` - Shop ID

---

## 2. Coze OAuth API

### 2.1 Get Token for SDK

```http
POST /api/coze/oauth/tokenForSdk
```

**Request Body:**
```json
{
  "sessionName": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "expires_in": 86400,
  "token_type": "Bearer"
}
```

### 2.2 Get JWT Token

```http
GET /api/coze/oauth/token
```

### 2.3 OAuth Callback

```http
GET /api/coze/oauth/callback?code=<auth_code>
```

**Query Parameters:**
- `code` - Authorization code (required)

### 2.4 Authorize Redirect

```http
GET /api/coze/oauth/authorize?redirectUri=<uri>
```

**Query Parameters:**
- `redirectUri` - Redirect URI (optional)

### 2.5 Get Authorization URL

```http
GET /api/coze/oauth/authorize-url?redirectUri=<uri>
```

**Query Parameters:**
- `redirectUri` - Redirect URI (optional)

---

## 3. Bot Settings API

### 3.1 Create Bot Setting

```http
POST /api/bot-settings
```

**Request Body:**
```json
{
  "shopId": "string",
  "shopName": "string",
  "chatLogo": "string",
  "chatAvatar": "string",
  "apiToken": "string",
  "botId": "string",
  "botName": "string"
}
```

### 3.2 Update Bot Setting

```http
PUT /api/bot-settings
```

**Request Body:**
```json
{
  "id": 123,
  "shopId": "string",
  "shopName": "string",
  "botName": "string"
}
```

### 3.3 Get Bot Settings Page

```http
GET /api/bot-settings/page
```

**Query Parameters:**
- `shopId` - Filter by shop ID
- `shopName` - Filter by shop name
- `botId` - Filter by bot ID
- `pageNo` - Page number (required, starts at 1)
- `pageSize` - Page size (required, max 100)

### 3.4 Get Bot Setting by ID

```http
GET /api/bot-settings/:id
```

### 3.5 Get Bot Setting by Shop Name

```http
GET /api/bot-settings/shop/name/:shopName
```

### 3.6 Get Bot Setting by Shop ID

```http
GET /api/bot-settings/shop/:id
```

### 3.7 Delete Bot Setting

```http
DELETE /api/bot-settings/:id
```

---

## 4. Chat History API

### 4.1 Create Chat History

```http
POST /api/chat-history
```

**Request Body:**
```json
{
  "inboxUserId": "string",
  "conversationId": "string",
  "shopId": "string",
  "botId": "string",
  "content": "string",
  "sender": "user|bot",
  "sessionId": "string"
}
```

### 4.2 Update Chat History

```http
PUT /api/chat-history
```

### 4.3 Get Chat History Page

```http
GET /api/chat-history/page
```

**Query Parameters:**
- `inboxUserId` - Customer ID
- `conversationId` - Conversation ID
- `shopId` - Shop ID
- `botId` - Bot ID
- `content` - Content filter
- `sender` - Sender filter (user/bot)
- `sessionId` - Session ID
- `pageNo` - Page number (required)
- `pageSize` - Page size (required)

### 4.4 Get Chat History by ID

```http
GET /api/chat-history/:id
```

### 4.5 Get Chat Users

```http
GET /api/chat-history/users
```

**Query Parameters:**
- `inboxUserId` - Customer ID
- `email` - Customer email
- `userName` - Customer username
- `pageNo` - Page number (required)
- `pageSize` - Page size (required)

### 4.6 Today's Chat Statistics

```http
GET /api/chat-history/statistics/today
```

**Response:**
```json
{
  "totalChats": 150,
  "totalUsers": 45,
  "avgResponseTime": 2.5
}
```

### 4.7 Reply Rate Statistics

```http
GET /api/chat-history/statistics/reply-rate
```

**Response:**
```json
{
  "totalQuestions": 200,
  "answeredQuestions": 180,
  "replyRate": 0.9
}
```

### 4.8 Export Chat History

```http
GET /api/chat-history/export
```

**Query Parameters:** Same as 4.3

**Response:** Excel file (binary stream)

### 4.9 Delete Chat History

```http
DELETE /api/chat-history/:id
```

---

## 5. Coze Info API

### 5.1 Create Coze Info

```http
POST /api/coze-info
```

**Request Body:**
```json
{
  "shopId": "string",
  "datasetId": "string",
  "botId": "string",
  "docId": "string",
  "datasetType": 1
}
```

**Dataset Types:**
- `1` - Product
- `2` - Order
- `3` - Customer

### 5.2 Update Coze Info

```http
PUT /api/coze-info
```

### 5.3 Get Coze Info Page

```http
GET /api/coze-info/page
```

**Query Parameters:**
- `shopId` - Shop ID
- `datasetId` - Dataset ID
- `botId` - Bot ID
- `docId` - Document ID
- `datasetType` - Dataset type (1/2/3)
- `pageNo` - Page number (required)
- `pageSize` - Page size (required)

### 5.4 Get Coze Info by ID

```http
GET /api/coze-info/:id
```

### 5.5 Export Coze Info

```http
GET /api/coze-info/export
```

**Response:** Excel file

### 5.6 Delete Coze Info

```http
DELETE /api/coze-info/:id
```

---

## 6. Customer Inquiries API

### 6.1 Create Inquiry

```http
POST /api/inquiries
```

**Request Body:**
```json
{
  "email": "customer@example.com",
  "message": "I need help with my order"
}
```

### 6.2 Update Inquiry

```http
PUT /api/inquiries
```

**Request Body:**
```json
{
  "id": 123,
  "email": "customer@example.com",
  "message": "Updated message"
}
```

### 6.3 Get Inquiries Page

```http
GET /api/inquiries/page
```

**Query Parameters:**
- `email` - Filter by email
- `message` - Filter by message content
- `createTime` - Filter by creation time
- `pageNo` - Page number (required)
- `pageSize` - Page size (required)

### 6.4 Get Inquiry by ID

```http
GET /api/inquiries/:id
```

### 6.5 Export Inquiries

```http
GET /api/inquiries/export
```

**Response:** Excel file

### 6.6 Delete Inquiry

```http
DELETE /api/inquiries/:id
```

---

## 7. Inbox Users API

### 7.1 Create Inbox User

```http
POST /api/inbox-users
```

**Request Body:**
```json
{
  "shopId": "string",
  "shopName": "string",
  "userEmail": "user@example.com",
  "userName": "string"
}
```

### 7.2 Login Inbox User

```http
POST /api/inbox-users/login
```

**Request Body:**
```json
{
  "shopId": "string",
  "userEmail": "user@example.com"
}
```

### 7.3 Update Inbox User

```http
PUT /api/inbox-users
```

### 7.4 Get Inbox Users Page

```http
GET /api/inbox-users/page
```

**Query Parameters:**
- `shopId` - Shop ID
- `shopName` - Shop name
- `userEmail` - User email
- `userName` - User name
- `pageNo` - Page number (required)
- `pageSize` - Page size (required)

### 7.5 Get Inbox User by ID

```http
GET /api/inbox-users/:id
```

### 7.6 Get Inbox Users by Shop

```http
GET /api/inbox-users/shop/:id
```

### 7.7 Export Inbox Users

```http
GET /api/inbox-users/export
```

**Response:** Excel file

### 7.8 Delete Inbox User

```http
DELETE /api/inbox-users/:id
```

---

## Common Response Formats

### Success Response

```json
{
  "id": 123,
  "shopId": "456",
  "name": "Example",
  ...
}
```

Or for paginated responses:

```json
{
  "list": [...],
  "total": 100
}
```

### Error Response

```json
{
  "error": "Error",
  "message": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2025-10-28T12:34:56.789Z",
  "path": "/api/bot-settings"
}
```

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Backend error |
| 503 | Service Unavailable | Backend not reachable |

---

## Rate Limiting

Currently no rate limiting is implemented. For production, consider adding:

```typescript
// src/middleware/rate-limit.ts
import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later',
});

// Apply to routes
app.use('/api/', apiLimiter);
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Chatbot Node Proxy",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    },
    {
      "key": "token",
      "value": "your-access-token"
    },
    {
      "key": "tenant_id",
      "value": "1"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Bot Settings",
      "item": [
        {
          "name": "Get Bot Settings Page",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{token}}"
              },
              {
                "key": "tenant-id",
                "value": "{{tenant_id}}"
              }
            ],
            "url": {
              "raw": "{{base_url}}/api/bot-settings/page?pageNo=1&pageSize=10",
              "query": [
                {
                  "key": "pageNo",
                  "value": "1"
                },
                {
                  "key": "pageSize",
                  "value": "10"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## GraphQL Alternative (Future)

If you want to add GraphQL support:

```typescript
// src/graphql/schema.ts
import { GraphQLSchema, GraphQLObjectType, GraphQLString } from 'graphql';

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    botSettings: {
      type: BotSettingType,
      args: { shopId: { type: GraphQLString } },
      resolve(parent, args) {
        return backendClient.proxy(
          'GET',
          `/admin-api/mail/shopify/botSettings/shop/${args.shopId}`,
          {},
        );
      },
    },
  },
});

export default new GraphQLSchema({
  query: RootQuery,
});
```

---

## WebSocket Support (Future)

For real-time chat, consider WebSocket:

```typescript
// src/websocket/chat.ts
import { WebSocketServer } from 'ws';

export function setupWebSocket(server: any) {
  const wss = new WebSocketServer({ server, path: '/ws/chat' });

  wss.on('connection', (ws, req) => {
    ws.on('message', async (message) => {
      const data = JSON.parse(message.toString());
      
      // Stream response from backend
      const response = await backendClient.proxyStream(
        'POST',
        '/admin-api/mail/coze/api/chat',
        req.headers as any,
        data
      );

      response.data.on('data', (chunk: Buffer) => {
        ws.send(chunk.toString());
      });
    });
  });
}
```

---

## Troubleshooting

### Common Issues

**Issue**: `ECONNREFUSED`
- **Cause**: Backend not running
- **Fix**: Start chatbotadmin: `mvn spring-boot:run -pl yudao-server`

**Issue**: `401 Unauthorized`
- **Cause**: Invalid or expired token
- **Fix**: Re-login to get new token

**Issue**: `CORS error`
- **Cause**: Frontend domain not allowed
- **Fix**: Update `CORS_ORIGIN` in `.env`

**Issue**: `Timeout`
- **Cause**: Backend slow or unresponsive
- **Fix**: Increase `REQUEST_TIMEOUT` in `.env`

---

## Support

- Documentation: See `README.md`, `QUICK_START.md`
- Examples: See `examples/api-examples.md`
- Architecture: See `memory/constitution.md`
- API Spec: See `docs/chatbot-api-spec.md`

