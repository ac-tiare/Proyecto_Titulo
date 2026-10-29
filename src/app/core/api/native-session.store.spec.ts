import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
  type TestRequest,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { firstValueFrom } from 'rxjs';

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  moduleImported: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  remove: vi.fn(),
}));

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}));

vi.mock('@aparajita/capacitor-secure-storage', () => {
  mocks.moduleImported();
  return {
    SecureStorage: {
      get: mocks.get,
      set: mocks.set,
      remove: mocks.remove,
    },
  };
});

import { apiInterceptor } from './api.interceptor';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import { NativeSessionStore } from './native-session.store';

describe.sequential('native session storage and transport', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isNativePlatform.mockReturnValue(false);
    mocks.get.mockResolvedValue(null);
    mocks.set.mockResolvedValue(undefined);
    mocks.remove.mockResolvedValue(true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('does not load secure storage on web or persist credentials there', async () => {
    expect(Capacitor.isNativePlatform()).toBe(false);
    const store = TestBed.inject(NativeSessionStore);
    await store.save({
      user: {
        id: 'user-id',
        name: 'Alex',
        surname: null,
        email: 'alex@example.cl',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessExpiresAt: '2026-10-28T12:15:00.000Z',
      refreshExpiresAt: '2026-11-11T12:00:00.000Z',
    });
    await store.clear();

    expect(await store.accessToken()).toBeNull();
    expect(mocks.moduleImported).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
  });

  it('stores the access and refresh pair as one native secure-storage value', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    const store = TestBed.inject(NativeSessionStore);
    await store.save({
      user: {
        id: 'user-id',
        name: 'Alex',
        surname: null,
        email: 'alex@example.cl',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessExpiresAt: '2026-10-28T12:15:00.000Z',
      refreshExpiresAt: '2026-11-11T12:00:00.000Z',
    });

    expect(mocks.set).toHaveBeenCalledWith(
      'contigo-session-credentials',
      { accessToken: 'access-token', refreshToken: 'refresh-token' },
    );
    mocks.get.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(await store.accessToken()).toBe('access-token');
    expect(await store.refreshToken()).toBe('refresh-token');
    await store.clear();
    expect(mocks.remove).toHaveBeenCalledWith('contigo-session-credentials');
    expect(mocks.get).toHaveBeenCalledWith('contigo-session-credentials');
    expect(mocks.moduleImported).toHaveBeenCalledOnce();
  });

  it('sends native bearer credentials and identifies the client', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.get.mockResolvedValue({
      accessToken: 'native-access-token',
      refreshToken: 'native-refresh-token',
    });

    const pending = firstValueFrom(
      TestBed.inject(HttpClient).get('/api/emociones'),
    );
    let request: TestRequest | undefined;
    await vi.waitFor(() => {
      request = httpTesting.match('/api/emociones')[0];
      expect(request).toBeDefined();
    });
    if (!request) throw new Error('Native API request was not dispatched.');
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer native-access-token',
    );
    expect(request.request.headers.get('X-Contigo-Client')).toBe('native');
    expect(request.request.withCredentials).toBe(false);
    request.flush({ data: { items: [], pagination: {} } });
    await pending;
  });

  it('restores a native profile using the stored access credential', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.get.mockResolvedValue({
      accessToken: 'native-access-token',
      refreshToken: 'native-refresh-token',
    });

    const pending = firstValueFrom(
      TestBed.inject(AuthSessionService).restore(),
    );
    let request: TestRequest | undefined;
    await vi.waitFor(() => {
      request = httpTesting.match('/api/auth/me')[0];
      expect(request).toBeDefined();
    });
    if (!request) throw new Error('Native profile request was not dispatched.');
    expect(request.request.headers.get('Authorization')).toBe(
      'Bearer native-access-token',
    );
    expect(request.request.headers.get('X-Contigo-Client')).toBe('native');
    expect(request.request.withCredentials).toBe(false);
    request.flush({
      data: {
        id: 'user-id',
        name: 'Alex',
        surname: null,
        email: 'alex@example.cl',
      },
    });

    await expect(pending).resolves.toMatchObject({ id: 'user-id' });
  });

  it('loads the native refresh credential and persists the rotated pair', async () => {
    mocks.isNativePlatform.mockReturnValue(true);
    mocks.get.mockResolvedValue({
      accessToken: 'old-access-token',
      refreshToken: 'old-refresh-token',
    });
    const auth = TestBed.inject(AuthApiService);
    const pending = firstValueFrom(auth.refresh());
    let request: TestRequest | undefined;
    await vi.waitFor(() => {
      request = httpTesting.match('/api/auth/refresh')[0];
      expect(request).toBeDefined();
    });
    if (!request) throw new Error('Native refresh request was not dispatched.');

    expect(request.request.body).toEqual({ refreshToken: 'old-refresh-token' });
    expect(request.request.headers.get('X-Contigo-Client')).toBe('native');
    request.flush({
      data: {
        user: {
          id: 'user-id',
          name: 'Alex',
          surname: null,
          email: 'alex@example.cl',
        },
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        accessExpiresAt: '2026-10-28T12:15:00.000Z',
        refreshExpiresAt: '2026-11-11T12:00:00.000Z',
      },
    });
    await expect(pending).resolves.toMatchObject({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    expect(mocks.set).toHaveBeenCalledWith(
      'contigo-session-credentials',
      { accessToken: 'new-access-token', refreshToken: 'new-refresh-token' },
    );
  });
});
