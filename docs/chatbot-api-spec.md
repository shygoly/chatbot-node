# Chatbot API Specification

> Extracted from chatbotadmin API documentation  
> **Total Endpoints**: 48  
> **Base URL**: `http://localhost:48080`

## Authentication

All endpoints require:
```http
tenant-id: 1
Authorization: Bearer <access_token>
```

## Response Format

All endpoints return:
```json
{
  "code": 0,      // 0 = success, other = error
  "data": {},     // actual response data
  "msg": ""       // error message if any
}
```

---

## 1. Coze API调用 (7 endpoints)

### 1.1 更新客户知识库
- **Path**: `POST /admin-api/mail/coze/api/updateDataset/3`
- **Operation ID**: `updateCustomer`

### 1.2 更新订单知识库
- **Path**: `POST /admin-api/mail/coze/api/updateDataset/2`
- **Operation ID**: `updateOrder`

### 1.3 更新产品知识库
- **Path**: `POST /admin-api/mail/coze/api/updateDataset/1`
- **Operation ID**: `updateProduct`

### 1.4 获取或者创建智能体
- **Path**: `POST /admin-api/mail/coze/api/getOrCreateBot`
- **Operation ID**: `login_2`
- **Request Body**: `BotSaveReqVO`

### 1.5 chat
- **Path**: `POST /admin-api/mail/coze/api/chat`
- **Operation ID**: `chat`
- **Request Body**: `CozeChatReqVO`
- **Note**: Returns Server-Sent Events (SSE) stream

### 1.6 根据类型获取数据集统计
- **Path**: `GET /admin-api/mail/coze/api/getDatasetStatisticByType/{shopId}/{type}`
- **Operation ID**: `getDatasetStatisticByType`
- **Parameters**:
  - `shopId` (path, required)
  - `type` (path, required)

### 1.7 获取数据集统计
- **Path**: `GET /admin-api/mail/coze/api/datasetStatistic/{shopId}`
- **Operation ID**: `getDatasetStatistic`
- **Parameters**:
  - `shopId` (path, required)

---

## 2. Coze授权 (5 endpoints)

### 2.1 TokenForSdk
- **Path**: `POST /admin-api/mail/coze/oauth/tokenForSdk`
- **Operation ID**: `getTokenForSdk`
- **Request Body**: `CozeTokenDTO`

### 2.2 使用JWT授权方式获取Token
- **Path**: `GET /admin-api/mail/coze/oauth/token`
- **Operation ID**: `getToken`

### 2.3 处理Coze授权回调
- **Path**: `GET /admin-api/mail/coze/oauth/callback`
- **Operation ID**: `handleCallback`
- **Parameters**:
  - `code` (query, required) - 授权码

### 2.4 引导用户到Coze授权页面
- **Path**: `GET /admin-api/mail/coze/oauth/authorize`
- **Operation ID**: `authorizeRedirect`
- **Parameters**:
  - `redirectUri` (query, optional)

### 2.5 获取Coze授权页面URL
- **Path**: `GET /admin-api/mail/coze/oauth/authorize-url`
- **Operation ID**: `getAuthorizeUrl`
- **Parameters**:
  - `redirectUri` (query, optional)

---

## 3. bot配置 (7 endpoints)

### 3.1 更新bot配置
- **Path**: `PUT /admin-api/mail/shopify/botSettings/update`
- **Operation ID**: `updateBotSetting`
- **Request Body**: `ShopifyBotSettingSaveReqVO`

### 3.2 创建bot配置
- **Path**: `POST /admin-api/mail/shopify/botSettings/create`
- **Operation ID**: `createBotSetting`
- **Request Body**: `ShopifyBotSettingSaveReqVO`

### 3.3 根据shopName查询BotSetting
- **Path**: `GET /admin-api/mail/shopify/botSettings/shopByName/{shopName}`
- **Operation ID**: `getBotSettingByShopName`
- **Parameters**:
  - `shopName` (path, required)

### 3.4 根据shopid查询BotSetting
- **Path**: `GET /admin-api/mail/shopify/botSettings/shop/{id}`
- **Operation ID**: `getBotSettingByShopId`
- **Parameters**:
  - `id` (path, required)

### 3.5 获得bot配置分页
- **Path**: `GET /admin-api/mail/shopify/botSettings/page`
- **Operation ID**: `getAliMailLogPage`
- **Parameters**:
  - `shopId` (query)
  - `shopName` (query)
  - `chatLogo` (query)
  - `chatAvatar` (query)
  - `apiToken` (query)
  - `botId` (query)
  - `botName` (query)
  - `createTime` (query)
  - `pageNo` (query, required)
  - `pageSize` (query, required)

