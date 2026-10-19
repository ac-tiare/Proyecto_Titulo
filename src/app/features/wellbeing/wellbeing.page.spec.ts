import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  EmotionalRecord,
  EmotionalRecordsService,
} from './emotional-records.service';
import { WellbeingPage } from './wellbeing.page';

describe('WellbeingPage', () => {
  const sampleRecord: EmotionalRecord = {
    id: 'record-1',
    moodId: 'mal',
    emotionIds: ['ansiedad', 'soledad'],
    note: 'Hoy fue un día difícil.',
    otherEmotion: '',
    date: '16 oct 2026, 02:30',
    dateTimestamp: Date.now(),
  };

  const configure = async (service: { listForCurrentUser: ReturnType<typeof vi.fn> }) =>
    TestBed.configureTestingModule({
      imports: [WellbeingPage],
      providers: [
        provideRouter([]),
        { provide: EmotionalRecordsService, useValue: service },
      ],
    }).compileComponents();

  it('shows an honest empty state after a successful empty query', async () => {
    const records = { listForCurrentUser: vi.fn().mockResolvedValue([]) };
    await configure(records);

    const fixture = TestBed.createComponent(WellbeingPage);
    await fixture.componentInstance.loadRecords();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Todavía no hay registros');
    expect(content).toContain('Cuando guardes un registro emocional');
    expect(content).not.toContain('No se guardan estados emocionales');
  });

  it('shows the authenticated emotional history and record details', async () => {
    const records = {
      listForCurrentUser: vi.fn().mockResolvedValue([sampleRecord]),
    };
    await configure(records);

    const fixture = TestBed.createComponent(WellbeingPage);
    await fixture.componentInstance.loadRecords();
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Mal');
    expect(content).toContain('Ansiedad');
    expect(content).toContain('Soledad');
    expect(content).toContain('Hoy fue un día difícil.');
    expect(content).toContain('16 oct 2026, 02:30');
    expect(content).toContain('Semana');
    expect(content).toContain('Mes');
    expect(content).toContain('Año');
  });

  it('filters the history by week, month, and year', async () => {
    const currentWeekRecord = {
      ...sampleRecord,
      id: 'this-week',
      dateTimestamp: new Date('2026-10-16T12:00:00').getTime(),
    };
    const previousMonthRecord = {
      ...sampleRecord,
      id: 'this-month',
      dateTimestamp: new Date('2026-10-01T12:00:00').getTime(),
    };
    const previousYearRecord = {
      ...sampleRecord,
      id: 'this-year',
      dateTimestamp: new Date('2026-03-15T12:00:00').getTime(),
    };
    const lastYearRecord = {
      ...sampleRecord,
      id: 'last-year',
      dateTimestamp: new Date('2025-05-15T12:00:00').getTime(),
    };
    const records = {
      listForCurrentUser: vi.fn().mockResolvedValue([
        currentWeekRecord,
        previousMonthRecord,
        previousYearRecord,
        lastYearRecord,
      ]),
    };
    await configure(records);

    const fixture = TestBed.createComponent(WellbeingPage);
    const page = fixture.componentInstance;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00'));
    try {
      await page.loadRecords();
      fixture.detectChanges();

      expect(page.filteredRecords().map((record) => record.id)).toEqual([
        'this-week',
      ]);

      const periodButtons = Array.from(
        fixture.nativeElement.querySelectorAll('.period-selector button'),
      ) as HTMLButtonElement[];
      const monthButton = periodButtons.find(
        (button) => button.textContent?.trim() === 'Mes',
      );
      expect(monthButton).toBeDefined();
      monthButton?.click();
      fixture.detectChanges();
      expect(page.filteredRecords().map((record) => record.id)).toEqual([
        'this-week',
        'this-month',
      ]);

      const yearButton = periodButtons.find(
        (button) => button.textContent?.trim() === 'Año',
      );
      expect(yearButton).toBeDefined();
      yearButton?.click();
      fixture.detectChanges();
      expect(page.filteredRecords().map((record) => record.id)).toEqual([
        'this-week',
        'this-month',
        'this-year',
      ]);
      expect(yearButton?.getAttribute('aria-pressed')).toBe('true');
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows an empty message when a selected period has no records', async () => {
    const records = {
      listForCurrentUser: vi.fn().mockResolvedValue([
        {
          ...sampleRecord,
          dateTimestamp: new Date('2025-05-15T12:00:00').getTime(),
        },
      ]),
    };
    await configure(records);

    const fixture = TestBed.createComponent(WellbeingPage);
    const page = fixture.componentInstance;
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T12:00:00'));
    try {
      await page.loadRecords();
      page.selectPeriod('week');
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Aún no hay registros en este período',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('distinguishes query errors from an empty history and allows retry', async () => {
    const records = {
      listForCurrentUser: vi
        .fn()
        .mockRejectedValueOnce(new Error('permission-denied'))
        .mockResolvedValueOnce([sampleRecord]),
    };
    await configure(records);

    const fixture = TestBed.createComponent(WellbeingPage);
    await fixture.componentInstance.loadRecords();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar tu historial',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Todavía no hay registros',
    );

    await fixture.componentInstance.loadRecords();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mal');
    expect(records.listForCurrentUser).toHaveBeenCalledTimes(2);
  });
});
