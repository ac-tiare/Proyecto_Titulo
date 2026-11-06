import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';

import { ApiResponse } from './api.models';
import { CsrfTokenService } from './csrf-token.service';
import { apiBaseUrl } from './api.config';

@Injectable({ providedIn: 'root' })
export class PasswordRecoveryApiService {
  private readonly http = inject(HttpClient);
  private readonly csrfToken = inject(CsrfTokenService);
  private readonly authUrl = `${apiBaseUrl}/auth`;

  requestRecovery(email: string): Observable<void> {
    return this.csrfToken.getToken().pipe(
      switchMap((token) =>
        this.http.post<ApiResponse<{ message: string }>>(
          `${this.authUrl}/forgot-password`,
          { email },
          { headers: { 'X-XSRF-TOKEN': token } },
        ),
      ),
      map(() => undefined),
    );
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.csrfToken.getToken().pipe(
      switchMap((csrfToken) =>
        this.http.post<ApiResponse<{ message: string }>>(
          `${this.authUrl}/reset-password`,
          { token, newPassword },
          { headers: { 'X-XSRF-TOKEN': csrfToken } },
        ),
      ),
      map(() => undefined),
    );
  }
}
