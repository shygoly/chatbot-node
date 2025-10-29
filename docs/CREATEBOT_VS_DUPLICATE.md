# createBot vs duplicateBot - 对比分析

**分析时间**: 2025年10月28日

---

## ✅ chatbotadmin 使用的 API

### 明确答案: **createBot**

从 chatbotadmin 的 Java 代码可以看到：

```java
// CozeApiServiceImpl.java - Line 250-274
public String createBot(BotSaveReqVO botSaveReqVO){
    CozeAPI coze = cozeAPI();
    BotPromptInfo promptInfo = new BotPromptInfo(botSaveReqVO.getPromptInfo());
    
    // 工作流配置
    BotWorkflowIdInfo workflowIdInfo = new BotWorkflowIdInfo();
    workflowIdInfo.setId("7530904201956147251");
    // ... 配置代码
    
    // 创建 Bot 请求
    CreateBotReq createReq = CreateBotReq.builder()
        .spaceID("7530893540072259584")  // 畅达团队 workspace
        .name(botSaveReqVO.getName())
        .description(botSaveReqVO.getDescription())
        .promptInfo(promptInfo)
        .workflowIdList(botWorkflowIdList)
        .modelInfoConfig(modelInfoConfig)
        .build();
        
    // 调用 Coze API 创建 Bot
    CreateBotResp createResp = coze.bots().create(createReq);
    return createResp.getBotID();
}
```

**使用的 API**: `coze.bots().create(createReq)` = **createBot**

---

## 📊 两种 API 的区别

### createBot (创建新 Bot)

**用途**: 从零创建一个全新的智能体

**参数**:
- ✅ `space_id` - 工作空间 ID
- ✅ `name` - Bot 名称
- ✅ `description` - 描述
- ✅ `prompt_info` - 人设和回复逻辑
- ✅ `onboarding_info` - 开场白
- ✅ `plugin_id_list` - 插件列表
- ✅ `workflow_id_list` - 工作流列表
- ✅ `model_info_config` - 模型配置

**权限**: `createBot`

**API 端点**: `POST https://api.coze.cn/v1/bot/create`

**特点**:
- ✅ 创建全新的 Bot
- ✅ 完全自定义配置
- ✅ 可以设置所有参数

---

### duplicateBot (复制现有 Bot)

**用途**: 复制一个已存在的智能体

**参数**:
- ✅ `source_bot_id` - 源 Bot ID
- ✅ `target_space_id` - 目标工作空间 ID
- ✅ 可选: 修改名称、描述等

**权限**: `duplicate`

**特点**:
- ✅ 快速复制现有 Bot
- ✅ 保留原有配置
- ✅ 适合模板场景

---

## 🎯 为什么 chatbotadmin 使用 createBot？

### 业务场景:

chatbotadmin 是为**每个 Shopify 商家创建独立的客服 Bot**：

1. **每个商家不同**:
   - 不同的 shop name
   - 不同的商品知识库
   - 不同的工作流

2. **需要定制化**:
   - 每个 Bot 绑定不同的工作流
   - 每个 Bot 使用商家特定的知识库
   - Prompt 中包含商家信息

3. **不是简单复制**:
   - 虽然有统一的 Prompt 模板
   - 但每个 Bot 需要独立配置
   - 需要绑定特定的 workflow ID

### 代码证据:

```java
// 每个 Bot 都绑定特定的工作流
workflowIdInfo.setId("7530904201956147251");  // 固定的工作流 ID

// 使用商家 ID 作为 Bot 名称
.name(botSaveReqVO.getName())  // shopId/shopName

// 每个 Bot 在畅达团队的 workspace
.spaceID("7530893540072259584")
```

---

## 💡 chatbot-node 的实现

### 当前实现:

```typescript
// src/services/coze-api.service.ts
async getOrCreateBot(shopId: string, botName: string) {
  const response = await axios.post(
    `${config.coze.oauth.baseUrl}/v1/bot/create`,  // ✅ 使用 createBot
    {
      space_id: process.env.COZE_WORKSPACE_ID || '7351411557182226472',
      name: botName,
      description: `AI customer service bot for shop ${shopId}`,
      prompt_info: {
        prompt: 'You are a helpful AI customer service assistant...',
      },
    },
    // ...
  );
}
```

**结论**: chatbot-node 与 chatbotadmin **保持一致**，使用 `createBot` API ✅

---

## 🔍 何时使用 duplicateBot？

### 适用场景:

1. **模板场景**:
   - 有一个标准的 Bot 模板
   - 需要快速创建多个相似的 Bot
   - 只需要修改名称和少量配置

2. **批量创建**:
   - 从一个 master Bot 复制多个副本
   - 每个副本配置基本相同
   - 只有少量差异（如名称、描述）

3. **跨空间复制**:
   - 将 Bot 从一个 workspace 复制到另一个
   - 快速迁移 Bot

### chatbotadmin 不使用的原因:

- ❌ 每个商家的 Bot 有独立配置
- ❌ 需要绑定不同的知识库（虽然当前代码未实现）
- ❌ 需要完全控制 Bot 的所有参数

---

## 📝 总结

| 项目 | 使用的 API | 原因 |
|------|-----------|------|
| chatbotadmin | **createBot** ✅ | 每个商家需要独立配置的 Bot |
| chatbot-node | **createBot** ✅ | 与 chatbotadmin 保持一致 |

**推荐**: 继续使用 `createBot`，因为：
1. ✅ 与原有系统一致
2. ✅ 更灵活的配置
3. ✅ 可以完全控制 Bot 参数
4. ✅ 适合独立的商家客服场景

---

**分析完成时间**: 2025年10月28日 04:19  
**结论**: **使用 createBot** ✅
