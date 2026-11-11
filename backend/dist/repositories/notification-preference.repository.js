import { prisma } from '../config/prisma.js';
export const notificationPreferenceRepository = {
    findByUserId(userId) {
        return prisma.userNotificationPreference.findUnique({ where: { userId } });
    },
    save(userId, preferences) {
        return prisma.userNotificationPreference.upsert({
            where: { userId },
            create: { userId, ...preferences },
            update: preferences,
        });
    },
};
