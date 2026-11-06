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

import { apiInterceptor } from './api.interceptor';
import { PasswordRecoveryApiService } from './password-recovery-api.service';

describe('PasswordRecoveryApiService', () => {
  let httpTesting: HttpTestingController;
  let service: PasswordRecoveryApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(
          withXsrfConfiguration({
            cookieName: 'XSRF-TOKEN',
            headerName: 'X-XSRF-TOKEN',
          }),
          withInterceptors([apiInterceptor]),
        ),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.inject(PasswordRecoveryApiService);
  });

  afterEach(() => httpTesting.verify());

  it('obtains and sends a CSRF token before requesting password recovery', () => {
    let completed = false;
    service.requestRecovery('alex@example.cl').subscribe(() => {
      completed = true;
    });

    const csrfRequest = httpTesting.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.withCredentials).toBe(true);
    csrfRequest.flush({
      data: { csrfToken: 'csrf-token' },
    });
    const recoveryRequest = httpTesting.expectOne('/api/auth/forgot-password');
    expect(recoveryRequest.request.headers.get('X-XSRF-TOKEN')).toBe(
      'csrf-token',
    );
    expect(recoveryRequest.request.withCredentials).toBe(true);
    recoveryRequest.flush({
      data: { message: 'Si el correo está asociado a una cuenta, recibirás instrucciones.' },
    });

    expect(completed).toBe(true);
  });

  it('posts the token and new password after obtaining CSRF protection', () => {
    service.resetPassword('opaque-token', 'new-secure-password').subscribe();

    const csrfRequest = httpTesting.expectOne('/api/auth/csrf');
    expect(csrfRequest.request.withCredentials).toBe(true);
    csrfRequest.flush({
      data: { csrfToken: 'csrf-token' },
    });
    const request = httpTesting.expectOne('/api/auth/reset-password');
    expect(request.request.body).toEqual({
      token: 'opaque-token',
      newPassword: 'new-secure-password',
    });
    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ data: { message: 'Tu contraseña fue actualizada.' } });
  });
});
