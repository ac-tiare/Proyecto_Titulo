import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthSessionService } from '../../core/api/auth-session.service';
import {
  NotificationPreferenceApiService,
} from '../../core/api/notification-preference-api.service';
import { NotificationPermissionService } from '../../core/notifications/notification-permission.service';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NotificationPreferencesService,
} from '../../core/notifications/notification-preferences.service';
import { NotificationsPage } from './notifications.page';

describe('NotificationsPage', () => {
  const authenticatedUser = {
    id: 'notifications-user',
    name: 'Alex',
    surname: null,
    email: 'alex@example.cl',
  };
  let permission: { ensurePermission: ReturnType<typeof vi.fn> };
  let authSession: { restore: ReturnType<typeof vi.fn> };
  let preferencesApi: {
    get: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
  };
  let preferencesService: NotificationPreferencesService;

  const configure = async () => {
    permission = { ensurePermission: vi.fn().mockResolvedValue(true) };
    authSession = { restore: vi.fn(() => of(authenticatedUser)) };
    preferencesApi = {
      get: vi.fn(() =>
        of({
          preferences: DEFAULT_NOTIFICATION_PREFERENCES,
          persisted: false,
        }),
      ),
      save: vi.fn((preferences) =>
        of({ preferences, persisted: true }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [
        { provide: AuthSessionService, useValue: authSession },
        { provide: NotificationPermissionService, useValue: permission },
        {
          provide: NotificationPreferenceApiService,
          useValue: preferencesApi,
        },
      ],
    }).compileComponents();
    preferencesService = TestBed.inject(NotificationPreferencesService);
  };

  beforeEach(() => localStorage.clear());

  it('renders independent, initially disabled notification categories', async () => {
    await configure();

    const fixture = TestBed.createComponent(NotificationsPage);
    const page = fixture.componentInstance;
    page.loadPreferences();
    await vi.waitFor(() => expect(page.loading()).toBe(false));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.page-icon ion-icon')?.getAttribute('name'),
    ).toBe('notifications-outline');
    expect(fixture.nativeElement.textContent).toContain('Registro emocional');
    expect(fixture.nativeElement.textContent).toContain('Bienestar preventivo');
    expect(fixture.nativeElement.textContent).toContain('Plan de seguridad');
    expect(fixture.nativeElement.textContent).toContain(
      'no cambia tu registro emocional',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'no programa ni confirma el envío',
    );
    expect(fixture.nativeElement.querySelectorAll('ion-toggle')).toHaveLength(3);
    expect(page.preferences()).toEqual(DEFAULT_NOTIFICATION_PREFERENCES);
    expect(preferencesApi.get).toHaveBeenCalledOnce();
  });

  it('requests device permission and persists only the selected category', async () => {
    await configure();

    const page = TestBed.createComponent(NotificationsPage).componentInstance;
    page.loadPreferences();
    await vi.waitFor(() => expect(page.loading()).toBe(false));
    await page.setPreference('emotionalCheckIns', true);

    expect(permission.ensurePermission).toHaveBeenCalledOnce();
    expect(preferencesApi.save).toHaveBeenCalledWith({
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: false,
    });
    expect(preferencesService.load(authenticatedUser.id)).toEqual({
      emotionalCheckIns: true,
      preventiveWellbeing: false,
      safetyPlanUpdates: false,
    });
  });

  it('keeps a category disabled and reports a denied permission', async () => {
    await configure();
    permission.ensurePermission.mockResolvedValue(false);

    const page = TestBed.createComponent(NotificationsPage).componentInstance;
    page.loadPreferences();
    await vi.waitFor(() => expect(page.loading()).toBe(false));
    await page.setPreference('safetyPlanUpdates', true);

    expect(page.preferences().safetyPlanUpdates).toBe(false);
    expect(page.errorMessage()).toContain('el permiso fue denegado');
    expect(preferencesApi.save).not.toHaveBeenCalled();
  });

  it('shows cached preferences and pending status when offline', async () => {
    await configure();
    const cached = {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      emotionalCheckIns: true,
    };
    localStorage.setItem(
      'contigo.notification-preferences.notifications-user',
      JSON.stringify(cached),
    );
    preferencesApi.get.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );

    const fixture = TestBed.createComponent(NotificationsPage);
    const page = fixture.componentInstance;
    page.loadPreferences();
    await vi.waitFor(() => expect(page.loading()).toBe(false));
    fixture.detectChanges();

    expect(page.preferences()).toEqual(cached);
    expect(page.syncMessage()).toContain('pendientes de sincronización');
    expect(fixture.nativeElement.querySelector('[role="status"]')).not.toBeNull();
  });

  it('surfaces errors from session restoration', async () => {
    await configure();
    authSession.restore.mockReturnValue(
      throwError(() => new Error('session unavailable')),
    );

    const page = TestBed.createComponent(NotificationsPage).componentInstance;
    page.loadPreferences();

    expect(page.errorMessage()).toBe(
      'No se pudo completar la solicitud. Inténtalo nuevamente.',
    );
  });
});
