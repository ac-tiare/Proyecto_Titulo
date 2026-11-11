import { prisma } from '../config/prisma.js';

export interface NotificationPreferenceInput {
  emotionalCheckIns: boolean;
  preventiveWellbeing: boolean;
  safetyPlanUpdates: boolean;
}

export const notificationPreferenceRepository = {
  findByUserId(userId: string) {
    return prisma.userNotificationPreference.findUnique({ where: { userId } });
  },

  save(userId: string, preferences: NotificationPreferenceInput) {
    return prisma.userNotificationPreference.upsert({
      where: { userId },
      create: { userId, ...preferences },
      update: preferences,
    });
  },
};
