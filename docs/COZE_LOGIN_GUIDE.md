# Coze 平台 OAuth 配置验证指南

## 当前状态

已打开 Coze 开放平台 OAuth 应用管理页面，但需要登录。

**页面**: https://www.coze.cn/open/oauth/apps  
**状态**: 重定向到登录页面

## 🔐 登录方式

页面提供两种登录方式：

### 1. 手机号登录
- 输入手机号
- 获取验证码
- 登录

### 2. 账号登录 (当前选中)
- 输入账号名/账号ID
- 输入登录密码
- 登录

### 3. 第三方登录
- 抖音登录
- 飞书登录

## 📝 下一步操作

### 选项 A: 手动登录 (推荐)

我已经打开了登录页面，你可以：

1. **在浏览器中手动登录** Coze 平台
2. **进入** OAuth 应用管理页面
3. **查找或创建** JWT OAuth 应用
4. **获取** 正确的 Client ID 和 Key ID
5. **更新** chatbot-node 的 `.env` 配置

### 选项 B: 使用现有配置先尝试部署

如果你希望跳过平台验证，可以：

1. **假设** chatbotadmin 的配置仍然有效
2. **直接部署** chatbot-node 到 Fly.io
3. **使用生产环境**的 Coze credentials
4. **测试** 是否能正常工作

### 选项 C: 创建新的 JWT OAuth 应用

如果能登录到 Coze 平台：

1. **创建应用** → 选择 "服务应用 (JWT)"
2. **生成新密钥对**:
   ```bash
   cd /Users/mac/Sync/project/drsell/chatbot-node/config
   openssl genrsa -out private_key_new.pem 2048
   openssl rsa -in private_key_new.pem -pubout -out public_key_new.pem
   ```
3. **上传公钥** `public_key_new.pem` 到 Coze
4. **获取** App ID 和 Key ID
5. **更新配置** 并测试

## 🚀 或者：直接部署到 Fly.io 测试

由于 JWT OAuth 不需要回调 URL，我们可以：

### 快速部署方案:

```bash
# 1. 创建 Fly.io 应用
cd /Users/mac/Sync/project/drsell/chatbot-node
fly apps create chatbot-node

# 2. 创建 PostgreSQL (或使用现有的)
fly postgres create --name chatbot-node-db

# 3. 配置 secrets
fly secrets set \
  DATABASE_URL="<postgres_connection_string>" \
  JWT_SECRET="chatbot-node-production-secret-2024" \
  COZE_CLIENT_ID="1133483935040" \
  COZE_PUBLIC_KEY="_VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s" \
  COZE_PRIVATE_KEY_PATH="/app/config/coze-private-key.pem" \
  COZE_BASE_URL="https://api.coze.cn" \
  -a chatbot-node

# 4. 部署
fly deploy -a chatbot-node

# 5. 测试
curl https://chatbot-node.fly.dev/health
```

然后在生产环境测试：
```bash
# 登录
curl -X POST https://chatbot-node.fly.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 测试 Coze OAuth
curl https://chatbot-node.fly.dev/api/coze/oauth/token \
  -H "Authorization: Bearer <token>"

# 创建 Bot
curl -X POST https://chatbot-node.fly.dev/api/coze/bot/getOrCreateBot \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"shopId":"test-shop-001","botName":"node-chat2"}'
```

## 💡 建议

### 如果你有 Coze 账号：
→ 登录验证配置 (5分钟)

### 如果没有或想快速测试：
→ 直接部署到 Fly.io，使用现有配置试试 (10分钟)

### 如果想创建新应用：
→ 登录后创建新 JWT OAuth 应用 (10分钟)

## 📸 截图

登录页面截图已保存: `coze-login-page.png`

---

**你希望我帮你做什么？**

1. 等待你手动登录后继续验证配置
2. 直接准备部署到 Fly.io 的配置
3. 创建新的 JWT OAuth 应用的详细步骤

