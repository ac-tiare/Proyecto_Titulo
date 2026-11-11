import { z } from 'zod';
export const deleteAccountSchema = z
    .object({
    confirmation: z.literal('ELIMINAR MI CUENTA'),
})
    .strict();
