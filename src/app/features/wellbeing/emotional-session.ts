import { Injectable, signal } from '@angular/core';

export const moodOptions = [
  { id: 'muy-mal', label: 'Muy mal', emoji: '😞' },
  { id: 'mal', label: 'Mal', emoji: '😕' },
  { id: 'mas-o-menos', label: 'Más o menos', emoji: '😐' },
  { id: 'bien', label: 'Bien', emoji: '🙂' },
  { id: 'muy-bien', label: 'Muy bien', emoji: '😄' },
] as const;

export type MoodId = (typeof moodOptions)[number]['id'];

export const moodLabels: Record<MoodId, string> = {
  'muy-mal': 'Muy mal',
  mal: 'Mal',
  'mas-o-menos': 'Más o menos',
  bien: 'Bien',
  'muy-bien': 'Muy bien',
};

@Injectable({ providedIn: 'root' })
export class EmotionalSessionService {
  private readonly currentMood = signal<MoodId | null>(null);
  readonly selectedMood = this.currentMood.asReadonly();

  select(moodId: MoodId): void {
    this.currentMood.set(moodId);
  }

  clear(): void {
    this.currentMood.set(null);
  }
}
