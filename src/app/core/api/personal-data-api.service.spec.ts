import {
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { apiInterceptor } from './api.interceptor';
import { PersonalDataApiService } from './personal-data-api.service';

describe('PersonalDataApiService', () => {
  let httpTesting: HttpTestingController;

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
  });

  afterEach(() => httpTesting.verify());

  it('downloads the authenticated account export from the API', async () => {
    const pending = firstValueFrom(
      TestBed.inject(PersonalDataApiService).exportData(),
    );
    const request = httpTesting.expectOne('/api/privacy/export');

    expect(request.request.method).toBe('GET');
    expect(request.request.withCredentials).toBe(true);
    request.flush({
      data: {
        exportedAt: '2026-10-28T00:00:00.000Z',
        profile: {
          id: 'user-id',
          name: 'Alex',
          surname: null,
          email: 'alex@example.cl',
          createdAt: '2026-10-01T00:00:00.000Z',
        },
        emotionalRecords: [],
        safetyPlan: null,
        trustedContacts: [],
      },
    });

    await expect(pending).resolves.toMatchObject({
      profile: { id: 'user-id' },
      emotionalRecords: [],
      safetyPlan: null,
      trustedContacts: [],
    });
  });

  it('sends the deliberate confirmation for account deletion', async () => {
    const pending = firstValueFrom(
      TestBed.inject(PersonalDataApiService).deleteAccount(),
    );
    const request = httpTesting.expectOne('/api/privacy/account');

    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toEqual({
      confirmation: 'ELIMINAR MI CUENTA',
    });
    request.flush(null);

    await expect(pending).resolves.toBeNull();
  });
});
