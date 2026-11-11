import type { Request, Response } from 'express';

import { notificationPreferenceService } from '../services/notification-preference.service.js';
import { AppError } from '../utils/app-error.js';
import { notificationPreferencesSchema } from '../validators/notification-preference.validators.js';

const authenticatedUserId = (request: Request): string => {
  const userId = request.auth?.user.id;
  if (!userId) {
    throw new AppError(401, 'UNAUTHENTICATED', 'Inicia sesión para continuar.');
  }
  return userId;
};

export const getNotificationPreferences = async (
  request: Request,
  response: Response,
): Promise<void> => {
  response.json({
    data: await notificationPreferenceService.get(authenticatedUserId(request)),
  });
};

export const saveNotificationPreferences = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const preferences = notificationPreferencesSchema.parse(request.body);
  response.json({
    data: await notificationPreferenceService.save(
      authenticatedUserId(request),
      preferences,
    ),
  });
};
