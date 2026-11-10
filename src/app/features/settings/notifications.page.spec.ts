import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthSessionService } from '../../core/api/auth-session.service';
import { NotificationPermissionService } from '../../core/notifications/notification-permission.service';
import { NotificationPreferencesService } from '../../core/notifications/notification-preferences.service';
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
  let preferencesService: NotificationPreferencesService;

  const configure = async () => {
    permission = { ensurePermission: vi.fn().mockResolvedValue(true) };
    authSession = { restore: vi.fn(() => of(authenticatedUser)) };
    await TestBed.configureTestingModule({
      imports: [NotificationsPage],
      providers: [
        { provide: AuthSessionService, useValue: authSession },
        { provide: NotificationPermissionService, useValue: permission },
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
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Registro emocional');
    expect(fixture.nativeElement.textContent).toContain('Bienestar preventivo');
    expect(fixture.nativeElement.textContent).toContain('Plan de seguridad');
    expect(fixture.nativeElement.textContent).toContain(
      'no cambia tu registro emocional',
    );
    expect(fixture.nativeElement.querySelectorAll('ion-toggle')).toHaveLength(3);
    expect(page.preferences()).toEqual({
      emotionalCheckIns: false,
      preventiveWellbeing: false,
      safetyPlanUpdates: false,
    });
  });

  it('requests device permission and persists only the selected category', async () => {
    await configure();

    const page = TestBed.createComponent(NotificationsPage).componentInstance;
    page.loadPreferences();
    await page.setPreference('emotionalCheckIns', true);

    expect(permission.ensurePermission).toHaveBeenCalledOnce();
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
    await page.setPreference('safetyPlanUpdates', true);

    expect(page.preferences().safetyPlanUpdates).toBe(false);
    expect(page.errorMessage()).toContain('el permiso fue denegado');
    expect(preferencesService.load(authenticatedUser.id).safetyPlanUpdates).toBe(
      false,
    );
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
