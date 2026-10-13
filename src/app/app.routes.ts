import { Routes } from '@angular/router';

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
    path: '',
    redirectTo: 'login',
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
        path: 'inicio',
        loadComponent: () =>
          import('./features/home/home.page').then((module) => module.HomePage),
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
        path: 'plan-seguridad',
        loadComponent: () =>
          import('./features/safety/safety-plan.page').then(
            (module) => module.SafetyPlanPage,
          ),
      },
      {
        path: 'red-apoyo',
        loadComponent: () =>
          import('./features/safety/support-network.page').then(
            (module) => module.SupportNetworkPage,
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
        path: 'informacion-recursos',
        loadComponent: () =>
          import('./features/safety/resources.page').then(
            (module) => module.ResourcesPage,
          ),
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./features/profile/profile.page').then(
            (module) => module.ProfilePage,
          ),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
