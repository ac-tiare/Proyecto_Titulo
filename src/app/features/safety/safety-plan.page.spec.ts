import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  SafetyPlanSupportService,
  SafetySupportEntry,
} from './safety-plan-support.service';
import { SafetyPlanPage } from './safety-plan.page';

describe('SafetyPlanPage', () => {
  const createSupportService = () => ({
    list: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  });

  it('identifies the prompts as demo content, not a saved personal plan', async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: createSupportService() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('se guardan en tu cuenta de forma privada');
    expect(content).toContain('vista previa temporal');
    expect(content).toContain('Mi Plan de Seguridad');
    expect(content).toContain('Mis señales de alerta');
    expect(content).toContain('Acciones que me ayudan');
    expect(content).toContain('Personas y lugares de apoyo');
    expect(content).toContain('Mis contactos de confianza');
    expect(content).toContain('Canales oficiales de ayuda');
    expect(content).toContain('Completar sección');
    expect(content).toContain('Sitio oficial de Metro de Santiago');
    expect(
      fixture.nativeElement.querySelector(
        'a[href="https://www.metro.cl/"]',
      )?.getAttribute('rel'),
    ).toContain('noopener');
  });

  it('lets the user complete and edit plan sections in the current view', async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: createSupportService() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    fixture.detectChanges();

    page.openEditor('warning-signs');
    page.draftText.set('Me cuesta concentrarme\nMe siento aislado');
    page.saveSection('warning-signs');
    fixture.detectChanges();

    expect(page.sectionEntries('warning-signs')).toEqual([
      'Me cuesta concentrarme',
      'Me siento aislado',
    ]);
    expect(fixture.nativeElement.textContent).toContain('Completada');
    expect(fixture.nativeElement.textContent).toContain('Me cuesta concentrarme');

    page.openEditor('warning-signs');
    expect(page.draftText()).toBe('Me cuesta concentrarme\nMe siento aislado');
    page.draftText.set('Me cuesta concentrarme');
    page.saveSection('warning-signs');
    expect(page.sectionEntries('warning-signs')).toEqual([
      'Me cuesta concentrarme',
    ]);
  });

  it('discards an uncommitted edit when cancelled', async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: createSupportService() },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.openEditor('trusted-contacts');
    page.draftText.set('Contacto de ejemplo');
    page.cancelEdit();

    expect(page.sectionEntries('trusted-contacts')).toEqual([]);
    expect(page.editingSection()).toBeNull();
  });

  it('creates, reads, edits, and deletes a saved person or place', async () => {
    const entry: SafetySupportEntry = {
      id: 'support-1',
      type: 'person',
      name: 'Alex',
      details: 'Puede acompañarme',
      createdAt: 1,
      updatedAt: 1,
    };
    const editedEntry: SafetySupportEntry = {
      ...entry,
      name: 'Alex actualizado',
      details: 'Disponible por teléfono',
      updatedAt: 2,
    };
    const service = createSupportService();
    service.list
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([entry])
      .mockResolvedValueOnce([editedEntry])
      .mockResolvedValueOnce([]);
    await TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: service },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    await page.loadSupportEntries();
    expect(service.list).toHaveBeenCalledOnce();

    page.openSupportForm();
    page.supportName.set('Alex');
    page.supportDetails.set('Puede acompañarme');
    await page.saveSupportEntry();
    expect(service.create).toHaveBeenCalledWith({
      type: 'person',
      name: 'Alex',
      details: 'Puede acompañarme',
    });
    expect(page.supportEntries()).toEqual([entry]);

    page.editSupportEntry(entry);
    page.supportName.set('Alex actualizado');
    page.supportDetails.set('Disponible por teléfono');
    await page.saveSupportEntry();
    expect(service.update).toHaveBeenCalledWith('support-1', {
      type: 'person',
      name: 'Alex actualizado',
      details: 'Disponible por teléfono',
    });
    expect(page.supportEntries()).toEqual([editedEntry]);

    await page.deleteSupportEntry(editedEntry);
    expect(service.delete).not.toHaveBeenCalled();
    expect(page.deleteConfirmationId()).toBe('support-1');
    await page.deleteSupportEntry(editedEntry);
    expect(service.delete).toHaveBeenCalledWith('support-1');
    expect(page.supportEntries()).toEqual([]);
  });

  it('shows Firestore errors instead of treating a failed load as an empty list', async () => {
    const service = createSupportService();
    service.list.mockRejectedValue(new Error('permission-denied'));
    await TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [
        provideRouter([]),
        { provide: SafetyPlanSupportService, useValue: service },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    await page.loadSupportEntries();
    fixture.detectChanges();

    expect(page.supportLoadError()).toContain('permission-denied');
    expect(fixture.nativeElement.textContent).toContain(
      'Revisa tu conexión y las reglas de Firestore',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Aún no has agregado personas o lugares de apoyo.',
    );
  });
});
