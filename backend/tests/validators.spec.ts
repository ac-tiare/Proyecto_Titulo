import { describe, expect, it } from 'vitest';

import { loginSchema, registerSchema } from '../src/validators/auth.validators.js';
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
  it('normalizes email and enforces a strong registration password', () => {
    expect(
      registerSchema.parse({
        name: 'Alex',
        email: ' ALEX@Example.CL ',
        password: 'a-strong-password',
      }).email,
    ).toBe('alex@example.cl');
    expect(
      registerSchema.safeParse({
        name: 'Alex',
        email: 'alex@example.cl',
        password: 'short',
      }).success,
    ).toBe(false);
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
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
