# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Node.js/Express proxy service** for chatbotadmin intelligent customer service APIs. The project acts as a lightweight intermediary between frontend clients and a Java Spring Boot backend, providing simplified RESTful endpoints, SSE streaming support, and OAuth integration.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with hot-reload using tsx
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm start` - Run production server from compiled JavaScript
- `npm run lint` - Run ESLint on TypeScript source files
- `npm run format` - Format code using Prettier

### Testing
- No automated test framework is currently configured
- Use `./examples/test-api.sh` for manual API testing
- Test script includes comprehensive API endpoint validation

## Architecture Overview

### Proxy Pattern
The service functions as a **stateless proxy** to the chatbotadmin backend at `http://localhost:48080`:
- All requests are transparently forwarded to the backend
- Response wrapping (`CommonResult<T>`) is automatically unwrapped
- Error handling is centralized through middleware
- CORS and security headers are applied at the proxy level

### API Groups
- **Coze API** (`/api/coze`): Bot management, chat, and dataset updates
- **Coze OAuth** (`/api/coze/oauth`): Coze authorization flow
- **Bot Settings** (`/api/bot-settings`): Shopify bot configuration
- **Chat History** (`/api/chat-history`): Chat history and statistics
- **Coze Info** (`/api/coze-info`): Coze bot information
- **Inquiries** (`/api/inquiries`): Customer service inquiries
- **Inbox Users** (`/api/inbox-users`): Chat inbox user management

### Key Components
- **Configuration**: Centralized config in `src/config/index.ts` with environment variable support
- **Backend Client**: HTTP client in `src/lib/backend-client.ts` handles all backend communication
- **Middleware**: Request logging and centralized error handling
- **Authentication**: JWT-based with tenant ID validation
- **Logging**: Winston-based with request ID tracing

## Important Implementation Details

### Authentication Flow
All endpoints require:
```http
Authorization: Bearer <access_token>
tenant-id: 1
```

### Special Features
- **SSE Streaming**: `/api/coze/chat` supports Server-Sent Events for real-time chat responses
- **File Downloads**: Export endpoints return binary streams (Excel files)
- **Path Mapping**: Proxy paths are mapped to backend paths via route configuration
- **Error Responses**: Consistent error format with timestamps and status codes

### Backend Dependencies
The proxy depends on a Java Spring Boot backend running at `http://localhost:48080`. Before starting development:
1. Ensure the chatbotadmin backend is running
2. Use `admin`/`admin123` credentials for authentication
3. Backend login endpoint: `/admin-api/system/auth/login`

### Configuration Files
- **Environment variables**: Define in `.env` file (see `.env.example`)
- **TypeScript configuration**: Strict mode enabled with comprehensive checks
- **CORS**: Configurable origin with default `*`
- **Request timeout**: 30-second timeout for backend requests

## Project Structure

```
chatbot-node/
├── src/
│   ├── config/index.ts          # Centralized configuration
│   ├── lib/
│   │   ├── backend-client.ts    # Backend HTTP client
│   │   └── logger.ts            # Winston logger
│   ├── middleware/
│   │   ├── error-handler.ts    # Global error handling
│   │   └── request-logger.ts   # Request logging with IDs
│   ├── routes/                 # API route definitions
│   ├── types/index.ts          # TypeScript type definitions
│   ├── app.ts                  # Express app setup
│   └── index.ts                # Server entry point
├── config/coze-private-key.pem  # OAuth private key
├── examples/test-api.sh        # Comprehensive API testing script
└── docs/chatbot-api-spec.md    # API specification
```

## Development Workflow

1. **Start backend**: Ensure chatbotadmin backend is running on port 48080
2. **Development**: `npm run dev` starts proxy on port 3000 with hot-reload
3. **Testing**: Use `./examples/test-api.sh` to validate all API endpoints
4. **Production**: Build with `npm run build`, start with `npm start`

### Environment Setup
```bash
cp .env.example .env
# Configure BACKEND_URL, PORT, and OAuth credentials
npm install
npm run dev
```

## Important Notes

- **No automated tests**: Consider adding Jest or similar testing framework
- **Strict TypeScript**: Compiler flags prevent many common errors
- **Security**: Helmet.js and CORS configured for production use
- **Logging**: Winston logs include request IDs for tracing
- **Error handling**: Centralized middleware provides consistent error responses
- **Docker ready**: Production deployment via Dockerfile in root directory