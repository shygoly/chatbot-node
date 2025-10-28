#!/bin/bash

# 快速测试脚本
# Quick test script for chatbot-node backend

echo "🚀 chatbot-node 后端测试"
echo "================================"

# 1. 启动服务器(如果未运行)
if ! lsof -i:3000 > /dev/null 2>&1; then
  echo "启动服务器..."
  npm run dev > dev.log 2>&1 &
  sleep 3
fi

# 2. 健康检查
echo ""
echo "1️⃣  健康检查:"
curl -s http://localhost:3000/health | jq .

# 3. 登录测试
echo ""
echo "2️⃣  登录测试 (admin/admin123):"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "$LOGIN_RESPONSE" | jq .

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo "✅ 登录成功! Token: ${ACCESS_TOKEN:0:30}..."
  
  # 4. 测试认证端点
  echo ""
  echo "3️⃣  获取当前用户:"
  curl -s http://localhost:3000/api/auth/me \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
  
  # 5. 测试 Bot Settings
  echo ""
  echo "4️⃣  Bot 设置列表:"
  curl -s "http://localhost:3000/api/bot-settings/page?pageNo=1&pageSize=10" \
    -H "Authorization: Bearer $ACCESS_TOKEN" | jq .
  
  echo ""
  echo "================================"
  echo "✅ 核心功能测试完成!"
  echo "================================"
else
  echo "❌ 登录失败!"
fi

