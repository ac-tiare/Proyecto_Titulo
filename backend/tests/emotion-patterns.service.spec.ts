import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  listPatternRecords: vi.fn(),
}));

vi.mock('../src/repositories/emotion.repository.js', () => ({
  emotionRepository: {
    listPatternRecords: mocks.listPatternRecords,
  },
}));

import { emotionService } from '../src/services/emotion.service.js';

describe('emotional pattern summaries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-28T12:00:00.000Z'));
    mocks.listPatternRecords.mockResolvedValue([]);
  });

  it('counts only the authenticated user records and groups them by period', async () => {
    mocks.listPatternRecords.mockResolvedValue([
      {
        mood: 'BAD',
        recordedAt: new Date('2026-10-27T12:00:00.000Z'),
        emotions: [{ emotion: 'ANXIETY' }, { emotion: 'SADNESS' }],
      },
      {
        mood: 'NEUTRAL',
        recordedAt: new Date('2026-10-28T12:00:00.000Z'),
        emotions: [{ emotion: 'ANXIETY' }],
      },
    ]);

    const result = await emotionService.patterns('owner-user', 'month');

    expect(mocks.listPatternRecords).toHaveBeenCalledWith(
      'owner-user',
      new Date(2026, 9, 1, 0, 0, 0, 0),
    );
    expect(result).toMatchObject({
      period: 'month',
      recordCount: 2,
      moodCounts: { mal: 1, 'mas-o-menos': 1 },
      emotionCounts: { ansiedad: 2, tristeza: 1 },
      hasTemporalComparison: true,
    });
    expect(result.buckets.reduce((sum, bucket) => sum + bucket.recordCount, 0))
      .toBe(2);
    expect(result).not.toHaveProperty('notes');
    expect(JSON.stringify(result)).not.toContain('note');
  });

  it('reports insufficient comparison data without making conclusions', async () => {
    mocks.listPatternRecords.mockResolvedValue([
      {
        mood: 'GOOD',
        recordedAt: new Date('2026-10-28T12:00:00.000Z'),
        emotions: [{ emotion: 'CALM' }],
      },
    ]);

    const result = await emotionService.patterns('owner-user', 'week');

    expect(result.recordCount).toBe(1);
    expect(result.hasTemporalComparison).toBe(false);
    expect(result.buckets).toHaveLength(1);
  });

  it('returns zeroed categories when there are no records', async () => {
    const result = await emotionService.patterns('owner-user', 'year');

    expect(result.recordCount).toBe(0);
    expect(result.hasTemporalComparison).toBe(false);
    expect(Object.values(result.moodCounts).every((count) => count === 0)).toBe(true);
    expect(Object.values(result.emotionCounts).every((count) => count === 0)).toBe(true);
    expect(result.buckets).toEqual([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });
});
