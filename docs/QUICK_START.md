# Quick Start Guide

## 1. Prerequisites

Ensure you have:
- Node.js 18+ installed
- chatbotadmin backend running on `http://localhost:48080`

Verify backend is running:
```bash
curl http://localhost:48080/actuator/health
```

## 2. Installation

```bash
cd /Users/mac/Sync/project/drsell/chatbot-node
npm install
```

## 3. Configuration

The project is pre-configured for local development. If needed, edit `.env`:

```bash
# Already created with defaults
cat .env
```

## 4. Start the Proxy Server

```bash
npm run dev
```

You should see:
```
2025-10-28 12:34:56 [info]: Server started {"port":3000,"env":"development","backend":"http://localhost:48080"}
```

## 5. Test the Service

In a new terminal:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
{
  "status": "ok",
  "timestamp": "2025-10-28T12:34:56.789Z",
  "uptime": 12.345,
  "backend": "http://localhost:48080"
}
```

## 6. Get Access Token

```bash
TOKEN=$(curl -s -X POST "http://localhost:48080/admin-api/system/auth/login" \
  -H "Content-Type: application/json" \
  -H "tenant-id: 1" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.accessToken')

echo "Token: $TOKEN"
```

## 7. Test Chatbot APIs

### Test Bot Settings

```bash
curl "http://localhost:3000/api/bot-settings/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" | jq '.'
```

### Test Chat Statistics

```bash
curl "http://localhost:3000/api/chat-history/statistics/today" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" | jq '.'
```

### Test Customer Inquiries

```bash
curl -X POST "http://localhost:3000/api/inquiries" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "message": "Test inquiry from proxy"
  }' | jq '.'
```

## 8. Run Full Test Suite

```bash
chmod +x examples/test-api.sh
./examples/test-api.sh
```

## Common Issues

### Backend Not Running

Error:
```
Backend service unavailable
```

Solution:
```bash
cd /Users/mac/Sync/project/drsell/chatbotadmin
mvn spring-boot:run -pl yudao-server -Dspring-boot.run.profiles=local
```

### Port Already in Use

Error:
```
Error: listen EADDRINUSE: address already in use :::3000
```

Solution:
```bash
# Change PORT in .env
PORT=3001
```

Or kill the process:
```bash
lsof -ti:3000 | xargs kill -9
```

### Token Expired

Error:
```
{
  "error": "Error",
  "message": "Token expired",
  "statusCode": 401
}
```

Solution: Get a new token (step 6)

## Next Steps

- Read `README.md` for full documentation
- Check `examples/api-examples.md` for detailed API usage
- Review `docs/chatbot-api-spec.md` for complete API reference
- See `memory/constitution.md` for architecture details

## Production Deployment

```bash
# Build
npm run build

# Run production
NODE_ENV=production npm start
```

Or use Docker:
```bash
docker build -t chatbot-node .
docker run -p 3000:3000 --env-file .env chatbot-node
```

