import { TestBed } from '@angular/core/testing';

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesService,
} from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  let service: NotificationPreferencesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationPreferencesService);
  });

  it('uses disabled defaults and persists preferences separately per user', () => {
    const firstUserPreferences = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      emotionalCheckIns: true,
    };

    expect(service.load('user-one')).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    service.save('user-one', firstUserPreferences);

    expect(service.load('user-one')).toEqual(firstUserPreferences);
    expect(service.load('user-two')).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
  });

  it('rejects corrupted stored preferences instead of silently resetting them', () => {
    localStorage.setItem(
      'contigo.notification-preferences.user-one',
      '{invalid',
    );

    expect(() => service.load('user-one')).toThrow(
      'Las preferencias guardadas no tienen un formato válido.',
    );
  });
});
