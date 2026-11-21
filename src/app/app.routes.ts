import { Routes } from '@angular/router';

import { authGuard } from './core/api/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.page').then((module) => module.LoginPage),
  },
  {
    path: 'crear-cuenta',
    loadComponent: () =>
      import('./features/login/register.page').then(
        (module) => module.RegisterPage,
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/login/forgot-password.page').then(
        (module) => module.ForgotPasswordPage,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./features/login/reset-password.page').then(
        (module) => module.ResetPasswordPage,
      ),
  },
  {
    path: 'bienvenida',
    loadComponent: () =>
      import('./features/home/home.page').then((module) => module.HomePage),
  },
  {
    path: 'apoyo/:activity',
    loadComponent: () =>
      import('./features/wellbeing/quick-support.page').then(
        (module) => module.QuickSupportPage,
      ),
  },
  {
    path: 'necesito-ayuda',
    loadComponent: () =>
      import('./features/safety/need-help.page').then(
        (module) => module.NeedHelpPage,
      ),
  },
  {
    path: '',
    redirectTo: 'inicio',
    pathMatch: 'full',
  },
  {
    path: '',
    loadComponent: () =>
      import('./core/layout/main-tabs/main-tabs.component').then(
        (module) => module.MainTabsComponent,
      ),
    children: [
      {
        path: '',
        redirectTo: 'inicio',
        pathMatch: 'full',
      },
      {
        path: 'inicio',
        loadComponent: () =>
          import('./features/home/dashboard.page').then(
            (module) => module.DashboardPage,
          ),
      },
      {
        path: 'explorar',
        loadComponent: () =>
          import('./features/home/explore.page').then(
            (module) => module.ExplorePage,
          ),
      },
      {
        path: 'bienestar',
        loadComponent: () =>
          import('./features/wellbeing/wellbeing.page').then(
            (module) => module.WellbeingPage,
          ),
      },
      {
        path: 'registro-emocional',
        loadComponent: () =>
          import('./features/wellbeing/emotional-entry.page').then(
            (module) => module.EmotionalEntryPage,
          ),
      },
      {
        path: 'mi-bienestar',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/wellbeing/emotional-entry.page').then(
            (module) => module.EmotionalEntryPage,
          ),
      },
      {
        path: 'mi-plan',
        loadComponent: () =>
          import('./features/safety/safety-plan.page').then(
            (module) => module.SafetyPlanPage,
          ),
      },
      {
        path: 'plan-seguridad',
        loadComponent: () =>
          import('./features/safety/safety-plan.page').then(
            (module) => module.SafetyPlanPage,
          ),
      },
      {
        path: 'red-apoyo',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/safety/support-network.page').then(
            (module) => module.SupportNetworkPage,
          ),
      },
      {
        path: 'informacion-recursos',
        loadComponent: () =>
          import('./features/safety/resources.page').then(
            (module) => module.ResourcesPage,
          ),
      },
      {
        path: 'recursos',
        loadComponent: () =>
          import('./features/safety/resources.page').then(
            (module) => module.ResourcesPage,
          ),
      },
      {
        path: 'recursos-informacion',
        loadComponent: () =>
          import('./features/safety/resources.page').then(
            (module) => module.ResourcesPage,
          ),
      },
      {
        path: 'configuracion-notificaciones',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/settings/notifications.page').then(
            (module) => module.NotificationsPage,
          ),
      },
      {
        path: 'perfil',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/profile/profile.page').then(
            (module) => module.ProfilePage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'inicio',
  },
];
