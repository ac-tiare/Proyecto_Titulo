import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  NotificationPreferenceApiService,
  NotificationPreferences,
} from '../api/notification-preference-api.service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesService,
} from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;
  let api: {
    get: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    localStorage.clear();
    api = {
      get: vi.fn(() =>
        of({ preferences: DEFAULT_NOTIFICATION_PREFERENCES, persisted: false }),
      ),
      save: vi.fn((preferences: NotificationPreferences) =>
        of({ preferences, persisted: true }),
      ),
    };
    TestBed.configureTestingModule({
      providers: [
        {
          provide: NotificationPreferenceApiService,
          useValue: api,
        },
      ],
    });
    service = TestBed.inject(NotificationPreferencesService);
  });

  it('keeps preferences isolated per account and synchronizes server state', async () => {
    const firstUserPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      emotionalCheckIns: true,
    };
    api.get.mockReturnValue(
      of({ preferences: firstUserPreferences, persisted: true }),
    );

    await expect(service.synchronize('user-one')).resolves.toMatchObject({
      preferences: firstUserPreferences,
      syncState: 'synced',
    });
    expect(service.load('user-one')).toEqual(firstUserPreferences);
    expect(service.load('user-two')).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('marks offline changes pending and merges only changed categories on recovery', async () => {
    api.save.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );
    const changed = await service.update(
      'user-one',
      'emotionalCheckIns',
      true,
    );
    expect(changed.syncState).toBe('pending');
    expect(service.loadState('user-one').pendingKeys).toEqual([
      'emotionalCheckIns',
    ]);

    const serverPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      safetyPlanUpdates: true,
    };
    api.get.mockReturnValue(
      of({ preferences: serverPreferences, persisted: true }),
    );
    api.save.mockReturnValue(
      of({
        preferences: {
          ...serverPreferences,
          emotionalCheckIns: true,
        },
        persisted: true,
      }),
    );

    const synchronized = await service.synchronize('user-one');
    expect(api.save).toHaveBeenLastCalledWith({
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: true,
    });
    expect(synchronized.syncState).toBe('synced');
    expect(synchronized.preferences).toEqual({
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: true,
    });
    expect(service.loadState('user-one').pendingKeys).toEqual([]);
  });

  it('migrates legacy local preferences only when no server choice exists', async () => {
    const legacy = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      preventiveWellbeing: true,
    };
    localStorage.setItem(
      'contigo.notification-preferences.user-one',
      JSON.stringify(legacy),
    );
    const migrated = await service.synchronize('user-one');
    expect(migrated.preferences).toEqual(legacy);
    expect(api.save).toHaveBeenCalledWith(legacy);

    api.get.mockReturnValue(
      of({
        preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        persisted: true,
      }),
    );
    await service.synchronize('user-two');
    expect(service.load('user-two')).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('uses a cached value on network failure and rejects corrupted local data', async () => {
    api.get.mockReturnValue(
      of({
        preferences: DEFAULT_NOTIFICATION_PREFERENCES,
        persisted: true,
      }),
    );
    await service.synchronize('user-one');
    api.get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    await expect(service.synchronize('user-one')).resolves.toMatchObject({
      syncState: 'stale',
    });

    localStorage.setItem(
      'contigo.notification-preferences.user-bad',
      '{invalid',
    );
    await expect(service.synchronize('user-bad')).rejects.toThrow(
      'Las preferencias guardadas no tienen un formato válido.',
    );
  });
});
