import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { apiInterceptor } from './api.interceptor';
import { AuthApiService } from './auth-api.service';
import { EmotionalRecordApiService } from './emotional-record-api.service';
import { SafetyPlanApiService } from './safety-plan-api.service';
import { TrustedContactApiService } from './trusted-contact-api.service';

describe('API services and interceptor', () => {
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

  it('uses the auth routes and unwraps the API response envelope', async () => {
    const auth = TestBed.inject(AuthApiService);
    const pending = firstValueFrom(
      auth.login({ email: 'alex@example.cl', password: 'a-strong-password' }),
    );
    const request = httpTesting.expectOne('/api/auth/login');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      email: 'alex@example.cl',
      password: 'a-strong-password',
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
    await expect(pending).resolves.toMatchObject({
      user: { id: 'user-id', email: 'alex@example.cl' },
    });
  });

  it('sends the web CSRF header from the readable CSRF cookie', async () => {
    document.cookie = 'XSRF-TOKEN=csrf-test-token; path=/';
    const pending = firstValueFrom(
      TestBed.inject(AuthApiService).logout(),
    );
    const request = httpTesting.expectOne('/api/auth/logout');

    expect(request.request.headers.get('X-XSRF-TOKEN')).toBe('csrf-test-token');
    expect(request.request.withCredentials).toBe(true);
    request.flush(null);
    await pending;
    document.cookie = 'XSRF-TOKEN=; Max-Age=0; path=/';
  });

  it('requests paginated emotional history with its period filter', async () => {
    const records = TestBed.inject(EmotionalRecordApiService);
    const pending = firstValueFrom(records.list(2, 10, 'month'));
    const request = httpTesting.expectOne(
      '/api/emociones?page=2&pageSize=10&period=month',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        items: [],
        pagination: { page: 2, pageSize: 10, total: 0, totalPages: 0 },
      },
    });
    await expect(pending).resolves.toMatchObject({
      items: [],
      pagination: { page: 2, pageSize: 10 },
    });
  });

  it('requests an authenticated descriptive emotional summary', async () => {
    const pending = firstValueFrom(
      TestBed.inject(EmotionalRecordApiService).patterns('year'),
    );
    const request = httpTesting.expectOne(
      '/api/emociones/patrones?period=year',
    );

    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        period: 'year',
        recordCount: 2,
        moodCounts: { 'muy-bien': 1, bien: 0, 'mas-o-menos': 0, mal: 1, 'muy-mal': 0 },
        emotionCounts: {
          tristeza: 1,
          ansiedad: 1,
          miedo: 0,
          enojo: 0,
          soledad: 0,
          calma: 0,
          esperanza: 0,
          otra: 0,
        },
        buckets: [],
        hasTemporalComparison: true,
      },
    });

    await expect(pending).resolves.toMatchObject({
      period: 'year',
      recordCount: 2,
      hasTemporalComparison: true,
    });
  });

  it('saves the structured safety plan and trusted contacts', async () => {
    const plan = TestBed.inject(SafetyPlanApiService);
    const planPending = firstValueFrom(
      plan.save({
        warningSigns: ['Una señal'],
        copingActions: ['Una acción'],
        safePlaces: [],
      }),
    );
    const planRequest = httpTesting.expectOne('/api/plan-seguridad');
    expect(planRequest.request.method).toBe('PUT');
    planRequest.flush({
      data: {
        id: 'plan-id',
        warningSigns: ['Una señal'],
        copingActions: ['Una acción'],
        safePlaces: [],
        updatedAt: '2026-10-28T12:00:00.000Z',
      },
    });
    await expect(planPending).resolves.toMatchObject({ id: 'plan-id' });

    const contacts = TestBed.inject(TrustedContactApiService);
    const contactPending = firstValueFrom(
      contacts.create({ name: 'Contacto', phone: '+56912345678' }),
    );
    const contactRequest = httpTesting.expectOne('/api/contactos');
    expect(contactRequest.request.method).toBe('POST');
    contactRequest.flush({
      data: {
        id: 'contact-id',
        userId: 'user-id',
        name: 'Contacto',
        phone: '+56912345678',
        relationship: null,
        details: null,
        createdAt: '2026-10-28T12:00:00.000Z',
        updatedAt: '2026-10-28T12:00:00.000Z',
      },
    });
    await expect(contactPending).resolves.toMatchObject({
      id: 'contact-id',
      phone: '+56912345678',
    });
  });

  it('adds cookie credentials only to configured API requests', async () => {
    const http = TestBed.inject(HttpClient);
    const pending = firstValueFrom(http.get('/api/health'));
    const apiRequest = httpTesting.expectOne('/api/health');
    expect(apiRequest.request.withCredentials).toBe(true);
    apiRequest.flush({ data: { status: 'ok' } });
    await pending;

    const externalPending = firstValueFrom(http.get('/assets/resources.json'));
    const externalRequest = httpTesting.expectOne('/assets/resources.json');
    expect(externalRequest.request.withCredentials).toBe(false);
    externalRequest.flush({});
    await externalPending;
  });
});
