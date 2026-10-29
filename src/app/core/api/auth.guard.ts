import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthSessionService } from './auth-session.service';
import { AuthStateService } from './auth-state.service';

export const authGuard: CanActivateFn = () => {
  const session = inject(AuthSessionService);
  const state = inject(AuthStateService);
  const router = inject(Router);

  return session.restore().pipe(
    map((user) => user ? true : router.createUrlTree(['/login'])),
    catchError(() => {
      state.setError('No se pudo comprobar la sesión. Inténtalo nuevamente.');
      return of(router.createUrlTree(['/login']));
    }),
  );
};
