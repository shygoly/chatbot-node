# Chatbot Node Proxy - Constitution

## Project Purpose

A lightweight, stateless proxy service that wraps chatbotadmin's intelligent customer service APIs. This service provides a clean Node.js/Express interface for frontend applications to interact with the Java Spring Boot backend.

## Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript with strict mode
- **HTTP Client**: Axios for backend communication
- **Validation**: Zod for request/response validation
- **Logging**: Winston for structured logging
- **Security**: Helmet for security headers, CORS for cross-origin requests

## Architecture Principles

### 1. Stateless Proxy Pattern
- No local state storage
- All requests proxied to chatbotadmin backend at `http://localhost:48080`
- No caching (delegate to backend)
- No database connections

### 2. Request Forwarding
- Forward all authentication headers (`Authorization`, `tenant-id`)
- Preserve query parameters and request bodies
- Maintain HTTP methods (GET, POST, PUT, DELETE)
- Forward client IP and user agent when relevant

### 3. Response Transformation

Transform Java `CommonResult<T>` format:
```typescript
interface CommonResult<T> {
  code: number;    // 0 = success, others = error
  data: T;         // actual payload
  msg: string;     // error message
}
```

To standard REST responses:
- **Success (code: 0)**: HTTP 200 with `data` field as response body
- **Client Error (code: 400-499)**: HTTP 4xx with error message
- **Server Error (code: 500+)**: HTTP 500 with error message
- **Unknown Error**: HTTP 500 with generic message

### 4. Error Handling
- Catch all async errors with Express error middleware
- Log errors with full context (request ID, user, endpoint)
- Return consistent error format:
  ```typescript
  {
    error: string;
    message: string;
    statusCode: number;
    timestamp: string;
  }
  ```

### 5. Special Cases

#### Server-Sent Events (SSE)
For `POST /api/coze/chat`:
- Backend returns SSE stream
- Proxy must stream events to client without buffering
- Set proper headers: `Content-Type: text/event-stream`
- Handle connection interruptions gracefully

#### File Downloads
For Excel export endpoints:
- Forward binary response directly
- Set proper `Content-Type` and `Content-Disposition` headers
- Stream large files to avoid memory issues

## API Design

### Path Mapping
Simplify paths for frontend consumption:

| Frontend Path | Backend Path |
|---------------|--------------|
| `/api/coze/bot/**` | `/admin-api/mail/coze/api/**` |
| `/api/coze/oauth/**` | `/admin-api/mail/coze/oauth/**` |
| `/api/bot-settings/**` | `/admin-api/mail/shopify/botSettings/**` |
| `/api/chat-history/**` | `/admin-api/mail/coze-chat-history/**` |
| `/api/coze-info/**` | `/admin-api/mail/coze-info/**` |
| `/api/inquiries/**` | `/admin-api/mail/customerServiceInquiries/**` |
| `/api/inbox-users/**` | `/admin-api/mail/shopify/inboxUser/**` |

### Authentication Strategy
- Accept `Authorization: Bearer <token>` header from client
- Accept `X-Tenant-ID` header (default: 1)
- Forward to backend as-is
- No token validation (delegate to backend)
- Return 401 errors from backend transparently

## Configuration

Environment variables:
- `BACKEND_URL`: chatbotadmin backend URL (default: http://localhost:48080)
- `PORT`: Proxy server port (default: 3000)
- `NODE_ENV`: development | production
- `LOG_LEVEL`: debug | info | warn | error
- `CORS_ORIGIN`: Allowed CORS origins (default: *)
- `REQUEST_TIMEOUT`: Backend request timeout in ms (default: 30000)

## Code Quality Standards

- Use async/await, avoid callbacks
- Type all function signatures
- Export interfaces for all DTOs
- Use ESLint with recommended TypeScript rules
- Format code with Prettier
- Write JSDoc comments for public APIs
- Handle all edge cases (network errors, timeouts, malformed responses)

## Logging Strategy

Log levels:
- **debug**: Request/response details, headers
- **info**: Successful requests, startup info
- **warn**: Retries, fallbacks, deprecated usage
- **error**: Failed requests, exceptions

Include in all logs:
- Request ID (generated per request)
- Timestamp
- HTTP method and path
- User identifier (if available)
- Duration for completed requests

## Security Considerations

- Never log sensitive data (passwords, tokens)
- Validate all inputs before forwarding
- Set security headers with Helmet
- Rate limiting (optional, for production)
- HTTPS in production (terminate at reverse proxy)

## Development Workflow

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env`
3. Start backend: `cd ../chatbotadmin && mvn spring-boot:run -pl yudao-server -Dspring-boot.run.profiles=local`
4. Start proxy: `npm run dev`
5. Test endpoints: `curl http://localhost:3000/api/health`

## Deployment

- Build TypeScript: `npm run build`
- Output to `dist/` directory
- Run production: `npm start`
- Docker support with multi-stage build
- Environment variables via secret management

