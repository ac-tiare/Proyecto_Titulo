import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let httpTesting: HttpTestingController;

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideRouter([]),
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN',
          }),
          withInterceptors([apiInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    })
      .compileComponents()
      .then(() => {
        httpTesting = TestBed.inject(HttpTestingController);
      });

  afterEach(() => httpTesting.verify());

  it('shows labeled fields and an accessible password visibility toggle', async () => {
    await configure();

    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    const email = fixture.nativeElement.querySelector(
      'ion-input[name="email"]',
    ) as HTMLIonInputElement;
    const password = fixture.nativeElement.querySelector(
      'ion-input[name="password"]',
    ) as HTMLIonInputElement;
    const visibilityButton = fixture.nativeElement.querySelector(
      '.visibility-button',
    );

    expect(content).toContain('Bienvenido/a');
    expect(content).toContain('Tu espacio de apoyo y bienestar');
    expect(content).not.toContain('Modo demostración');
    expect(email.getAttribute('label')).toBe('Correo electrónico');
    expect(password.getAttribute('label')).toBe('Contraseña');
    expect(password.type).toBe('password');
    expect(visibilityButton.getAttribute('aria-label')).toBe('Mostrar contraseña');

    visibilityButton.click();
    fixture.detectChanges();

    expect(password.type).toBe('text');
    expect(visibilityButton.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(visibilityButton.getAttribute('aria-pressed')).toBe('true');
  });

  it('requires credentials before attempting authentication', async () => {
    await configure();

    const fixture = TestBed.createComponent(LoginPage);
    await fixture.componentInstance.signIn();
    expect(fixture.componentInstance.errorMessage()).toContain(
      'Ingresa tu correo electrónico y contraseña.',
    );
  });

  it('authenticates with the backend and navigates only after success', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email.set('alex@example.cl');
    fixture.componentInstance.password.set('secure-password');

    fixture.componentInstance.signIn();
    const csrfRequest = httpTesting.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.method).toBe('GET');
    expect(csrfRequest.request.withCredentials).toBe(true);
    csrfRequest.flush({ data: { csrfToken: 'login-csrf-token' } });

    const request = httpTesting.expectOne('/api/auth/login');
    expect(request.request.body).toEqual({
      email: 'alex@example.cl',
      password: 'secure-password',
    });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe(
      'login-csrf-token',
    );
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      data: {
        user: {
          id: 'user-id',
          name: 'Alex',
          surname: null,
          email: 'alex@example.cl',
        },
        accessExpiresAt: '2026-10-28T12:15:00.000Z',
        refreshExpiresAt: '2026-11-11T12:00:00.000Z',
      },
    });

    await vi.waitFor(() => expect(navigate).toHaveBeenCalledWith(['/inicio']));
    expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  it('shows an authentication error without navigating on server rejection', async () => {
    await configure();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    const fixture = TestBed.createComponent(LoginPage);
    fixture.componentInstance.email.set('alex@example.cl');
    fixture.componentInstance.password.set('wrong-password');

    fixture.componentInstance.signIn();
    httpTesting.expectOne('/api/auth/csrf').flush({
      data: { csrfToken: 'login-csrf-token' },
    });
    httpTesting.expectOne('/api/auth/login').flush(
      {
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Correo o contraseña incorrectos.',
        },
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    await vi.waitFor(() =>
      expect(fixture.componentInstance.errorMessage()).toBe(
        'Correo o contraseña incorrectos.',
      ),
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('links to the public password recovery form', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate');
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const actions = fixture.nativeElement.querySelectorAll(
      'ion-button.text-action',
    ) as NodeListOf<HTMLIonButtonElement>;

    expect(actions[0].getAttribute('routerLink')).toBe('/forgot-password');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('navigates to Crear Cuenta from Login', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(LoginPage);
    fixture.detectChanges();

    const createAccount = fixture.nativeElement.querySelector(
      '.create-account',
    ) as HTMLIonButtonElement;
    createAccount.click();

    expect(navigate).toHaveBeenCalledWith(['/crear-cuenta']);
  });
});
