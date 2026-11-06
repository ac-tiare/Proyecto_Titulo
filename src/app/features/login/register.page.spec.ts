import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { RegisterPage } from './register.page';

describe('RegisterPage', () => {
  let httpTesting: HttpTestingController;

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [RegisterPage],
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

  it('shows the four labeled fields and independent password visibility controls', async () => {
    await configure();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    const inputs = fixture.nativeElement.querySelectorAll('ion-input');
    expect(Array.from(inputs, (input: HTMLIonInputElement) => input.label)).toEqual([
      'Nombre',
      'Correo electrónico',
      'Contraseña',
      'Confirmar contraseña',
    ]);
    expect(fixture.nativeElement.textContent).not.toContain('Modo demostración');

    const toggles = fixture.nativeElement.querySelectorAll('.visibility-button');
    expect(toggles).toHaveLength(2);
    expect(inputs[2].type).toBe('password');
    expect(inputs[3].type).toBe('password');

    toggles[0].click();
    fixture.detectChanges();

    expect(inputs[2].type).toBe('text');
    expect(inputs[3].type).toBe('password');
    expect(toggles[0].getAttribute('aria-pressed')).toBe('true');
  });

  it('validates required fields, email, password length, and confirmation', async () => {
    await configure();

    const fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();

    await fixture.componentInstance.submit();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingresa tu nombre.');
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa tu correo electrónico.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa una contraseña.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Confirma tu contraseña.',
    );

    fixture.componentInstance.updateField('name', 'Alex');
    fixture.componentInstance.updateField('email', 'correo-invalido');
    fixture.componentInstance.updateField('password', 'short');
    fixture.componentInstance.updateField('confirmPassword', 'otra');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Ingresa un correo electrónico válido.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'La contraseña debe tener al menos 12 caracteres.',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Las contraseñas no coinciden.',
    );
  });

  it('creates an account and navigates only after server confirmation', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', ' Alex ');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'secure-password');
    fixture.componentInstance.updateField('confirmPassword', 'secure-password');

    fixture.componentInstance.submit();
    const request = httpTesting.expectOne('/api/auth/register');
    expect(request.request.body).toEqual({
      name: 'Alex',
      email: 'alex@example.cl',
      password: 'secure-password',
    });
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

    expect(fixture.componentInstance.values().name).toBe(' Alex ');
    await vi.waitFor(() =>
      expect(fixture.componentInstance.confirmation()).toBe(
        'Tu cuenta fue creada correctamente.',
      ),
    );
    expect(navigate).toHaveBeenCalledWith(['/inicio']);
  });

  it('shows duplicate-email and server failures without false success', async () => {
    await configure();

    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    const fixture = TestBed.createComponent(RegisterPage);
    fixture.componentInstance.updateField('name', 'Alex');
    fixture.componentInstance.updateField('email', 'alex@example.cl');
    fixture.componentInstance.updateField('password', 'secure-password');
    fixture.componentInstance.updateField('confirmPassword', 'secure-password');

    fixture.componentInstance.submit();
    httpTesting.expectOne('/api/auth/register').flush(
      {
        error: {
          code: 'EMAIL_ALREADY_REGISTERED',
          message: 'Ese correo ya está registrado.',
        },
      },
      { status: 409, statusText: 'Conflict' },
    );

    await vi.waitFor(() =>
      expect(fixture.componentInstance.errorMessage()).toBe(
        'Ese correo ya está registrado.',
      ),
    );
    expect(fixture.componentInstance.confirmation()).toBe('');
    expect(navigate).not.toHaveBeenCalled();

    fixture.componentInstance.submit();
    httpTesting.expectOne('/api/auth/register').flush(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Ocurrió un error inesperado. Inténtalo nuevamente.',
        },
      },
      { status: 500, statusText: 'Server Error' },
    );
    await vi.waitFor(() =>
      expect(fixture.componentInstance.errorMessage()).toBe(
        'Ocurrió un error inesperado. Inténtalo nuevamente.',
      ),
    );
    expect(fixture.componentInstance.confirmation()).toBe('');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('returns to Login', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(RegisterPage);

    await fixture.componentInstance.goToLogin();

    expect(navigate).toHaveBeenCalledWith(['/login']);
  });
});
