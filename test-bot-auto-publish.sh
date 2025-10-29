#!/bin/bash

# Test script for bot auto-publish functionality
# This script tests creating a bot and automatically publishing to Agent As API

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║       🤖 Bot 自动发布测试 - Agent As API                     ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
API_URL="http://localhost:3000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

echo "📋 测试步骤:"
echo "  1. 管理员登录"
echo "  2. 创建新 bot（会自动发布到 Agent As API）"
echo "  3. 验证发布状态"
echo "  4. 测试聊天功能"
echo ""

# Step 1: Login
echo "🔐 Step 1: 管理员登录..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${ADMIN_USERNAME}\",
    \"password\": \"${ADMIN_PASSWORD}\"
  }")

TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败"
  echo "$LOGIN_RESPONSE" | python3 -m json.tool
  exit 1
fi

echo "✅ 登录成功"
echo "   Token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create bot with auto-publish
echo "🤖 Step 2: 创建新 bot（自动发布）..."
BOT_NAME="auto-publish-test-bot-$(date +%s)"
SHOP_ID="test-shop-autopublish"

echo "   Bot Name: ${BOT_NAME}"
echo "   Shop ID: ${SHOP_ID}"
echo ""

CREATE_RESPONSE=$(curl -s -X POST "${API_URL}/api/coze/bot/getOrCreateBot" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -d "{
    \"shopId\": \"${SHOP_ID}\",
    \"botName\": \"${BOT_NAME}\"
  }")

echo "📊 创建响应:"
echo "$CREATE_RESPONSE" | python3 -m json.tool
echo ""

BOT_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('data', {}).get('botId', ''))" 2>/dev/null)

if [ -z "$BOT_ID" ]; then
  echo "❌ Bot 创建失败"
  exit 1
fi

echo "✅ Bot 创建成功"
echo "   Bot ID: ${BOT_ID}"
echo ""

# Check logs for publish confirmation
echo "📝 Step 3: 检查服务器日志..."
sleep 2

echo "查找发布日志..."
tail -n 100 dev.log | grep -A 5 "Publishing bot\|published successfully" | tail -n 20

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Step 4: Test chat with the new bot
echo "💬 Step 4: 测试聊天功能..."
echo ""

CHAT_RESPONSE=$(curl -s -X POST "${API_URL}/api/coze/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"userId\": \"test-user-autopublish\",
    \"message\": \"你好，请介绍一下你自己\",
    \"botId\": \"${BOT_ID}\",
    \"shopId\": \"${SHOP_ID}\"
  }")

echo "📊 聊天响应:"
echo "$CHAT_RESPONSE" | python3 -m json.tool
echo ""

# Check if we got a real response or error
RESPONSE_TEXT=$(echo "$CHAT_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('response', ''))" 2>/dev/null)

if [[ "$RESPONSE_TEXT" == *"Sorry, I encountered an error"* ]]; then
  echo "⚠️  Bot 已创建但可能未正确发布"
  echo "    检查 Coze 平台是否需要手动批准发布"
  echo ""
  echo "🔍 详细错误日志:"
  tail -n 50 dev.log | grep -A 10 "Coze chat API\|Failed to publish" | tail -n 30
else
  echo "✅ Bot 运行正常 - 自动发布成功！"
  echo "   响应: ${RESPONSE_TEXT:0:100}..."
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📚 总结:"
echo "  • Bot ID: ${BOT_ID}"
echo "  • Bot Name: ${BOT_NAME}"
echo "  • Shop ID: ${SHOP_ID}"
echo ""
echo "🔗 相关链接:"
echo "  • Coze Bot 详情: https://www.coze.cn/space/7351411557182226472/bot/${BOT_ID}"
echo "  • 演示页面: ${API_URL}/product-inquiry-demo.html"
echo ""
echo "✨ 完成！"

