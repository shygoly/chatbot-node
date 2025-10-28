#!/bin/bash

# Complete Flow Test: Login → Coze OAuth → Create Bot
# 完整流程测试: 登录 → Coze OAuth 授权 → 创建智能客服

set -e

API_BASE="http://localhost:3000"
BOT_NAME="node-chat2"

echo "================================================"
echo "🚀 Starting Complete Flow Test"
echo "================================================"
echo ""

# Step 1: Login
echo "📝 Step 1: Login with admin/admin123..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq .

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" == "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed! Cannot proceed."
  exit 1
fi

echo "✅ Login successful! Token obtained."
echo "Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 2: Get Coze OAuth Token
echo "🔐 Step 2: Get Coze OAuth Token (JWT)..."
COZE_TOKEN_RESPONSE=$(curl -s -X GET "${API_BASE}/api/coze/oauth/token" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}")

echo "Coze OAuth Response:"
echo "$COZE_TOKEN_RESPONSE" | jq .

COZE_ACCESS_TOKEN=$(echo "$COZE_TOKEN_RESPONSE" | jq -r '.access_token')

if [ "$COZE_ACCESS_TOKEN" == "null" ] || [ -z "$COZE_ACCESS_TOKEN" ]; then
  echo "❌ Coze OAuth failed! Cannot proceed."
  exit 1
fi

echo "✅ Coze OAuth successful! Token obtained."
echo "Coze Token: ${COZE_ACCESS_TOKEN:0:30}..."
echo ""

# Step 3: Create Bot
echo "🤖 Step 3: Create bot '${BOT_NAME}'..."
CREATE_BOT_RESPONSE=$(curl -s -X POST "${API_BASE}/api/coze/bot/getOrCreateBot" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"shopId\": \"test-shop-001\",
    \"botName\": \"${BOT_NAME}\"
  }")

echo "Create Bot Response:"
echo "$CREATE_BOT_RESPONSE" | jq .

BOT_ID=$(echo "$CREATE_BOT_RESPONSE" | jq -r '.botId // .bot_id // empty')

if [ -z "$BOT_ID" ]; then
  echo "❌ Bot creation failed!"
  exit 1
fi

echo "✅ Bot created successfully!"
echo "Bot ID: ${BOT_ID}"
echo ""

# Summary
echo "================================================"
echo "✅ Complete Flow Test Passed!"
echo "================================================"
echo "Summary:"
echo "  - Login: ✅"
echo "  - Coze OAuth: ✅"
echo "  - Bot Created: ✅"
echo "  - Bot Name: ${BOT_NAME}"
echo "  - Bot ID: ${BOT_ID}"
echo "================================================"

