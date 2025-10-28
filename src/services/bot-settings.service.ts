import prisma from './database';
import { Prisma } from '@prisma/client';

export interface BotSettingInput {
  shopId: string;
  shopName?: string;
  chatLogo?: string;
  chatAvatar?: string;
  apiToken?: string;
  botId?: string;
  botName?: string;
}

export interface BotSettingFilters {
  shopId?: string;
  shopName?: string;
  botId?: string;
  botName?: string;
  pageNo: number;
  pageSize: number;
}

class BotSettingsService {
  /**
   * Create a new bot setting
   */
  async create(data: BotSettingInput) {
    return await prisma.shopifyBotSetting.create({
      data: {
        shopId: data.shopId,
        shopName: data.shopName,
        chatLogo: data.chatLogo,
        chatAvatar: data.chatAvatar,
        apiToken: data.apiToken,
        botId: data.botId,
        botName: data.botName,
      },
    });
  }

  /**
   * Update bot setting
   */
  async update(id: number, data: Partial<BotSettingInput>) {
    return await prisma.shopifyBotSetting.update({
      where: { id },
      data,
    });
  }

  /**
   * Get bot setting by ID
   */
  async getById(id: number) {
    const setting = await prisma.shopifyBotSetting.findFirst({
      where: { id, deleted: 0 },
    });

    if (!setting) {
      const error: any = new Error('Bot setting not found');
      error.statusCode = 404;
      throw error;
    }

    return setting;
  }

  /**
   * Get bot setting by shop ID
   */
  async getByShopId(shopId: string) {
    const setting = await prisma.shopifyBotSetting.findFirst({
      where: { shopId, deleted: 0 },
    });

    if (!setting) {
      const error: any = new Error('Bot setting not found for this shop');
      error.statusCode = 404;
      throw error;
    }

    return setting;
  }

  /**
   * Get bot setting by shop name
   */
  async getByShopName(shopName: string) {
    const setting = await prisma.shopifyBotSetting.findFirst({
      where: { shopName, deleted: 0 },
    });

    if (!setting) {
      const error: any = new Error('Bot setting not found for this shop name');
      error.statusCode = 404;
      throw error;
    }

    return setting;
  }

  /**
   * List bot settings with pagination
   */
  async list(filters: BotSettingFilters) {
    const where: Prisma.ShopifyBotSettingWhereInput = {
      deleted: 0,
    };

    if (filters.shopId) {
      where.shopId = filters.shopId;
    }
    if (filters.shopName) {
      where.shopName = { contains: filters.shopName };
    }
    if (filters.botId) {
      where.botId = filters.botId;
    }
    if (filters.botName) {
      where.botName = { contains: filters.botName };
    }

    const skip = (filters.pageNo - 1) * filters.pageSize;
    const take = Math.min(filters.pageSize, 100); // Max 100

    const [list, total] = await Promise.all([
      prisma.shopifyBotSetting.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shopifyBotSetting.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo: filters.pageNo,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Delete bot setting (soft delete)
   */
  async delete(id: number) {
    return await prisma.shopifyBotSetting.update({
      where: { id },
      data: { deleted: 1 },
    });
  }
}

export default new BotSettingsService();

