import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { IonButton, IonContent } from '@ionic/angular';
import { RouterLink } from '@angular/router';

import {
  EmotionId,
  emotionLabels,
  MoodId,
  moodLabels,
} from './emotional-session';
import { apiErrorMessage } from '../../core/api/api-error';
import {
  EmotionalPatterns,
  EmotionalRecord,
  Page,
} from '../../core/api/api.models';
import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';

export type HistoryPeriod = 'week' | 'month' | 'year';

@Component({
  selector: 'app-wellbeing',
  templateUrl: './wellbeing.page.html',
  styleUrl: './wellbeing.page.scss',
  imports: [IonButton, IonContent, RouterLink],
})
export class WellbeingPage {
  private readonly emotionalRecordApi = inject(EmotionalRecordApiService);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription?: Subscription;
  private patternsSubscription?: Subscription;

  readonly records = signal<readonly EmotionalRecord[]>([]);
  readonly patterns = signal<EmotionalPatterns | null>(null);
  readonly loading = signal(false);
  readonly patternsLoading = signal(false);
  readonly loadError = signal('');
  readonly patternsError = signal('');
  readonly patternsOpen = signal(false);
  readonly selectedPeriod = signal<HistoryPeriod>('month');
  readonly page = signal(1);
  readonly pageSize = 20;
  readonly pagination = signal<Page<EmotionalRecord>['pagination']>({
    page: 1,
    pageSize: this.pageSize,
    total: 0,
    totalPages: 0,
  });
  readonly moodLabels = moodLabels;
  readonly emotionLabels = emotionLabels;
  readonly filteredRecords = computed(() => this.records());
  readonly patternMoodCounts = computed(() => {
    const counts = this.patterns()?.moodCounts;
    if (!counts) return [];
    return (Object.keys(counts) as MoodId[])
      .filter((id) => counts[id] > 0)
      .sort((left, right) => counts[right] - counts[left])
      .map((id) => ({ label: this.moodLabels[id], count: counts[id] }));
  });
  readonly patternEmotionCounts = computed(() => {
    const counts = this.patterns()?.emotionCounts;
    if (!counts) return [];
    return (Object.keys(counts) as EmotionId[])
      .filter((id) => counts[id] > 0)
      .sort((left, right) => counts[right] - counts[left])
      .map((id) => ({ label: this.emotionLabels[id], count: counts[id] }));
  });
  readonly patternBuckets = computed(() =>
    (this.patterns()?.buckets ?? []).map((bucket) => ({
      ...bucket,
      moodSummary: Object.entries(bucket.moodCounts)
        .filter((entry): entry is [string, number] => (entry[1] ?? 0) > 0)
        .map(([id, count]) => `${this.moodLabels[id as MoodId]}: ${count}`)
        .join(', '),
    })),
  );
  readonly moodEmojis: Record<MoodId, string> = {
    'muy-bien': '😄',
    bien: '🙂',
    'mas-o-menos': '😐',
    mal: '😔',
    'muy-mal': '😣',
  };

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.loadSubscription?.unsubscribe();
      this.patternsSubscription?.unsubscribe();
    });
  }

  ionViewWillEnter(): void {
    void this.loadRecords();
    if (this.patternsOpen()) this.loadPatterns();
  }

  loadRecords(): void {
    this.loadSubscription?.unsubscribe();
    this.loading.set(true);
    this.loadError.set('');
    this.loadSubscription = this.emotionalRecordApi
      .list(this.page(), this.pageSize, this.selectedPeriod())
      .pipe(
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (result) => {
          this.records.set(result.items);
          this.pagination.set(result.pagination);
        },
        error: (error: unknown) =>
          this.loadError.set(apiErrorMessage(error)),
      });
  }

  selectPeriod(period: HistoryPeriod): void {
    this.selectedPeriod.set(period);
    this.page.set(1);
    this.loadRecords();
    if (this.patternsOpen()) this.loadPatterns();
  }

  togglePatterns(): void {
    const open = !this.patternsOpen();
    this.patternsOpen.set(open);
    if (open) this.loadPatterns();
  }

  loadPatterns(): void {
    this.patternsSubscription?.unsubscribe();
    this.patternsLoading.set(true);
    this.patternsError.set('');
    this.patternsSubscription = this.emotionalRecordApi
      .patterns(this.selectedPeriod())
      .pipe(finalize(() => this.patternsLoading.set(false)))
      .subscribe({
        next: (result) => this.patterns.set(result),
        error: (error: unknown) =>
          this.patternsError.set(apiErrorMessage(error)),
      });
  }

  selectPage(page: number): void {
    if (page < 1 || page > this.pagination().totalPages) return;
    this.page.set(page);
    this.loadRecords();
  }
}
