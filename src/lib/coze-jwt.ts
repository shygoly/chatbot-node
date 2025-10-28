import fs from 'fs';
import path from 'path';
import logger from './logger';
import { getJWTToken } from '@coze/api';

export interface CozeOAuthToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// No longer needed - using official SDK functions

/**
 * Read private key from file
 */
export function readPrivateKey(privateKeyPath: string): string {
  const absolutePath = path.resolve(process.cwd(), privateKeyPath);
  
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Private key file not found: ${absolutePath}`);
  }

  return fs.readFileSync(absolutePath, 'utf8');
}

/**
 * Get Coze access token using official SDK
 * Reference: https://github.com/coze-dev/coze-js/blob/main/examples/coze-js-node/src/auth/auth-oauth-jwt-channel.ts
 */
export async function getCozeJWTAccessToken(
  clientId: string,
  privateKeyPath: string,
  publicKeyId: string,
  baseUrl: string,
  _duration?: number,
  _sessionName?: string
): Promise<CozeOAuthToken> {
  try {
    // Read private key (keep original format with newlines)
    const privateKey = readPrivateKey(privateKeyPath);

    // IMPORTANT: Per Coze official documentation (https://www.coze.cn/open/docs/developer_guides/oauth_jwt)
    // Permissions are controlled by the OAuth application configuration in Coze platform
    // The JWT token does NOT need a scope parameter - permissions are automatically inherited from the app config
    // You must configure permissions in the OAuth app settings on Coze platform (API管理 → 授权 → OAuth应用)

    logger.info('Getting JWT token from Coze SDK', {
      baseURL: baseUrl,
      appId: clientId,
      keyid: publicKeyId,
      hasPrivateKey: !!privateKey,
    });

    // Use official Coze SDK getJWTToken function
    // Reference: https://github.com/coze-dev/coze-js/blob/main/examples/coze-js-node/src/auth/auth-oauth-jwt-channel.ts
    // IMPORTANT: Per Coze docs, permissions are controlled by OAuth app config, NOT by scope parameter
    // Reference: https://www.coze.cn/open/docs/developer_guides/oauth_jwt
    const token = await getJWTToken({
      baseURL: baseUrl,
      appId: clientId,
      aud: 'api.coze.cn',
      keyid: publicKeyId,
      privateKey: privateKey,
      // Remove scope - permissions are determined by OAuth app configuration on Coze platform
    });

    logger.info('Coze JWT token obtained successfully', {
      expires_in: token.expires_in,
    });

    return {
      access_token: token.access_token,
      expires_in: token.expires_in,
      token_type: 'Bearer',
    };
  } catch (error: any) {
    logger.error('Failed to get Coze JWT token', {
      error: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

