import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '../../core/api/auth-session.service';
import { AuthStateService } from '../../core/api/auth-state.service';
import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';
import type {
  AuthUser,
  EmotionalRecord,
  EmotionalRecordRequest,
} from '../../core/api/api.models';
import { QuickCheckInService } from '../../core/quick-check-in.service';
import { DashboardPage } from './dashboard.page';

describe('DashboardPage', () => {
  beforeEach(() => localStorage.clear());

  const savedRecord: EmotionalRecord = {
    id: 'remote-record',
    moodId: 'mal',
    emotionIds: [],
    note: '',
    otherEmotion: '',
    date: '19 nov 2026, 12:00',
    dateTimestamp: 1795104000000,
  };
  const user: AuthUser = {
    id: 'user-id',
    name: 'Alex',
    surname: null,
    email: 'alex@example.cl',
  };

  const configure = async (
    restoredUser: AuthUser | null = null,
    create = vi.fn<(request: EmotionalRecordRequest) => ReturnType<EmotionalRecordApiService['create']>>(
      () => of(savedRecord),
    ),
    update = vi.fn<(id: string, request: EmotionalRecordRequest) => ReturnType<EmotionalRecordApiService['update']>>(
      () => of(savedRecord),
    ),
  ) => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: { restore: () => of(restoredUser) },
        },
        {
          provide: AuthStateService,
          useValue: { user: () => restoredUser },
        },
        {
          provide: EmotionalRecordApiService,
          useValue: { create, update },
        },
      ],
    }).compileComponents();
    return TestBed.createComponent(DashboardPage);
  };

  it('shows contextual offline illustrations on each practice card', async () => {
    const fixture = await configure();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll(
      '.practice-card',
    ) as NodeListOf<HTMLAnchorElement>;
    expect(
      Array.from(cards, (card) =>
        card.querySelector('.practice-illustration img')?.getAttribute('src'),
      ),
    ).toEqual([
      'assets/illustrations/breathing-waves.svg',
      'assets/illustrations/sensory-window.svg',
      'assets/illustrations/open-book.svg',
    ]);
    expect(
      Array.from(cards, (card) =>
        card.querySelector('.practice-illustration img')?.getAttribute('aria-hidden'),
      ),
    ).toEqual(['true', 'true', 'true']);
    expect(Array.from(cards, (card) => card.getAttribute('data-tone'))).toEqual([
      'sage',
      'sky',
      'lavender',
    ]);

    fixture.destroy();
  });

  it('keeps daily practices freely selectable and offers distinct themed shortcuts', async () => {
    const fixture = await configure();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.section-count')).toBeNull();
    expect(fixture.nativeElement.querySelector('.practice-status')).toBeNull();
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.practice-card'),
        (card: HTMLAnchorElement) => card.getAttribute('href'),
      ),
    ).toEqual(['/apoyo/respirar', '/apoyo/enraizar', '/apoyo/despejar']);
    expect(fixture.componentInstance.exploreShortcuts.map(({ title }) => title)).toEqual([
      'Calmar ansiedad',
      'Mucho ruido en el metro',
      'Música para relajar',
      'Meditación guiada',
      'Salud mental hoy',
    ]);
    expect(
      fixture.nativeElement.querySelectorAll('.shortcut-illustration img'),
    ).toHaveLength(5);
    expect(fixture.componentInstance.exploreShortcuts[1].route).toBe(
      '/apoyo/sobrecarga',
    );
    expect(fixture.componentInstance.exploreShortcuts.slice(2).every(
      (shortcut) => shortcut.route === '/explorar',
    )).toBe(true);

    fixture.destroy();
  });

  it('saves a guest check-in only after the mood and an emotion are selected', async () => {
    const fixture = await configure();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.selectMood('muy-mal');
    fixture.detectChanges();

    expect(TestBed.inject(QuickCheckInService).records()).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('.mood-word-picker')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      '¿Necesitas bajar la intensidad ahora?',
    );
    page.toggleMoodWord(page.moodWords().find((word) => word.label === 'Tristeza')!);
    expect(TestBed.inject(QuickCheckInService).records()).toHaveLength(0);

    fixture.nativeElement
      .querySelector('.mood-word-picker ion-button')
      .click();
    fixture.detectChanges();

    const record = TestBed.inject(QuickCheckInService).records()[0];
    expect(record.moodId).toBe('muy-mal');
    expect(record.emotionIds).toEqual(['tristeza']);
    expect(fixture.nativeElement.querySelector('.mood-word-picker')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Estado guardado en esta sesión');
    fixture.destroy();
  });

  it('persists an authenticated check-in once, after explicit confirmation', async () => {
    const create = vi.fn<(request: EmotionalRecordRequest) => ReturnType<EmotionalRecordApiService['create']>>(
      () => of(savedRecord),
    );
    const fixture = await configure(user, create);
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.selectMood('mal');
    expect(create).not.toHaveBeenCalled();

    page.toggleMoodWord(page.moodWords().find((word) => word.label === 'Ansiedad')!);
    expect(create).not.toHaveBeenCalled();
    expect(TestBed.inject(QuickCheckInService).records()).toHaveLength(0);

    page.saveMood();

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      moodId: 'mal',
      emotionIds: ['ansiedad'],
      note: '',
      otherEmotion: '',
    });
    expect(TestBed.inject(QuickCheckInService).records()[0].synchronized).toBe(true);
    fixture.destroy();
  });

  it('shows mood-specific words and clears them when the mood changes', async () => {
    const fixture = await configure();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.selectMood('mal');

    expect(page.moodWords().map((word) => word.label)).toEqual([
      'Tristeza',
      'Soledad',
      'Cansancio',
      'Enojo',
      'Frustración',
      'Celos',
      'Miedo',
      'Inseguridad',
      'Dolor',
      'Ansiedad',
      'No sé con certeza',
      'Otros',
    ]);

    page.toggleMoodWord(page.moodWords()[0]);
    page.toggleMoodWord(page.moodWords()[2]);
    expect(TestBed.inject(QuickCheckInService).records()).toHaveLength(0);
    expect(page.selectedEmotionIds()).toEqual(['tristeza', 'otra']);
    expect(page.otherEmotion()).toBe('Cansancio');

    page.selectMood('mas-o-menos');
    expect(page.selectedMoodWords()).toEqual([]);
    expect(page.selectedEmotionIds()).toEqual([]);
    expect(page.moodWords().map((word) => word.label)).toContain('Neutralidad');
    expect(page.moodWords().map((word) => word.label)).not.toContain('Tristeza');

    page.selectMood('muy-bien');
    expect(page.moodWords().map((word) => word.label)).toContain('Agradecimiento');
    expect(page.moodWords().slice(-2).map((word) => word.label)).toEqual([
      'No sé con certeza',
      'Otros',
    ]);
    fixture.destroy();
  });

  it('does not save until an "other" emotion has a description', async () => {
    const create = vi.fn<
      (request: EmotionalRecordRequest) => ReturnType<EmotionalRecordApiService['create']>
    >(() => of(savedRecord));
    const fixture = await configure(user, create);
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.selectMood('mal');
    page.saveMood();
    expect(create).not.toHaveBeenCalled();

    page.toggleMoodWord(page.moodWords().find((word) => word.label === 'Otros')!);
    page.saveMood();
    expect(create).not.toHaveBeenCalled();
    expect(page.draftMessage()).toContain('Otros');

    page.updateOtherEmotion('Inquietud');
    page.saveMood();

    expect(create).toHaveBeenCalledWith({
      moodId: 'mal',
      emotionIds: ['otra'],
      note: '',
      otherEmotion: 'Inquietud',
    });
    fixture.destroy();
  });

  it('saves selected emotions and an optional note together for guests', async () => {
    const fixture = await configure();
    const page = fixture.componentInstance;
    page.ionViewWillEnter();
    page.selectMood('mas-o-menos');
    page.toggleMoodWord(page.moodWords()[0]);
    page.updateNote('Voy con calma.');
    expect(TestBed.inject(QuickCheckInService).records()).toHaveLength(0);
    page.saveMood();

    const record = TestBed.inject(QuickCheckInService).records()[0];
    expect(record.emotionIds).toEqual(['calma']);
    expect(record.note).toBe('Voy con calma.');
    fixture.destroy();
  });
});
