#!/bin/bash

# Test script for chatbot-node proxy API
# Usage: ./examples/test-api.sh

BASE_URL="http://localhost:3000"
BACKEND_URL="http://localhost:48080"

echo "🚀 Testing Chatbot Node Proxy API"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check health
echo "1️⃣  Testing health endpoint..."
HEALTH=$(curl -s "${BASE_URL}/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "$HEALTH" | jq '.'
else
    echo -e "${RED}❌ Health check failed${NC}"
    exit 1
fi
echo ""

# Step 2: Login to get token
echo "2️⃣  Logging in to get access token..."
LOGIN_RESPONSE=$(curl -s -X POST "${BACKEND_URL}/admin-api/system/auth/login" \
  -H "Content-Type: application/json" \
  -H "tenant-id: 1" \
  -d '{"username":"admin","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}❌ Login failed${NC}"
    echo "$LOGIN_RESPONSE" | jq '.'
    exit 1
else
    echo -e "${GREEN}✅ Login successful${NC}"
    echo "Token: ${TOKEN:0:20}..."
fi
echo ""

# Step 3: Test bot settings page
echo "3️⃣  Testing bot settings API..."
BOT_SETTINGS=$(curl -s "${BASE_URL}/api/bot-settings/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1")

if echo "$BOT_SETTINGS" | jq -e '. | type == "object"' > /dev/null; then
    echo -e "${GREEN}✅ Bot settings API working${NC}"
    echo "$BOT_SETTINGS" | jq '.'
else
    echo -e "${YELLOW}⚠️  Bot settings returned unexpected format${NC}"
    echo "$BOT_SETTINGS"
fi
echo ""

# Step 4: Test chat history statistics
echo "4️⃣  Testing chat history statistics..."
STATS=$(curl -s "${BASE_URL}/api/chat-history/statistics/today" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1")

if echo "$STATS" | jq -e '. | type == "object"' > /dev/null; then
    echo -e "${GREEN}✅ Chat statistics API working${NC}"
    echo "$STATS" | jq '.'
else
    echo -e "${YELLOW}⚠️  Chat statistics returned unexpected format${NC}"
    echo "$STATS"
fi
echo ""

# Step 5: Test coze info page
echo "5️⃣  Testing coze info API..."
COZE_INFO=$(curl -s "${BASE_URL}/api/coze-info/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1")

if echo "$COZE_INFO" | jq -e '. | type == "object"' > /dev/null; then
    echo -e "${GREEN}✅ Coze info API working${NC}"
    echo "$COZE_INFO" | jq '.'
else
    echo -e "${YELLOW}⚠️  Coze info returned unexpected format${NC}"
    echo "$COZE_INFO"
fi
echo ""

# Step 6: Test inquiries page
echo "6️⃣  Testing customer inquiries API..."
INQUIRIES=$(curl -s "${BASE_URL}/api/inquiries/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1")

if echo "$INQUIRIES" | jq -e '. | type == "object"' > /dev/null; then
    echo -e "${GREEN}✅ Inquiries API working${NC}"
    echo "$INQUIRIES" | jq '.'
else
    echo -e "${YELLOW}⚠️  Inquiries returned unexpected format${NC}"
    echo "$INQUIRIES"
fi
echo ""

# Step 7: Test inbox users page
echo "7️⃣  Testing inbox users API..."
INBOX_USERS=$(curl -s "${BASE_URL}/api/inbox-users/page?pageNo=1&pageSize=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "tenant-id: 1")

if echo "$INBOX_USERS" | jq -e '. | type == "object"' > /dev/null; then
    echo -e "${GREEN}✅ Inbox users API working${NC}"
    echo "$INBOX_USERS" | jq '.'
else
    echo -e "${YELLOW}⚠️  Inbox users returned unexpected format${NC}"
    echo "$INBOX_USERS"
fi
echo ""

echo "=================================="
echo -e "${GREEN}🎉 API tests completed!${NC}"

