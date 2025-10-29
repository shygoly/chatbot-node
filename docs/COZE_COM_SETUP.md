# Coze.com 国际版 OAuth 应用设置指南

## 问题背景
当前的 chatbot-node 应用使用国内版 Coze API (`api.coze.cn`)，在 Fly.io 海外部署时遇到网络连接问题。需要切换到国际版 Coze API (`api.coze.com`)。

## 解决方案

### 1. 访问 Coze.com 国际版
打开浏览器访问: https://www.coze.com/open

### 2. 创建或登录账户
- 如果已有 coze.com 账户，直接登录
- 如果没有，需要注册新账户

### 3. 创建 OAuth 应用
1. 导航到 **开发者中心** 或 **OAuth 应用** 页面
2. 点击 **创建应用** 或 **New Application**
3. 填写应用信息:
   - 应用名称: `chatbot-node`
   - 应用描述: `Node.js Chatbot Service`
   - 回调 URL: `https://chatbot-node.fly.dev` (可选)

### 4. 获取 Credentials
创建应用后，您会看到以下信息：

#### App ID / Client ID
```
例如: 1145141919810
```
这个 ID 用于 OAuth 认证

#### Key ID (Public Key ID)
```
例如: _xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
这是公钥的标识符

#### Workspace ID
```
例如: 7351411557182226472
```
这是工作区 ID

#### Private Key
1. 点击 **下载私钥** 或 **Generate Private Key**
2. 下载 `.pem` 文件
3. 保存私钥内容（需要添加到 Fly.io secrets）

### 5. 更新 Fly.io Secrets
获取到上述信息后，运行以下命令更新 secrets:

```bash
# 设置 Client ID (App ID)
fly secrets set COZE_CLIENT_ID=<你的 Client ID> --app chatbot-node

# 设置 Key ID (Public Key ID)
fly secrets set COZE_KEY_ID=<你的 Key ID> --app chatbot-node

# 设置 Workspace ID
fly secrets set COZE_WORKSPACE_ID=<你的 Workspace ID> --app chatbot-node

# 设置 Private Key (将 .pem 文件内容作为 secret)
fly secrets set COZE_PRIVATE_KEY_PATH=config/coze-private-key.pem --app chatbot-node

# 确保 base URL 是国际版
fly secrets set COZE_BASE_URL=https://api.coze.com --app chatbot-node
```

### 6. 上传私钥到服务器
需要在代码仓库中更新 `config/coze-private-key.pem` 文件:

```bash
# 将下载的私钥文件复制到项目
cp ~/Downloads/new-private-key.pem /Users/mac/Sync/project/drsell/chatbot-node/config/coze-private-key-new.pem

# 然后重新部署
cd /Users/mac/Sync/project/drsell/chatbot-node
fly deploy --ha=false
```

## 注意事项

1. **安全性**: 私钥文件包含敏感信息，确保：
   - 不要提交到 Git 仓库
   - 使用 Fly.io secrets 管理
   - 在本地妥善保管备份

2. **兼容性**: 确保国际版的 bot ID 和当前使用的保持一致

3. **测试**: 更新后需要测试聊天功能是否正常工作

## 当前状态

- ✅ 应用已部署: https://chatbot-node.fly.dev/
- ✅ PostgreSQL 数据库已连接
- ✅ 环境变量 `COZE_BASE_URL=https://api.coze.com` 已设置
- ⏳ 需要获取国际版 OAuth credentials

## 获取 Credentials 后

创建文档后，请按照上面的步骤操作，然后运行:

```bash
# 查看当前 secrets
fly secrets list --app chatbot-node

# 更新为国际版 credentials
fly secrets set COZE_CLIENT_ID=<new_client_id> --app chatbot-node
fly secrets set COZE_KEY_ID=<new_key_id> --app chatbot-node
fly secrets set COZE_WORKSPACE_ID=<new_workspace_id> --app chatbot-node

# 重新部署以生效
fly deploy --ha=false
```

