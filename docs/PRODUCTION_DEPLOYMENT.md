# 生产环境部署指南

**项目**: chatbot-node  
**环境**: Production  
**最后更新**: 2025-10-28

---

## 🚀 快速部署 (Fly.io)

### 前置条件

1. 安装 Fly CLI
```bash
curl -L https://fly.io/install.sh | sh
```

2. 登录 Fly.io
```bash
fly auth login
```

3. 创建 PostgreSQL 数据库
```bash
fly postgres create --name chatbot-db --region hkg
```

4. 创建应用
```bash
cd /Users/mac/Sync/project/drsell/chatbot-node
fly apps create chatbot-node
```

### 配置环境变量

```bash
# Coze API
fly secrets set COZE_CLIENT_ID=1133483935040
fly secrets set COZE_KEY_ID=4UtqE_Y61W18zwxgTExPydvPTxK4UUucU_CJklfjU9w
fly secrets set COZE_WORKSPACE_ID=7351411557182226472
fly secrets set COZE_PRIVATE_KEY_PATH=./config/coze-private-key-new.pem

# JWT
fly secrets set JWT_SECRET=$(openssl rand -base64 32)

# Database (auto-configured by Fly)
fly postgres attach chatbot-db

# EverShop
fly secrets set EVERSHOP_BASE_URL=https://evershop-fly.fly.dev
fly secrets set EVERSHOP_EMAIL=admin@example.com
fly secrets set EVERSHOP_PASSWORD=admin123
fly secrets set EVERSHOP_WEBHOOK_SECRET=$(openssl rand -base64 32)

# Feature Flags
fly secrets set USE_SSE_STREAMING=true
fly secrets set NODE_ENV=production
fly secrets set LOG_LEVEL=info
```

### 部署

```bash
# 首次部署
fly deploy

# 查看状态
fly status

# 查看日志
fly logs

# 打开应用
fly open
```

---

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t chatbot-node:latest .
```

### 运行容器

```bash
docker run -d \
  --name chatbot-node \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://user:pass@host:5432/chatbot \
  -e COZE_CLIENT_ID=your_client_id \
  -e COZE_KEY_ID=your_key_id \
  -e COZE_WORKSPACE_ID=your_workspace_id \
  -e COZE_PRIVATE_KEY_PATH=./config/coze-private-key.pem \
  -e JWT_SECRET=your_jwt_secret \
  -v $(pwd)/config:/app/config:ro \
  chatbot-node:latest
```

### Docker Compose

创建 `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/chatbot
      - REDIS_URL=redis://redis:6379
    env_file:
      - .env.production
    volumes:
      - ./config:/app/config:ro
    depends_on:
      - db
      - redis
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=chatbot
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

运行：
```bash
docker-compose up -d
```

---

## ⚙️ 环境变量配置

### 必需变量

```bash
# Server
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://user:password@host:5432/chatbot

# Coze API
COZE_CLIENT_ID=1133483935040
COZE_KEY_ID=4UtqE_Y61W18zwxgTExPydvPTxK4UUucU_CJklfjU9w
COZE_WORKSPACE_ID=7351411557182226472
COZE_PRIVATE_KEY_PATH=./config/coze-private-key-new.pem

# JWT
JWT_SECRET=your-super-secret-key-at-least-32-chars
JWT_EXPIRES_IN=7d
```

### 可选变量

```bash
# Redis (for Bull queue and caching)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=https://your-domain.com

# EverShop Integration
EVERSHOP_BASE_URL=https://your-evershop.com
EVERSHOP_EMAIL=admin@example.com
EVERSHOP_PASSWORD=admin123
EVERSHOP_WEBHOOK_SECRET=your-webhook-secret

# Feature Flags
USE_SSE_STREAMING=true
ENABLE_WEBSOCKET=true
ENABLE_WEBHOOKS=true

# Optional: Bot creation config
COZE_WORKFLOW_ID=
COZE_MODEL_ID=
```

---

## 📊 性能优化

### 1. 数据库索引（已实现）

运行性能优化 SQL：
```bash
# For PostgreSQL
psql $DATABASE_URL < prisma/migrations/add_performance_indexes.sql

# For SQLite (local development)
sqlite3 dev.db < prisma/migrations/add_performance_indexes.sql
```

### 2. Token 缓存（已实现）

Coze access token 自动缓存，有效期内重用：
```typescript
// src/services/coze-api.service.ts
private token: string | null = null;
private tokenExpiry: number = 0;

async getAccessToken(): Promise<string> {
  // Reuse token if still valid (5 min buffer)
  if (this.token && Date.now() < this.tokenExpiry - 300000) {
    return this.token;
  }
  // Fetch new token...
}
```

### 3. 启用 Redis 缓存（可选）

