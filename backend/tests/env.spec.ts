import { afterEach, describe, expect, it, vi } from 'vitest';

const loadEnv = async (overrides: Record<string, string>) => {
  vi.resetModules();
  for (const [key, value] of Object.entries({
    NODE_ENV: 'test',
    DATABASE_URL:
      'postgresql://test:test@localhost:5432/contigo_test?schema=public',
    SMTP_HOST: '',
    SMTP_FROM: '',
    SMTP_USER: '',
    SMTP_PASSWORD: '',
    SMTP_PASS: '',
    PUBLIC_APP_URL: '',
    FRONTEND_URL: '',
    COOKIE_SECURE: 'false',
    ...overrides,
  })) {
    vi.stubEnv(key, value);
  }
  return import('../src/config/env.js');
};

describe('backend environment aliases', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('accepts SMTP_PASS and FRONTEND_URL when existing names are unset', async () => {
    const { env } = await loadEnv({
      SMTP_USER: 'mailer@example.cl',
      SMTP_PASS: 'alias-password',
      FRONTEND_URL: 'https://contigo.example.cl',
    });

    expect(env.SMTP_PASSWORD).toBe('alias-password');
    expect(env.publicAppUrl).toBe('https://contigo.example.cl');
  });

  it('prefers the existing variables when both names are configured', async () => {
    const { env } = await loadEnv({
      SMTP_USER: 'mailer@example.cl',
      SMTP_PASSWORD: 'existing-password',
      SMTP_PASS: 'alias-password',
      PUBLIC_APP_URL: 'https://existing.example.cl',
      FRONTEND_URL: 'https://alias.example.cl',
    });

    expect(env.SMTP_PASSWORD).toBe('existing-password');
    expect(env.publicAppUrl).toBe('https://existing.example.cl');
  });

  it('uses lax non-secure cookies outside production', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'development',
      COOKIE_SECURE: 'true',
      COOKIE_SAME_SITE: 'strict',
    });

    expect(env.cookieSecure).toBe(false);
    expect(env.cookieSameSite).toBe('lax');
    expect(env.webOrigins).toContain('http://localhost:8080');
    expect(env.webOrigins).toContain('http://localhost:3000');
  });

  it('preserves secure cookie settings in production', async () => {
    const { env } = await loadEnv({
      NODE_ENV: 'production',
      COOKIE_SECURE: 'true',
      COOKIE_SAME_SITE: 'none',
    });

    expect(env.cookieSecure).toBe(true);
    expect(env.cookieSameSite).toBe('none');
  });
});
