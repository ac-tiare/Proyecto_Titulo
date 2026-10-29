import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
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
import { apiErrorMessage } from '../../core/api/api-error';
import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';

@Component({
  selector: 'app-emotional-entry',
  templateUrl: './emotional-entry.page.html',
  styleUrl: './emotional-entry.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput, IonTextarea],
})
export class EmotionalEntryPage {
  private readonly router = inject(Router);
  private readonly emotionalSession = inject(EmotionalSessionService);
  private readonly emotionalRecordApi = inject(EmotionalRecordApiService);

  readonly moods = moodOptions;
  readonly emotions = emotionOptions;
  readonly moodLabels = moodLabels;
  readonly selectedMood = this.emotionalSession.selectedMood;
  readonly draft = this.emotionalSession.draft;
  readonly saveMessage = signal('');
  readonly isSaving = signal(false);

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
    if (draft?.saved || this.isSaving()) {
      return;
    }

    const errors: string[] = [];

    if (!draft?.moodId) {
      errors.push('Selecciona un estado emocional.');
    }
    if (!draft?.emotionIds.length) {
      errors.push('Selecciona al menos una emoción.');
    }
    if (draft?.emotionIds.includes('otra') && !draft.otherEmotion.trim()) {
      errors.push('Describe la otra emoción.');
    }
    if (errors.length || !draft?.moodId || !draft.emotionIds.length) {
      this.saveMessage.set(errors.join(' '));
      return;
    }

    this.saveMessage.set('');
    this.isSaving.set(true);
    this.emotionalRecordApi
      .create({
        moodId: draft.moodId,
        emotionIds: [...draft.emotionIds],
        note: draft.note,
        otherEmotion: draft.otherEmotion,
      })
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.emotionalSession.markDraftSaved();
          this.saveMessage.set('Tu registro emocional fue guardado.');
        },
        error: (error: unknown) =>
          this.saveMessage.set(apiErrorMessage(error)),
      });
  }

  async finish(): Promise<void> {
    this.emotionalSession.clear();
    await this.router.navigate(['/inicio']);
  }
}
