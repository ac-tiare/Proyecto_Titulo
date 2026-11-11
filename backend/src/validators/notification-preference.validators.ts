import { z } from 'zod';

export const notificationPreferencesSchema = z
  .object({
    emotionalCheckIns: z.boolean(),
    preventiveWellbeing: z.boolean(),
    safetyPlanUpdates: z.boolean(),
  })
  .strict();

export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
