import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((email) => email.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres.')
  .max(128, 'La contraseña no puede superar 128 caracteres.')
  .regex(/\d/, 'La contraseña debe incluir al menos un número.');

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  surname: z.string().trim().max(100).optional(),
  email: emailSchema,
  password: passwordSchema,
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

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32).max(128),
  newPassword: passwordSchema,
});
