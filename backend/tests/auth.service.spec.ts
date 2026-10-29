import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/utils/app-error.js';
import { hashSessionToken } from '../src/utils/session-token.js';

const mocks = vi.hoisted(() => ({
  hash: vi.fn(),
  verify: vi.fn(),
  createSession: vi.fn(),
  createWithSession: vi.fn(),
  findByEmail: vi.fn(),
  findActiveByAccessTokenHash: vi.fn(),
  rotate: vi.fn(),
  revoke: vi.fn(),
  updatePublic: vi.fn(),
}));

vi.mock('argon2', () => ({
  default: {
    argon2id: 2,
    hash: mocks.hash,
    verify: mocks.verify,
  },
}));

vi.mock('../src/repositories/session.repository.js', () => ({
  sessionRepository: {
    create: mocks.createSession,
    findActiveByAccessTokenHash: mocks.findActiveByAccessTokenHash,
    rotate: mocks.rotate,
    revoke: mocks.revoke,
  },
}));

vi.mock('../src/repositories/user.repository.js', () => ({
  userRepository: {
    createWithSession: mocks.createWithSession,
    findByEmail: mocks.findByEmail,
    updatePublic: mocks.updatePublic,
  },
}));

import { authService } from '../src/services/auth.service.js';

const publicUser = {
  id: 'user-1',
  name: 'Alex',
  surname: null,
  email: 'alex@example.cl',
};

const storedUser = {
  ...publicUser,
  passwordHash: 'stored-password-hash',
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('auth service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.hash.mockResolvedValue('argon2id-password-hash');
    mocks.verify.mockImplementation(
      async (hash: string, password: string) =>
        hash === storedUser.passwordHash && password === 'correct-password',
    );
    mocks.createSession.mockResolvedValue({ id: 'session-1' });
    mocks.createWithSession.mockResolvedValue({
      user: publicUser,
      session: { id: 'session-1' },
    });
    mocks.findByEmail.mockResolvedValue(storedUser);
    mocks.findActiveByAccessTokenHash.mockResolvedValue(null);
    mocks.rotate.mockResolvedValue(null);
    mocks.revoke.mockResolvedValue({ count: 1 });
    mocks.updatePublic.mockResolvedValue(publicUser);
  });

  it('creates a password hash and stores registration plus session atomically', async () => {
    const result = await authService.register(
      {
        name: 'Alex',
        email: 'alex@example.cl',
        password: 'a-strong-password',
      },
      'NATIVE',
    );

    expect(mocks.hash).toHaveBeenCalledWith(
      'a-strong-password',
      expect.objectContaining({ type: 2, memoryCost: 19_456 }),
    );
    expect(mocks.createWithSession).toHaveBeenCalledOnce();
    const [userData, sessionData] = mocks.createWithSession.mock.calls[0];
    expect(userData.passwordHash).toBe('argon2id-password-hash');
    expect(userData.passwordHash).not.toBe('a-strong-password');
    expect(sessionData.accessTokenHash).toBe(hashSessionToken(result.accessToken));
    expect(sessionData.refreshTokenHash).toBe(hashSessionToken(result.refreshToken));
    expect(sessionData.accessExpiresAt.getTime()).toBeLessThan(
      sessionData.refreshExpiresAt.getTime(),
    );
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicate email registrations without creating a session', async () => {
    mocks.createWithSession.mockRejectedValue(
      Object.assign(new Error('unique constraint'), { code: 'P2002' }),
    );

    await expect(
      authService.register(
        {
          name: 'Alex',
          email: 'alex@example.cl',
          password: 'a-strong-password',
        },
        'WEB',
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
  });

  it('creates a session after valid login and rejects incorrect credentials', async () => {
    const result = await authService.login(
      { email: 'alex@example.cl', password: 'correct-password' },
      'WEB',
    );

    expect(result.user).toEqual(publicUser);
    expect(mocks.createSession).toHaveBeenCalledOnce();
    await expect(
      authService.login(
        { email: 'alex@example.cl', password: 'wrong-password' },
        'WEB',
      ),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
    });
  });

  it('rejects expired access credentials and rotates refresh credentials once', async () => {
    const expiredAccess = 'expired-access-token';
    await expect(authService.authenticate(expiredAccess)).rejects.toBeInstanceOf(
      AppError,
    );
    expect(mocks.findActiveByAccessTokenHash).toHaveBeenCalledWith(
      hashSessionToken(expiredAccess),
      expect.any(Date),
    );

    mocks.rotate.mockResolvedValue({
      id: 'session-1',
      userId: publicUser.id,
      client: 'NATIVE',
      user: publicUser,
    });
    const refreshToken = 'current-refresh-token';
    const rotated = await authService.refresh(refreshToken, 'NATIVE');
    expect(mocks.rotate).toHaveBeenCalledWith(
      expect.objectContaining({
        currentRefreshTokenHash: hashSessionToken(refreshToken),
        client: 'NATIVE',
      }),
    );
    expect(rotated.refreshToken).not.toBe(refreshToken);
    expect(rotated.user).toEqual(publicUser);

    mocks.rotate.mockResolvedValue(null);
    await expect(
      authService.refresh(refreshToken, 'NATIVE'),
    ).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('revokes the authenticated session on logout', async () => {
    await authService.logout('session-1', publicUser.id);

    expect(mocks.revoke).toHaveBeenCalledWith(
      'session-1',
      publicUser.id,
      expect.any(Date),
    );
  });

  it('maps profile email conflicts without returning authentication data', async () => {
    mocks.updatePublic.mockRejectedValue(
      Object.assign(new Error('unique constraint'), { code: 'P2002' }),
    );

    await expect(
      authService.updateProfile(publicUser.id, {
        name: publicUser.name,
        email: 'taken@example.cl',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      code: 'EMAIL_ALREADY_REGISTERED',
    });
  });
});
