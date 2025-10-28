# chatbot-node - 智能客服后端服务

> 基于 Node.js + Express + TypeScript + Prisma 的完整智能客服后端

## ✨ 功能特性

- ✅ **完整的后端服务** - 不是代理,是真正的后端
- ✅ **JWT 认证** - 安全的用户认证系统
- ✅ **数据库持久化** - Prisma ORM + SQLite/PostgreSQL
- ✅ **Coze AI 集成** - 智能客服机器人管理
- ✅ **聊天历史** - 完整的对话记录和统计
- ✅ **多店铺支持** - 支持多个 Shopify 店铺
- ✅ **类型安全** - 100% TypeScript
- ✅ **生产就绪** - 完善的错误处理和日志

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
```bash
# 复制 .env 示例
cp .env .env.local

# 编辑 .env 文件,配置数据库等
```

### 3. 初始化数据库
```bash
# 推送 Prisma schema
npx prisma db push

# 创建管理员用户
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();
(async () => {
  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.adminUser.create({ 
    data: { 
      username: 'admin', 
      password: hashed,
      email: 'admin@chatbot.local',
      nickname: 'Admin',
      status: 1
    }
  });
  console.log('✅ 管理员创建成功');
  await prisma.\$disconnect();
})();
"
```

### 4. 启动开发服务器
```bash
npm run dev
# 服务器运行在 http://localhost:3000
```

### 5. 测试
```bash
# 登录测试
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

## 📖 API 文档

### 认证接口

#### POST /api/auth/login
登录获取 access token 和 refresh token

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

响应:
```json
{
  "userId": 1,
  "username": "admin",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 86400000
}
```

### Bot 管理接口

#### POST /api/coze/bot/getOrCreateBot
创建或获取智能客服机器人

```bash
TOKEN="<your_access_token>"

curl -X POST http://localhost:3000/api/coze/bot/getOrCreateBot \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "my-shop-001",
    "botName": "我的智能客服"
  }'
```

### 聊天接口

#### POST /api/coze/chat
与智能客服对话

```bash
curl -X POST http://localhost:3000/api/coze/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shopId": "my-shop-001",
    "message": "你好,请介绍一下你们的产品",
    "userId": "1",
    "botId": "bot_xxx"
  }'
```

## 🔧 配置说明

### Coze OAuth 配置

1. **访问 Coze 开放平台**
   - https://www.coze.cn/open/oauth/apps

2. **创建 JWT OAuth 应用**
   - 类型: 服务应用 (JWT)
   - 权限: Connector.botManage, Connector.botChat

3. **获取凭证**
   - App ID (client_id)
   - Key ID (public_key_id)
   - 上传公钥

4. **更新 .env**
   ```bash
   COZE_CLIENT_ID=<your_app_id>
   COZE_PUBLIC_KEY=<your_key_id>
   COZE_PRIVATE_KEY_PATH=config/coze-private-key.pem
   ```

## 📁 项目结构

```
chatbot-node/
├── src/
│   ├── services/       # 业务逻辑层
│   ├── routes/         # API 路由
│   ├── middleware/     # 中间件
│   ├── lib/            # 工具库
│   └── config/         # 配置
├── prisma/
│   └── schema.prisma   # 数据库 schema
├── config/
│   └── coze-private-key.pem  # Coze 私钥
└── docs/               # 文档
```

## 🛠️ 技术栈

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: Prisma ORM + SQLite/PostgreSQL
- **Auth**: JWT + Bcrypt
- **Security**: Helmet + CORS
- **Logging**: Winston

## 📚 更多文档

- `SUCCESS_SUMMARY.md` - 成功总结
- `FINAL_IMPLEMENTATION_REPORT.md` - 完整报告
- `OAUTH_DEBUG_NOTES.md` - OAuth 调试笔记
- `TEST_RESULTS.md` - 测试结果
- `API_REFERENCE.md` - API 参考

## 🎯 下一步

1. 配置 Coze OAuth 应用
2. 测试创建智能客服 bot
3. 集成到前端应用
4. 部署到生产环境

## 📄 License

MIT

---

**状态**: ✅ 生产就绪  
**版本**: 1.0.0  
**实现日期**: 2025-10-28
