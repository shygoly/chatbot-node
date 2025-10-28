import { Request } from 'express';

// Common Result format from Java backend
export interface CommonResult<T = any> {
  code: number;
  data: T;
  msg: string;
}

// Standard error response
export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  path?: string;
}

// Extended Express Request with custom properties
export interface AuthRequest extends Request {
  requestId?: string;
  tenantId?: string;
  userId?: string;
}

// Pagination request
export interface PaginationParams {
  pageNo: number;
  pageSize: number;
}

// Coze OAuth Token
export interface CozeOAuthToken {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
}

// Bot Setting
export interface BotSetting {
  id?: number;
  shopId: string;
  shopName: string;
  chatLogo?: string;
  chatAvatar?: string;
  apiToken?: string;
  botId?: string;
  botName?: string;
  createTime?: string;
}

// Chat History
export interface ChatHistory {
  id?: number;
  inboxUserId?: string;
  conversationId?: string;
  shopId?: string;
  botId?: string;
  content?: string;
  sender?: string;
  sessionId?: string;
  replyId?: string;
  createTime?: string;
}

// Customer Service Inquiry
export interface CustomerServiceInquiry {
  id?: number;
  email: string;
  message: string;
  createTime?: string;
}

// Inbox User
export interface InboxUser {
  id?: number;
  shopId: string;
  shopName?: string;
  userEmail: string;
  userName?: string;
  createTime?: string;
}

// Coze Info
export interface CozeInfo {
  id?: number;
  shopId: string;
  datasetId?: string;
  botId?: string;
  docId?: string;
  datasetType?: number; // 1-产品，2-订单，3-客户
  createTime?: string;
}

