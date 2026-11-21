import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { AuthSessionService } from '../../core/api/auth-session.service';
import { AuthStateService } from '../../core/api/auth-state.service';
import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';
import { QuickCheckInService } from '../../core/quick-check-in.service';

@Component({
  selector: 'app-emotional-entry',
  templateUrl: './emotional-entry.page.html',
  styleUrl: './emotional-entry.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput, IonTextarea, RouterLink],
})
export class EmotionalEntryPage {
  private readonly router = inject(Router);
  private readonly emotionalSession = inject(EmotionalSessionService);
  private readonly emotionalRecordApi = inject(EmotionalRecordApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly authState = inject(AuthStateService);
  private readonly quickCheckIn = inject(QuickCheckInService);
  private readonly destroyRef = inject(DestroyRef);

  readonly moods = moodOptions;
  readonly emotions = emotionOptions;
  readonly moodLabels = moodLabels;
  readonly selectedMood = this.emotionalSession.selectedMood;
  readonly draft = this.emotionalSession.draft;
  readonly saveMessage = signal('');
  readonly isSaving = signal(false);
  readonly guestMode = signal(false);
  readonly sessionReady = signal(false);
  readonly sessionMessage = signal('');

  constructor() {
    this.emotionalSession.ensureDraft();
    this.authSession
      .restore()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (user) => {
          this.guestMode.set(!user);
          this.sessionReady.set(true);
        },
        error: (error: unknown) => {
          this.guestMode.set(!this.authState.user());
          this.sessionReady.set(true);
          this.sessionMessage.set(
            `No se pudo comprobar la sesión. ${
              this.guestMode()
                ? 'El registro quedará solo en esta sesión.'
                : apiErrorMessage(error)
            }`,
          );
        },
      });
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
    if (!this.sessionReady()) {
      this.saveMessage.set('Estamos comprobando tu sesión. Inténtalo nuevamente en un momento.');
      return;
    }

    this.saveMessage.set('');
    if (this.guestMode()) {
      this.quickCheckIn.addMood(draft.moodId, {
        emotionIds: [...draft.emotionIds],
        note: draft.note,
        otherEmotion: draft.otherEmotion,
      });
      this.emotionalSession.markDraftSaved();
      this.saveMessage.set(
        'Tu registro quedó guardado solo durante esta sesión en este dispositivo.',
      );
      return;
    }

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
    await this.router.navigate(['/bienestar']);
  }
}
