import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import {
  catchError,
  concatMap,
  finalize,
  from,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import {
  AuthCredentials,
  AuthUser,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
} from './api.models';
import { AuthApiService } from './auth-api.service';
import { AuthStateService } from './auth-state.service';
import { NativeSessionStore } from './native-session.store';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly api = inject(AuthApiService);
  private readonly state = inject(AuthStateService);
  private readonly nativeStore = inject(NativeSessionStore);
  private readonly router = inject(Router);
  private restored = false;
  private restoration: Observable<AuthUser | null> | null = null;

  restore(): Observable<AuthUser | null> {
    if (this.restored) return of(this.state.user());
    if (this.restoration) return this.restoration;

    this.state.setRestoring(true);
    this.restoration = this.loadUser()
      .pipe(
        tap((user) => {
          if (user) {
            this.state.setUser(user);
          } else {
            this.state.clear();
          }
          this.restored = true;
        }),
        catchError((error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 401) {
            this.state.clear();
            this.restored = true;
            return of(null);
          }
          this.state.setError(
            'No se pudo comprobar la sesión. Inténtalo nuevamente.',
          );
          return throwError(() => error);
        }),
        finalize(() => {
          this.state.setRestoring(false);
          this.restoration = null;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.restoration;
  }

  login(input: LoginRequest): Observable<AuthCredentials> {
    return this.api.login(input).pipe(
      tap((credentials) => this.accept(credentials)),
    );
  }

  register(input: RegisterRequest): Observable<AuthCredentials> {
    return this.api.register(input).pipe(
      tap((credentials) => this.accept(credentials)),
    );
  }

  updateProfile(input: UpdateProfileRequest): Observable<AuthUser> {
    return this.api.updateProfile(input).pipe(
      tap((user) => this.state.setUser(user)),
    );
  }

  logout(): Observable<void> {
    const revokeSession = this.api.logout().pipe(
      catchError((error: unknown) => {
        if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
          return throwError(() => error);
        }

        return this.api.refresh().pipe(
          concatMap(() => this.api.logout()),
          catchError((refreshError: unknown) => {
            if (
              !(refreshError instanceof HttpErrorResponse) ||
              refreshError.status !== 401
            ) {
              return throwError(() => refreshError);
            }

            this.state.clear();
            this.restored = true;
            const clearNativeCredentials = Capacitor.isNativePlatform()
              ? from(this.nativeStore.clear())
              : of(undefined);
            return clearNativeCredentials.pipe(map(() => undefined));
          }),
        );
      }),
    );

    return revokeSession.pipe(
      tap(() => {
        this.state.clear();
        this.restored = true;
      }),
      concatMap(() =>
        from(this.router.navigate(['/login'])).pipe(map(() => undefined)),
      ),
    );
  }

  completeAccountDeletion(): Observable<void> {
    this.state.clear();
    this.restored = true;
    const clearNativeCredentials = Capacitor.isNativePlatform()
      ? from(this.nativeStore.clear())
      : of(undefined);

    return clearNativeCredentials.pipe(
      concatMap(() =>
        from(this.router.navigate(['/login'])).pipe(map(() => undefined)),
      ),
    );
  }

  expire(): void {
    this.state.clear();
    this.restored = true;
  }

  private loadUser(): Observable<AuthUser | null> {
    if (!Capacitor.isNativePlatform()) return this.api.me();

    return from(this.nativeStore.accessToken()).pipe(
      switchMap((accessToken) => {
        if (accessToken) return this.api.me();
        return from(this.nativeStore.refreshToken()).pipe(
          switchMap((refreshToken) =>
            refreshToken
              ? this.api.refresh(refreshToken).pipe(
                  concatMap(() => this.api.me()),
                )
              : of(null),
          ),
        );
      }),
    );
  }

  private accept(credentials: AuthCredentials): void {
    this.state.setUser(credentials.user);
    this.restored = true;
  }
}
