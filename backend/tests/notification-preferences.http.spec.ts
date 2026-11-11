import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  get: vi.fn(),
  save: vi.fn(),
}));

vi.mock('../src/services/auth.service.js', () => ({
  authService: { authenticate: mocks.authenticate },
}));

vi.mock('../src/services/notification-preference.service.js', () => ({
  notificationPreferenceService: {
    get: mocks.get,
    save: mocks.save,
  },
}));

import { app } from '../src/app.js';

describe('notification preferences endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockImplementation(async (token: string) => ({
      user: {
        id: token === 'other-token' ? 'other-user' : 'owner-user',
        name: 'Alex',
        surname: null,
        email: 'alex@example.cl',
      },
      sessionId: 'session-id',
      client: 'NATIVE',
    }));
    mocks.get.mockResolvedValue({
      preferences: {
        emotionalCheckIns: false,
        preventiveWellbeing: false,
        safetyPlanUpdates: false,
      },
      persisted: false,
    });
    mocks.save.mockImplementation(async (userId, preferences) => ({
      preferences,
      persisted: true,
      userId,
    }));
  });

  it('requires authentication and returns defaults for the session owner', async () => {
    const unauthenticated = await request(app).get('/api/users/preferences');
    expect(unauthenticated.status).toBe(401);
    expect(mocks.get).not.toHaveBeenCalled();

    const response = await request(app)
      .get('/api/users/preferences')
      .set('Authorization', 'Bearer owner-token');
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      preferences: {
        emotionalCheckIns: false,
        preventiveWellbeing: false,
        safetyPlanUpdates: false,
      },
      persisted: false,
    });
    expect(mocks.get).toHaveBeenCalledWith('owner-user');
  });

  it('saves only a complete boolean preference set for the authenticated user', async () => {
    const preferences = {
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: true,
    };
    const response = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', 'Bearer other-token')
      .send(preferences);

    expect(response.status).toBe(200);
    expect(mocks.save).toHaveBeenCalledWith('other-user', preferences);

    const incomplete = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', 'Bearer owner-token')
      .send({ emotionalCheckIns: true });
    expect(incomplete.status).toBe(400);

    const unknown = await request(app)
      .put('/api/users/preferences')
      .set('Authorization', 'Bearer owner-token')
      .send({ ...preferences, userId: 'other-user' });
    expect(unknown.status).toBe(400);
    expect(mocks.save).toHaveBeenCalledTimes(1);
  });
});
