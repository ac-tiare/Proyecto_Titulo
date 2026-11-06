import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';

import {
  getCsrfToken,
  login,
  logout,
  me,
  refresh,
  register,
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

export const authRoutes = Router();

authRoutes.get('/csrf', getCsrfToken);
authRoutes.post('/register', authRateLimit, register);
authRoutes.post('/login', authRateLimit, login);
authRoutes.post('/refresh', authRateLimit, refresh);
authRoutes.get('/me', requireAuth, me);
authRoutes.patch('/me', requireAuth, updateMe);
authRoutes.post('/logout', requireAuth, logout);
