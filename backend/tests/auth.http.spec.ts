import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  refresh: vi.fn(),
  authenticate: vi.fn(),
  logout: vi.fn(),
  updateProfile: vi.fn(),
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
        password: 'a-strong-password',
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

  it('rejects web mutations without CSRF proof and does not call refresh', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', 'http://localhost:8080')
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_REJECTED');
    expect(mocks.refresh).not.toHaveBeenCalled();
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
