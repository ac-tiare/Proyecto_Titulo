import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { ForgotPasswordPage } from './forgot-password.page';
import { ResetPasswordPage } from './reset-password.page';

describe('Password recovery pages', () => {
  let httpTesting: HttpTestingController;
  let toastPresent: ReturnType<typeof vi.fn>;
  let createToast: ReturnType<typeof vi.fn>;

  const configure = async () => {
    toastPresent = vi.fn().mockResolvedValue(undefined);
    createToast = vi
      .fn()
      .mockResolvedValue({ present: toastPresent });
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage, ResetPasswordPage],
      providers: [
        provideRouter([]),
        {
          provide: ToastController,
          useValue: { create: createToast },
        },
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN',
          }),
          withInterceptors([apiInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    httpTesting = TestBed.inject(HttpTestingController);
  };

  afterEach(() => httpTesting.verify());

  it('validates the email before sending a recovery request', async () => {
    await configure();
    const fixture = TestBed.createComponent(ForgotPasswordPage);

    fixture.componentInstance.form.controls.email.setValue('not-an-email');
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.form.controls.email.invalid).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')?.textContent,
    ).toContain('correo electrónico válido');
    httpTesting.expectNone('/api/auth/csrf');
  });

  it('shows the generic server confirmation after requesting recovery', async () => {
    await configure();
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.componentInstance.form.controls.email.setValue(' alex@example.cl ');
    fixture.componentInstance.submit();

    httpTesting.expectOne('/api/auth/csrf').flush({
      data: { csrfToken: 'csrf-token' },
    });
    const request = httpTesting.expectOne('/api/auth/forgot-password');
    expect(request.request.body).toEqual({ email: 'alex@example.cl' });
    request.flush({
      data: {
        message:
          'Si el correo está asociado a una cuenta, recibirás instrucciones para recuperar el acceso.',
      },
    });

    expect(fixture.componentInstance.confirmationMessage()).toContain(
      'Si el correo está asociado a una cuenta',
    );
    expect(fixture.componentInstance.errorMessage()).toBe('');
  });

  it('checks password length, number, and confirmation before sending a reset request', async () => {
    await configure();
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.componentInstance.token.set('opaque-token');
    fixture.componentInstance.form.controls.password.setValue('short');
    fixture.componentInstance.form.controls.confirmPassword.setValue('short');
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.form.controls.password.hasError('minlength')).toBe(true);
    httpTesting.expectNone('/api/auth/csrf');

    fixture.componentInstance.form.controls.password.setValue(
      'password-without-number',
    );
    fixture.componentInstance.form.controls.confirmPassword.setValue(
      'password-without-number',
    );
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.controls.password.hasError('pattern')).toBe(true);
    httpTesting.expectNone('/api/auth/csrf');

    fixture.componentInstance.form.controls.password.setValue(
      'long-enough-password1',
    );
    fixture.componentInstance.form.controls.confirmPassword.setValue(
      'different-password1',
    );
    fixture.componentInstance.submit();
    expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBe(true);
    httpTesting.expectNone('/api/auth/csrf');
  });

  it('explains an invalid or expired token and offers another link', async () => {
    await configure();
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.componentInstance.token.set('expired-token');
    fixture.componentInstance.form.controls.password.setValue(
      'a-new-password-long-enough1',
    );
    fixture.componentInstance.form.controls.confirmPassword.setValue(
      'a-new-password-long-enough1',
    );
    fixture.componentInstance.submit();

    httpTesting.expectOne('/api/auth/csrf').flush({
      data: { csrfToken: 'csrf-token' },
    });
    httpTesting.expectOne('/api/auth/reset-password').flush(
      {
        error: {
          code: 'INVALID_OR_EXPIRED_RESET_TOKEN',
          message: 'El enlace no es válido o venció. Solicita uno nuevo.',
        },
      },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'El enlace ya no es válido o venció',
    );
    expect(
      fixture.nativeElement
        .querySelector('ion-button[routerLink="/forgot-password"]')
        ?.textContent,
    ).toContain('Solicitar otro enlace');
  });

  it('shows a spinner while requesting a recovery email', async () => {
    await configure();
    const fixture = TestBed.createComponent(ForgotPasswordPage);
    fixture.componentInstance.form.controls.email.setValue('alex@example.cl');
    fixture.componentInstance.submit();
    fixture.detectChanges();

    expect(fixture.componentInstance.isSubmitting()).toBe(true);
    expect(fixture.nativeElement.querySelector('ion-spinner')).not.toBeNull();
    httpTesting.expectOne('/api/auth/csrf').flush({
        data: { csrfToken: 'csrf-token' },
    });
    httpTesting.expectOne('/api/auth/forgot-password').flush({
        data: { message: 'Solicitud recibida.' },
    });
  });

  it('resets the password, shows a toast, and redirects to Login', async () => {
    await configure();
    const router = TestBed.inject(Router);
    const navigateByUrl = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.componentInstance.token.set('opaque-reset-token');
    fixture.componentInstance.form.controls.password.setValue(
        'a-new-password-long-enough1',
    );
    fixture.componentInstance.form.controls.confirmPassword.setValue(
        'a-new-password-long-enough1',
    );

    fixture.componentInstance.submit();
    httpTesting.expectOne('/api/auth/csrf').flush({
        data: { csrfToken: 'csrf-token' },
    });
    const resetRequest = httpTesting.expectOne('/api/auth/reset-password');
    expect(resetRequest.request.body).toEqual({
        token: 'opaque-reset-token',
        newPassword: 'a-new-password-long-enough1',
    });
    resetRequest.flush({ data: { message: 'Contraseña actualizada.' } });

    await vi.waitFor(() => {
        expect(createToast).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.',
          }),
        );
        expect(toastPresent).toHaveBeenCalledOnce();
        expect(navigateByUrl).toHaveBeenCalledWith('/login');
    });
  });

  it('does not request recovery if the reset link has no token', async () => {
    await configure();
    const fixture = TestBed.createComponent(ResetPasswordPage);
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toContain(
      'no contiene un código válido',
    );
    httpTesting.expectNone('/api/auth/csrf');
  });
});
