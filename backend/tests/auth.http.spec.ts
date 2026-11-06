import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
  authenticate: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
  requestPasswordRecovery: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock('../src/services/auth.service.js', () => ({
  authService: {
    login: mocks.login,
    register: mocks.register,
    refresh: mocks.refresh,
    authenticate: mocks.authenticate,
    logout: mocks.logout,
    updateProfile: mocks.updateProfile,
  },
}));

vi.mock('../src/services/password-recovery.service.js', () => ({
  passwordRecoveryService: {
    request: mocks.requestPasswordRecovery,
    reset: mocks.resetPassword,
  },
}));

import { app } from '../src/app.js';

const authResult = {
  user: {
    id: 'user-1',
    name: 'Alex',
    surname: null,
    email: 'alex@example.cl',
  },
  sessionId: 'session-1',
  accessToken: 'opaque-access-token',
  refreshToken: 'opaque-refresh-token',
  accessExpiresAt: new Date('2026-01-01T00:15:00Z'),
  refreshExpiresAt: new Date('2026-01-15T00:00:00Z'),
  csrfToken: 'csrf-token-from-service',
};

describe('web and native authentication transport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.register.mockResolvedValue(authResult);
    mocks.login.mockResolvedValue(authResult);
    mocks.refresh.mockResolvedValue(authResult);
    mocks.requestPasswordRecovery.mockResolvedValue(undefined);
    mocks.resetPassword.mockResolvedValue(undefined);
  });

  it('sets HttpOnly session cookies and omits credentials from web JSON', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'http://localhost:8080')
      .set('Cookie', 'XSRF-TOKEN=csrf-token-from-service')
      .set('X-XSRF-TOKEN', 'csrf-token-from-service')
      .send({
        name: 'Alex',
        email: 'alex@example.cl',
        password: 'a-strong-password1',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).not.toHaveProperty('accessToken');
    expect(response.body.data).not.toHaveProperty('refreshToken');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('contigo_access=opaque-access-token;'),
        expect.stringContaining('contigo_refresh=opaque-refresh-token;'),
        expect.stringContaining('HttpOnly'),
      ]),
    );
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('contigo_access=opaque-access-token;'),
        expect.stringContaining('contigo_refresh=opaque-refresh-token;'),
      ]),
    );
  });

  it.each([
    ['/register', { name: 'Alex', email: 'alex@example.cl', password: 'a-strong-password1' }],
    ['/login', { email: 'alex@example.cl', password: 'a-strong-password1' }],
  ])('allows local web %s after obtaining a CSRF token', async (path, body) => {
    const client = request.agent(app);
    const csrfResponse = await client
      .get('/api/auth/csrf')
      .set('Origin', 'http://localhost:8080');
    const csrfToken = csrfResponse.body.data.csrfToken as string;

    expect(csrfResponse.status).toBe(200);
    expect(csrfResponse.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('XSRF-TOKEN=')]),
    );

    const response = await client
      .post(`/api/auth${path}`)
      .set('Origin', 'http://localhost:8080')
      .set('X-XSRF-TOKEN', csrfToken)
      .send(body);

    expect(response.status).toBe(path === '/register' ? 201 : 200);
    expect(
      path === '/register' ? mocks.register : mocks.login,
    ).toHaveBeenCalledOnce();
  });

  it.each([
    ['/register', { name: 'Alex', email: 'alex@example.cl', password: 'a-strong-password1' }, 201],
    ['/login', { email: 'alex@example.cl', password: 'a-strong-password1' }, 200],
    ['/forgot-password', { email: 'alex@example.cl' }, 200],
    ['/reset-password', { token: 'a-valid-test-reset-token-with-more-than-32-chars', newPassword: 'a-strong-password1' }, 200],
  ])('allows public web %s from a trusted origin without a CSRF cookie', async (path, body, expectedStatus) => {
    const response = await request(app)
      .post(`/api/auth${path}`)
      .set('Origin', 'http://localhost:8080')
      .send(body);

    expect(response.status).toBe(expectedStatus);
    expect(response.body.error?.code).not.toBe('CSRF_REJECTED');
  });

  it.each(['http://localhost:8080', 'http://localhost:3000'])(
    'sets a readable local CSRF cookie with credentialed CORS for %s',
    async (origin) => {
      const response = await request(app)
        .get('/api/auth/csrf')
        .set('Origin', origin);
      const setCookie = response.headers['set-cookie'] as string[];
      const csrfCookie = setCookie.find((cookie) =>
        cookie.startsWith('XSRF-TOKEN='),
      );

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe(origin);
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      expect(csrfCookie).toContain('SameSite=Lax');
      expect(csrfCookie).not.toContain('HttpOnly');
      expect(csrfCookie).not.toContain('Secure');
    },
  );

  it('rejects a mismatched CSRF cookie and header on private mutations', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Origin', 'http://localhost:8080')
      .set('Cookie', 'XSRF-TOKEN=cookie-token')
      .set('X-XSRF-TOKEN', 'different-header-token')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_REJECTED');
    expect(mocks.logout).not.toHaveBeenCalled();
  });

  it('rejects web mutations without CSRF proof and does not call refresh', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', 'http://localhost:8080')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_REJECTED');
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it('rejects public authentication requests that omit Origin', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alex',
        email: 'alex@example.cl',
        password: 'a-strong-password1',
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_REJECTED');
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('rejects disallowed origins as a safe forbidden response, not an internal error', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .set('Origin', 'https://untrusted.example')
      .send({
        name: 'Alex',
        email: 'alex@example.cl',
        password: 'a-strong-password',
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_REJECTED');
    expect(JSON.stringify(response.body)).not.toContain('Origin is not allowed');
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('returns native credentials only to the explicitly identified native client', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', 'capacitor://localhost')
      .set('X-Contigo-Client', 'native')
      .send({ email: 'alex@example.cl', password: 'a-strong-password' });

    expect(response.status).toBe(200);
    expect(response.body.data.accessToken).toBe('opaque-access-token');
    expect(response.body.data.refreshToken).toBe('opaque-refresh-token');
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});
