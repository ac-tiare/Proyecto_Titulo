import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonInput, IonTextarea } from '@ionic/angular';
import { Subscription, finalize } from 'rxjs';

import { apiErrorMessage } from '../../core/api/api-error';
import { AuthSessionService } from '../../core/api/auth-session.service';
import { AuthStateService } from '../../core/api/auth-state.service';
import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';
import type { EmotionalRecordRequest, EmotionId, MoodId } from '../../core/api/api.models';
import { QuickCheckInService, SessionCheckIn } from '../../core/quick-check-in.service';
import { moodOptions } from '../wellbeing/emotional-session';

interface DailyPractice {
  id: string;
  title: string;
  category: string;
  duration: string;
  route: string;
  illustration: string;
  tone: CardTone;
}

interface ExploreShortcut {
  title: string;
  description: string;
  route: string;
  illustration: string;
  tone: CardTone;
}

type CardTone = 'sage' | 'sky' | 'lavender' | 'rose' | 'sand';

interface MoodWord {
  label: string;
  emotionId?: EmotionId;
}

const lowMoodWords: readonly MoodWord[] = [
  { label: 'Tristeza', emotionId: 'tristeza' },
  { label: 'Soledad', emotionId: 'soledad' },
  { label: 'Cansancio' },
  { label: 'Enojo', emotionId: 'enojo' },
  { label: 'Frustración' },
  { label: 'Celos' },
  { label: 'Miedo', emotionId: 'miedo' },
  { label: 'Inseguridad' },
  { label: 'Dolor' },
  { label: 'Ansiedad', emotionId: 'ansiedad' },
  { label: 'No sé con certeza' },
  { label: 'Otros' },
];

const neutralMoodWords: readonly MoodWord[] = [
  { label: 'Calma', emotionId: 'calma' },
  { label: 'Neutralidad' },
  { label: 'Nostalgia' },
  { label: 'Relajación' },
  { label: 'Reflexión' },
  { label: 'Somnolencia' },
  { label: 'Aburrimiento' },
  { label: 'Cansancio' },
  { label: 'Confusión' },
  { label: 'Seriedad' },
  { label: 'No sé con certeza' },
  { label: 'Otros' },
];

const positiveMoodWords: readonly MoodWord[] = [
  { label: 'Satisfacción' },
  { label: 'Serenidad' },
  { label: 'Conciencia' },
  { label: 'Alegría' },
  { label: 'Optimismo' },
  { label: 'Energía' },
  { label: 'Autoconfianza' },
  { label: 'Logro' },
  { label: 'Valía' },
  { label: 'Agradecimiento' },
  { label: 'No sé con certeza' },
  { label: 'Otros' },
];

const moodWordsByMood: Record<MoodId, readonly MoodWord[]> = {
  'muy-mal': lowMoodWords,
  mal: lowMoodWords,
  'mas-o-menos': neutralMoodWords,
  bien: positiveMoodWords,
  'muy-bien': positiveMoodWords,
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.scss',
  imports: [IonButton, IonContent, IonIcon, IonInput, IonTextarea, RouterLink],
})
export class DashboardPage {
  private readonly authSession = inject(AuthSessionService);
  private readonly authState = inject(AuthStateService);
  private readonly emotionalRecordApi = inject(EmotionalRecordApiService);
  readonly checkIns = inject(QuickCheckInService);
  private readonly destroyRef = inject(DestroyRef);
  private restoreSubscription?: Subscription;
  private readonly syncSubscriptions = new Set<Subscription>();
  private readonly syncingIds = new Set<string>();

