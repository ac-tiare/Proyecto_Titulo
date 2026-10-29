import 'dotenv/config';

import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(14),
    COOKIE_SECURE: z.stringbool().default(false),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    WEB_ORIGINS: z.string().default('http://localhost:8080'),
    NATIVE_ORIGINS: z.string().default('capacitor://localhost,http://localhost'),
    TRUST_PROXY: z.stringbool().default(false),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
  })
  .refine(
    (value) => value.NODE_ENV !== 'production' || value.COOKIE_SECURE,
    'COOKIE_SECURE must be true in production.',
  )
  .refine(
    (value) => value.COOKIE_SAME_SITE !== 'none' || value.COOKIE_SECURE,
    'SameSite=None requires secure cookies.',
  );

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
  throw new Error(`Invalid backend environment: ${parsedEnv.error.message}`);
}

const parseOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const env = {
  ...parsedEnv.data,
  webOrigins: parseOrigins(parsedEnv.data.WEB_ORIGINS),
  nativeOrigins: parseOrigins(parsedEnv.data.NATIVE_ORIGINS),
};
