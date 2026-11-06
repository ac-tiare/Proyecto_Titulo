import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  reset: vi.fn(),
}));

vi.mock('../src/services/password-recovery.service.js', () => ({
  passwordRecoveryService: {
    request: mocks.request,
    reset: mocks.reset,
  },
}));

import { app } from '../src/app.js';
import { AppError } from '../src/utils/app-error.js';

const post = (path: string) =>
  request(app)
    .post(path)
    .set('Origin', 'http://localhost:8080')
    .set('Cookie', 'XSRF-TOKEN=csrf-test-token')
    .set('X-XSRF-TOKEN', 'csrf-test-token');

describe('password recovery HTTP endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.request.mockResolvedValue(undefined);
    mocks.reset.mockResolvedValue(undefined);
  });

  it('returns the same generic response for registered and unknown email addresses', async () => {
    const registered = await post('/api/auth/forgot-password').send({
      email: 'person@example.cl',
    });
    const unknown = await post('/api/auth/forgot-password').send({
      email: 'unknown@example.cl',
    });

    expect(registered.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(registered.body).toEqual(unknown.body);
    expect(registered.body.data.message).toContain(
      'Si el correo está asociado a una cuenta',
    );
    expect(JSON.stringify(registered.body)).not.toContain('person@example.cl');
    expect(mocks.request).toHaveBeenNthCalledWith(1, 'person@example.cl');
    expect(mocks.request).toHaveBeenNthCalledWith(2, 'unknown@example.cl');
  });

  it('rejects malformed email input without invoking the recovery service', async () => {
    const response = await post('/api/auth/forgot-password').send({
      email: 'not-an-email',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mocks.request).not.toHaveBeenCalled();
  });

  it('updates the password without returning the submitted token', async () => {
    const response = await post('/api/auth/reset-password').send({
      token: 'opaque-reset-token-with-sufficient-length-123456',
      newPassword: 'a-new-valid-password1',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.message).toContain('contraseña fue actualizada');
    expect(JSON.stringify(response.body)).not.toContain(
      'opaque-reset-token-with-sufficient-length-123456',
    );
    expect(mocks.reset).toHaveBeenCalledWith(
      'opaque-reset-token-with-sufficient-length-123456',
      'a-new-valid-password1',
    );
  });

  it('returns an actionable error for an expired or invalid reset token', async () => {
    mocks.reset.mockRejectedValue(
      new AppError(
        400,
        'INVALID_OR_EXPIRED_RESET_TOKEN',
        'El enlace no es válido o venció. Solicita uno nuevo.',
      ),
    );

    const response = await post('/api/auth/reset-password').send({
      token: 'opaque-reset-token-with-sufficient-length-123456',
      newPassword: 'a-new-valid-password1',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_OR_EXPIRED_RESET_TOKEN');
    expect(JSON.stringify(response.body)).not.toContain(
      'opaque-reset-token-with-sufficient-length-123456',
    );
  });

  it('does not consume a reset token when the new password is invalid', async () => {
    const response = await post('/api/auth/reset-password').send({
      token: 'opaque-reset-token-with-sufficient-length-123456',
      newPassword: 'short',
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mocks.reset).not.toHaveBeenCalled();
  });
});
