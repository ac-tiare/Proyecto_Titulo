import { notificationPreferenceRepository } from '../repositories/notification-preference.repository.js';

export interface NotificationPreferences {
  emotionalCheckIns: boolean;
  preventiveWellbeing: boolean;
  safetyPlanUpdates: boolean;
}

const defaults: NotificationPreferences = {
  emotionalCheckIns: false,
  preventiveWellbeing: false,
  safetyPlanUpdates: false,
};

const toResponse = (
  preferences: NotificationPreferences | null,
  persisted: boolean,
) => {
  const values = preferences ?? defaults;
  return {
    preferences: {
      emotionalCheckIns: values.emotionalCheckIns,
      preventiveWellbeing: values.preventiveWellbeing,
      safetyPlanUpdates: values.safetyPlanUpdates,
    },
    persisted,
  };
};

export const notificationPreferenceService = {
  async get(userId: string) {
    const preferences =
      await notificationPreferenceRepository.findByUserId(userId);
    return toResponse(preferences, preferences !== null);
  },

  async save(userId: string, preferences: NotificationPreferences) {
    const saved = await notificationPreferenceRepository.save(
      userId,
      preferences,
    );
    return toResponse(saved, true);
  },
};
