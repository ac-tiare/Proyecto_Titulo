import { z } from 'zod';
const emailSchema = z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((email) => email.toLowerCase());
export const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    surname: z.string().trim().max(100).optional(),
    email: emailSchema,
    password: z.string().min(12).max(128),
});
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1).max(128),
});
export const refreshSchema = z.object({
    refreshToken: z.string().min(32).max(128),
});
export const updateProfileSchema = z.object({
    name: z.string().trim().min(1).max(100),
    surname: z.string().trim().max(100).nullable().optional(),
    email: emailSchema,
});
