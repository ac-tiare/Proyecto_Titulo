import { randomUUID } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  passwordRecoveryRequest: vi.fn(),
}));

vi.mock('../src/services/auth.service.js', () => ({
  authService: {
    login: mocks.login,
    register: vi.fn(),
    refresh: vi.fn(),
    authenticate: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('../src/services/password-recovery.service.js', () => ({
  passwordRecoveryService: {
    request: mocks.passwordRecoveryRequest,
    reset: vi.fn(),
  },
}));

import { app } from '../src/app.js';
import { AppError } from '../src/utils/app-error.js';

describe('authentication rate limiting', () => {
  const originalTrustProxy = app.get('trust proxy');

  afterEach(() => {
    app.set('trust proxy', originalTrustProxy);
    vi.clearAllMocks();
  });

  it('limits repeated login attempts from one client', async () => {
    mocks.login.mockRejectedValue(
      new AppError(401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.'),
    );
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 9; attempt += 1) {
      const response = await request(app)
          .post('/api/auth/login')
          .set('Origin', 'http://localhost:8080')
          .set('Cookie', 'XSRF-TOKEN=csrf-test-token')
          .set('X-XSRF-TOKEN', 'csrf-test-token')
          .send({ email: 'alex@example.cl', password: 'wrong-password' });
      statuses.push(response.status);
    }

    expect(statuses.slice(0, 8)).toEqual(Array(8).fill(401));
    expect(statuses[8]).toBe(429);
    expect(mocks.login).toHaveBeenCalledTimes(8);
  });

  it('limits recovery attempts to three per client IP', async () => {
    app.set('trust proxy', 1);
    mocks.passwordRecoveryRequest.mockResolvedValue(undefined);
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', ip)
        .set('Origin', 'http://localhost:8080')
        .set('Cookie', 'XSRF-TOKEN=csrf-test-token')
        .set('X-XSRF-TOKEN', 'csrf-test-token')
        .send({ email: `ip-test-${randomUUID()}@example.cl` });
      statuses.push(response.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(mocks.passwordRecoveryRequest).toHaveBeenCalledTimes(3);
  });

  it('limits recovery attempts to three per normalized email across IPs', async () => {
    app.set('trust proxy', 1);
    mocks.passwordRecoveryRequest.mockResolvedValue(undefined);
    const email = `email-test-${randomUUID()}@example.cl`;
    const statuses: number[] = [];

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', `203.0.113.${attempt + 1}`)
        .set('Origin', 'http://localhost:8080')
        .set('Cookie', 'XSRF-TOKEN=csrf-test-token')
        .set('X-XSRF-TOKEN', 'csrf-test-token')
        .send({ email: attempt === 0 ? email.toUpperCase() : email });
      statuses.push(response.status);
    }

    expect(statuses).toEqual([200, 200, 200, 429]);
    expect(mocks.passwordRecoveryRequest).toHaveBeenCalledTimes(3);
  });
});
