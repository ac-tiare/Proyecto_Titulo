import { z } from 'zod';
export const moodValues = [
    'muy-bien',
    'bien',
    'mas-o-menos',
    'mal',
    'muy-mal',
];
export const emotionValues = [
    'tristeza',
    'ansiedad',
    'miedo',
    'enojo',
    'soledad',
    'calma',
    'esperanza',
    'otra',
];
export const createEmotionSchema = z
    .object({
    moodId: z.enum(moodValues),
    emotionIds: z.array(z.enum(emotionValues)).min(1).max(emotionValues.length),
    note: z.string().max(500).default(''),
    otherEmotion: z.string().max(500).default(''),
    dateTimestamp: z.coerce.number().int().positive().optional(),
})
    .superRefine((entry, context) => {
    if (new Set(entry.emotionIds).size !== entry.emotionIds.length) {
        context.addIssue({
            code: 'custom',
            path: ['emotionIds'],
            message: 'No repitas una emoción en el mismo registro.',
        });
    }
    if (entry.emotionIds.includes('otra') && !entry.otherEmotion.trim()) {
        context.addIssue({
            code: 'custom',
            path: ['otherEmotion'],
            message: 'Describe la otra emoción seleccionada.',
        });
    }
    if (!entry.emotionIds.includes('otra') && entry.otherEmotion.trim()) {
        context.addIssue({
            code: 'custom',
            path: ['otherEmotion'],
            message: 'El detalle solo se admite cuando se selecciona Otra.',
        });
    }
});
export const listEmotionsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    period: z.enum(['week', 'month', 'year']).optional(),
});
export const emotionPatternsSchema = z.object({
    period: z.enum(['week', 'month', 'year']).default('month'),
});
