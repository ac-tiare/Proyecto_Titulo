import { Router } from 'express';

import {
  getNotificationPreferences,
  saveNotificationPreferences,
} from '../controllers/notification-preference.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

export const userRoutes = Router();

userRoutes.use(requireAuth);
userRoutes.get('/preferences', getNotificationPreferences);
userRoutes.put('/preferences', saveNotificationPreferences);
