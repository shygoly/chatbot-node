# chatbot-node 配置与 chatbotadmin 对齐

**更新时间**: 2025年10月28日  
**状态**: ✅ 配置已对齐

---

## 📊 chatbotadmin 的 createBot 配置

### Java 实现 (CozeApiServiceImpl.java):

```java
public String createBot(BotSaveReqVO botSaveReqVO){
    CozeAPI coze = cozeAPI();
    
    // 1. Prompt Info
    BotPromptInfo promptInfo = new BotPromptInfo(botSaveReqVO.getPromptInfo());
    
    // 2. 工作流配置
    BotWorkflowIdInfo workflowIdInfo = new BotWorkflowIdInfo();
    workflowIdInfo.setId("7530904201956147251");  // 固定的工作流 ID
    List<BotWorkflowIdInfo> workflowIdInfoList = new LinkedList<>();
    workflowIdInfoList.add(workflowIdInfo);
    BotWorkflowIdList botWorkflowIdList = new BotWorkflowIdList();
    botWorkflowIdList.setIds(workflowIdInfoList);
    
    // 3. 模型配置
    BotModelInfoConfig modelInfoConfig = new BotModelInfoConfig();
    modelInfoConfig.setModelId("1742989917");  // 固定的模型 ID
    
    // 4. 创建请求
    CreateBotReq createReq = CreateBotReq.builder()
        .spaceID("7530893540072259584")  // 畅达团队 workspace
        .name(botSaveReqVO.getName())
        .description(botSaveReqVO.getDescription())
        .promptInfo(promptInfo)
        .workflowIdList(botWorkflowIdList)  // ✅ 包含工作流
        .modelInfoConfig(modelInfoConfig)    // ✅ 包含模型配置
        .build();
        
    CreateBotResp createResp = coze.bots().create(createReq);
    return createResp.getBotID();
}
```

### Prompt 模板 (ShopifyAuthServiceImpl.java):

```java
botSaveReqVO.setPromptInfo(
    "## 回复语言策略（必须遵守）\n" +
    "1. 必须检测用户使用的语言（如中文、英文、日文等）。\n" +
    "2. 的回复语言应与用户输入语言一致...\n" +
    "3. 不允许始终使用中文作为默认语言...\n" +
    "\n" +
    "# 角色\n" +
    "你是一名专业且人性化的网店客服...\n" +
    "\n" +
    "## 技能\n" +
    "### 技能 1: 解答商品属性和使用条件问题\n" +
    "### 技能 2: 解答商品价格问题\n" +
    "### 技能 3: 解答商品退换货运费问题\n" +
    "### 技能 4: 解答商品库存相关问题\n" +
    "   - 调用工作流，输入参数shopName\n" +
    "### 能力 5: 商品推荐与导购\n" +
    "\n" +
    "## 限制\n" +
    "- 用「您」称呼客户，回复简洁（不超过3句话）\n" +
    "- 严格限定于商品相关咨询"
);
botSaveReqVO.setName(shopName);
botSaveReqVO.setDescription(shopName+"的chatbot");
```

---

## ✅ chatbot-node 已对齐的配置

### TypeScript 实现 (coze-api.service.ts):

```typescript
async getOrCreateBot(shopId: string, botName: string) {
  const promptInfo = `## 回复语言策略（必须遵守）
1. 必须检测用户使用的语言（如中文、英文、日文等）。
2. 的回复语言应与用户输入语言一致。例如：
   - 用户使用英文提问，必须用英文回答。
   - 用户使用中文提问，必须用中文回答。
   - 用户在对话中切换语言，的回复也必须随之切换。
3. 不允许始终使用中文作为默认语言。

# 角色
你是一名专业且人性化的网店客服，负责解答用户售前、售中及售后的各类咨询问题。

## 技能
### 技能 1: 解答商品属性和使用条件问题
1. 当用户询问商品属性和使用条件时，调用知识库查找相关信息。
2. 若知识库信息不足，通过合理推测和通用知识补充，确保准确回答用户。

### 技能 2: 解答商品价格问题
1. 接到用户关于商品价格的咨询，依据知识库提供精确价格信息。
2. 若价格有变动或优惠活动，详细告知用户具体情况。

### 技能 3: 解答商品退换货运费问题
1. 针对用户提出的商品退换货运费疑问，结合知识库给出准确答案。
2. 清晰说明不同退换货情形下运费的承担规则。

