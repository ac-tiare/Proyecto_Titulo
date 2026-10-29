import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  exportAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('../src/services/auth.service.js', () => ({
  authService: { authenticate: mocks.authenticate },
}));

vi.mock('../src/services/personal-data.service.js', () => ({
  personalDataService: {
    exportAccount: mocks.exportAccount,
    deleteAccount: mocks.deleteAccount,
  },
}));

import { app } from '../src/app.js';

describe('personal data privacy endpoints', () => {
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
    mocks.exportAccount.mockResolvedValue({
      exportedAt: '2026-10-28T00:00:00.000Z',
      profile: { id: 'owner-user', email: 'alex@example.cl' },
      emotionalRecords: [],
      safetyPlan: null,
      trustedContacts: [],
    });
    mocks.deleteAccount.mockResolvedValue(undefined);
  });

  it('exports only the authenticated account with private no-cache headers', async () => {
    const unauthenticated = await request(app).get('/api/privacy/export');
    expect(unauthenticated.status).toBe(401);
    expect(mocks.exportAccount).not.toHaveBeenCalled();

    const response = await request(app)
      .get('/api/privacy/export')
      .set('Authorization', 'Bearer valid-access-token');

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(response.headers['content-disposition']).toContain(
      'attachment; filename="contigo-datos-',
    );
    expect(response.body.data.profile.id).toBe('owner-user');
    expect(mocks.exportAccount).toHaveBeenCalledWith('owner-user');
  });

  it('requires explicit deletion confirmation and clears web session cookies', async () => {
    const unauthenticated = await request(app)
      .delete('/api/privacy/account')
      .set('Origin', 'capacitor://localhost')
      .set('X-Contigo-Client', 'native')
      .send({ confirmation: 'ELIMINAR MI CUENTA' });

    expect(unauthenticated.status).toBe(401);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();

    const rejected = await request(app)
      .delete('/api/privacy/account')
      .set('Origin', 'http://localhost:8080')
      .set('Cookie', 'contigo_access=valid-access-token; XSRF-TOKEN=csrf-proof')
      .set('X-XSRF-TOKEN', 'csrf-proof')
      .send({ confirmation: 'yes' });

    expect(rejected.status).toBe(400);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();

    const response = await request(app)
      .delete('/api/privacy/account')
      .set('Origin', 'http://localhost:8080')
      .set('Cookie', 'contigo_access=valid-access-token; XSRF-TOKEN=csrf-proof')
      .set('X-XSRF-TOKEN', 'csrf-proof')
      .send({ confirmation: 'ELIMINAR MI CUENTA' });

    expect(response.status).toBe(204);
    expect(mocks.deleteAccount).toHaveBeenCalledWith('owner-user');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('contigo_access=;'),
        expect.stringContaining('contigo_refresh=;'),
        expect.stringContaining('XSRF-TOKEN=;'),
      ]),
    );
  });
});
