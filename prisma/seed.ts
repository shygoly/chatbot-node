import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  // Check if admin exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: 'admin' },
  });
  
  if (!existingAdmin) {
    const admin = await prisma.adminUser.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@chatbot.local',
        nickname: 'Admin',
        status: 1,
      },
    });
    console.log('✅ Created admin user:', admin.username);
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create sample bot setting if none exists
  const existingBot = await prisma.shopifyBotSetting.findFirst({
    where: { shopId: 'demo-shop' },
  });
  
  if (!existingBot) {
    const botSetting = await prisma.shopifyBotSetting.create({
      data: {
        shopId: 'demo-shop',
        shopName: 'Demo Store',
        botId: 'demo-bot-123',
        botName: 'Demo Assistant',
        chatLogo: 'https://example.com/logo.png',
        chatAvatar: 'https://example.com/avatar.png',
      },
    });
    console.log('✅ Created bot setting for shop:', botSetting.shopName);
  } else {
    console.log('ℹ️  Demo bot setting already exists');
  }

  // Create sample inbox user if none exists
  const existingUser = await prisma.shopifyInboxUser.findFirst({
    where: { userEmail: 'customer@example.com', shopId: 'demo-shop' },
  });
  
  if (!existingUser) {
    const inboxUser = await prisma.shopifyInboxUser.create({
      data: {
        shopId: 'demo-shop',
        shopName: 'Demo Store',
        userEmail: 'customer@example.com',
        userName: 'Demo Customer',
      },
    });
    console.log('✅ Created inbox user:', inboxUser.userEmail);
  } else {
    console.log('ℹ️  Demo inbox user already exists');
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

