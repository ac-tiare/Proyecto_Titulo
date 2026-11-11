import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findByUserId: vi.fn(),
  save: vi.fn(),
}));

vi.mock('../src/repositories/notification-preference.repository.js', () => ({
  notificationPreferenceRepository: {
    findByUserId: mocks.findByUserId,
    save: mocks.save,
  },
}));

import { notificationPreferenceService } from '../src/services/notification-preference.service.js';

describe('notificationPreferenceService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns disabled defaults when no preference has been saved', async () => {
    mocks.findByUserId.mockResolvedValue(null);

    await expect(
      notificationPreferenceService.get('owner-id'),
    ).resolves.toEqual({
      preferences: {
        emotionalCheckIns: false,
        preventiveWellbeing: false,
        safetyPlanUpdates: false,
      },
      persisted: false,
    });
    expect(mocks.findByUserId).toHaveBeenCalledWith('owner-id');
  });

  it('returns only preference fields and marks persisted updates', async () => {
    const updatedAt = new Date();
    mocks.save.mockResolvedValue({
      userId: 'owner-id',
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: true,
      updatedAt,
    });

    const response = await notificationPreferenceService.save('owner-id', {
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: true,
    });
    expect(response).toEqual({
      preferences: {
        emotionalCheckIns: true,
        preventiveWellbeing: false,
        safetyPlanUpdates: true,
      },
      persisted: true,
    });
    expect(response.preferences).not.toHaveProperty('userId');
    expect(response.preferences).not.toHaveProperty('updatedAt');
  });
});
