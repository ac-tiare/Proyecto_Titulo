import { describe, expect, it } from 'vitest';

import {
  forgotPasswordSchema,
  loginSchema,
  passwordSchema,
  registerSchema,
  resetPasswordSchema,
} from '../src/validators/auth.validators.js';
import {
  createEmotionSchema,
  listEmotionsSchema,
} from '../src/validators/emotion.validators.js';
import {
  contactSchema,
  listContactsSchema,
  savePlanSchema,
} from '../src/validators/safety.validators.js';

describe('request validators', () => {
  it('normalizes email and enforces the shared password policy', () => {
    expect(
      registerSchema.parse({
        name: 'Alex',
        email: ' ALEX@Example.CL ',
        password: 'pass-word1',
      }).email,
    ).toBe('alex@example.cl');
    expect(passwordSchema.safeParse('12345678').success).toBe(true);
    expect(passwordSchema.safeParse('short1').success).toBe(false);
    expect(passwordSchema.safeParse('password-without-number').success).toBe(
      false,
    );
    expect(passwordSchema.safeParse(`password1${'a'.repeat(120)}`).success).toBe(
      false,
    );
    expect(
      registerSchema.safeParse({
        name: 'Alex',
        email: 'alex@example.cl',
        password: 'password-without-number',
      }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
  });

  it('validates password recovery input with the registration password policy', () => {
    expect(
      forgotPasswordSchema.parse({ email: ' PERSON@example.cl ' }).email,
    ).toBe('person@example.cl');
    expect(forgotPasswordSchema.safeParse({ email: 'invalid' }).success).toBe(
      false,
    );
    expect(
      resetPasswordSchema.safeParse({
        token: 'a-valid-looking-reset-token-with-more-than-32-characters',
        newPassword: 'a-new-valid-password1',
      }).success,
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        token: 'too-short',
        newPassword: 'short',
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        token: 'a-valid-looking-reset-token-with-more-than-32-characters',
        newPassword: 'password-without-number',
      }).success,
    ).toBe(false);
  });

  it('requires emotions and validates the optional Other detail', () => {
    expect(
      createEmotionSchema.safeParse({
        moodId: 'mal',
        emotionIds: [],
        note: '',
        otherEmotion: '',
      }).success,
    ).toBe(false);
    expect(
      createEmotionSchema.safeParse({
        moodId: 'bien',
        emotionIds: ['otra'],
        note: '',
        otherEmotion: '',
      }).success,
    ).toBe(false);
    expect(
      createEmotionSchema.safeParse({
        moodId: 'bien',
        emotionIds: ['calma'],
        note: '',
        otherEmotion: '',
      }).success,
    ).toBe(true);
    expect(
      createEmotionSchema.safeParse({
        moodId: 'bien',
        emotionIds: ['calma', 'calma'],
        note: '',
        otherEmotion: '',
      }).success,
    ).toBe(false);
  });

  it('limits safety-plan and trusted-contact data', () => {
    expect(
      savePlanSchema.safeParse({
        warningSigns: ['Una señal'],
        copingActions: [],
        safePlaces: [],
      }).success,
    ).toBe(true);
    expect(
      contactSchema.safeParse({ name: 'Alex', phone: '+56912345678' }).success,
    ).toBe(true);
    expect(
      contactSchema.safeParse({ name: 'Alex', phone: 'texto' }).success,
    ).toBe(false);
    expect(listEmotionsSchema.safeParse({ page: 1, pageSize: 101 }).success).toBe(
      false,
    );
    expect(listContactsSchema.safeParse({ page: 0 }).success).toBe(false);
  });
});
