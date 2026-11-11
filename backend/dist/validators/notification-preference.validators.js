import { z } from 'zod';
export const notificationPreferencesSchema = z
    .object({
    emotionalCheckIns: z.boolean(),
    preventiveWellbeing: z.boolean(),
    safetyPlanUpdates: z.boolean(),
})
    .strict();
