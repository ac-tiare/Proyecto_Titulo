import { routes } from './app.routes';

describe('application routes', () => {
  const shellRoute = routes.find((route) => route.path === '' && route.children);
  const childRoutes = shellRoute?.children ?? [];

  it('opens Inicio by default', () => {
    expect(childRoutes).toContainEqual(
      expect.objectContaining({
        path: '',
        redirectTo: 'inicio',
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

  it('redirects unknown routes to Inicio', () => {
    expect(routes.at(-1)).toEqual(
      expect.objectContaining({
        path: '**',
        redirectTo: 'inicio',
      }),
    );
  });
});
