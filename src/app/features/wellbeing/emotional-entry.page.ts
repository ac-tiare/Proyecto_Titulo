import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonTextarea,
} from '@ionic/angular';

import {
  EmotionalSessionService,
  emotionOptions,
  EmotionId,
  moodLabels,
  moodOptions,
  MoodId,
} from './emotional-session';

@Component({
  selector: 'app-emotional-entry',
  templateUrl: './emotional-entry.page.html',
  styleUrl: './emotional-entry.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput, IonTextarea],
})
export class EmotionalEntryPage {
  private readonly router = inject(Router);
  private readonly emotionalSession = inject(EmotionalSessionService);

  readonly moods = moodOptions;
  readonly emotions = emotionOptions;
  readonly moodLabels = moodLabels;
  readonly selectedMood = this.emotionalSession.selectedMood;
  readonly draft = this.emotionalSession.draft;
  readonly saveMessage = signal('');

  constructor() {
    this.emotionalSession.ensureDraft();
  }

  selectMood(moodId: MoodId): void {
    this.emotionalSession.select(moodId);
  }

  toggleEmotion(emotionId: EmotionId): void {
    this.emotionalSession.toggleEmotion(emotionId);
  }

  updateNote(note: string): void {
    this.emotionalSession.updateNote(note);
  }

  updateOtherEmotion(otherEmotion: string): void {
    this.emotionalSession.updateOtherEmotion(otherEmotion);
  }

  save(): void {
    const draft = this.draft();
    if (draft?.saved) {
      return;
    }

    const errors: string[] = [];

    if (!draft?.moodId) {
      errors.push('Selecciona un estado emocional.');
    }
    if (!draft?.emotionIds.length) {
      errors.push('Selecciona al menos una emoción.');
    }
    if (errors.length || !draft?.moodId || !draft.emotionIds.length) {
      this.saveMessage.set(errors.join(' '));
      return;
    }

    this.saveMessage.set('');
    if (this.emotionalSession.saveDraft()) {
      this.saveMessage.set(
        'Tu registro se guardó en esta sesión; se perderá al cerrar o recargar la app.',
      );
    }
  }

  async finish(): Promise<void> {
    this.emotionalSession.clear();
    await this.router.navigate(['/inicio']);
  }
}