  readonly moods = moodOptions;
  readonly sessionReady = signal(false);
  readonly guestMode = signal(true);
  readonly selectedRecordId = signal<string | null>(null);
  readonly selectedRecord = computed<SessionCheckIn | null>(() => {
    const records = this.checkIns.records();
    return (
      records.find((record) => record.id === this.selectedRecordId()) ??
      records.at(0) ??
      null
    );
  });
  readonly draftMoodId = signal<MoodId | null>(null);
  readonly activeMoodId = computed(
    () => this.draftMoodId() ?? this.selectedRecord()?.moodId ?? null,
  );
  readonly moodWords = computed(() => {
    const mood = this.draftMoodId();
    return mood ? moodWordsByMood[mood] : [];
  });
  readonly selectedMoodWords = signal<readonly string[]>([]);
  readonly selectedEmotionIds = signal<readonly EmotionId[]>([]);
  readonly note = signal('');
  readonly otherEmotion = signal('');
  readonly customOtherEmotion = signal('');
  readonly draftMessage = signal('');
  readonly checkInMessage = signal('');
  readonly sessionMessage = signal('');
  readonly syncMessage = signal('');
  readonly canSaveMood = computed(
    () =>
      this.selectedEmotionIds().length > 0 &&
      (!this.isOtherWordSelected() || !!this.customOtherEmotion().trim()),
  );
  readonly poorMoodSelected = computed(() => {
    const mood = this.activeMoodId();
    return mood === 'mal' || mood === 'muy-mal';
  });
  readonly practices: readonly DailyPractice[] = [
    {
      id: 'respirar',
      title: 'Pausa de respiración',
      category: 'Respiración',
      duration: '1 min',
      route: '/apoyo/respirar',
      illustration: 'assets/illustrations/breathing-waves.svg',
      tone: 'sage',
    },
    {
      id: 'enraizar',
      title: 'Enfoque sensorial en el vagón',
      category: 'Atención plena',
      duration: '2 min',
      route: '/apoyo/enraizar',
      illustration: 'assets/illustrations/sensory-window.svg',
      tone: 'sky',
    },
    {
      id: 'despejar',
      title: 'Lectura para despejar la mente',
      category: 'Lectura breve',
      duration: '3 min',
      route: '/apoyo/despejar',
      illustration: 'assets/illustrations/open-book.svg',
      tone: 'lavender',
    },
  ];
  readonly exploreShortcuts: readonly ExploreShortcut[] = [
    {
      title: 'Calmar ansiedad',
      description: 'Una pausa visual y silenciosa',
      route: '/apoyo/calmarme',
      illustration: 'assets/illustrations/anxiety-calm.svg',
      tone: 'rose',
    },
    {
      title: 'Mucho ruido en el metro',
      description: 'Refugio visual y corporal',
      route: '/apoyo/sobrecarga',
      illustration: 'assets/illustrations/quiet-sound.svg',
      tone: 'sky',
    },
    {
      title: 'Música para relajar',
      description: 'Sonidos suaves y lluvia para viajar',
      route: '/explorar',
      illustration: 'assets/illustrations/soft-music.svg',
      tone: 'sand',
    },
    {
      title: 'Meditación guiada',
      description: 'Escaneo corporal y respiración',
      route: '/explorar',
      illustration: 'assets/illustrations/guided-rest.svg',
      tone: 'sage',
    },
    {
      title: 'Salud mental hoy',
      description: 'Lecturas breves que sostienen',
      route: '/explorar',
      illustration: 'assets/illustrations/mental-health-path.svg',
      tone: 'lavender',
    },
  ];
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.restoreSubscription?.unsubscribe();
      for (const subscription of this.syncSubscriptions) {
        subscription.unsubscribe();
      }
    });
  }

  ionViewWillEnter(): void {
    if (this.checkIns.records().length && !this.selectedRecordId()) {
      this.selectedRecordId.set(this.checkIns.records()[0].id);
    }
    this.restoreSubscription?.unsubscribe();
    this.restoreSubscription = this.authSession.restore().subscribe({
      next: (user) => {
        this.guestMode.set(!user);
        this.sessionReady.set(true);
        this.sessionMessage.set('');
        if (user) this.syncPendingRecords();
      },
      error: (error: unknown) => {
        this.guestMode.set(!this.authState.user());
        this.sessionReady.set(true);
        this.sessionMessage.set(
          `No se pudo comprobar la sesión; el check-in seguirá disponible en esta sesión. ${apiErrorMessage(error)}`,
        );
      },
    });
  }

  selectMood(moodId: MoodId): void {
    this.draftMoodId.set(moodId);
    this.selectedMoodWords.set([]);
    this.selectedEmotionIds.set([]);
    this.note.set('');
    this.otherEmotion.set('');
    this.customOtherEmotion.set('');
    this.draftMessage.set('');
    this.checkInMessage.set('');
    this.syncMessage.set('');
  }

  toggleMoodWord(word: MoodWord): void {
    if (!this.draftMoodId()) return;

    const selected = this.selectedMoodWords();
    const next = selected.includes(word.label)
      ? selected.filter((label) => label !== word.label)
      : [...selected, word.label];
    if (!next.includes('Otros')) this.customOtherEmotion.set('');
    this.selectedMoodWords.set(next);
    this.updateEmotionDetailsFromWords();
    this.draftMessage.set('');
  }

  isMoodWordSelected(label: string): boolean {
    return this.selectedMoodWords().includes(label);
  }

  isOtherWordSelected(): boolean {
    return this.isMoodWordSelected('Otros');
  }

  private updateEmotionDetailsFromWords(): void {
    const selectedWords = this.moodWords().filter((word) =>
      this.selectedMoodWords().includes(word.label),
    );
    const emotionIds = [
      ...new Set(
        selectedWords.flatMap((word) =>
          word.emotionId ? [word.emotionId] : [],
        ),
      ),
    ];
    const otherWords = selectedWords
      .filter((word) => !word.emotionId && word.label !== 'Otros')
      .map((word) => word.label);
    const customOtherEmotion = this.customOtherEmotion().trim();
    if (this.isOtherWordSelected() && customOtherEmotion) {
      otherWords.push(customOtherEmotion);
    }
    if (otherWords.length) emotionIds.push('otra');
    this.selectedEmotionIds.set(emotionIds);
    this.otherEmotion.set(otherWords.join(', '));
  }

  updateNote(note: string): void {
    this.note.set(note);
  }

  updateOtherEmotion(otherEmotion: string): void {
    this.customOtherEmotion.set(otherEmotion);
    this.updateEmotionDetailsFromWords();
    this.draftMessage.set('');
  }

  saveMood(): void {
    const moodId = this.draftMoodId();
    if (!moodId) return;
    if (this.isOtherWordSelected() && !this.customOtherEmotion().trim()) {
      this.draftMessage.set('Describe la emoción seleccionada como “Otros”.');
      return;
    }
    if (!this.selectedEmotionIds().length) {
      this.draftMessage.set('Selecciona al menos una emoción para guardar.');
      return;
    }

    const record = this.checkIns.addMood(moodId, {
      emotionIds: [...this.selectedEmotionIds()],
      note: this.note().trim(),
      otherEmotion: this.otherEmotion().trim(),
    });
    this.selectedRecordId.set(record.id);
    this.draftMoodId.set(null);
    this.draftMessage.set('');
    this.checkInMessage.set('Estado guardado en esta sesión.');
    this.syncMessage.set('');
    if (this.sessionReady() && !this.guestMode()) this.syncRecord(record);
  }

  retrySync(): void {
    this.syncMessage.set('');
    this.syncPendingRecords();
  }

  isEmotionSelected(emotionId: EmotionId): boolean {
    return this.selectedEmotionIds().includes(emotionId);
  }

  private syncPendingRecords(): void {
    for (const record of this.checkIns.pendingRecords()) {
      this.syncRecord(record);
    }
  }

  private syncRecord(record: SessionCheckIn): void {
    if (this.syncingIds.has(record.id)) return;
    this.syncingIds.add(record.id);
    this.syncMessage.set('');
    const syncedRevision = record.revision;
    const request: EmotionalRecordRequest = {
      moodId: record.moodId,
      emotionIds: [...record.emotionIds],
      note: record.note,
      otherEmotion: record.otherEmotion,
    };
    const save = record.serverId
      ? this.emotionalRecordApi.update(record.serverId, request)
      : this.emotionalRecordApi.create(request);
    let succeeded = false;
    const subscription = new Subscription();
    this.syncSubscriptions.add(subscription);
    subscription.add(save
      .pipe(finalize(() => {
        this.syncingIds.delete(record.id);
        this.syncSubscriptions.delete(subscription);
        if (
          succeeded &&
          this.sessionReady() &&
          !this.guestMode() &&
          this.checkIns.hasPendingRecords()
        ) {
          queueMicrotask(() => this.syncPendingRecords());
        }
      }))
      .subscribe({
        next: (remoteRecord) => {
          succeeded = true;
          this.checkIns.markSynchronized(record.id, remoteRecord, syncedRevision);
          this.syncMessage.set(
            'Estado guardado en tu perfil; ya está disponible en el historial mensual.',
          );
        },
        error: (error: unknown) => {
          this.syncMessage.set(
            `Se conserva en esta sesión, pero no se pudo sincronizar. ${apiErrorMessage(error)}`,
          );
        },
      }));
  }
}
