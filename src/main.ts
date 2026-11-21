import { isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { provideHttpClient, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import {
  alertCircleOutline,
  arrowForwardOutline,
  bookOutline,
  calendarClearOutline,
  chevronForwardOutline,
  compassOutline,
  createOutline,
  eyeOutline,
  heartOutline,
  helpCircleOutline,
  homeOutline,
  informationCircleOutline,
  leafOutline,
  openOutline,
  notificationsOutline,
  peopleOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
  volumeMuteOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Capacitor } from '@capacitor/core';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { apiInterceptor } from './app/core/api/api.interceptor';

addIcons({
  alertCircleOutline,
  arrowForwardOutline,
  bookOutline,
  calendarClearOutline,
  chevronForwardOutline,
  compassOutline,
  createOutline,
  eyeOutline,
  heartOutline,
  helpCircleOutline,
  homeOutline,
  informationCircleOutline,
  leafOutline,
  openOutline,
  notificationsOutline,
  peopleOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
  volumeMuteOutline,
});

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [
      { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
      provideIonicAngular(),
      provideHttpClient(
        withXsrfConfiguration({
          cookieName: 'XSRF-TOKEN',
          headerName: 'X-XSRF-TOKEN',
        }),
        withInterceptors([apiInterceptor]),
      ),
      provideRouter(
        routes,
        withPreloading(PreloadAllModules),
        withComponentInputBinding(),
      ),
    ],
  });

const startApplication = async (): Promise<void> => {
  if (
    !isDevMode() &&
    !Capacitor.isNativePlatform() &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  ) {
    try {
      await navigator.serviceWorker.register('/contigo-sw.js');
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<void>((resolve) => window.setTimeout(resolve, 1500)),
      ]);
    } catch (error: unknown) {
      console.error('No se pudo habilitar el acceso sin conexión.', error);
    }
  }

  await bootstrap();
};

void startApplication();
