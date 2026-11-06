import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createPasswordRecoveryService } from '../src/services/password-recovery.service.js';
import { hashSessionToken } from '../src/utils/session-token.js';

const now = new Date('2026-11-05T12:00:00.000Z');
const account = { id: 'user-1', email: 'person@example.cl' };

const createDependencies = () => ({
  repository: {
    findAccountByEmail: vi.fn(),
    issue: vi.fn(),
    findValidToken: vi.fn(),
    complete: vi.fn(),
  },
  mailer: {
    isConfigured: vi.fn().mockReturnValue(true),
    send: vi.fn(),
  },
  hashPassword: vi.fn().mockResolvedValue('argon2id-password-hash'),
  reportMailFailure: vi.fn(),
  now: () => new Date(now),
});

describe('password recovery service', () => {
  let dependencies: ReturnType<typeof createDependencies>;

  beforeEach(() => {
    dependencies = createDependencies();
  });

  it('creates and emails a hashed token that expires after 15 minutes', async () => {
    dependencies.repository.findAccountByEmail.mockResolvedValue(account);
    dependencies.repository.issue.mockResolvedValue({ id: 'reset-1' });
    const service = createPasswordRecoveryService(dependencies);

    await service.request(account.email);

    const [userId, tokenHash, expiresAt] =
      dependencies.repository.issue.mock.calls[0];
    expect(userId).toBe(account.id);
    expect(tokenHash).not.toBe('');
    expect(tokenHash).toHaveLength(64);
    expect(expiresAt).toEqual(new Date(now.getTime() + 15 * 60 * 1000));
    const [sentEmail, rawToken] = dependencies.mailer.send.mock.calls[0];
    expect(sentEmail).toBe(account.email);
    expect(rawToken).not.toBe(tokenHash);
    expect(hashSessionToken(rawToken)).toBe(tokenHash);
  });

  it('does not disclose or send mail for an unknown account', async () => {
    dependencies.repository.findAccountByEmail.mockResolvedValue(null);
    const service = createPasswordRecoveryService(dependencies);

    await expect(service.request('unknown@example.cl')).resolves.toBeUndefined();

    expect(dependencies.repository.issue).not.toHaveBeenCalled();
    expect(dependencies.mailer.send).not.toHaveBeenCalled();
  });

  it('rejects requests consistently when the mailer is not configured', async () => {
    dependencies.mailer.isConfigured.mockReturnValue(false);
    const service = createPasswordRecoveryService(dependencies);

    await expect(service.request('unknown@example.cl')).rejects.toMatchObject({
      statusCode: 503,
      code: 'PASSWORD_RECOVERY_UNAVAILABLE',
    });
    expect(dependencies.repository.findAccountByEmail).not.toHaveBeenCalled();
  });

  it('reports SMTP delivery failure without exposing account existence', async () => {
    dependencies.repository.findAccountByEmail.mockResolvedValue(account);
    dependencies.repository.issue.mockResolvedValue({ id: 'reset-1' });
    dependencies.mailer.send.mockRejectedValue(new Error('SMTP failure'));
    const service = createPasswordRecoveryService(dependencies);

    await expect(service.request(account.email)).resolves.toBeUndefined();

    expect(dependencies.reportMailFailure).toHaveBeenCalledOnce();
  });

  it('updates the password through the repository for a valid token', async () => {
    dependencies.repository.findValidToken.mockResolvedValue({
      id: 'reset-1',
      userId: account.id,
    });
    dependencies.repository.complete.mockResolvedValue(true);
    const service = createPasswordRecoveryService(dependencies);

    await expect(
      service.reset('valid-reset-token', 'new-valid-password'),
    ).resolves.toBeUndefined();

    expect(dependencies.hashPassword).toHaveBeenCalledWith(
      'new-valid-password',
    );
    expect(dependencies.repository.findValidToken).toHaveBeenCalledWith(
      hashSessionToken('valid-reset-token'),
      now,
    );
    expect(dependencies.repository.complete).toHaveBeenCalledWith(
      'reset-1',
      account.id,
      'argon2id-password-hash',
      now,
    );
  });

  it.each(['invalid', 'expired', 'used'])(
    'rejects a %s token without hashing a password',
    async () => {
      dependencies.repository.findValidToken.mockResolvedValue(null);
      const service = createPasswordRecoveryService(dependencies);

      await expect(
        service.reset('invalid-reset-token', 'new-valid-password'),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'INVALID_OR_EXPIRED_RESET_TOKEN',
      });

      expect(dependencies.hashPassword).not.toHaveBeenCalled();
      expect(dependencies.repository.complete).not.toHaveBeenCalled();
    },
  );

  it('rejects a concurrently consumed token', async () => {
    dependencies.repository.findValidToken.mockResolvedValue({
      id: 'reset-1',
      userId: account.id,
    });
    dependencies.repository.complete.mockResolvedValue(false);
    const service = createPasswordRecoveryService(dependencies);

    await expect(
      service.reset('valid-reset-token', 'new-valid-password'),
    ).rejects.toMatchObject({
      code: 'INVALID_OR_EXPIRED_RESET_TOKEN',
    });
  });

  it('does not report success when the transactional update fails', async () => {
    dependencies.repository.findValidToken.mockResolvedValue({
      id: 'reset-1',
      userId: account.id,
    });
    dependencies.repository.complete.mockRejectedValue(
      new Error('transaction failed'),
    );
    const service = createPasswordRecoveryService(dependencies);

    await expect(
      service.reset('valid-reset-token', 'new-valid-password'),
    ).rejects.toThrow('transaction failed');
  });
});
