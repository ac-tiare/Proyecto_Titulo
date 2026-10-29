import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  exportAccount: vi.fn(),
  deleteAccount: vi.fn(),
}));

vi.mock('../src/repositories/personal-data.repository.js', () => ({
  personalDataRepository: {
    exportAccount: mocks.exportAccount,
    deleteAccount: mocks.deleteAccount,
  },
}));

import { personalDataService } from '../src/services/personal-data.service.js';

describe('personalDataService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('serializes the authenticated account data without credential fields', async () => {
    mocks.exportAccount.mockResolvedValue({
      id: 'owner-user',
      name: 'Alex',
      surname: null,
      email: 'alex@example.cl',
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      passwordHash: 'must-not-be-exported',
      sessions: [{ accessTokenHash: 'must-not-be-exported' }],
      emotions: [
        {
          id: 'record-id',
          mood: 'GOOD',
          note: 'Private note',
          otherEmotion: null,
          recordedAt: new Date('2026-10-28T00:00:00.000Z'),
          createdAt: new Date('2026-10-28T00:00:00.000Z'),
          emotions: [{ emotion: 'CALM' }],
        },
      ],
      safetyPlan: {
        createdAt: new Date('2026-10-01T00:00:00.000Z'),
        updatedAt: new Date('2026-10-28T00:00:00.000Z'),
        items: [{ type: 'WARNING_SIGN', content: 'Private plan item', position: 0 }],
      },
      contacts: [],
    });

    const exported = await personalDataService.exportAccount('owner-user');
    const serialized = JSON.stringify(exported);

    expect(mocks.exportAccount).toHaveBeenCalledWith('owner-user');
    expect(exported.profile.id).toBe('owner-user');
    expect(exported.emotionalRecords).toMatchObject([
      { mood: 'GOOD', emotions: ['CALM'], note: 'Private note' },
    ]);
    expect(exported.safetyPlan?.items[0]?.content).toBe('Private plan item');
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('accessTokenHash');
  });
});
