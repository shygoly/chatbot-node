#!/bin/sh
set -e

echo "🚀 Starting chatbot-node..."

# Run database migrations
echo "📊 Running database migrations..."
npx prisma migrate deploy

# Seed database if needed (only for first deployment)
if [ "$RUN_SEED" = "true" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed || echo "Seed failed or already run"
fi

# Start the application
echo "✅ Starting application..."
exec node dist/index.js

