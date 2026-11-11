import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
}));

vi.mock('../src/services/resource.service.js', () => ({
  resourceService: { list: mocks.list, get: mocks.get },
}));

import { app } from '../src/app.js';

describe('resource catalog endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.list.mockResolvedValue([
      {
        id: 'respiracion',
        title: 'Haz una pausa',
        summary: 'Un ejercicio breve.',
        category: 'bienestar-emocional',
        imageUrl: null,
        createdAt: '2026-11-10T00:00:00.000Z',
      },
    ]);
    mocks.get.mockResolvedValue({
      id: 'respiracion',
      title: 'Haz una pausa',
      summary: 'Un ejercicio breve.',
      content: ['Respira a tu ritmo.'],
      links: [],
      category: 'bienestar-emocional',
      imageUrl: null,
      createdAt: '2026-11-10T00:00:00.000Z',
    });
  });

  it('lists resources and passes a validated category filter', async () => {
    const all = await request(app).get('/api/resources');
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(1);
    expect(mocks.list).toHaveBeenLastCalledWith(undefined);

    const filtered = await request(app).get(
      '/api/resources?category=autocuidado',
    );
    expect(filtered.status).toBe(200);
    expect(mocks.list).toHaveBeenLastCalledWith('autocuidado');
  });

  it('rejects invalid filters and returns complete details', async () => {
    const invalid = await request(app).get(
      '/api/resources?category=not-a-category',
    );
    expect(invalid.status).toBe(400);
    expect(mocks.list).not.toHaveBeenCalled();

    const detail = await request(app).get('/api/resources/respiracion');
    expect(detail.status).toBe(200);
    expect(detail.body.data.content).toEqual(['Respira a tu ritmo.']);
    expect(mocks.get).toHaveBeenCalledWith('respiracion');
  });

  it('returns not found for an unknown resource', async () => {
    const { AppError } = await import('../src/utils/app-error.js');
    mocks.get.mockRejectedValue(
      new AppError(404, 'NOT_FOUND', 'No se encontró el recurso.'),
    );

    const response = await request(app).get('/api/resources/no-existe');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
