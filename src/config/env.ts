import dotenv from 'dotenv';

dotenv.config();

const REQUIRED: string[] = [
  'PORT',
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_ROUNDS',
];

const missing = REQUIRED.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}\n` +
      `Copy .env.example to .env and fill in the values.`
  );
}

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoUri: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  bcryptRounds: number;
  allowedOrigins: string[];
  publicProfileBaseUrl: string;
}

const env: EnvConfig = {
  port: parseInt(process.env.PORT as string, 10) || 5000,
  nodeEnv: process.env.NODE_ENV as string,
  mongoUri: process.env.MONGO_URI as string,
  jwtSecret: process.env.JWT_SECRET as string,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN as string,
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS as string, 10) || 12,
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  publicProfileBaseUrl:
    process.env.PUBLIC_PROFILE_BASE_URL || 'http://localhost:5000/api/v1/vendors/public',
};

export default env;
