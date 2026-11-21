import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { apiInterceptor } from '../../core/api/api.interceptor';
import { SafetyPlan, TrustedContact } from '../../core/api/api.models';
import { SafetyPlanPage } from './safety-plan.page';

describe('SafetyPlanPage', () => {
  let httpTesting: HttpTestingController;

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
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

  const savedPlan = (overrides: Partial<SafetyPlan> = {}): SafetyPlan => ({
    id: 'plan-id',
    warningSigns: [],
    copingActions: [],
    safePlaces: [],
    updatedAt: '2026-10-28T12:00:00.000Z',
    ...overrides,
  });

  afterEach(() => httpTesting.verify());

  it('loads the persistent plan and keeps contacts linked to one shared list', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.loadPlan();
    httpTesting.expectOne('/api/plan-seguridad').flush({
      data: savedPlan({
        warningSigns: ['Me cuesta concentrarme'],
        safePlaces: ['Plaza cercana'],
      }),
    });

    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Me cuesta concentrarme');
    expect(content).toContain('Plaza cercana');
    expect(content).toContain('Mis contactos de confianza');
    expect(content).toContain('Gestionar contactos de confianza');
    expect(content).not.toContain('vista previa temporal');
    expect(content).not.toContain('temporalmente inactiva');
    expect(
      fixture.nativeElement.querySelector(
        'ion-button[routerlink="/red-apoyo"]',
      ),
    ).not.toBeNull();
    expect(page.sectionEntries('trusted-contacts')).toEqual([]);
  });

  it('shows actionable trusted contacts alongside the plan', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    fixture.componentInstance.loadContacts();
    const contact: TrustedContact = {
      id: 'contact-id',
      userId: 'user-id',
      name: 'Alex',
      phone: '+56912345678',
      relationship: 'Amistad',
      details: null,
      createdAt: '2026-10-28T12:00:00.000Z',
      updatedAt: '2026-10-28T12:00:00.000Z',
    };
    httpTesting.expectOne('/api/contactos?page=1&pageSize=3').flush({
      data: {
        items: [contact],
        pagination: {
          page: 1,
          pageSize: 3,
          total: 1,
          totalPages: 1,
        },
      },
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Mi Red de Apoyo');
    expect(fixture.nativeElement.textContent).toContain('Alex');
    expect(fixture.nativeElement.textContent).toContain('+56912345678');
    expect(
      fixture.nativeElement.querySelector('.trusted-contact-preview ion-button')
        ?.textContent,
    ).toContain('Llamar');
  });

  it('saves a section remotely and reports success only after confirmation', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.loadPlan();
    httpTesting.expectOne('/api/plan-seguridad').flush({
      data: savedPlan({ copingActions: ['Respirar con calma'] }),
    });

    page.openEditor('warning-signs');
    page.draftText.set('Me cuesta concentrarme\nMe siento aislado');
    page.saveSection('warning-signs');
    const request = httpTesting.expectOne('/api/plan-seguridad');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      warningSigns: ['Me cuesta concentrarme', 'Me siento aislado'],
      copingActions: ['Respirar con calma'],
      safePlaces: [],
    });
    expect(page.saveMessage()).toBe('');
    expect(page.editingSection()).toBe('warning-signs');

    request.flush({
      data: savedPlan({
        warningSigns: ['Me cuesta concentrarme', 'Me siento aislado'],
        copingActions: ['Respirar con calma'],
      }),
    });

    expect(page.sectionEntries('warning-signs')).toEqual([
      'Me cuesta concentrarme',
      'Me siento aislado',
    ]);
    expect(page.editingSection()).toBeNull();
    expect(page.saveMessage()).toBe(
      'Tu plan de seguridad fue actualizado.',
    );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Tu plan de seguridad fue actualizado.',
    );
  });

  it('retains the editor and shows an error when persistence fails', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.loadPlan();
    httpTesting.expectOne('/api/plan-seguridad').flush({
      data: savedPlan(),
    });
    page.openEditor('coping-actions');
    page.draftText.set('Caminar un momento');
    page.saveSection('coping-actions');

    httpTesting.expectOne('/api/plan-seguridad').flush(
      {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'No pudimos guardar el plan.',
        },
      },
      { status: 500, statusText: 'Server Error' },
    );

    expect(page.editingSection()).toBe('coping-actions');
    expect(page.sectionEntries('coping-actions')).toEqual([]);
    expect(page.saveError()).toBe('No pudimos guardar el plan.');
  });

  it('discards an uncommitted edit when cancelled', async () => {
    await configure();

    const page = TestBed.createComponent(SafetyPlanPage).componentInstance;
    page.openEditor('warning-signs');
    page.draftText.set('Dato temporal');
    page.cancelEdit();

    expect(page.sectionEntries('warning-signs')).toEqual([]);
    expect(page.editingSection()).toBeNull();
    httpTesting.expectNone('/api/plan-seguridad');
  });
});
