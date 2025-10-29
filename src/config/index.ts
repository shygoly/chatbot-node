import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

interface Config {
  database: {
    url: string;
  };
  server: {
    port: number;
    env: string;
  };
  logging: {
    level: string;
  };
  cors: {
    origin: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiresIn: string;
  };
  coze: {
    oauth: {
      clientId: string;
      publicKey: string;
      privateKeyPath: string;
      baseUrl: string;
    };
    oauth2: {
      clientId: string;
      publicKey: string;
      privateKeyPath: string;
    };
    workflowId: string;
    modelId: string;
  };
  evershop: {
    baseUrl: string;
    email: string;
    password: string;
  };
}

const config: Config = {
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chatbot_node',
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'chatbot-node-secret-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  coze: {
    oauth: {
      clientId: process.env.COZE_CLIENT_ID || '1133483935040',
      publicKey: process.env.COZE_PUBLIC_KEY || '_VzHkKSlwVT2yfAcNrZraFCpusQjQ7pXpEagzYheN7s',
      privateKeyPath: process.env.COZE_PRIVATE_KEY_PATH || 'config/coze-private-key.pem',
      baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.cn',
    },
    oauth2: {
      clientId: process.env.COZE2_CLIENT_ID || '1128777746451',
      publicKey: process.env.COZE2_PUBLIC_KEY || 'biaowGl9do-Dr_uMEZReTn8AFAqc36n925UUbo0CeWQ',
      privateKeyPath: process.env.COZE2_PRIVATE_KEY_PATH || 'config/coze-private-key2.pem',
    },
    // Bot creation configuration (matching chatbotadmin)
    workflowId: process.env.COZE_WORKFLOW_ID || '7530904201956147251',
    modelId: process.env.COZE_MODEL_ID || '1742989917',
  },
  evershop: {
    baseUrl: process.env.EVERSHOP_URL || 'https://evershop-fly.fly.dev',
    email: process.env.EVERSHOP_EMAIL || 'admin@example.com',
    password: process.env.EVERSHOP_PASSWORD || 'admin123',
  },
};

// Helper to read private key
export function readPrivateKey(relativePath: string): string {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Private key file not found: ${absolutePath}`);
  }
  return fs.readFileSync(absolutePath, 'utf-8');
}

export default config;

