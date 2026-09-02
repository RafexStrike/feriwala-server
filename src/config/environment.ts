import dotenv from 'dotenv';

dotenv.config();

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
};

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const ENV = {
  NODE_ENV: process.env.NODE_ENV?.trim() || 'development',
  PORT: parseNumber(process.env.PORT, 3000),
  MONGODB_URI: requireEnv('MONGODB_URI'),
  CLIENT_FRONTEND_URL: process.env.CLIENT_FRONTEND_URL?.trim() || 'http://localhost:3000',
  ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL?.trim() || 'http://localhost:3001',
  BETTER_AUTH_SECRET: requireEnv('BETTER_AUTH_SECRET'),
  BETTER_AUTH_URL: requireEnv('BETTER_AUTH_URL'),
  EMAIL_HOST: requireEnv('EMAIL_HOST'),
  EMAIL_PORT: parseNumber(process.env.EMAIL_PORT, 587),
  EMAIL_USER: requireEnv('EMAIL_USER'),
  EMAIL_PASS: requireEnv('EMAIL_PASS'),
  EMAIL_FROM: requireEnv('EMAIL_FROM'),
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || '',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  UPLOAD_DIR: process.env.UPLOAD_DIR?.trim() || 'uploads',
  WEB_PUSH_PUBLIC_KEY: process.env.WEB_PUSH_PUBLIC_KEY?.trim() || '',
  WEB_PUSH_PRIVATE_KEY: process.env.WEB_PUSH_PRIVATE_KEY?.trim() || '',
  WEB_PUSH_SUBJECT: process.env.WEB_PUSH_SUBJECT?.trim() || '',
  // Optional Google OAuth credentials (not required for local development)
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID?.trim() || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET?.trim() || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI?.trim() || ''
};

export const CORS_ORIGINS = [ENV.CLIENT_FRONTEND_URL, ENV.ADMIN_FRONTEND_URL].filter(Boolean);
