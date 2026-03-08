# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Node.js/Express backend service** for an intelligent customer service chatbot platform. It integrates with Coze AI, EverShop e-commerce, and Shopify, providing multi-tenant support, real-time chat streaming, webhook handling, and data synchronization.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with hot-reload using tsx
- `npm run build` - Compile TypeScript to JavaScript in dist/ directory
- `npm start` - Run production server from compiled JavaScript
- `npm run lint` - Run ESLint on TypeScript source files
- `npm run format` - Format code using Prettier

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run pending migrations
- `npm run db:push` - Push schema changes to database (dev only)
- `npm run db:seed` - Seed database with initial data
- `npm run db:studio` - Open Prisma Studio for database inspection

### Setup
```bash
npm install
cp .env.example .env
# Edit .env with your configuration
npm run db:generate
npm run db:migrate
npm run dev
```

## Architecture Overview

### Multi-Tenant Design
The service supports multiple merchants/shops with isolated data:
- **Tenant model**: Stores shop configuration, SSO settings, webhook secrets
- **TenantConfig model**: Per-shop settings (logo, bot ID, sync scopes)
- **Tenant-scoped data**: Chat history, bot settings, inbox users all include `tenantId`
- **Authentication**: Tenant ID passed via headers or extracted from JWT

### Core Features
- **Coze Integration**: AI bot management and chat streaming via Coze API
- **EverShop Sync**: Webhook-based product/order/promotion synchronization
- **Shopify Support**: Bot settings and inbox user management for Shopify stores
- **Real-time Chat**: SSE streaming for live chat responses
- **Job Queue**: Bull-based async job processing (via Redis)
- **WebSocket Support**: Socket.io for real-time updates

### API Route Groups
- **Auth** (`/api/auth`): Login, token refresh, SSO flows (no auth required)
- **Coze API** (`/api/coze`): Bot management, chat, dataset updates
- **Coze OAuth** (`/api/coze/oauth`): Coze authorization flow
- **Bot Settings** (`/api/bot-settings`): Shopify bot configuration
- **Chat History** (`/api/chat-history`): Chat history and statistics
- **Coze Info** (`/api/coze-info`): Coze bot information
- **Inquiries** (`/api/inquiries`): Customer service inquiries
- **Inbox Users** (`/api/inbox-users`): Chat inbox user management
- **EverShop** (`/api/evershop`): EverShop integration endpoints
- **Webhooks** (`/api/webhooks`): Webhook receivers for external services
- **Analytics** (`/api/analytics`): Chat analytics and reporting
- **Tenant Admin** (`/api/admin/tenants`): Tenant registration and configuration
- **Sync** (`/api/sync`): EverShop webhook handlers (products/orders/promotions)
- **Import** (`/api/import`): Initial data sync pull endpoints

### Key Components
- **Configuration**: `src/config/index.ts` - Centralized config with environment variables
- **Database**: Prisma ORM with PostgreSQL, models in `prisma/schema.prisma`
- **Authentication Middleware**: Multiple strategies in `src/middleware/`:
  - `customer-auth.ts`: Customer-facing authentication
  - `auth-shopsaas.ts`: ShopSaaS SSO authentication
  - `auth-sso.ts`: Generic SSO authentication
- **Services**: Business logic in `src/services/`:
  - `websocket.service.ts`: Socket.io connection management
  - `ChatStreamPersistenceService.ts`: Persist streaming chat responses
  - `coze-stream-adapter.ts`: Adapt Coze streaming format
  - `tenant.service.ts`: Tenant management
- **Logging**: Winston-based with request ID tracing
- **Error Handling**: Centralized middleware with consistent error responses

## Important Implementation Details

### Authentication
Multiple authentication strategies supported:
- **JWT Bearer tokens**: Standard `Authorization: Bearer <token>` header
- **Tenant ID**: Required header `tenant-id` for multi-tenant routing
- **SSO flows**: ShopSaaS and generic SSO via `/api/auth` endpoints
- **Customer auth**: Separate middleware for customer-facing endpoints

