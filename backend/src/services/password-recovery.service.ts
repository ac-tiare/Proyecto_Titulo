import { randomBytes } from 'node:crypto';

import argon2 from 'argon2';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { passwordResetRepository } from '../repositories/password-reset.repository.js';
import { createPasswordResetMailer } from './password-reset-mailer.js';
import { AppError } from '../utils/app-error.js';
import { hashSessionToken } from '../utils/session-token.js';

const TOKEN_TTL_MS = 15 * 60 * 1000;

const mailer = createPasswordResetMailer({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  user: env.SMTP_USER,
  password: env.SMTP_PASSWORD,
  from: env.SMTP_FROM,
  publicAppUrl: env.publicAppUrl,
});

type RecoveryRepository = typeof passwordResetRepository;
type RecoveryMailer = Pick<typeof mailer, 'isConfigured' | 'send'>;

export const createPasswordRecoveryService = (dependencies: {
  repository?: RecoveryRepository;
  mailer?: RecoveryMailer;
  now?: () => Date;
  hashPassword?: (password: string) => Promise<string>;
  reportMailFailure?: () => void;
} = {}) => {
  const repository = dependencies.repository ?? passwordResetRepository;
  const emailService = dependencies.mailer ?? mailer;
  const now = dependencies.now ?? (() => new Date());
  const hashPassword =
    dependencies.hashPassword ??
    ((password: string) =>
      argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19_456,
        timeCost: 2,
        parallelism: 1,
        salt: randomBytes(16),
      }));
  const reportMailFailure =
    dependencies.reportMailFailure ??
    (() =>
      logger.error(
        { code: 'PASSWORD_RECOVERY_EMAIL_DELIVERY_FAILED' },
        'Password recovery email delivery failed',
      ));

  return {
    async request(email: string): Promise<void> {
      if (!emailService.isConfigured()) {
        throw new AppError(
          503,
          'PASSWORD_RECOVERY_UNAVAILABLE',
          'La recuperación por correo no está disponible en este momento.',
        );
      }

      const account = await repository.findAccountByEmail(email);
      if (!account) return;

      const token = randomBytes(32).toString('base64url');
      const requestedAt = now();
      await repository.issue(
        account.id,
        hashSessionToken(token),
        new Date(requestedAt.getTime() + TOKEN_TTL_MS),
      );

      try {
        await emailService.send(account.email, token);
      } catch {
        reportMailFailure();
      }
    },

    async reset(token: string, newPassword: string): Promise<void> {
      const currentTime = now();
      const resetToken = await repository.findValidToken(
        hashSessionToken(token),
        currentTime,
      );
      if (!resetToken) {
        throw new AppError(
          400,
          'INVALID_OR_EXPIRED_RESET_TOKEN',
          'El enlace no es válido o venció. Solicita uno nuevo.',
        );
      }

      const passwordHash = await hashPassword(newPassword);
      const completed = await repository.complete(
        resetToken.id,
        resetToken.userId,
        passwordHash,
        currentTime,
      );
      if (!completed) {
        throw new AppError(
          400,
          'INVALID_OR_EXPIRED_RESET_TOKEN',
          'El enlace no es válido o venció. Solicita uno nuevo.',
        );
      }
    },
  };
};

export const passwordRecoveryService = createPasswordRecoveryService();
