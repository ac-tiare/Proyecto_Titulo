import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import {
  ResourceApiService,
  ResourceCategoryId,
  ResourceDetail,
  ResourceSummary,
} from '../../core/api/resource-api.service';
import { ResourcesPage } from './resources.page';

describe('ResourcesPage', () => {
  const items: ResourceSummary[] = [
    {
      id: 'respiracion',
      title: 'Haz una pausa',
      summary: 'Un ejercicio breve.',
      category: 'bienestar-emocional',
      imageUrl: null,
      createdAt: '2026-11-10T00:00:00.000Z',
    },
    {
      id: 'descanso',
      title: 'Cuidar el descanso',
      summary: 'Ideas de descanso.',
      category: 'autocuidado',
      imageUrl: null,
      createdAt: '2026-11-10T00:00:00.000Z',
    },
    {
      id: 'senales',
      title: 'Observa cambios',
      summary: 'Señales sostenidas.',
      category: 'senales-alerta',
      imageUrl: null,
      createdAt: '2026-11-10T00:00:00.000Z',
    },
    {
      id: 'canales',
      title: 'Canales de orientación',
      summary: 'Dónde pedir apoyo.',
      category: 'busqueda-ayuda-prevencion',
      imageUrl: null,
      createdAt: '2026-11-10T00:00:00.000Z',
    },
  ];
  const detail: ResourceDetail = {
    ...items[3],
    content: ['Contenido completo de apoyo.'],
    links: [{ label: 'Llamar a orientación', url: 'tel:1412' }],
  };
  let resourceApi: {
    list: ReturnType<typeof vi.fn>;
    get: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    resourceApi = {
      list: vi.fn((category?: ResourceCategoryId) =>
        of(
          category
            ? items.filter((item) => item.category === category)
            : items,
        ),
      ),
      get: vi.fn(() => of(detail)),
    };
    await TestBed.configureTestingModule({
      imports: [ResourcesPage],
      providers: [{ provide: ResourceApiService, useValue: resourceApi }],
    }).compileComponents();
  });

  it('filters the catalog into four distinct themes and keeps the selected filter', async () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    const page = fixture.componentInstance;
    await page.loadResources();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.page-icon ion-icon')?.getAttribute('name'),
    ).toBe('book-outline');
    expect(resourceApi.list).toHaveBeenLastCalledWith(undefined);
    expect(page.categories.filter(({ id }) => id !== 'todas')).toHaveLength(4);
    expect(page.resources()).toHaveLength(4);
    await page.selectCategory('senales-alerta');
    fixture.detectChanges();

    expect(resourceApi.list).toHaveBeenLastCalledWith('senales-alerta');
    expect(page.selectedCategory()).toBe('senales-alerta');
    expect(page.resources().map(({ id }) => id)).toEqual(['senales']);
    expect(
      fixture.nativeElement.querySelector(
        'button[aria-pressed="true"]',
      ).textContent,
    ).toContain('Señales de alerta');
  });

  it('keeps the empty state hidden until the catalog request completes', async () => {
    const response = new Subject<ResourceSummary[]>();
    resourceApi.list.mockReturnValueOnce(response);

    const fixture = TestBed.createComponent(ResourcesPage);
    const page = fixture.componentInstance;
    const loading = page.loadResources();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Cargando recursos');
    expect(fixture.nativeElement.textContent).not.toContain(
      'No hay recursos disponibles',
    );

    response.next(items);
    await loading;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain(
      'No hay recursos disponibles',
    );
    expect(page.resources()).toHaveLength(items.length);
  });

  it('loads full resource detail on demand and preserves support links', async () => {
    const fixture = TestBed.createComponent(ResourcesPage);
    const page = fixture.componentInstance;
    await page.selectCategory('busqueda-ayuda-prevencion');
    await page.loadDetail('canales');
    fixture.detectChanges();

    expect(page.resources()).toHaveLength(1);
    expect(page.details()['canales']?.content).toEqual([
      'Contenido completo de apoyo.',
    ]);
    expect(fixture.nativeElement.textContent).toContain('no reemplaza');
    expect(detail.links[0]?.url).toBe('tel:1412');
  });

  it('shows empty results and offers retry after catalog or detail failures', async () => {
    resourceApi.list.mockReturnValueOnce(of([]));
    const fixture = TestBed.createComponent(ResourcesPage);
    const page = fixture.componentInstance;
    await page.loadResources();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No hay recursos disponibles',
    );

    resourceApi.list.mockReturnValueOnce(
      throwError(() => new Error('offline')),
    );
    await page.loadResources();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Intentar nuevamente');

    resourceApi.get.mockReturnValueOnce(
      throwError(() => new Error('offline')),
    );
    await page.loadDetail('canales');
    fixture.detectChanges();
    expect(page.detailErrors()['canales']).toContain(
      'No se pudo cargar el contenido',
    );
  });
});
