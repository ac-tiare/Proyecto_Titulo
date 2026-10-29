import { HttpClient, provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiInterceptor } from './api.interceptor';
import { AuthSessionService } from './auth-session.service';
import { AuthStateService } from './auth-state.service';

const user = {
  id: 'user-id',
  name: 'Alex',
  surname: null,
  email: 'alex@example.cl',
};

describe('authenticated session lifecycle', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
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
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  });

  it('restores a web session once and exposes the public profile', async () => {
    const session = TestBed.inject(AuthSessionService);
    const state = TestBed.inject(AuthStateService);
    const pending = firstValueFrom(session.restore());
    const request = httpTesting.expectOne('/api/auth/me');

    expect(request.request.withCredentials).toBe(true);
    request.flush({ data: user });

    await expect(pending).resolves.toEqual(user);
    expect(state.user()).toEqual(user);
    expect(state.isAuthenticated()).toBe(true);
    await expect(firstValueFrom(session.restore())).resolves.toEqual(user);
    httpTesting.expectNone('/api/auth/me');
  });

  it('clears local session state and returns to Login after confirmed logout', async () => {
    const state = TestBed.inject(AuthStateService);
    state.setUser(user);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const pending = firstValueFrom(TestBed.inject(AuthSessionService).logout());
    const request = httpTesting.expectOne('/api/auth/logout');

    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null);

    await expect(pending).resolves.toBeUndefined();
    expect(state.user()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('renews an expired access credential before revoking the session', async () => {
    const state = TestBed.inject(AuthStateService);
    state.setUser(user);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const pending = firstValueFrom(
      TestBed.inject(AuthSessionService).logout(),
    );

    httpTesting.expectOne('/api/auth/logout').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    httpTesting.expectOne('/api/auth/refresh').flush({
      data: {
        user,
        accessExpiresAt: '2026-10-28T12:15:00.000Z',
        refreshExpiresAt: '2026-11-11T12:00:00.000Z',
      },
    });

    let retry: TestRequest | undefined;
    await vi.waitFor(() => {
      retry = httpTesting.match('/api/auth/logout')[0];
      expect(retry).toBeDefined();
    });
    if (!retry) throw new Error('Logout should retry after refreshing credentials.');
    expect(retry.request.method).toBe('POST');
    retry.flush(null);

    await expect(pending).resolves.toBeUndefined();
    expect(state.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('clears an already-invalid session after refresh is rejected during logout', async () => {
    const state = TestBed.inject(AuthStateService);
    state.setUser(user);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const pending = firstValueFrom(
      TestBed.inject(AuthSessionService).logout(),
    );

    httpTesting.expectOne('/api/auth/logout').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    httpTesting.expectOne('/api/auth/refresh').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(pending).resolves.toBeUndefined();
    expect(state.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('renews once after an expired access credential and retries the request', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-test-token; path=/';
    const pending = firstValueFrom(
      TestBed.inject(HttpClient).get('/api/emociones'),
    );
    const expiredRequest = httpTesting.expectOne('/api/emociones');
    expiredRequest.flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const refreshRequest = httpTesting.expectOne('/api/auth/refresh');
    expect(refreshRequest.request.method).toBe('POST');
    expect(refreshRequest.request.withCredentials).toBe(true);
    expect(refreshRequest.request.headers.get('X-XSRF-TOKEN')).toBe(
      'csrf-test-token',
    );
    refreshRequest.flush({
      data: {
        user,
        accessExpiresAt: '2026-10-28T12:15:00.000Z',
        refreshExpiresAt: '2026-11-11T12:00:00.000Z',
      },
    });

    let retriedRequest: TestRequest | undefined;
    await vi.waitFor(() => {
      retriedRequest = httpTesting.match('/api/emociones')[0];
      expect(retriedRequest).toBeDefined();
    });
    if (!retriedRequest) throw new Error('The retried request was not dispatched.');
    expect(retriedRequest.request.withCredentials).toBe(true);
    const history = {
      items: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    retriedRequest.flush({ data: history });
    await expect(pending).resolves.toEqual({ data: history });
  });

  it('shares one refresh request between concurrent expired API calls', async () => {
    const http = TestBed.inject(HttpClient);
    const first = firstValueFrom(http.get('/api/emociones?page=1'));
    const second = firstValueFrom(http.get('/api/contactos?page=1'));
    httpTesting.expectOne('/api/emociones?page=1').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    httpTesting.expectOne('/api/contactos?page=1').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    const refreshRequest = httpTesting.expectOne('/api/auth/refresh');
    httpTesting.expectNone('/api/auth/refresh');
    refreshRequest.flush({
      data: {
        user,
        accessExpiresAt: '2026-10-28T12:15:00.000Z',
        refreshExpiresAt: '2026-11-11T12:00:00.000Z',
      },
    });

    let historyRetry: TestRequest | undefined;
    let contactsRetry: TestRequest | undefined;
    await vi.waitFor(() => {
      historyRetry ??= httpTesting.match('/api/emociones?page=1')[0];
      contactsRetry ??= httpTesting.match('/api/contactos?page=1')[0];
      expect(historyRetry).toBeDefined();
      expect(contactsRetry).toBeDefined();
    });
    if (!historyRetry || !contactsRetry) {
      throw new Error('Both expired API calls must be retried.');
    }
    historyRetry.flush({ data: { items: [], pagination: {} } });
    contactsRetry.flush({ data: { items: [], pagination: {} } });
    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
  });

  it('clears session state and redirects only when renewal is rejected', async () => {
    const state = TestBed.inject(AuthStateService);
    state.setUser(user);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const pending = firstValueFrom(
      TestBed.inject(HttpClient).get('/api/emociones'),
    );
    httpTesting.expectOne('/api/emociones').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    httpTesting.expectOne('/api/auth/refresh').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(state.user()).toBeNull();
    expect(state.isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/login']);
  });

  it('preserves session state and surfaces server errors during renewal', async () => {
    const state = TestBed.inject(AuthStateService);
    state.setUser(user);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate');
    const pending = firstValueFrom(
      TestBed.inject(HttpClient).get('/api/emociones'),
    );
    httpTesting.expectOne('/api/emociones').flush(
      { error: { code: 'UNAUTHENTICATED', message: 'Expired' } },
      { status: 401, statusText: 'Unauthorized' },
    );
    httpTesting.expectOne('/api/auth/refresh').flush(
      { error: { code: 'INTERNAL_ERROR', message: 'Unavailable' } },
      { status: 500, statusText: 'Server Error' },
    );

    await expect(pending).rejects.toMatchObject({ status: 500 });
    expect(state.user()).toEqual(user);
    expect(navigate).not.toHaveBeenCalled();
  });
});
