import 'dotenv/config';
import { z } from 'zod';
const envSchema = z
    .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    DATABASE_URL: z.string().min(1),
    ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().min(5).max(60).default(15),
    SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(14),
    SMTP_HOST: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).optional()),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).optional()),
    SMTP_PASSWORD: z.preprocess((value) => (value === '' ? undefined : value), z.string().min(1).optional()),
    SMTP_FROM: z.preprocess((value) => (value === '' ? undefined : value), z.string().email().optional()),
    PUBLIC_APP_URL: z.url().default('http://localhost:8080'),
    COOKIE_SECURE: z.stringbool().default(false),
    COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
    WEB_ORIGINS: z
        .string()
        .default('http://localhost:8080,http://localhost:3000'),
    NATIVE_ORIGINS: z.string().default('capacitor://localhost,http://localhost'),
    TRUST_PROXY: z.stringbool().default(false),
    LOG_LEVEL: z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),
})
    .refine((value) => value.NODE_ENV !== 'production' || value.COOKIE_SECURE, 'COOKIE_SECURE must be true in production.')
    .refine((value) => value.COOKIE_SAME_SITE !== 'none' || value.COOKIE_SECURE, 'SameSite=None requires secure cookies.')
    .refine((value) => Boolean(value.SMTP_HOST) === Boolean(value.SMTP_FROM), 'SMTP_HOST and SMTP_FROM must be configured together.')
    .refine((value) => Boolean(value.SMTP_USER) === Boolean(value.SMTP_PASSWORD), 'SMTP_USER and SMTP_PASSWORD must be configured together.');
const parsedEnv = envSchema.safeParse({
    ...process.env,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL || process.env.FRONTEND_URL || undefined,
});
if (!parsedEnv.success) {
    throw new Error(`Invalid backend environment: ${parsedEnv.error.message}`);
}
const parseOrigins = (value) => value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
export const env = {
    ...parsedEnv.data,
    cookieSecure: parsedEnv.data.NODE_ENV === 'production' && parsedEnv.data.COOKIE_SECURE,
    cookieSameSite: parsedEnv.data.NODE_ENV === 'production'
        ? parsedEnv.data.COOKIE_SAME_SITE
        : 'lax',
    passwordRecoveryEnabled: Boolean(parsedEnv.data.SMTP_HOST && parsedEnv.data.SMTP_FROM),
    publicAppUrl: parsedEnv.data.PUBLIC_APP_URL.replace(/\/+$/, ''),
    webOrigins: parseOrigins(parsedEnv.data.WEB_ORIGINS),
    nativeOrigins: parseOrigins(parsedEnv.data.NATIVE_ORIGINS),
};
