import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { AuthStateService } from '../../core/api/auth-state.service';
import { AuthUser } from '../../core/api/api.models';
import { ProfilePage } from './profile.page';

describe('ProfilePage', () => {
  let httpTesting: HttpTestingController;

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    })
      .compileComponents()
      .then(() => {
        httpTesting = TestBed.inject(HttpTestingController);
      });

  const user = (overrides: Partial<AuthUser> = {}): AuthUser => ({
    id: 'user-id',
    name: 'Alex',
    surname: 'Prueba',
    email: 'alex@example.cl',
    ...overrides,
  });

  const restoreUser = (page: ProfilePage): void => {
    page.loadProfile();
    httpTesting.expectOne('/api/auth/me').flush({ data: user() });
  };

  afterEach(() => httpTesting.verify());

  it('loads the authenticated profile and existing settings', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    restoreUser(fixture.componentInstance);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Alex Prueba');
    expect(fixture.nativeElement.textContent).toContain('alex@example.cl');
    expect(fixture.nativeElement.textContent).toContain('Mi Perfil');
    expect(fixture.nativeElement.textContent).toContain(
      'Editar información del perfil',
    );
    expect(fixture.nativeElement.textContent).toContain('Notificaciones');
    expect(fixture.nativeElement.textContent).toContain('Privacidad y seguridad');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
    expect(fixture.nativeElement.textContent).not.toContain(
      'temporalmente inactivas',
    );
  });

  it('updates account details only after the backend confirms the change', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;
    restoreUser(page);
    page.openProfileEditor();
    page.draftName.set('Alex actualizado');
    page.draftEmail.set('correo-invalido');
    page.saveProfile();

    expect(page.editError()).toBe('Ingresa un correo electrónico válido.');
    expect(page.profileName()).toBe('Alex Prueba');
    httpTesting.expectNone('/api/auth/me');

    page.draftEmail.set('alex.nuevo@example.cl');
    page.saveProfile();
    const request = httpTesting.expectOne('/api/auth/me');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({
      name: 'Alex actualizado',
      email: 'alex.nuevo@example.cl',
      surname: 'Prueba',
    });
    expect(page.feedback()).toBe('');
    expect(page.profileName()).toBe('Alex Prueba');
    request.flush({
      data: user({
        name: 'Alex actualizado',
        email: 'alex.nuevo@example.cl',
      }),
    });

    expect(page.profileName()).toBe('Alex actualizado Prueba');
    expect(page.profileEmail()).toBe('alex.nuevo@example.cl');
    expect(page.feedback()).toBe(
      'Los cambios de tu perfil fueron guardados.',
    );
    expect(page.editingProfile()).toBe(false);
  });

  it('does not present a duplicate-email conflict as a saved change', async () => {
    await configure();

    const page = TestBed.createComponent(ProfilePage).componentInstance;
    restoreUser(page);
    page.openProfileEditor();
    page.draftName.set('Alex actualizado');
    page.draftEmail.set('otra-cuenta@example.cl');
    page.saveProfile();
    httpTesting.expectOne('/api/auth/me').flush(
      {
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Ese correo ya está asociado a otra cuenta.',
        },
      },
      { status: 409, statusText: 'Conflict' },
    );

    expect(page.editError()).toBe(
      'Ese correo ya está asociado a otra cuenta.',
    );
    expect(page.feedback()).toBe('');
    expect(page.editingProfile()).toBe(true);
    expect(page.profileName()).toBe('Alex Prueba');
    expect(TestBed.inject(AuthStateService).user()?.email).toBe(
      'alex@example.cl',
    );
  });

  it('opens notification and privacy settings and updates local preferences', async () => {
    await configure();

    const page = TestBed.createComponent(ProfilePage).componentInstance;
    page.toggleNotifications();
    expect(page.notificationsOpen()).toBe(true);
    expect(page.remindersEnabled()).toBe(true);
    page.toggleReminders();
    expect(page.remindersEnabled()).toBe(false);
    page.toggleWellbeingTips();
    expect(page.wellbeingTipsEnabled()).toBe(true);

    page.togglePrivacy();
    expect(page.privacyOpen()).toBe(true);
  });

  it('exposes privacy information and deletion confirmation accessibly', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;
    page.togglePrivacy();
    fixture.detectChanges();

    const privacyToggle = fixture.nativeElement.querySelector(
      '[aria-controls="privacy-details"]',
    ) as HTMLButtonElement;
    expect(privacyToggle.getAttribute('aria-expanded')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain(
      'Descargar mis datos',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'eliminar tu cuenta y sus datos activos',
    );

    page.toggleDeleteAccount();
    fixture.detectChanges();
    const deleteToggle = fixture.nativeElement.querySelector(
      '[aria-controls="delete-account-form"]',
    ) as HTMLElement;
    const confirmation = fixture.nativeElement.querySelector(
      '#delete-account-confirmation',
    ) as HTMLInputElement;
    const confirmationLabel = fixture.nativeElement.querySelector(
      'label[for="delete-account-confirmation"]',
    ) as HTMLLabelElement;
    expect(deleteToggle.getAttribute('aria-expanded')).toBe('true');
    expect(confirmationLabel.htmlFor).toBe(confirmation.id);
    expect(confirmation.getAttribute('aria-describedby')).toBe(
      'delete-account-instructions',
    );
  });

  it('requires explicit account deletion confirmation and clears the session after success', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;
    const authState = TestBed.inject(AuthStateService);
    const navigate = vi
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    authState.setUser(user());
    page.togglePrivacy();
    page.toggleDeleteAccount();

    page.deleteAccount();
    httpTesting.expectNone('/api/privacy/account');
    page.toggleDeleteAccount();
    expect(page.deleteAccountOpen()).toBe(false);
    httpTesting.expectNone('/api/privacy/account');
    page.toggleDeleteAccount();

    page.deleteAccountConfirmation.set('ELIMINAR MI CUENTA');
    page.deleteAccount();
    const deletion = httpTesting.expectOne('/api/privacy/account');
    expect(deletion.request.method).toBe('DELETE');
    expect(authState.isAuthenticated()).toBe(true);
    deletion.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(authState.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(page.privacyError()).toBe('');
  });

  it('does not claim account deletion when the backend rejects the request', async () => {
    await configure();

    const page = TestBed.createComponent(ProfilePage).componentInstance;
    const authState = TestBed.inject(AuthStateService);
    authState.setUser(user());
    page.deleteAccountConfirmation.set('ELIMINAR MI CUENTA');
    page.deleteAccount();
    httpTesting.expectOne('/api/privacy/account').flush(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No pudimos eliminar la cuenta.',
        },
      },
      { status: 500, statusText: 'Server Error' },
    );

    expect(authState.isAuthenticated()).toBe(true);
    expect(page.privacyFeedback()).toBe('');
    expect(page.privacyError()).toBe('No pudimos eliminar la cuenta.');
  });

  it('does not report data export success when the API fails', async () => {
    await configure();

    const page = TestBed.createComponent(ProfilePage).componentInstance;
    page.exportPersonalData();
    httpTesting.expectOne('/api/privacy/export').flush(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No pudimos exportar tus datos.',
        },
      },
      { status: 500, statusText: 'Server Error' },
    );

    expect(page.privacyFeedback()).toBe('');
    expect(page.privacyError()).toBe('No pudimos exportar tus datos.');
  });

  it('clears the session and navigates to login after server logout succeeds', async () => {
    await configure();

    const fixture = TestBed.createComponent(ProfilePage);
    const page = fixture.componentInstance;
    const authState = TestBed.inject(AuthStateService);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authState.setUser(user());

    page.signOut();
    const request = httpTesting.expectOne('/api/auth/logout');
    expect(request.request.method).toBe('POST');
    expect(authState.isAuthenticated()).toBe(true);
    request.flush(null, { status: 204, statusText: 'No Content' });
    await fixture.whenStable();

    expect(authState.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('keeps the session active and reports a logout failure', async () => {
    await configure();

    const page = TestBed.createComponent(ProfilePage).componentInstance;
    const authState = TestBed.inject(AuthStateService);
    authState.setUser(user());

    page.signOut();
    httpTesting.expectOne('/api/auth/logout').flush(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No pudimos cerrar tu sesión.',
        },
      },
      { status: 500, statusText: 'Server Error' },
    );

    expect(authState.isAuthenticated()).toBe(true);
    expect(page.errorMessage()).toBe('No pudimos cerrar tu sesión.');
    expect(page.noticeOpen()).toBe(true);
  });
});
