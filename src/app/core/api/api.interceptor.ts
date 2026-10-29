import { HttpInterceptorFn } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { Capacitor } from '@capacitor/core';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import {
  catchError,
  finalize,
  from,
  Observable,
  of,
  shareReplay,
  switchMap,
  throwError,
} from 'rxjs';

import { apiBaseUrl } from './api.config';
import { AuthApiService } from './auth-api.service';
import { AuthSessionService } from './auth-session.service';
import { AuthStateService } from './auth-state.service';
import { NativeSessionStore } from './native-session.store';

let refreshRequest: Observable<unknown> | null = null;

const isAuthenticationEndpoint = (url: string): boolean =>
  /\/auth\/(csrf|register|login|refresh|logout)(?:\?|$)/.test(url);

export const apiInterceptor: HttpInterceptorFn = (request, next) => {
  const isApiRequest =
    request.url === apiBaseUrl ||
    request.url.startsWith(`${apiBaseUrl}/`) ||
    request.url.startsWith(`${apiBaseUrl}?`);

  if (!isApiRequest) return next(request);
  const authApi = inject(AuthApiService);
  const authState = inject(AuthStateService);
  const session = inject(AuthSessionService);
  const router = inject(Router);
  const sessionStore = inject(NativeSessionStore);

  if (!Capacitor.isNativePlatform()) {
    return next(request.clone({ withCredentials: true })).pipe(
      catchError((error: unknown) => {
        if (
          !(error instanceof HttpErrorResponse) ||
          error.status !== 401 ||
          isAuthenticationEndpoint(request.url)
        ) {
          return throwError(() => error);
        }
        return recoverExpiredSession(
          request,
          next,
          error,
          authApi,
          authState,
          session,
          router,
          sessionStore,
        );
      }),
    );
  }

  return from(sessionStore.accessToken()).pipe(
    switchMap((accessToken) => {
      let headers = request.headers.set('X-Contigo-Client', 'native');
      if (accessToken) {
        headers = headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return next(
        request.clone({
          headers,
          withCredentials: false,
        }),
      ).pipe(
        catchError((error: unknown) => {
          if (
            !(error instanceof HttpErrorResponse) ||
            error.status !== 401 ||
            isAuthenticationEndpoint(request.url)
          ) {
            return throwError(() => error);
          }
          return recoverExpiredSession(
            request,
            next,
            error,
            authApi,
            authState,
            session,
            router,
            sessionStore,
          );
        }),
      );
    }),
  );
};

const recoverExpiredSession = (
  request: Parameters<HttpInterceptorFn>[0],
  next: Parameters<HttpInterceptorFn>[1],
  originalError: unknown,
  authApi: AuthApiService,
  authState: AuthStateService,
  session: AuthSessionService,
  router: Router,
  nativeStore: NativeSessionStore,
) => {
  if (!refreshRequest) {
    refreshRequest = authApi.refresh().pipe(
      finalize(() => {
        refreshRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }

  return refreshRequest.pipe(
    switchMap(() => {
      if (!Capacitor.isNativePlatform()) {
        return next(request.clone({ withCredentials: true }));
      }
      return from(nativeStore.accessToken()).pipe(
        switchMap((accessToken) => {
          let headers = request.headers.set('X-Contigo-Client', 'native');
          if (accessToken) {
            headers = headers.set('Authorization', `Bearer ${accessToken}`);
          }
          return next(
            request.clone({
              headers,
              withCredentials: false,
            }),
          );
        }),
      );
    }),
    catchError((refreshError: unknown) => {
      if (
        refreshError instanceof HttpErrorResponse &&
        refreshError.status !== 401
      ) {
        return throwError(() => refreshError);
      }

      session.expire();
      authState.clear();
      const clearNativeCredentials = Capacitor.isNativePlatform()
        ? from(nativeStore.clear())
        : of(undefined);
      return clearNativeCredentials.pipe(
        switchMap(() => from(router.navigate(['/login']))),
        switchMap(() => throwError(() => originalError)),
      );
    }),
  );
};
