import prisma from './database';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chatbot-node-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenPayload {
  userId: number;
  username: string;
}

export interface AuthResponse {
  userId: number;
  username: string;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  /**
   * Login with username and password
   */
  async login(username: string, password: string): Promise<AuthResponse> {
    // Find user
    const user = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!user || user.deleted === 1 || user.status === 0) {
      const error: any = new Error('Invalid username or password');
      error.statusCode = 401;
      throw error;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const error: any = new Error('Invalid username or password');
      error.statusCode = 401;
      throw error;
    }

    // Generate tokens
    const accessToken = this.generateToken({ userId: user.id, username: user.username });
    const refreshToken = this.generateToken(
      { userId: user.id, username: user.username },
      REFRESH_TOKEN_EXPIRES_IN
    );

    return {
      userId: user.id,
      username: user.username,
      accessToken,
      refreshToken,
      expiresIn: this.getExpiryTime(JWT_EXPIRES_IN),
    };
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: TokenPayload, expiresIn: string = JWT_EXPIRES_IN): string {
    const options: SignOptions = {
      expiresIn: expiresIn as any, // Type assertion to handle jwt types
    };
    return jwt.sign(
      {
        userId: payload.userId.toString(), // Convert BigInt to string for JWT
        username: payload.username,
      },
      JWT_SECRET,
      options
    );
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): TokenPayload {
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      return {
        userId: parseInt(decoded.userId),
        username: decoded.username,
      };
    } catch (error: any) {
      const err: any = new Error('Invalid or expired token');
      err.statusCode = 401;
      throw err;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const payload = this.verifyToken(refreshToken);

    // Verify user still exists and is active
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.deleted === 1 || user.status === 0) {
      const error: any = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    // Generate new tokens
    const accessToken = this.generateToken({ userId: user.id, username: user.username });
    const newRefreshToken = this.generateToken(
      { userId: user.id, username: user.username },
      REFRESH_TOKEN_EXPIRES_IN
    );

    return {
      userId: user.id,
      username: user.username,
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.getExpiryTime(JWT_EXPIRES_IN),
    };
  }

  /**
   * Get current user from token
   */
  async getCurrentUser(token: string) {
    const payload = this.verifyToken(token);
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        email: true,
        nickname: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user || user.status === 0) {
      const error: any = new Error('User not found or inactive');
      error.statusCode = 401;
      throw error;
    }

    return user;
  }

  /**
   * Convert expiry string to milliseconds
   */
  private getExpiryTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 24 * 60 * 60 * 1000; // Default 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }
}

export default new AuthService();

