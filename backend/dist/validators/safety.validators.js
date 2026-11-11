import { z } from 'zod';
const lineArray = z.array(z.string().trim().min(1).max(500)).max(100);
export const savePlanSchema = z.object({
    warningSigns: lineArray,
    copingActions: lineArray,
    safePlaces: lineArray,
});
export const contactSchema = z.object({
    name: z.string().trim().min(1).max(100),
    phone: z
        .string()
        .trim()
        .regex(/^\+?[0-9]{7,15}$/, 'Ingresa un teléfono válido.'),
    relationship: z.string().trim().max(100).nullable().optional(),
    details: z.string().trim().max(300).nullable().optional(),
});
export const listContactsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
