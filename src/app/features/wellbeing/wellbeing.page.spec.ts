import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { EmotionalSessionService, MoodId, EmotionId } from './emotional-session';
import { WellbeingPage } from './wellbeing.page';

describe('WellbeingPage', () => {
  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [WellbeingPage],
      providers: [provideRouter([])],
    }).compileComponents();

  const addRecord = (
    session: EmotionalSessionService,
    moodId: MoodId,
    emotionIds: readonly EmotionId[],
    note = '',
  ): number => {
    session.startDraft(moodId);
    for (const emotionId of emotionIds) {
      session.toggleEmotion(emotionId);
    }
    session.updateNote(note);
    return session.saveDraft()!.id;
  };

  it('shows an honest empty state when no record has been saved this session', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    fixture.componentInstance.loadRecords();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Tu historial comienza aquí');
    expect(content).toContain('Cuando guardes un registro emocional');
    expect(content).toContain('Se perderán al cerrar o recargar la app');
  });

  it('shows session records and their details', async () => {
    await configure();

    const session = TestBed.inject(EmotionalSessionService);
    addRecord(session, 'mal', ['ansiedad', 'soledad'], 'Hoy fue un día difícil.');
    const fixture = TestBed.createComponent(WellbeingPage);
    fixture.componentInstance.loadRecords();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Mal');
    expect(content).toContain('Ansiedad');
    expect(content).toContain('Soledad');
    expect(content).toContain('Hoy fue un día difícil.');
    expect(content).toContain('Semana');
    expect(content).toContain('Mes');
    expect(content).toContain('Año');
  });

  it('filters session history by week, month, and year', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00'));
    try {
      await configure();

      const session = TestBed.inject(EmotionalSessionService);
      const thisWeekId = addRecord(session, 'bien', ['calma']);
      vi.setSystemTime(new Date('2026-10-01T12:00:00'));
      const thisMonthId = addRecord(session, 'mal', ['ansiedad']);
      vi.setSystemTime(new Date('2026-03-15T12:00:00'));
      const thisYearId = addRecord(session, 'mas-o-menos', ['miedo']);
      vi.setSystemTime(new Date('2025-05-15T12:00:00'));
      const lastYearId = addRecord(session, 'muy-bien', ['esperanza']);
      vi.setSystemTime(new Date('2026-10-18T12:00:00'));

      const fixture = TestBed.createComponent(WellbeingPage);
      const page = fixture.componentInstance;
      page.loadRecords();
      page.selectPeriod('week');
      fixture.detectChanges();
      expect(page.filteredRecords().map((record) => record.id)).toEqual([
        thisWeekId,
      ]);

      page.selectPeriod('month');
      expect(page.filteredRecords().map((record) => record.id)).toEqual([
        thisWeekId,
        thisMonthId,
      ]);

      page.selectPeriod('year');
      expect(page.filteredRecords().map((record) => record.id)).toEqual([
        thisWeekId,
        thisMonthId,
        thisYearId,
      ]);
      expect(page.filteredRecords().map((record) => record.id)).not.toContain(
        lastYearId,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows an empty message when a selected period has no records', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00'));
    try {
      await configure();

      const session = TestBed.inject(EmotionalSessionService);
      vi.setSystemTime(new Date('2025-05-15T12:00:00'));
      addRecord(session, 'mal', ['ansiedad']);
      vi.setSystemTime(new Date('2026-10-18T12:00:00'));

      const fixture = TestBed.createComponent(WellbeingPage);
      const page = fixture.componentInstance;
      page.loadRecords();
      page.selectPeriod('week');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Aún no hay registros en este período',
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
