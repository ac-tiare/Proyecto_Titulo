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

export interface EmotionalDraft {
  id: number;
  moodId: MoodId | null;
  emotionIds: readonly EmotionId[];
  note: string;
  date: string;
  saved: boolean;
}

export interface EmotionalRecord extends Omit<EmotionalDraft, 'saved'> {
  moodId: MoodId;
}

@Injectable({ providedIn: 'root' })
export class EmotionalSessionService {
  private readonly currentDraft = signal<EmotionalDraft | null>(null);
  private readonly currentRecords = signal<readonly EmotionalRecord[]>([]);
  private nextDraftId = 1;

  readonly draft = this.currentDraft.asReadonly();
  readonly records = this.currentRecords.asReadonly();
  readonly selectedMood = computed(() => this.currentDraft()?.moodId ?? null);

  startDraft(moodId: MoodId): void {
    this.currentDraft.set({
      id: this.nextDraftId++,
      moodId,
      emotionIds: [],
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

  saveDraft(): EmotionalRecord | null {
    const draft = this.currentDraft();
    if (!draft || !draft.moodId || !draft.emotionIds.length || draft.saved) {
      return null;
    }

    const record: EmotionalRecord = { ...draft, moodId: draft.moodId };
    this.currentRecords.update((records) => [...records, record]);
    this.currentDraft.set({ ...draft, saved: true });
    return record;
  }

  clear(): void {
    this.currentDraft.set(null);
  }
}
