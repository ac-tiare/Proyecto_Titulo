import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withComponentInputBinding, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import {
  alertCircleOutline,
  arrowForwardOutline,
  heartOutline,
  homeOutline,
  informationCircleOutline,
  peopleOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import { addIcons } from 'ionicons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

addIcons({
  alertCircleOutline,
  arrowForwardOutline,
  heartOutline,
  homeOutline,
  informationCircleOutline,
  peopleOutline,
  personCircleOutline,
  shieldCheckmarkOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules), withComponentInputBinding()),
  ],
});
