import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('../src/config/prisma.js', () => ({
  prisma: {
    emotionalRecord: {
      findMany: mocks.findMany,
    },
  },
}));

import { emotionRepository } from '../src/repositories/emotion.repository.js';

describe('recent distress pattern records', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.findMany.mockResolvedValue([]);
  });

  it('filters by owner, seven-day bounds, and the two lowest mood levels', async () => {
    const from = new Date('2026-10-21T12:00:00.000Z');
    const to = new Date('2026-10-28T12:00:00.000Z');

    await emotionRepository.listPreventionInvitationRecords(
      'owner-user',
      from,
      to,
    );

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'owner-user',
        recordedAt: { gte: from, lte: to },
        mood: { in: ['BAD', 'VERY_BAD'] },
      },
      select: {
        mood: true,
        recordedAt: true,
        emotions: { select: { emotion: true } },
      },
      orderBy: { recordedAt: 'asc' },
    });
  });

  it('returns no records when none qualify', async () => {
    await expect(
      emotionRepository.listPreventionInvitationRecords(
        'owner-user',
        new Date('2026-10-21T12:00:00.000Z'),
        new Date('2026-10-28T12:00:00.000Z'),
      ),
    ).resolves.toEqual([]);
  });
});
