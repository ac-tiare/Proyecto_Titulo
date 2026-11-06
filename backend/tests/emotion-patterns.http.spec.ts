import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  patterns: vi.fn(),
}));

vi.mock('../src/services/auth.service.js', () => ({
  authService: { authenticate: mocks.authenticate },
}));

vi.mock('../src/services/emotion.service.js', () => ({
  emotionService: { patterns: mocks.patterns },
}));

import { app } from '../src/app.js';

describe('emotional patterns HTTP endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({
      user: {
        id: 'owner-user',
        name: 'Alex',
        surname: null,
        email: 'alex@example.cl',
      },
      sessionId: 'owner-session',
      client: 'NATIVE',
    });
    mocks.patterns.mockImplementation(async (_userId: string, period: string) => ({
      period,
      recordCount: 0,
      moodCounts: {},
      emotionCounts: {},
      buckets: [],
      hasTemporalComparison: false,
    }));
  });

  it('requires authentication and scopes the request to its session user', async () => {
    const unauthenticated = await request(app).get('/api/emociones/patrones');
    expect(unauthenticated.status).toBe(401);
    expect(mocks.patterns).not.toHaveBeenCalled();

    const response = await request(app)
      .get('/api/emociones/patrones?period=week')
      .set('Authorization', 'Bearer valid-access-token');

    expect(response.status).toBe(200);
    expect(response.body.data.period).toBe('week');
    expect(mocks.patterns).toHaveBeenCalledWith('owner-user', 'week');
  });

  it('rejects unsupported periods before querying the service', async () => {
    const response = await request(app)
      .get('/api/emociones/patrones?period=all')
      .set('Authorization', 'Bearer valid-access-token');

    expect(response.status).toBe(400);
    expect(mocks.patterns).not.toHaveBeenCalled();
  });
});
