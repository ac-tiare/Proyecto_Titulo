import { Component, inject, signal } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';
import { RouterLink } from '@angular/router';

import { EmotionalRecordsService, EmotionalRecord } from './emotional-records.service';
import {
  emotionLabels,
  moodLabels,
} from './emotional-session';

@Component({
  selector: 'app-wellbeing',
  templateUrl: './wellbeing.page.html',
  styleUrl: './wellbeing.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class WellbeingPage {
  private readonly recordsService = inject(EmotionalRecordsService);

  readonly records = signal<readonly EmotionalRecord[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly moodLabels = moodLabels;
  readonly emotionLabels = emotionLabels;

  ionViewWillEnter(): void {
    void this.loadRecords();
  }

  async loadRecords(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    this.records.set([]);

    try {
      this.records.set(await this.recordsService.listForCurrentUser());
    } catch {
      this.loadError.set(
        'No fue posible cargar tus registros. Revisa tu conexión o los permisos de Firestore e inténtalo nuevamente.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
