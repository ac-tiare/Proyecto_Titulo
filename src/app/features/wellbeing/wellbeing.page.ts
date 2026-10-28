import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonContent } from '@ionic/angular';
import { RouterLink } from '@angular/router';

import {
  EmotionalRecord,
  EmotionalSessionService,
  emotionLabels,
  moodLabels,
  MoodId,
} from './emotional-session';

export type HistoryPeriod = 'week' | 'month' | 'year';

@Component({
  selector: 'app-wellbeing',
  templateUrl: './wellbeing.page.html',
  styleUrl: './wellbeing.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class WellbeingPage {
  private readonly emotionalSession = inject(EmotionalSessionService);

  readonly records = signal<readonly EmotionalRecord[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly selectedPeriod = signal<HistoryPeriod>('month');
  readonly moodLabels = moodLabels;
  readonly emotionLabels = emotionLabels;
  readonly moodEmojis: Record<MoodId, string> = {
    'muy-bien': '😄',
    bien: '🙂',
    'mas-o-menos': '😐',
    mal: '😔',
    'muy-mal': '😣',
  };
  readonly filteredRecords = computed(() => {
    const now = new Date();
    const period = this.selectedPeriod();
    const start = new Date(now);

    if (period === 'week') {
      start.setDate(start.getDate() - 7);
    } else if (period === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }

    return this.records().filter((record) =>
      record.dateTimestamp >= start.getTime() &&
      record.dateTimestamp <= now.getTime(),
    );
  });

  ionViewWillEnter(): void {
    void this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(false);
    this.loadError.set('');
    this.records.set(this.emotionalSession.records());
  }

  selectPeriod(period: HistoryPeriod): void {
    this.selectedPeriod.set(period);
  }
}
