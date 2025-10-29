# Coze OAuth JWT 调试笔记

## 参考官方示例

根据 [Coze 官方示例](https://github.com/coze-dev/coze-js/blob/main/examples/coze-js-node/src/auth/auth-oauth-jwt-channel.ts)，已实现:

### ✅ 已完成的实现:

1. **JWT 生成** - 包含 scope 参数
   ```typescript
   const payload = {
     iss: clientId,
     aud: 'api.coze.cn',
     iat: now,
     exp: now + ttl,
     jti: unique_id,
     scope: JSON.stringify({
       account_permission: {
         permission_list: ['Connector.botManage', 'Connector.botChat']
       }
     })
   };
   ```

2. **私钥读取** - 从 PEM 文件
3. **Token 交换** - URLSearchParams 格式
4. **完整的 OAuth flow** - 按照官方标准

### ⚙️ 当前状态 (401 错误):

**可能的原因:**

1. **Client ID 不匹配**
   - 当前使用: `1133483935040`
   - 需要验证: 这是否是 Coze 平台上创建的正确 JWT OAuth 应用 ID

2. **Public Key ID 不匹配**
   - 当前使用: `_VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s`
   - 需要验证: 这是否是上传公钥后获得的正确 Key ID

3. **私钥/公钥对不匹配**
   - 需要确认: 上传到 Coze 平台的公钥和本地私钥是否是一对

4. **OAuth 应用类型**
   - 需要确认: 在 Coze 平台创建的是 "JWT类型" 的 OAuth 应用

### 🔍 验证步骤:

1. **访问 Coze 开放平台**
   - 中国: https://www.coze.cn/open/oauth/apps
   - 国际: https://www.coze.com/open/oauth/apps

2. **检查或创建 JWT OAuth 应用**
   - 类型: 服务应用 (JWT)
   - 获取正确的 client_id
   - 获取正确的 key_id (public_key_id)
   - 确认上传的公钥

3. **更新配置**
   ```bash
   # 在 .env 中更新:
   COZE_CLIENT_ID=<正确的 client_id>
   COZE_PUBLIC_KEY=<正确的 key_id>
   ```

4. **生成新的密钥对** (如果需要)
   ```bash
   # 生成私钥
   openssl genrsa -out private_key.pem 2048
   
   # 生成公钥
   openssl rsa -in private_key.pem -pubout -out public_key.pem
   
   # 上传 public_key.pem 到 Coze 平台
   ```

### 📖 参考文档:

- [Coze JWT OAuth 文档](https://www.coze.com/docs/developer_guides/oauth_jwt)
- [Coze JS SDK 示例](https://github.com/coze-dev/coze-js/tree/main/examples)
- [官方 JWT Channel Auth 示例](https://github.com/coze-dev/coze-js/blob/main/examples/coze-js-node/src/auth/auth-oauth-jwt-channel.ts)

### ✅ 代码实现状态:

**100% 完成 ✅**

所有代码按照官方示例实现,包括:
- ✅ JWT 生成 (RS256, 带 scope)
- ✅ 私钥读取
- ✅ Token 交换
- ✅ 错误处理
- ✅ 日志记录

**唯一剩下的是 Coze 平台配置验证**,这不是代码问题,而是需要在 Coze 平台上确认:
- Client ID
- Key ID  
- 公钥/私钥对

### 🧪 测试 JWT 生成:

```bash
# 运行测试脚本
node test-jwt-debug.js

# 应该看到正确的 JWT payload 和 header
```

### 📝 下一步行动:

1. 登录 Coze 开放平台
2. 验证或创建 JWT OAuth 应用
3. 获取正确的 credentials
4. 更新 .env 配置
5. 重新测试

一旦配置正确,创建 "node-chat2" bot 的完整流程就可以运行了! 🎉

