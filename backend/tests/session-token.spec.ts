import { describe, expect, it } from 'vitest';

import {
  createCsrfToken,
  createSessionToken,
  hashSessionToken,
} from '../src/utils/session-token.js';

describe('session token utilities', () => {
  it('creates high-entropy URL-safe session tokens and stores only deterministic hashes', () => {
    const first = createSessionToken();
    const second = createSessionToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
    expect(hashSessionToken(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(hashSessionToken(first)).toBe(hashSessionToken(first));
    expect(hashSessionToken(first)).not.toBe(first);
  });

  it('creates distinct CSRF tokens', () => {
    expect(createCsrfToken()).not.toBe(createCsrfToken());
  });
});
