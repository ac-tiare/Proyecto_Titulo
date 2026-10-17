import { computed, Injectable, signal } from '@angular/core';

export const moodOptions = [
  { id: 'muy-bien', label: 'Muy bien', emoji: '😄' },
  { id: 'bien', label: 'Bien', emoji: '🙂' },
  { id: 'mas-o-menos', label: 'Regular', emoji: '😐' },
  { id: 'mal', label: 'Mal', emoji: '😔' },
  { id: 'muy-mal', label: 'Muy mal', emoji: '😣' },
] as const;

export type MoodId = (typeof moodOptions)[number]['id'];

export const moodLabels: Record<MoodId, string> = {
  'muy-bien': 'Muy bien',
  bien: 'Bien',
  'mas-o-menos': 'Regular',
  mal: 'Mal',
  'muy-mal': 'Muy mal',
};

export const emotionOptions = [
  { id: 'tristeza', label: 'Tristeza' },
  { id: 'ansiedad', label: 'Ansiedad' },
  { id: 'miedo', label: 'Miedo' },
  { id: 'enojo', label: 'Enojo' },
  { id: 'soledad', label: 'Soledad' },
  { id: 'calma', label: 'Calma' },
  { id: 'esperanza', label: 'Esperanza' },
  { id: 'otra', label: 'Otra' },
] as const;

export type EmotionId = (typeof emotionOptions)[number]['id'];

export const emotionLabels: Record<EmotionId, string> = {
  tristeza: 'Tristeza',
  ansiedad: 'Ansiedad',
  miedo: 'Miedo',
  enojo: 'Enojo',
  soledad: 'Soledad',
  calma: 'Calma',
  esperanza: 'Esperanza',
  otra: 'Otra',
};

export interface EmotionalDraft {
  id: number;
  moodId: MoodId | null;
  emotionIds: readonly EmotionId[];
  otherEmotion: string;
  note: string;
  date: string;
  saved: boolean;
}

@Injectable({ providedIn: 'root' })
export class EmotionalSessionService {
  private readonly currentDraft = signal<EmotionalDraft | null>(null);
  private nextDraftId = 1;

  readonly draft = this.currentDraft.asReadonly();
  readonly selectedMood = computed(() => this.currentDraft()?.moodId ?? null);

  startDraft(moodId: MoodId): void {
    this.currentDraft.set({
      id: this.nextDraftId++,
      moodId,
      emotionIds: [],
      otherEmotion: '',
      note: '',
      date: new Date().toLocaleDateString('es-CL', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      saved: false,
    });
  }

  ensureDraft(): void {
    if (!this.currentDraft()) {
      this.currentDraft.set({
        id: this.nextDraftId++,
        moodId: null,
        emotionIds: [],
        otherEmotion: '',
        note: '',
        date: new Date().toLocaleDateString('es-CL', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        saved: false,
      });
    }
  }

  select(moodId: MoodId): void {
    this.ensureDraft();
    this.currentDraft.update((draft) =>
      draft ? { ...draft, moodId } : draft,
    );
  }

  toggleEmotion(emotionId: EmotionId): void {
    this.ensureDraft();
    this.currentDraft.update((draft) => {
      if (!draft) {
        return draft;
      }

      const emotionIds = draft.emotionIds.includes(emotionId)
        ? draft.emotionIds.filter((id) => id !== emotionId)
        : [...draft.emotionIds, emotionId];

      return { ...draft, emotionIds };
    });
  }

  updateNote(note: string): void {
    this.ensureDraft();
    this.currentDraft.update((draft) => (draft ? { ...draft, note } : draft));
  }

  updateOtherEmotion(otherEmotion: string): void {
    this.ensureDraft();
    this.currentDraft.update((draft) =>
      draft ? { ...draft, otherEmotion } : draft,
    );
  }

  markSaved(): void {
    this.currentDraft.update((draft) => (draft ? { ...draft, saved: true } : draft));
  }

  clear(): void {
    this.currentDraft.set(null);
  }
}
