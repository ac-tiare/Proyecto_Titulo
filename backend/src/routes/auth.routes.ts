import { Router } from 'express';
import { createHmac, randomBytes } from 'node:crypto';
import { rateLimit } from 'express-rate-limit';

import {
  getCsrfToken,
  login,
  logout,
  me,
  refresh,
  register,
  requestPasswordRecovery,
  resetPassword,
  updateMe,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiados intentos. Espera unos minutos antes de volver a intentarlo.',
    },
  },
});

const recoveryRateLimitResponse = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Demasiadas solicitudes. Espera unos minutos antes de volver a intentarlo.',
  },
};

const recoveryIpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: recoveryRateLimitResponse,
});

const recoveryEmailHmacKey = randomBytes(32);
const recoveryEmailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 3,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (request) => {
    const email =
      typeof request.body?.email === 'string'
        ? request.body.email.trim().toLowerCase()
        : '';
    return createHmac('sha256', recoveryEmailHmacKey).update(email).digest('hex');
  },
  message: recoveryRateLimitResponse,
});

const resetPasswordRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Espera unos minutos antes de volver a intentarlo.',
    },
  },
});

const recoveryRateLimits = [
  recoveryIpRateLimit,
  recoveryEmailRateLimit,
];

export const authRoutes = Router();

authRoutes.get('/csrf', getCsrfToken);
authRoutes.post('/register', authRateLimit, register);
authRoutes.post('/login', authRateLimit, login);
authRoutes.post(
  '/forgot-password',
  ...recoveryRateLimits,
  requestPasswordRecovery,
);
authRoutes.post('/reset-password', resetPasswordRateLimit, resetPassword);
authRoutes.post('/refresh', authRateLimit, refresh);
authRoutes.get('/me', requireAuth, me);
authRoutes.patch('/me', requireAuth, updateMe);
authRoutes.post('/logout', requireAuth, logout);
