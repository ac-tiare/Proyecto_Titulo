import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { finalize, Subscription } from 'rxjs';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
} from '@ionic/angular';
import { RouterLink } from '@angular/router';

import {
  EmotionId,
  emotionLabels,
  MoodId,
  moodLabels,
} from './emotional-session';
import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';
import { AuthStateService } from '../../core/api/auth-state.service';
import {
  EmotionalPatterns,
  EmotionalRecord,
  Page,
} from '../../core/api/api.models';
import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';
import { QuickCheckInService } from '../../core/quick-check-in.service';
import type { SessionCheckIn } from '../../core/quick-check-in.service';

export type HistoryPeriod = 'week' | 'month' | 'year';
export type WellbeingView = 'summary' | 'history';

interface MoodCount {
  id: MoodId;
  label: string;
  count: number;
  color: string;
}

interface BalanceAxis {
  id: 'calm' | 'energy' | 'stress' | 'connection';
  label: string;
  count: number;
  value: number;
  x: number;
  y: number;
}

@Component({
  selector: 'app-wellbeing',
  templateUrl: './wellbeing.page.html',
  styleUrl: './wellbeing.page.scss',
  imports: [
    IonButton,
    IonContent,
    IonFab,
    IonFabButton,
    IonIcon,
    LowerCasePipe,
    RouterLink,
  ],
})
export class WellbeingPage {
  private readonly emotionalRecordApi = inject(EmotionalRecordApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly authState = inject(AuthStateService);
  readonly checkInSession = inject(QuickCheckInService);
  private readonly destroyRef = inject(DestroyRef);
  private loadSubscription?: Subscription;
  private patternsSubscription?: Subscription;
  private sessionSubscription?: Subscription;

  readonly records = signal<readonly EmotionalRecord[]>([]);
  readonly guestView = signal(false);
  readonly patterns = signal<EmotionalPatterns | null>(null);
  readonly loading = signal(false);
  readonly patternsLoading = signal(false);
  readonly loadError = signal('');
  readonly sessionError = signal('');
  readonly patternsError = signal('');
  readonly activeView = signal<WellbeingView>('summary');
  readonly selectedAxis = signal<BalanceAxis['id']>('calm');
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
  readonly filteredRecords = computed(() => {
    const records = this.records();
    const periodRecords = this.guestView()
      ? records.filter((record) =>
          this.isInSelectedPeriod(record.dateTimestamp),
        )
      : records;
    if (!this.guestView()) return periodRecords;
    const start = (this.page() - 1) * this.pageSize;
    return periodRecords.slice(start, start + this.pageSize);
  });
  readonly todayRecord = computed(() => {
    const now = new Date();
    return this.records()
      .filter((record) => {
        const date = new Date(record.dateTimestamp);
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate()
        );
      })
      .sort((left, right) => right.dateTimestamp - left.dateTimestamp)[0] ?? null;
  });
  readonly summaryMoodCounts = computed<readonly MoodCount[]>(() => {
    const counts = Object.fromEntries(
      (Object.keys(this.moodLabels) as MoodId[]).map((id) => [id, 0]),
    ) as Record<MoodId, number>;
    if (this.guestView()) {
      for (const record of this.periodSessionRecords()) {
        counts[record.moodId] += 1;
      }
    } else {
      const serverCounts = this.patterns()?.moodCounts;
      if (serverCounts) {
        for (const id of Object.keys(counts) as MoodId[]) {
          counts[id] = serverCounts[id] ?? 0;
        }
      }
      for (const record of this.pendingPeriodRecords()) {
        counts[record.moodId] += 1;
      }
    }

    return (Object.keys(counts) as MoodId[]).map((id) => ({
      id,
      label: this.moodLabels[id],
      count: counts[id],
      color: this.moodColors[id],
    }));
  });
  readonly summaryEmotionCounts = computed<readonly {
    id: EmotionId;
    label: string;
    count: number;
  }[]>(() => {
    const counts = Object.fromEntries(
      (Object.keys(this.emotionLabels) as EmotionId[]).map((id) => [id, 0]),
    ) as Record<EmotionId, number>;
    if (this.guestView()) {
      for (const record of this.periodSessionRecords()) {
        for (const id of record.emotionIds) counts[id] += 1;
      }
    } else {
      const serverCounts = this.patterns()?.emotionCounts;
      if (serverCounts) {
        for (const id of Object.keys(counts) as EmotionId[]) {
          counts[id] = serverCounts[id] ?? 0;
        }
      }
      for (const record of this.pendingPeriodRecords()) {
        for (const id of record.emotionIds) counts[id] += 1;
      }
    }
    return (Object.keys(counts) as EmotionId[])
      .map((id) => ({ id, label: this.emotionLabels[id], count: counts[id] }))
      .filter((item) => item.count > 0)
      .sort((left, right) => right.count - left.count)
      .slice(0, 3);
  });
  readonly summaryRecordCount = computed(() => {
    if (this.guestView()) return this.periodSessionRecords().length;
    return (
      (this.patterns()?.recordCount ?? 0) +
      this.pendingPeriodRecords().length
    );
  });
  readonly balanceAxes = computed<readonly BalanceAxis[]>(() => {
    const records = this.dashboardRecords();
    const total = this.summaryRecordCount();
    const counts = this.summaryEmotionCountsById();
    const energyCount = records.filter((record) =>
      /\b(energ[ií]a|cansancio|fatiga|agotamiento|sue[nñ]o|somnolencia)\b/i.test(
        `${record.otherEmotion} ${record.note}`,
      ),
    ).length;
    const definitions = [
      { id: 'calm', label: 'Calma mental', count: counts.calma },
      { id: 'energy', label: 'Energía física', count: energyCount },
      {
        id: 'stress',
        label: 'Manejo del estrés',
        count: counts.ansiedad + counts.miedo + counts.enojo,
      },
      {
        id: 'connection',
        label: 'Conexión y apoyo',
        count: counts.soledad + counts.esperanza,
      },
    ] as const;
    const radius = 65;
    return definitions.map((definition, index) => {
      const angle = (-90 + index * 90) * (Math.PI / 180);
      return {
        ...definition,
        value:
          total === 0
            ? 0
            : Math.min(100, Math.round((definition.count / total) * 100)),
        x: 120 + Math.cos(angle) * radius,
        y: 120 + Math.sin(angle) * radius,
      };
    });
  });
  readonly balancePolygonPoints = computed(() =>
    this.balanceAxes()
      .map((axis) => {
        const radius = 65 * (axis.value / 100);
        const angle = Math.atan2(axis.y - 120, axis.x - 120);
        return `${120 + Math.cos(angle) * radius},${120 + Math.sin(angle) * radius}`;
      })
      .join(' '),
  );
  readonly selectedBalanceAxis = computed(
    () =>
      this.balanceAxes().find((axis) => axis.id === this.selectedAxis()) ?? null,
  );
  readonly moodEmojis: Record<MoodId, string> = {
    'muy-bien': '😄',
    bien: '🙂',
    'mas-o-menos': '😐',
    mal: '😔',
    'muy-mal': '😣',
  };
  readonly balanceGridPoints = [25, 50, 75, 100].map((value) =>
    this.axisCoordinates(value),
  );

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.loadSubscription?.unsubscribe();
      this.patternsSubscription?.unsubscribe();
      this.sessionSubscription?.unsubscribe();
    });
  }

  ionViewWillEnter(): void {
    this.sessionSubscription?.unsubscribe();
    this.sessionSubscription = this.authSession.restore().subscribe({
      next: (user) => {
        this.guestView.set(!user);
        this.sessionError.set('');
        if (user) {
          this.loadRecords();
          this.loadPatterns();
        } else {
          this.loadSessionRecords();
        }
      },
      error: (error: unknown) => {
        this.guestView.set(!this.authState.user());
        this.sessionError.set(
          `No se pudo comprobar la sesión. Se muestran los check-ins de esta sesión. ${apiErrorMessage(error)}`,
        );
        this.loadSessionRecords();
      },
    });
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
          const localRecords = this.checkInSession
            .records()
            .filter((record) => !record.synchronized);
          const overriddenServerIds = new Set(
            localRecords
              .map((record) => record.serverId)
              .filter((id): id is string => id !== null),
          );
          const serverRecords = result.items.filter(
            (record) => !overriddenServerIds.has(record.id),
          );
          const visibleLocalRecords =
            this.page() === 1
              ? localRecords.map((record) => this.toEmotionalRecord(record))
              : [];
          const total = Math.max(
            0,
            result.pagination.total -
              result.items.filter((record) => overriddenServerIds.has(record.id))
                .length +
              localRecords.length,
          );
          this.records.set(
            [...visibleLocalRecords, ...serverRecords].sort(
              (left, right) => right.dateTimestamp - left.dateTimestamp,
            ),
          );
          this.pagination.set({
            ...result.pagination,
            total,
            totalPages: Math.ceil(total / this.pageSize),
          });
        },
        error: (error: unknown) =>
          this.loadError.set(apiErrorMessage(error)),
      });
  }

  selectPeriod(period: HistoryPeriod): void {
    this.selectedPeriod.set(period);
    this.page.set(1);
    if (this.guestView()) {
      this.loadSessionRecords();
    } else {
      this.loadRecords();
      this.loadPatterns();
    }
  }

  selectView(view: WellbeingView): void {
    this.activeView.set(view);
    if (view === 'summary' && this.page() !== 1) {
      this.page.set(1);
      if (this.guestView()) {
        this.pagination.update((pagination) => ({ ...pagination, page: 1 }));
      } else {
        this.loadRecords();
      }
    }
  }

  selectAxis(axis: BalanceAxis['id']): void {
    this.selectedAxis.set(axis);
  }

  moodDistributionLabel(): string {
    const distribution = this.summaryMoodCounts()
      .map((item) => `${item.label}: ${item.count}`)
      .join(', ');
    return `Distribución de estados emocionales: ${distribution}`;
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
    if (this.guestView()) {
      this.pagination.update((pagination) => ({ ...pagination, page }));
    } else {
      this.loadRecords();
    }
  }

  private loadSessionRecords(): void {
    const records = this.checkInSession
      .records()
      .filter((record) => !this.guestView() || record.serverId === null)
      .map((record) => this.toEmotionalRecord(record))
      .sort((left, right) => right.dateTimestamp - left.dateTimestamp);
    this.records.set(records);
    const periodRecords = records.filter((record) =>
      this.isInSelectedPeriod(record.dateTimestamp),
    );
    this.pagination.set({
      page: 1,
      pageSize: this.pageSize,
      total: periodRecords.length,
      totalPages: Math.ceil(periodRecords.length / this.pageSize),
    });
    this.loading.set(false);
    this.loadError.set('');
  }

  private toEmotionalRecord(record: SessionCheckIn): EmotionalRecord {
    return {
      id: record.id,
      moodId: record.moodId,
      emotionIds: [...record.emotionIds],
      note: record.note,
      otherEmotion: record.otherEmotion,
      date: record.date,
      dateTimestamp: record.dateTimestamp,
    };
  }

  private readonly moodColors = {
    'muy-bien': '#6b9b78',
    bien: '#8bb59a',
    'mas-o-menos': '#d6ac62',
    mal: '#c98291',
    'muy-mal': '#a96f89',
  } satisfies Record<MoodId, string>;

  private periodSessionRecords(): readonly EmotionalRecord[] {
    return this.checkInSession
      .records()
      .filter((record) => !this.guestView() || record.serverId === null)
      .filter((record) => this.isInSelectedPeriod(record.dateTimestamp));
  }

  private pendingPeriodRecords(): readonly SessionCheckIn[] {
    return this.checkInSession
      .records()
      .filter(
        (record) =>
          !record.synchronized &&
          record.serverId === null &&
          this.isInSelectedPeriod(record.dateTimestamp),
      );
  }

  private dashboardRecords(): readonly EmotionalRecord[] {
    return this.guestView()
      ? this.periodSessionRecords()
      : this.records();
  }

  private summaryEmotionCountsById(): Record<EmotionId, number> {
    const counts = Object.fromEntries(
      (Object.keys(this.emotionLabels) as EmotionId[]).map((id) => [id, 0]),
    ) as Record<EmotionId, number>;
    if (!this.guestView()) {
      const serverCounts = this.patterns()?.emotionCounts;
      if (serverCounts) {
        for (const id of Object.keys(counts) as EmotionId[]) {
          counts[id] = serverCounts[id] ?? 0;
        }
      }
    }
    for (const record of this.guestView()
      ? this.periodSessionRecords()
      : this.pendingPeriodRecords()) {
      for (const id of record.emotionIds) counts[id] += 1;
    }
    return counts;
  }

  private isInSelectedPeriod(timestamp: number): boolean {
    const date = new Date(timestamp);
    const now = new Date();
    if (this.selectedPeriod() === 'year') {
      return date.getFullYear() === now.getFullYear();
    }
    if (this.selectedPeriod() === 'month') {
      return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    }
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);
    return date >= startOfWeek && date <= endOfToday;
  }

  private axisCoordinates(value: number): string {
    const radius = 65 * (value / 100);
    return [0, 1, 2, 3]
      .map((index) => {
        const angle = (-90 + index * 90) * (Math.PI / 180);
        return `${120 + Math.cos(angle) * radius},${120 + Math.sin(angle) * radius}`;
      })
      .join(' ');
  }
}
