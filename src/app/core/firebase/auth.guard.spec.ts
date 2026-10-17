import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { User } from 'firebase/auth';

import { AuthService } from './auth.service';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  it('redirects unauthenticated users to Login and preserves the requested route', async () => {
    const auth = {
      waitForAuthState: vi.fn().mockResolvedValue(null),
      authError: signal(null),
    };
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(
        {} as never,
        { url: '/necesito-ayuda' } as RouterStateSnapshot,
      ),
    );
    const router = TestBed.inject(Router);

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/login?returnUrl=%2Fnecesito-ayuda',
    );
  });

  it('allows navigation after Firebase restores an authenticated user', async () => {
    const user = { uid: 'user-1' } as User;
    const auth = {
      waitForAuthState: vi.fn().mockResolvedValue(user),
      authError: signal(null),
    };
    await TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth },
      ],
    }).compileComponents();

    const result = await TestBed.runInInjectionContext(() =>
      authGuard(
        {} as never,
        { url: '/bienestar' } as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
  });
});
