import { notificationPreferenceRepository } from '../repositories/notification-preference.repository.js';
const defaults = {
    emotionalCheckIns: false,
    preventiveWellbeing: false,
    safetyPlanUpdates: false,
};
const toResponse = (preferences, persisted) => {
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
    async get(userId) {
        const preferences = await notificationPreferenceRepository.findByUserId(userId);
        return toResponse(preferences, preferences !== null);
    },
    async save(userId, preferences) {
        const saved = await notificationPreferenceRepository.save(userId, preferences);
        return toResponse(saved, true);
    },
};
