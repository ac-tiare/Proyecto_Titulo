import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
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

import { app } from '../src/app.js';
import { AppError } from '../src/utils/app-error.js';

describe('authentication rate limiting', () => {
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
});
