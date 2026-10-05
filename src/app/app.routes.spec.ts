import { routes } from './app.routes';

describe('application routes', () => {
  const shellRoute = routes.find((route) => route.path === '' && route.children);
  const childRoutes = shellRoute?.children ?? [];

  it('opens Login by default outside the application shell', () => {
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: 'login',
        loadComponent: expect.any(Function),
      }),
    );
    expect(routes).toContainEqual(
      expect.objectContaining({
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
      }),
    );
  });

  it('provides a route for every initial screen', () => {
    expect(childRoutes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        'inicio',
        'bienestar',
        'registro-emocional',
        'plan-seguridad',
        'red-apoyo',
        'necesito-ayuda',
        'informacion-recursos',
        'perfil',
      ]),
    );
  });

  it('redirects unknown routes to Login', () => {
    expect(routes.at(-1)).toEqual(
      expect.objectContaining({
        path: '**',
        redirectTo: 'login',
      }),
    );
  });
});
