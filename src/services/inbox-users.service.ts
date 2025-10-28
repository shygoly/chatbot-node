import prisma from './database';
import { Prisma } from '@prisma/client';

export interface InboxUserInput {
  shopId: string;
  shopName?: string;
  userEmail: string;
  userName?: string;
}

export interface InboxUserFilters {
  shopId?: string;
  shopName?: string;
  userEmail?: string;
  userName?: string;
  pageNo: number;
  pageSize: number;
}

class InboxUsersService {
  /**
   * Create inbox user
   */
  async create(data: InboxUserInput) {
    // Check if user already exists
    const existing = await prisma.shopifyInboxUser.findFirst({
      where: {
        userEmail: data.userEmail,
        shopId: data.shopId,
        deleted: 0,
      },
    });

    if (existing) {
      return existing; // Return existing user
    }

    return await prisma.shopifyInboxUser.create({
      data: {
        shopId: data.shopId,
        shopName: data.shopName,
        userEmail: data.userEmail,
        userName: data.userName,
      },
    });
  }

  /**
   * Login inbox user (simple - just find or create)
   */
  async login(userEmail: string, shopId: string) {
    let user = await prisma.shopifyInboxUser.findFirst({
      where: { userEmail, shopId, deleted: 0 },
    });

    if (!user) {
      // Auto-create user on first login
      user = await this.create({
        shopId,
        userEmail,
        userName: userEmail.split('@')[0], // Use email prefix as name
      });
    }

    return user;
  }

  /**
   * Update inbox user
   */
  async update(id: number, data: Partial<InboxUserInput>) {
    return await prisma.shopifyInboxUser.update({
      where: { id },
      data,
    });
  }

  /**
   * Get inbox user by ID
   */
  async getById(id: number) {
    const user = await prisma.shopifyInboxUser.findFirst({
      where: { id, deleted: 0 },
    });

    if (!user) {
      const error: any = new Error('Inbox user not found');
      error.statusCode = 404;
      throw error;
    }

    return user;
  }

  /**
   * Get all inbox users for a shop
   */
  async getByShopId(shopId: string) {
    return await prisma.shopifyInboxUser.findMany({
      where: { shopId, deleted: 0 },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * List inbox users with pagination
   */
  async list(filters: InboxUserFilters) {
    const where: Prisma.ShopifyInboxUserWhereInput = {
      deleted: 0,
    };

    if (filters.shopId) {
      where.shopId = filters.shopId;
    }
    if (filters.shopName) {
      where.shopName = { contains: filters.shopName };
    }
    if (filters.userEmail) {
      where.userEmail = { contains: filters.userEmail };
    }
    if (filters.userName) {
      where.userName = { contains: filters.userName };
    }

    const skip = (filters.pageNo - 1) * filters.pageSize;
    const take = Math.min(filters.pageSize, 100);

    const [list, total] = await Promise.all([
      prisma.shopifyInboxUser.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.shopifyInboxUser.count({ where }),
    ]);

    return {
      list,
      total,
      pageNo: filters.pageNo,
      pageSize: filters.pageSize,
    };
  }

  /**
   * Delete inbox user (soft delete)
   */
  async delete(id: number) {
    return await prisma.shopifyInboxUser.update({
      where: { id },
      data: { deleted: 1 },
    });
  }
}

export default new InboxUsersService();

