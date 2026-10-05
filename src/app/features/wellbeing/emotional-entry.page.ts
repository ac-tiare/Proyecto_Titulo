import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent } from '@ionic/angular';

import {
  EmotionalSessionService,
  moodLabels,
  moodOptions,
  MoodId,
} from './emotional-session';

@Component({
  selector: 'app-emotional-entry',
  templateUrl: './emotional-entry.page.html',
  styleUrl: './emotional-entry.page.scss',
  imports: [IonButton, IonContent],
})
export class EmotionalEntryPage {
  private readonly router = inject(Router);
  private readonly emotionalSession = inject(EmotionalSessionService);

  readonly moods = moodOptions;
  readonly moodLabels = moodLabels;
  readonly selectedMood = this.emotionalSession.selectedMood;

  selectMood(moodId: MoodId): void {
    this.emotionalSession.select(moodId);
  }

  async finish(): Promise<void> {
    this.emotionalSession.clear();
    await this.router.navigate(['/inicio']);
  }
}
