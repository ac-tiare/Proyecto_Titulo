import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular';

import { GuestSessionService } from '../../core/guest-session.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
  imports: [IonContent, IonIcon, RouterLink],
})
export class HomePage {
  readonly guestSession = inject(GuestSessionService);
  readonly welcomeReturnQueryParams = { returnTo: 'bienvenida' } as const;

  constructor() {
    this.guestSession.initialize();
  }
}