### 技能 4: 解答商品库存相关问题
1. 结合工作流出准确答案。
2. 调用工作流的时候，工作流需要输入参数shopName，输入值为${shopId}
3. 工作流的返回product是商品数组，里面有每一件商品的信息，total为商品总数
4. 每件商品中title 是商品名称

### 能力 5: 商品推荐与导购
1. 主动推荐匹配用户需求的商品
2. 突出商品三大核心优势：
   - 材质工艺亮点
   - 独家功能设计
   - 用户体验价值
3. 采用FAB话术结构：特性→优势→利益

## 限制
- 导购时自然融入商品优势说明，每次聚焦1-3个核心卖点
- 用「您」称呼客户，回复简洁（不超过3句话）
- 严格限定于商品相关咨询
- 回答需基于知识库信息，若知识库信息不足按上述技能要求处理。`;

  const response = await axios.post(
    `${config.coze.oauth.baseUrl}/v1/bot/create`,
    {
      space_id: process.env.COZE_WORKSPACE_ID || '7351411557182226472',
      name: botName,
      description: `${botName}的chatbot`,  // ✅ 与 chatbotadmin 一致
      prompt_info: {
        prompt: promptInfo,  // ✅ 完整的客服 Prompt
      },
      workflow_id_list: {  // ✅ 添加工作流配置
        ids: [
          {
            id: config.coze.workflowId,  // 7530904201956147251
          },
        ],
      },
      model_info_config: {  // ✅ 添加模型配置
        model_id: config.coze.modelId,  // 1742989917
      },
    },
    // ...
  );
}
```

---

## 📊 配置对比

| 参数 | chatbotadmin | chatbot-node (更新后) | 状态 |
|------|-------------|---------------------|------|
| **space_id** | 7530893540072259584 | 7351411557182226472 | ⚠️ 不同 workspace |
| **name** | shopName | botName | ✅ 一致 |
| **description** | `{shopName}的chatbot` | `${botName}的chatbot` | ✅ 一致 |
| **prompt_info** | 完整客服模板 | **✅ 现已一致** |
| **workflow_id_list** | `["7530904201956147251"]` | **✅ 现已添加** |
| **model_info_config** | `"1742989917"` | **✅ 现已添加** |

---

## 🎯 关键配置参数

### 1. Workflow ID: `7530904201956147251`

**用途**: 用于商品库存查询  
**来源**: chatbotadmin 固定配置  
**说明**: 工作流接收 `shopName` 参数，返回商品数组

### 2. Model ID: `1742989917`

**用途**: 指定使用的 AI 模型  
**来源**: chatbotadmin 固定配置  
**说明**: 豆包模型

### 3. Prompt 模板

**特点**:
- ✅ 多语言支持（中英日等）
- ✅ 自动检测用户语言
- ✅ 5 大技能模块
- ✅ 专业客服话术
- ✅ FAB 销售结构

---

## 🔄 环境变量

### 新增配置:

```bash
# Bot 创建配置 (与 chatbotadmin 对齐)
COZE_WORKFLOW_ID=7530904201956147251
COZE_MODEL_ID=1742989917
COZE_WORKSPACE_ID=7351411557182226472
```

---

## ✅ 更新内容

### 修改的文件:

1. ✅ `src/config/index.ts` - 添加 workflowId 和 modelId 配置
2. ✅ `src/services/coze-api.service.ts` - 更新 createBot 参数

### 新增功能:

- ✅ 完整的客服 Prompt 模板
- ✅ 工作流配置（商品库存查询）
- ✅ 模型配置（豆包 1742989917）
- ✅ 多语言支持
- ✅ 5 大客服技能

---

## 📝 总结

**chatbot-node 现在与 chatbotadmin 完全对齐！**

### 对齐的配置:

1. ✅ 使用 `createBot` API
2. ✅ 完整的客服 Prompt 模板
3. ✅ 工作流配置 (7530904201956147251)
4. ✅ 模型配置 (1742989917)
5. ✅ 描述格式 (`{name}的chatbot`)

### 唯一差异:

- **Workspace ID**: chatbotadmin 使用畅达团队 (7530893540072259584)，chatbot-node 使用个人空间 (7351411557182226472)

---

**更新完成时间**: 2025年10月28日 04:20  
**状态**: ✅ **配置已完全对齐！**
