# Chatbot Node 项目介绍

## 项目概述

**Chatbot Node** 是一个基于 Node.js/Express 的智能客服聊天机器人后端服务平台。该项目集成了 Coze AI、EverShop 电商平台和 Shopify，提供多租户支持、实时聊天流、Webhook 处理和数据同步等核心功能。

## 核心功能

### 1. **多租户架构**
- 支持多个商家/店铺的独立数据隔离
- 每个租户拥有独立的配置、SSO 设置和 Webhook 密钥
- 租户级别的数据过滤和权限管理

### 2. **AI 聊天集成**
- 与 Coze AI 平台深度集成，提供智能对话能力
- 支持 Server-Sent Events (SSE) 实时流式传输
- 聊天历史记录和统计分析

### 3. **电商平台集成**
- **EverShop 同步**：通过 Webhook 实时同步产品、订单、促销信息
- **Shopify 支持**：Bot 设置和收件箱用户管理
- 初始数据拉取和增量同步

### 4. **实时通信**
- WebSocket 支持（Socket.io）用于实时更新
- 异步任务队列（Bull + Redis）处理后台任务
- 流式聊天响应持久化

### 5. **认证与授权**
- JWT Bearer Token 认证
- ShopSaaS SSO 集成
- 通用 SSO 流程支持
- 客户端和管理员分离的认证策略

## 技术栈

| 层级 | 技术 |
|------|------|
| **运行时** | Node.js 18+ |
| **框架** | Express.js |
| **语言** | TypeScript (严格模式) |
| **数据库** | PostgreSQL + Prisma ORM |
| **缓存/队列** | Redis + Bull |
| **实时通信** | Socket.io |
| **日志** | Winston |
| **安全** | Helmet.js, CORS, JWT |
| **验证** | Zod |

## API 架构

项目提供 13 个主要 API 路由组：

| 路由组 | 路径 | 功能 |
|--------|------|------|
| 认证 | `/api/auth` | 登录、令牌刷新、SSO 流程 |
| Coze API | `/api/coze` | Bot 管理、聊天、数据集更新 |
| Coze OAuth | `/api/coze/oauth` | Coze 授权流程 |
| Bot 设置 | `/api/bot-settings` | Shopify Bot 配置 |
| 聊天历史 | `/api/chat-history` | 聊天记录和统计 |
| Coze 信息 | `/api/coze-info` | Bot 信息查询 |
| 客服工单 | `/api/inquiries` | 客户服务工单管理 |
| 收件箱用户 | `/api/inbox-users` | 聊天收件箱用户 |
| EverShop | `/api/evershop` | EverShop 集成端点 |
| Webhook | `/api/webhooks` | 外部服务 Webhook 接收 |
| 分析 | `/api/analytics` | 聊天分析和报告 |
| 租户管理 | `/api/admin/tenants` | 租户注册和配置 |
| 数据同步 | `/api/sync` | EverShop Webhook 处理 |
| 数据导入 | `/api/import` | 初始数据同步拉取 |

## 数据库模型

- **CozeChatHistory**：聊天消息和对话追踪
- **ShopifyBotSetting**：Shopify 店铺 Bot 配置
- **ShopifyInboxUser**：Shopify 收件箱用户
- **CozeConversation**：对话元数据和追踪
- **AdminUser**：管理员认证（bcrypt 加密）
- **Tenant**：多租户店铺配置和 SSO 设置
- **TenantConfig**：租户级别设置（Logo、Bot ID、同步范围）
- **WebhookDelivery**：Webhook 投递追踪和重试逻辑

## 项目结构

```
chatbot-node/
├── src/
│   ├── config/              # 配置管理
│   ├── lib/                 # 工具库（HTTP 客户端、日志）
│   ├── middleware/          # 中间件（认证、错误处理、日志）
│   ├── routes/              # API 路由定义
│   ├── services/            # 业务逻辑服务
│   ├── types/               # TypeScript 类型定义
│   ├── app.ts               # Express 应用配置
│   └── index.ts             # 服务器入口
├── prisma/
│   ├── schema.prisma        # 数据库 Schema
│   ├── seed.ts              # 数据库初始化
│   └── migrations/          # 迁移历史
├── public/
│   ├── widget/              # 聊天小部件文件
│   └── admin/               # 管理后台
└── config/                  # 配置文件（OAuth 密钥等）
```

## 开发工作流

### 初始化
```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

### 常用命令
- `npm run dev` - 开发服务器（热重载）
- `npm run build` - 编译 TypeScript
- `npm start` - 生产服务器
- `npm run lint` - 代码检查
- `npm run format` - 代码格式化
- `npm run db:studio` - 数据库可视化工具

## 部署特性

- ✅ Docker 支持
- ✅ 生产级日志和监控
- ✅ 安全头部配置（Helmet）
- ✅ CORS 和跨域支持
- ✅ 请求追踪（Request ID）
- ✅ 错误处理和恢复机制

## 关键特性

1. **实时流式聊天**：通过 SSE 实现客户端实时接收 AI 回复
2. **多渠道支持**：同时支持 Shopify、EverShop 等多个电商平台
3. **数据同步**：自动同步产品、订单等关键业务数据
4. **可扩展架构**：基于 Redis 的任务队列支持高并发
5. **安全认证**：多种认证策略满足不同场景需求

## 适用场景

- 电商平台的智能客服系统
- 多商家 SaaS 平台
- 实时聊天应用
- AI 驱动的客户服务自动化

---

这是一个功能完整、架构清晰的现代化后端服务，适合构建企业级的智能客服平台。