如果使用 Redis，可以缓存：
- 常见问题的响应
- 用户会话数据
- 数据集统计信息

---

## 🔒 安全配置

### 1. JWT Secret

生成强密钥：
```bash
openssl rand -base64 32
```

### 2. Webhook Secret

```bash
openssl rand -base64 32
```

### 3. 数据库密码

使用强密码，避免特殊字符：
```bash
openssl rand -base64 24 | tr -d '/+='
```

### 4. CORS 配置

生产环境设置具体的域名：
```bash
CORS_ORIGIN=https://your-domain.com,https://app.your-domain.com
```

### 5. Helmet 安全头

已配置（src/app.ts）：
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

---

## 📦 数据库迁移

### 初始化数据库

```bash
# 生成 Prisma Client
npm run db:generate

# 运行迁移
npm run db:migrate

# 创建管理员账户
npm run db:seed
```

### 应用性能索引

```bash
# PostgreSQL
psql $DATABASE_URL < prisma/migrations/add_performance_indexes.sql

# 验证索引
psql $DATABASE_URL -c "\di"
```

---

## 🔄 健康检查

### HTTP 健康检查

```bash
curl http://your-app.fly.dev/health
```

**预期响应**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-28T...",
  "uptime": 123.456,
  "database": "connected",
  "mode": "backend"
}
```

### WebSocket 检查

```bash
# 测试 WebSocket 连接
wscat -c wss://your-app.fly.dev
```

---

## 📊 监控和日志

### Fly.io 日志

```bash
# 实时日志
fly logs

# 最近 100 条
fly logs --lines=100

# 错误日志
fly logs | grep ERROR
```

### 性能监控

```bash
# 查看资源使用
fly status
fly vm status

# 查看指标
fly dashboard
```

---

## 🔧 故障排查

### 常见问题

**1. 数据库连接失败**
```bash
# 检查数据库状态
fly postgres db list

# 重启数据库
fly postgres restart
```

**2. 内存不足**
```bash
# 增加内存
fly scale memory 2048
```

**3. 应用启动失败**
```bash
# 查看日志
fly logs

# SSH 进入容器
fly ssh console
```

**4. WebSocket 连接失败**
```bash
# 检查 fly.toml 配置
# 确保 WebSocket 端口已开放
```

---

## 🎯 部署清单

### 部署前

- [ ] 运行 `npm run build` 确保编译成功
- [ ] 运行 `npm run lint` 确保无 linter 错误
- [ ] 测试所有核心功能
- [ ] 更新版本号
- [ ] 创建 Git tag

### 配置

- [ ] 设置所有必需的环境变量
- [ ] 上传 Coze 私钥文件
- [ ] 配置数据库连接
- [ ] 设置 CORS 域名
- [ ] 生成强 JWT secret

### 数据库

- [ ] 运行数据库迁移
- [ ] 应用性能索引
- [ ] 创建管理员账户
- [ ] 备份数据库配置

### 部署后

- [ ] 验证健康检查通过
- [ ] 测试核心 API 端点
- [ ] 测试 WebSocket 连接
- [ ] 测试 SSE 流式响应
- [ ] 验证多语言支持
- [ ] 监控错误日志

---

## 📚 相关文档

- **Fly.io 文档**: https://fly.io/docs/
- **Docker 文档**: https://docs.docker.com/
- **Prisma 迁移**: https://www.prisma.io/docs/guides/migrate
- **Node.js 生产最佳实践**: https://expressjs.com/en/advanced/best-practice-performance.html

---

## ✅ 生产就绪确认

### 系统要求
- [x] ✅ Node.js 18+
- [x] ✅ PostgreSQL 13+ (或 SQLite for local)
- [x] ✅ Redis (可选，用于 Bull queue)

### 核心功能
- [x] ✅ AI 聊天（轮询 + SSE）
- [x] ✅ 多语言支持
- [x] ✅ WebSocket 实时通信
- [x] ✅ Webhook 自动化
- [x] ✅ Analytics API
- [x] ✅ 客户 Widget
- [x] ✅ 商家后台

### 安全
- [x] ✅ JWT 认证
- [x] ✅ Helmet 安全头
- [x] ✅ CORS 配置
- [x] ✅ Webhook 签名验证

### 性能
- [x] ✅ 数据库索引
- [x] ✅ Token 缓存
- [x] ✅ 连接池
- [x] ✅ 错误处理

### 监控
- [x] ✅ 结构化日志 (Winston)
- [x] ✅ 健康检查端点
- [x] ✅ 请求追踪
- [x] ✅ 错误日志

---

**部署状态**: 🎊 生产就绪 ✅

**建议配置**:
- 内存: 1GB (标准)，2GB (高流量)
- CPU: 1 shared core
- 区域: hkg (Hong Kong) 或就近区域
- 扩展: 自动扩展，最少 1 台机器

