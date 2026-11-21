import { Location } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
} from '@ionic/angular';

import { OfficialSupportResourcesComponent } from '../../shared/official-support-resources.component';

@Component({
  selector: 'app-need-help',
  templateUrl: './need-help.page.html',
  styleUrl: './need-help.page.scss',
  imports: [
    IonButton,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    OfficialSupportResourcesComponent,
    RouterLink,
  ],
})
export class NeedHelpPage {
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  goBack(): void {
    const navigationId = window.history.state?.navigationId;
    if (typeof navigationId === 'number' && navigationId > 1) {
      this.location.back();
      return;
    }

    void this.router.navigateByUrl('/inicio');
  }

}
