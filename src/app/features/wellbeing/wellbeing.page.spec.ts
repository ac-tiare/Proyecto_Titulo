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
