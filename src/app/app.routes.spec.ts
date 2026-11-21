import { authGuard } from './core/api/auth.guard';
import { routes } from './app.routes';
import { DashboardPage } from './features/home/dashboard.page';
import { ExplorePage } from './features/home/explore.page';

describe('application routes', () => {
  const shellRoute = routes.find((route) => route.path === '' && route.children);
  const childRoutes = shellRoute?.children ?? [];

  it('opens the public Inicio dashboard by default', async () => {
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      }),
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: 'bienvenida',
        loadComponent: expect.any(Function),
      }),
    );
    expect(shellRoute?.canActivate).toBeUndefined();
    const inicio = childRoutes.find((route) => route.path === 'inicio');
    const explorar = childRoutes.find((route) => route.path === 'explorar');
    expect(await inicio?.loadComponent?.()).toBe(DashboardPage);
    expect(await explorar?.loadComponent?.()).toBe(ExplorePage);
  });

  it('provides standalone guest support and emergency routes', () => {
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: 'bienvenida',
        loadComponent: expect.any(Function),
      }),
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: 'apoyo/:activity',
        loadComponent: expect.any(Function),
      }),
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: 'necesito-ayuda',
        loadComponent: expect.any(Function),
      }),
    );
    expect(childRoutes.map((route) => route.path)).not.toContain('necesito-ayuda');
  });

  it('provides the standalone Crear Cuenta route', () => {
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: 'crear-cuenta',
        loadComponent: expect.any(Function),
      }),
    );
  });

  it('provides public password recovery routes outside the authenticated shell', () => {
    for (const path of ['forgot-password', 'reset-password']) {
      expect(routes).toContainEqual(
        expect.objectContaining({
          path,
          loadComponent: expect.any(Function),
        }),
      );
    }
    expect(shellRoute?.children?.map((route) => route.path)).not.toEqual(
      expect.arrayContaining(['forgot-password', 'reset-password']),
    );
  });

  it('keeps the existing subviews accessible behind authentication when needed', () => {
    expect(childRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        'inicio',
        'explorar',
        'bienestar',
        'registro-emocional',
        'mi-bienestar',
        'mi-plan',
        'plan-seguridad',
        'red-apoyo',
        'informacion-recursos',
        'recursos',
        'recursos-informacion',
        'configuracion-notificaciones',
        'perfil',
      ]),
    );
    expect(childRoutes.find((route) => route.path === 'bienestar')?.canActivate)
      .toBeUndefined();
    expect(
      childRoutes.find((route) => route.path === 'registro-emocional')?.canActivate,
    ).toBeUndefined();
    for (const path of [
      'mi-bienestar',
      'red-apoyo',
      'configuracion-notificaciones',
      'perfil',
    ]) {
      expect(childRoutes.find((route) => route.path === path)?.canActivate).toContain(
        authGuard,
      );
    }
    for (const path of ['mi-plan', 'plan-seguridad']) {
      expect(childRoutes.find((route) => route.path === path)?.canActivate)
        .toBeUndefined();
    }
  });

  it('redirects unknown routes to Inicio', () => {
    expect(routes.at(-1)).toEqual(
      expect.objectContaining({
        path: '**',
        redirectTo: 'inicio',
      }),
    );
  });
});
