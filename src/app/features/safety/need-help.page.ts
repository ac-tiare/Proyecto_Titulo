import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
} from '@ionic/angular';
import { PhoneIntentService } from '../../core/phone-intent.service';

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
    RouterLink,
  ],
})
export class NeedHelpPage {
  private readonly phoneIntent = inject(PhoneIntentService);

  async callOfficialLine(): Promise<void> {
    await this.phoneIntent.confirmAndOpen(
      '*4141',
      'call',
      'Línea nacional de prevención del suicidio',
    );
  }

  async callSaludResponde(): Promise<void> {
    await this.phoneIntent.confirmAndOpen(
      '600 360 7777',
      'call',
      'Salud Responde',
    );
  }
}
