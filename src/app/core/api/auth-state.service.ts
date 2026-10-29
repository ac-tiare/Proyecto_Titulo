import { computed, Injectable, signal } from '@angular/core';

import { AuthUser } from './api.models';

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly currentUser = signal<AuthUser | null>(null);
  private readonly restoringState = signal(false);
  private readonly currentError = signal<string | null>(null);

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isRestoring = this.restoringState.asReadonly();
  readonly errorMessage = this.currentError.asReadonly();

  setUser(user: AuthUser): void {
    this.currentUser.set(user);
    this.currentError.set(null);
  }

  setRestoring(restoring: boolean): void {
    this.restoringState.set(restoring);
  }

  setError(message: string): void {
    this.currentError.set(message);
  }

  clear(): void {
    this.currentUser.set(null);
  }
}
