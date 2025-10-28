# API Usage Examples

## Setup

First, get an access token from the backend:

```bash
# Login to get token
curl -X POST "http://localhost:48080/admin-api/system/auth/login" \
  -H "Content-Type: application/json" \
  -H "tenant-id: 1" \
  -d '{"username":"admin","password":"admin123"}'

# Response:
{
  "code": 0,
  "data": {
    "userId": 1,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "expiresTime": 1761554487298
  },
  "msg": ""
}
```

Export token for convenience:
```bash
export TOKEN="YOUR_ACCESS_TOKEN_HERE"
```

---

## 1. Coze Bot Management

### Create or Get Bot

```bash
curl -X POST "http://localhost:3000/api/coze/bot/getOrCreateBot" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "shopName": "My Store",
    "botName": "Store Assistant"
  }'
```

### Update Product Dataset

```bash
curl -X POST "http://localhost:3000/api/coze/bot/updateDataset/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "datasetId": "dataset-123"
  }'
```

### Get Dataset Statistics

```bash
curl "http://localhost:3000/api/coze/bot/datasetStatistic/123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

---

## 2. Coze Chat

### Real-time Chat with SSE

```bash
curl -N -X POST "http://localhost:3000/api/coze/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "botId": "bot-456",
    "userId": "user-789",
    "message": "What are your store hours?",
    "conversationId": "conv-001"
  }'
```

JavaScript example with EventSource:

```javascript
const response = await fetch('http://localhost:3000/api/coze/chat', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token,
    'tenant-id': '1',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    shopId: '123',
    message: 'Hello',
    userId: 'user-001'
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  console.log('Received:', chunk);
}
```

---

## 3. Bot Settings

### Get All Bot Settings

```bash
curl "http://localhost:3000/api/bot-settings/page?pageNo=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get Bot Setting by Shop Name

```bash
curl "http://localhost:3000/api/bot-settings/shop/name/mystore" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Create Bot Setting

```bash
curl -X POST "http://localhost:3000/api/bot-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "shopName": "My Store",
    "botId": "bot-456",
    "botName": "Store Assistant",
    "chatLogo": "https://example.com/logo.png",
    "chatAvatar": "https://example.com/avatar.png"
  }'
```

### Update Bot Setting

```bash
curl -X PUT "http://localhost:3000/api/bot-settings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "shopId": "123",
    "shopName": "My Store",
    "botName": "Updated Assistant"
  }'
```

---

## 4. Chat History

### Get Today's Statistics

```bash
curl "http://localhost:3000/api/chat-history/statistics/today" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get Reply Rate

```bash
curl "http://localhost:3000/api/chat-history/statistics/reply-rate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get Chat History Page

```bash
curl "http://localhost:3000/api/chat-history/page?shopId=123&pageNo=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get Chat Users

```bash
curl "http://localhost:3000/api/chat-history/users?pageNo=1&pageSize=20" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Export Chat History to Excel

```bash
curl "http://localhost:3000/api/chat-history/export?shopId=123&pageNo=1&pageSize=1000" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -o chat-history.xlsx
```

---

## 5. Customer Service Inquiries

### Create Inquiry

```bash
curl -X POST "http://localhost:3000/api/inquiries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "message": "I have a question about my order #12345"
  }'
```

### Get Inquiries Page

```bash
curl "http://localhost:3000/api/inquiries/page?email=customer@example.com&pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get Specific Inquiry

```bash
curl "http://localhost:3000/api/inquiries/123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

---

## 6. Inbox Users

### Create Inbox User

```bash
curl -X POST "http://localhost:3000/api/inbox-users" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "shopName": "My Store",
    "userEmail": "user@example.com",
    "userName": "John Doe"
  }'
```

### Login Inbox User

```bash
curl -X POST "http://localhost:3000/api/inbox-users/login" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "userEmail": "user@example.com"
  }'
```

### Get Inbox Users by Shop

```bash
curl "http://localhost:3000/api/inbox-users/shop/123" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

---

## 7. Coze OAuth

### Get Authorization URL

```bash
curl "http://localhost:3000/api/coze/oauth/authorize-url?redirectUri=https://myapp.com/callback" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get JWT Token

```bash
curl "http://localhost:3000/api/coze/oauth/token" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Get Token for SDK

```bash
curl -X POST "http://localhost:3000/api/coze/oauth/tokenForSdk" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionName": "user-session-001"
  }'
```

---

## 8. Coze Info

### Get Coze Info Page

```bash
curl "http://localhost:3000/api/coze-info/page?shopId=123&datasetType=1&pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"
```

### Create Coze Info

```bash
curl -X POST "http://localhost:3000/api/coze-info" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "123",
    "datasetId": "dataset-456",
    "botId": "bot-789",
    "datasetType": 1
  }'
```

---

## Error Handling Examples

### 401 Unauthorized (Invalid Token)

```bash
curl "http://localhost:3000/api/bot-settings/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer invalid_token" \
  -H "tenant-id: 1"

# Response:
{
  "error": "Error",
  "message": "Token expired or invalid",
  "statusCode": 401,
  "timestamp": "2025-10-28T12:34:56.789Z",
  "path": "/api/bot-settings/page"
}
```

### 404 Not Found

```bash
curl "http://localhost:3000/api/bot-settings/99999" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"

# Response:
{
  "error": "Error",
  "message": "Bot setting not found",
  "statusCode": 404,
  "timestamp": "2025-10-28T12:34:56.789Z"
}
```

### 503 Service Unavailable (Backend Down)

```bash
# Stop the backend and try any request
curl "http://localhost:3000/api/bot-settings/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1"

# Response:
{
  "error": "Error",
  "message": "Backend service unavailable",
  "statusCode": 503,
  "timestamp": "2025-10-28T12:34:56.789Z"
}
```

---

## Testing with Postman

Import this collection:

1. Create environment variables:
   - `base_url`: `http://localhost:3000`
   - `token`: Your access token
   - `tenant_id`: `1`

2. Set default headers for all requests:
   - `Authorization`: `Bearer {{token}}`
   - `tenant-id`: `{{tenant_id}}`

3. Import endpoints from `docs/chatbot-api-spec.md`

