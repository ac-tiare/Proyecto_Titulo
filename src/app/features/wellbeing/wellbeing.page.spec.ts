import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { EmotionalRecord, Page } from '../../core/api/api.models';
import { WellbeingPage } from './wellbeing.page';

describe('WellbeingPage', () => {
  let httpTesting: HttpTestingController;

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [WellbeingPage],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    })
      .compileComponents()
      .then(() => {
        httpTesting = TestBed.inject(HttpTestingController);
      });

  const record = (
    id: string,
    moodId: EmotionalRecord['moodId'] = 'mal',
    emotionIds: EmotionalRecord['emotionIds'] = ['ansiedad'],
    note = '',
  ): EmotionalRecord => ({
    id,
    moodId,
    emotionIds,
    note,
    otherEmotion: '',
    date: '18 oct 2026, 12:00',
    dateTimestamp: 1792321200000,
  });

  const response = (
    items: EmotionalRecord[],
    page = 1,
    pageSize = 20,
    total = items.length,
  ): { data: Page<EmotionalRecord> } => ({
    data: {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  });

  afterEach(() => httpTesting.verify());

  it('shows the empty state using the server response', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    fixture.componentInstance.loadRecords();
    const request = httpTesting.expectOne(
      (req) => req.url === '/api/emociones' && req.params.get('period') === 'month',
    );
    request.flush(response([]));
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Tu historial comienza aquí');
    expect(content).toContain('Cuando guardes un registro emocional');
    expect(content).toContain(
      'Tus registros se guardan en tu cuenta y están disponibles después de volver a ingresar.',
    );
  });

  it('renders emotional records returned by the API', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    fixture.componentInstance.loadRecords();
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=month')
      .flush(response([
        record('record-1', 'mal', ['ansiedad', 'soledad'], 'Hoy fue un día difícil.'),
      ]));
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Mal');
    expect(content).toContain('Ansiedad');
    expect(content).toContain('Soledad');
    expect(content).toContain('Hoy fue un día difícil.');
  });

  it('shows descriptive patterns for the selected period without clinical claims', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    const page = fixture.componentInstance;
    page.togglePatterns();
    const request = httpTesting.expectOne(
      '/api/emociones/patrones?period=month',
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      data: {
        period: 'month',
        recordCount: 2,
        moodCounts: {
          'muy-bien': 0,
          bien: 0,
          'mas-o-menos': 0,
          mal: 2,
          'muy-mal': 0,
        },
        emotionCounts: {
          tristeza: 1,
          ansiedad: 2,
          miedo: 0,
          enojo: 0,
          soledad: 0,
          calma: 0,
          esperanza: 0,
          otra: 0,
        },
        buckets: [
          {
            startDate: '2026-10-19',
            recordCount: 1,
            moodCounts: { mal: 1 },
            emotionCounts: { ansiedad: 1 },
          },
          {
            startDate: '2026-10-26',
            recordCount: 1,
            moodCounts: { mal: 1 },
            emotionCounts: { tristeza: 1 },
          },
        ],
        hasTemporalComparison: true,
      },
    });
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Patrones emocionales');
    expect(content).toContain('Estados registrados');
    expect(content).toContain('Mal: 2');
    expect(content).toContain('Emociones frecuentes');
    expect(content).toContain('Ansiedad: 2');
    expect(content).toContain('Registros por tramo');
    expect(content).toContain('No es un diagnóstico ni una evaluación clínica.');
    expect(page.patterns()?.recordCount).toBe(2);
  });

  it('shows an honest empty state and a retryable pattern error', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    const page = fixture.componentInstance;
    page.togglePatterns();
    httpTesting.expectOne('/api/emociones/patrones?period=month').flush({
      data: {
        period: 'month',
        recordCount: 0,
        moodCounts: {
          'muy-bien': 0,
          bien: 0,
          'mas-o-menos': 0,
          mal: 0,
          'muy-mal': 0,
        },
        emotionCounts: {
          tristeza: 0,
          ansiedad: 0,
          miedo: 0,
          enojo: 0,
          soledad: 0,
          calma: 0,
          esperanza: 0,
          otra: 0,
        },
        buckets: [],
        hasTemporalComparison: false,
      },
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Aún no hay registros suficientes para mostrar tendencias.',
    );

    page.selectPeriod('week');
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=week')
      .flush(response([]));
    httpTesting.expectOne('/api/emociones/patrones?period=week').flush(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No pudimos cargar tus tendencias.',
        },
      },
      { status: 500, statusText: 'Server Error' },
    );
    fixture.detectChanges();

    expect(page.patternsError()).toBe('No pudimos cargar tus tendencias.');
    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar tus tendencias.',
    );
  });

  it('requests each selected period from the API and resets to page one', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    const page = fixture.componentInstance;
    page.loadRecords();
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=month')
      .flush(response([record('month-record')]));

    page.selectPeriod('week');
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=week')
      .flush(response([record('week-record', 'bien', ['calma'])]));
    expect(page.filteredRecords().map(({ id }) => id)).toEqual(['week-record']);

    page.selectPeriod('year');
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=year')
      .flush(response([record('year-record', 'mas-o-menos', ['miedo'])]));
    expect(page.filteredRecords().map(({ id }) => id)).toEqual(['year-record']);
    expect(page.page()).toBe(1);
  });

  it('requests subsequent pages and disables navigation at the boundaries', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    const page = fixture.componentInstance;
    page.loadRecords();
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=month')
      .flush(response([record('first-page')], 1, 20, 21));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Página 1 de 2');

    page.selectPage(2);
    httpTesting.expectOne('/api/emociones?page=2&pageSize=20&period=month')
      .flush(response([record('second-page')], 2, 20, 21));
    fixture.detectChanges();

    expect(page.filteredRecords().map(({ id }) => id)).toEqual(['second-page']);
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2');
  });

  it('shows a retryable error when the API cannot load history', async () => {
    await configure();

    const fixture = TestBed.createComponent(WellbeingPage);
    fixture.componentInstance.loadRecords();
    httpTesting.expectOne('/api/emociones?page=1&pageSize=20&period=month')
      .flush(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'No pudimos cargar tus datos.',
          },
        },
        { status: 500, statusText: 'Server Error' },
      );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar tu historial',
    );
    expect(fixture.nativeElement.textContent).toContain(
      'No pudimos cargar tus datos.',
    );
  });
});
