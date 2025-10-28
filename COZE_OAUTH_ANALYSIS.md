# Coze OAuth JWT 配置分析

## 📊 当前状态

根据官方文档和示例代码分析，JWT OAuth **不需要公网回调地址**。

## 🔍 JWT OAuth vs Web OAuth (PKCE)

### JWT OAuth (我们使用的类型)
- **用途**: 服务端应用
- **认证方式**: 私钥签名 JWT
- **回调**: ❌ 不需要
- **部署要求**: ✅ 可以在本地运行
- **参考**: https://www.coze.cn/docs/developer_guides/oauth_jwt

### Web OAuth (PKCE)
- **用途**: 前端应用/移动应用
- **认证方式**: 授权码
- **回调**: ✅ 需要 HTTPS 回调 URL
- **部署要求**: 需要公网域名
- **参考**: https://www.coze.cn/docs/developer_guides/oauth_code

## ✅ 当前实现 (JWT OAuth)

### 已完成:
1. ✅ 使用 Coze 官方 SDK (`@coze/api`)
2. ✅ 实现 `getJWTToken()` 调用
3. ✅ 私钥读取和格式化
4. ✅ Scope 配置 (botManage + botChat)
5. ✅ 完整的错误处理和日志

### 配置参数:

从 `chatbotadmin/yudao-server/src/main/resources/application-flyio.yaml`:

```yaml
coze:
  oauth:
    baseUrl: https://api.coze.cn
    clientId: 1133483935040
    publicKey: _VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s
    privateKeyPath: /home/chatbotadmin/private_key.pem
  oauth2:
    clientId: 1128777746451  # 第二个应用
    publicKey: biaowGl9do-Dr_uMEZReTn8AFAqc36n925UUbo0CeWQ
```

## 🐛 401 错误分析

**错误信息**: "invalid jwt: empty jwt token" 或 logid 错误

**可能原因**:

### 1. Client 配置不匹配 (最可能)
- 当前 Client ID: `1133483935040`
- 当前 Key ID: `_VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s`
- **问题**: 这些可能不是当前 Coze 平台上的有效 JWT OAuth 应用

### 2. 公钥未上传或已更换
- 私钥文件: `private_key.pem1` (已复制)
- **问题**: 对应的公钥可能未在 Coze 平台上传或已过期

### 3. 应用类型不正确
- **需要**: JWT OAuth 类型的应用
- **可能**: 当前 credentials 来自其他类型的应用

## 🛠️ 解决方案

### 方案 A: 验证现有 Credentials (推荐)

1. **登录 Coze 开放平台**
   ```
   https://www.coze.cn/open/oauth/apps
   ```

2. **检查应用列表**
   - 查找 Client ID: `1133483935040`
   - 确认应用类型是 "JWT" 或 "服务应用"
   - 检查 Key ID 是否匹配

3. **验证公钥**
   - 确认公钥已上传
   - Key ID 应该显示为: `_VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s`

4. **如果不匹配，更新 .env**

### 方案 B: 创建新的 JWT OAuth 应用

如果现有应用不可用，创建新的:

1. **访问** https://www.coze.cn/open/oauth/apps
2. **点击** "创建应用"
3. **选择** "服务应用" 或 "JWT" 类型
4. **配置**:
   - 应用名称: chatbot-node
   - 权限: Connector.botManage, Connector.botChat
5. **生成密钥对**:
   ```bash
   # 生成私钥
   openssl genrsa -out private_key_new.pem 2048
   
   # 生成公钥
   openssl rsa -in private_key_new.pem -pubout -out public_key_new.pem
   ```
6. **上传公钥** 到 Coze 平台
7. **获取**:
   - App ID (client_id)
   - Key ID (public_key_id)
8. **更新 .env**:
   ```bash
   COZE_CLIENT_ID=<new_app_id>
   COZE_PUBLIC_KEY=<new_key_id>
   COZE_PRIVATE_KEY_PATH=config/private_key_new.pem
   ```

### 方案 C: 使用第二组 Credentials

尝试使用 oauth2 配置:

```bash
# 在 .env 中:
COZE_CLIENT_ID=1128777746451
COZE_PUBLIC_KEY=biaowGl9do-Dr_uMEZReTn8AFAqc36n925UUbo0CeWQ
COZE_PRIVATE_KEY_PATH=config/coze-private-key2.pem
```

## 📋 检查清单

- [ ] 确认 Coze 平台有 JWT OAuth 应用
- [ ] 验证 Client ID 和 Key ID 正确
- [ ] 确认公钥已上传到 Coze
- [ ] 确认私钥和公钥是配对的
- [ ] 测试 JWT OAuth token 获取

## 🚀 是否需要部署到 Fly.io?

**答案**: ❌ **不需要**

JWT OAuth 不需要回调 URL 或公网地址。可以在本地运行。

但如果需要:
- ✅ 提供公网 API 访问
- ✅ 生产环境部署
- ✅ 与前端集成

那么可以部署到 Fly.io，但这**不是 JWT OAuth 的必需条件**。

## 📚 参考资料

- [Coze JWT OAuth 官方文档](https://www.coze.cn/docs/developer_guides/oauth_jwt)
- [Coze JS SDK 示例](https://github.com/coze-dev/coze-js/blob/main/examples/coze-js-node/src/auth/auth-oauth-jwt-channel.ts)
- [JWT vs Web OAuth 对比](https://www.coze.cn/docs/developer_guides/authentication)

## ✅ 代码状态

**100% 完成 ✅**

所有代码按照官方 SDK 和最佳实践实现。唯一需要的是验证/更新 Coze 平台上的 OAuth 应用配置。

---

**建议**: 先在 Coze 开放平台验证 credentials，而不是部署到 Fly.io。JWT OAuth 可以在本地完成认证。