### 3.6 获得bot配置
- **Path**: `GET /admin-api/mail/shopify/botSettings/get`
- **Operation ID**: `getBotSettingById`
- **Parameters**:
  - `id` (query, required)

### 3.7 删除bot配置
- **Path**: `DELETE /admin-api/mail/shopify/botSettings/delete`
- **Operation ID**: `deleteBotSetting`
- **Parameters**:
  - `id` (query, required)

---

## 4. 对话历史 (9 endpoints)

### 4.1 更新对话历史
- **Path**: `PUT /admin-api/mail/coze-chat-history/update`
- **Operation ID**: `updateCozeChatHistory`
- **Request Body**: `CozeChatHistorySaveReqVO`

### 4.2 创建对话历史
- **Path**: `POST /admin-api/mail/coze-chat-history/create`
- **Operation ID**: `createCozeChatHistory`
- **Request Body**: `CozeChatHistorySaveReqVO`

### 4.3 获得对话用户
- **Path**: `GET /admin-api/mail/coze-chat-history/user/page`
- **Operation ID**: `getCozeHistoryUserList`
- **Parameters**:
  - `inboxUserId` (query) - 客户id
  - `email` (query) - 客户邮箱
  - `userName` (query) - 客户用户名
  - `emailUserIdList` (query, array)
  - `nameUserIdList` (query, array)
  - `pageNo` (query, required)
  - `pageSize` (query, required)

### 4.4 今日对话统计
- **Path**: `GET /admin-api/mail/coze-chat-history/todayChatStatistics`
- **Operation ID**: `todayChatStatistics`

### 4.5 回答率统计
- **Path**: `GET /admin-api/mail/coze-chat-history/replyRate`
- **Operation ID**: `replyRate`

### 4.6 获得对话历史分页
- **Path**: `GET /admin-api/mail/coze-chat-history/page`
- **Operation ID**: `getCozeChatHistoryPage`
- **Parameters**:
  - `inboxUserId` (query) - 客户id
  - `conversationId` (query) - 会话id
  - `shopId` (query) - 店铺id
  - `botId` (query) - 商店对应的Coze Bot ID
  - `content` (query) - 内容
  - `sender` (query) - 发送方
  - `sessionId` (query) - session id
  - `replyId` (query) - bot回复的那个问题的id
  - `createTime` (query) - 创建时间
  - `pageNo` (query, required)
  - `pageSize` (query, required)

### 4.7 获得对话历史
- **Path**: `GET /admin-api/mail/coze-chat-history/get`
- **Operation ID**: `getCozeChatHistory`
- **Parameters**:
  - `id` (query, required)

### 4.8 导出对话历史 Excel
- **Path**: `GET /admin-api/mail/coze-chat-history/export-excel`
- **Operation ID**: `exportCozeChatHistoryExcel`
- **Parameters**: Same as 4.6

### 4.9 删除对话历史
- **Path**: `DELETE /admin-api/mail/coze-chat-history/delete`
- **Operation ID**: `deleteCozeChatHistory`
- **Parameters**:
  - `id` (query, required)

---

## 5. 扣子信息 (6 endpoints)

### 5.1 更新扣子信息
- **Path**: `PUT /admin-api/mail/coze-info/update`
- **Operation ID**: `updateCozeInfo`
- **Request Body**: `CozeInfoSaveReqVO`

### 5.2 创建扣子信息
- **Path**: `POST /admin-api/mail/coze-info/create`
- **Operation ID**: `createCozeInfo`
- **Request Body**: `CozeInfoSaveReqVO`

### 5.3 获得扣子信息分页
- **Path**: `GET /admin-api/mail/coze-info/page`
- **Operation ID**: `getCozeInfoPage`
- **Parameters**:
  - `createTime` (query)
  - `shopId` (query)
  - `datasetId` (query)
  - `botId` (query)
  - `docId` (query)
  - `datasetType` (query) - 知识库类型(1-产品，2-订单，3-客户)
  - `pageNo` (query, required)
  - `pageSize` (query, required)

### 5.4 获得扣子信息
- **Path**: `GET /admin-api/mail/coze-info/get`
- **Operation ID**: `getCozeInfo`
- **Parameters**:
  - `id` (query, required)

### 5.5 导出扣子信息 Excel
- **Path**: `GET /admin-api/mail/coze-info/export-excel`
- **Operation ID**: `exportCozeInfoExcel`
- **Parameters**: Same as 5.3

### 5.6 删除扣子信息
- **Path**: `DELETE /admin-api/mail/coze-info/delete`
- **Operation ID**: `deleteCozeInfo`
- **Parameters**:
  - `id` (query, required)

---

## 6. 收集信息 (6 endpoints)

### 6.1 更新收集信息
- **Path**: `PUT /admin-api/mail/customerServiceInquiries/update`
- **Operation ID**: `updateCustomerServiceInquiries`
- **Request Body**: `CustomerServiceInquiriesSaveReqVO`

