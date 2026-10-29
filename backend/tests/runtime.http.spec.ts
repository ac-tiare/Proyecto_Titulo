import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock('../src/config/prisma.js', () => ({
  prisma: { $queryRaw: mocks.queryRaw },
}));

import { app } from '../src/app.js';
import { logger } from '../src/config/logger.js';

describe('backend liveness and readiness endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryRaw.mockResolvedValue([]);
  });

  it('reports liveness without depending on PostgreSQL', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok' } });
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness only when PostgreSQL accepts a query', async () => {
    const response = await request(app).get('/api/ready');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ready' } });
    expect(mocks.queryRaw).toHaveBeenCalledOnce();
  });

  it('returns a generic readiness failure and omits connection details from logs', async () => {
    const secretConnectionError =
      'postgresql://test-secret-password@database:5432/contigo';
    mocks.queryRaw.mockRejectedValue(new Error(secretConnectionError));
    const errorLog = vi.spyOn(logger, 'error');

    const response = await request(app).get('/api/ready');

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('INTERNAL_ERROR');
    expect(JSON.stringify(response.body)).not.toContain(secretConnectionError);
    expect(errorLog.mock.calls[0]?.[0]).toMatchObject({ errorName: 'Error' });
    expect(JSON.stringify(errorLog.mock.calls[0]?.[0])).not.toContain(
      secretConnectionError,
    );
    errorLog.mockRestore();
  });
});
