import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse } from './api.models';
import { apiBaseUrl } from './api.config';

@Injectable({ providedIn: 'root' })
export class CsrfTokenService {
  private readonly http = inject(HttpClient);

  getToken(): Observable<string> {
    return this.http
      .get<ApiResponse<{ csrfToken: string }>>(
        `${apiBaseUrl}/auth/csrf`,
      )
      .pipe(
        map((response) => {
          const token = response.data?.csrfToken;
          if (typeof token !== 'string' || token.length === 0) {
            throw new Error('The CSRF token endpoint returned no token.');
          }
          return token;
        }),
      );
  }
}