### 6.2 创建收集信息
- **Path**: `POST /admin-api/mail/customerServiceInquiries/create`
- **Operation ID**: `createCustomerServiceInquiries`
- **Request Body**: `CustomerServiceInquiriesSaveReqVO`

### 6.3 获得收集信息分页
- **Path**: `GET /admin-api/mail/customerServiceInquiries/page`
- **Operation ID**: `getCustomerServiceInquiriesPage`
- **Parameters**:
  - `email` (query) - 邮箱
  - `message` (query) - 信息
  - `createTime` (query)
  - `pageNo` (query, required)
  - `pageSize` (query, required)

### 6.4 获得收集信息
- **Path**: `GET /admin-api/mail/customerServiceInquiries/get`
- **Operation ID**: `getCustomerServiceInquiries`
- **Parameters**:
  - `id` (query, required)

### 6.5 导出收集信息 Excel
- **Path**: `GET /admin-api/mail/customerServiceInquiries/export-excel`
- **Operation ID**: `exportCustomerServiceInquiriesExcel`
- **Parameters**: Same as 6.3

### 6.6 删除收集信息
- **Path**: `DELETE /admin-api/mail/customerServiceInquiries/delete`
- **Operation ID**: `deleteCustomerServiceInquiries`
- **Parameters**:
  - `id` (query, required)

---

## 7. 用户收件箱 (8 endpoints)

### 7.1 更新用户收件箱
- **Path**: `PUT /admin-api/mail/shopify/inboxUser/update`
- **Operation ID**: `updateShopifyInboxUser`
- **Request Body**: `ShopifyInboxUserSaveReqVO`

### 7.2 创建用户收件箱（登录）
- **Path**: `POST /admin-api/mail/shopify/inboxUser/loginShopifyInboxUse`
- **Operation ID**: `loginShopifyInboxUse`
- **Request Body**: `ShopifyInboxUserSaveReqVO`

### 7.3 创建用户收件箱
- **Path**: `POST /admin-api/mail/shopify/inboxUser/create`
- **Operation ID**: `createShopifyInboxUser`
- **Request Body**: `ShopifyInboxUserSaveReqVO`

### 7.4 根据shopid查询全部InboxUser
- **Path**: `GET /admin-api/mail/shopify/inboxUser/shop/{id}`
- **Operation ID**: `getInboxUsersByShop`
- **Parameters**:
  - `id` (path, required)

### 7.5 获得用户收件箱分页
- **Path**: `GET /admin-api/mail/shopify/inboxUser/page`
- **Operation ID**: `getShopifyInboxUserPage`
- **Parameters**:
  - `shopId` (query)
  - `shopName` (query)
  - `userEmail` (query)
  - `userName` (query)
  - `createTime` (query)
  - `pageNo` (query, required)
  - `pageSize` (query, required)

### 7.6 获得用户收件箱
- **Path**: `GET /admin-api/mail/shopify/inboxUser/get`
- **Operation ID**: `getShopifyInboxUser`
- **Parameters**:
  - `id` (query, required)

### 7.7 导出用户收件箱 Excel
- **Path**: `GET /admin-api/mail/shopify/inboxUser/export-excel`
- **Operation ID**: `exportShopifyInboxUserExcel`
- **Parameters**: Same as 7.5

### 7.8 删除用户收件箱
- **Path**: `DELETE /admin-api/mail/shopify/inboxUser/delete`
- **Operation ID**: `deleteShopifyInboxUser`
- **Parameters**:
  - `id` (query, required)

---

## API Group Summary

| Group | Base Path | Endpoints | Purpose |
|-------|-----------|-----------|---------|
| Coze API | `/admin-api/mail/coze/api` | 7 | Bot management, chat, dataset updates |
| Coze OAuth | `/admin-api/mail/coze/oauth` | 5 | Coze authorization flow |
| Bot Settings | `/admin-api/mail/shopify/botSettings` | 7 | Shopify bot configuration |
| Chat History | `/admin-api/mail/coze-chat-history` | 9 | Chat history and statistics |
| Coze Info | `/admin-api/mail/coze-info` | 6 | Coze bot information |
| Customer Inquiries | `/admin-api/mail/customerServiceInquiries` | 6 | Customer service inquiries |
| Inbox Users | `/admin-api/mail/shopify/inboxUser` | 8 | Chat inbox user management |

---

## Notes

1. All endpoints require authentication via `Authorization: Bearer <token>` header
2. Multi-tenant support via `tenant-id` header
3. SSE streaming for chat endpoint requires special handling
4. Pagination uses `pageNo` (1-based) and `pageSize` (max 100)
5. Excel export endpoints return binary file data