### Database Models
- **CozeChatHistory**: Chat messages with conversation tracking
- **ShopifyBotSetting**: Bot configuration per Shopify shop
- **ShopifyInboxUser**: Inbox users for Shopify integration
- **CozeConversation**: Conversation metadata and tracking
- **AdminUser**: Admin authentication (bcrypt hashed passwords)
- **Tenant**: Multi-tenant shop configuration with SSO settings
- **TenantConfig**: Per-tenant settings (logo, bot ID, sync scopes)
- **WebhookDelivery**: Webhook delivery tracking and retry logic

### Real-time Features
- **SSE Streaming**: `/api/coze/chat` supports Server-Sent Events
- **WebSocket**: Socket.io for real-time updates (configured in `src/services/websocket.service.ts`)
- **Job Queue**: Bull queue for async processing (Redis-backed)

### EverShop Integration
- Webhook receivers at `/api/sync/products`, `/api/sync/orders`, `/api/sync/promotions`
- Initial data pull via `/api/import/products`, `/api/import/orders`, `/api/import/promotions`
- Tenant-specific webhook secrets for security

### Configuration
Environment variables in `.env`:
- `DATABASE_URL`: PostgreSQL connection string
- `PORT`: Server port (default 3000)
- `NODE_ENV`: Environment (development/production)
- `CORS_ORIGIN`: CORS allowed origins
- `COZE_CLIENT_ID`, `COZE_PUBLIC_KEY`, `COZE_PRIVATE_KEY_PATH`: Coze OAuth credentials
- `EVERSHOP_BASE_URL`, `EVERSHOP_EMAIL`, `EVERSHOP_PASSWORD`: EverShop integration
- `SHOPSAAS_BASE_URL`, `SHOPSAAS_SHARED_SECRET`: ShopSaaS SSO configuration

## Project Structure

```
chatbot-node/
├── src/
│   ├── config/index.ts                    # Configuration management
│   ├── lib/
│   │   ├── backend-client.ts              # HTTP client for backend
│   │   └── logger.ts                      # Winston logger
│   ├── middleware/
│   │   ├── error-handler.ts               # Global error handling
│   │   ├── request-logger.ts              # Request logging
│   │   ├── customer-auth.ts               # Customer authentication
│   │   ├── auth-shopsaas.ts               # ShopSaaS SSO
│   │   └── auth-sso.ts                    # Generic SSO
│   ├── routes/                            # API route definitions
│   ├── services/
│   │   ├── websocket.service.ts           # Socket.io management
│   │   ├── ChatStreamPersistenceService.ts # Chat persistence
│   │   ├── coze-stream-adapter.ts         # Coze format adapter
│   │   └── tenant.service.ts              # Tenant operations
│   ├── types/index.ts                     # TypeScript definitions
│   ├── app.ts                             # Express app setup
│   └── index.ts                           # Server entry point
├── prisma/
│   ├── schema.prisma                      # Database schema
│   ├── seed.ts                            # Database seeding
│   └── migrations/                        # Migration history
├── public/
│   ├── widget/                            # Chat widget files
│   └── admin/                             # Admin dashboard
├── config/coze-private-key.pem            # Coze OAuth private key
└── start.sh                               # Production startup script
```

## Development Workflow

1. **Setup database**: `npm run db:generate && npm run db:migrate`
2. **Development**: `npm run dev` starts server on port 3000 with hot-reload
3. **Database inspection**: `npm run db:studio` opens Prisma Studio
4. **Production**: `npm run build && npm start`

## Common Tasks

### Adding a New Tenant
Use `/api/admin/tenants` endpoints to register and configure new shops.

### Handling Webhooks
Webhook receivers in `src/routes/sync.routes.ts` and `src/routes/webhooks.routes.ts`. Verify webhook signatures using tenant's webhook secret.

### Streaming Chat Responses
Use `ChatStreamPersistenceService` to persist SSE streamed responses to database while sending to client.

### Multi-tenant Queries
Always filter by `tenantId` when querying database. Use tenant ID from request headers or JWT claims.