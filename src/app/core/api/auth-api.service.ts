import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { concatMap, from, map, Observable, switchMap, throwError } from 'rxjs';

import {
  ApiResponse,
  AuthCredentials,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from './api.models';
import { NativeSessionStore } from './native-session.store';
import { apiBaseUrl } from './api.config';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly sessionStore = inject(NativeSessionStore);
  private readonly baseUrl = `${apiBaseUrl}/auth`;

  register(input: RegisterRequest): Observable<AuthCredentials> {
    return this.withNativeSession(
      this.http.post<ApiResponse<AuthCredentials>>(
        `${this.baseUrl}/register`,
        input,
      ),
    );
  }

  login(input: LoginRequest): Observable<AuthCredentials> {
    return this.withNativeSession(
      this.http.post<ApiResponse<AuthCredentials>>(
        `${this.baseUrl}/login`,
        input,
      ),
    );
  }

  refresh(refreshToken?: string): Observable<AuthCredentials> {
    if (Capacitor.isNativePlatform() && !refreshToken) {
      return from(this.sessionStore.refreshToken()).pipe(
        switchMap((storedToken) =>
          storedToken
            ? this.postRefresh(storedToken)
            : throwError(
                () => new Error('No native refresh credential is available.'),
              ),
        ),
      );
    }
    return this.postRefresh(refreshToken);
  }

  me(): Observable<AuthUser> {
    return this.http
      .get<ApiResponse<AuthUser>>(`${this.baseUrl}/me`)
      .pipe(map((response) => response.data));
  }

  updateProfile(input: UpdateProfileRequest): Observable<AuthUser> {
    return this.http
      .patch<ApiResponse<AuthUser>>(`${this.baseUrl}/me`, input)
      .pipe(map((response) => response.data));
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/logout`, {})
      .pipe(
        concatMap(async () => {
          if (Capacitor.isNativePlatform()) await this.sessionStore.clear();
        }),
      );
  }

  private postRefresh(refreshToken?: string): Observable<AuthCredentials> {
    const body = Capacitor.isNativePlatform()
      ? { refreshToken }
      : {};
    return this.withNativeSession(
      this.http.post<ApiResponse<AuthCredentials>>(
        `${this.baseUrl}/refresh`,
        body,
      ),
    );
  }

  private withNativeSession(
    response: Observable<ApiResponse<AuthCredentials>>,
  ): Observable<AuthCredentials> {
    return response.pipe(
      map((result) => result.data),
      concatMap(async (credentials) => {
        if (Capacitor.isNativePlatform()) {
          await this.sessionStore.save(credentials);
        }
        return credentials;
      }),
    );
  }
}
