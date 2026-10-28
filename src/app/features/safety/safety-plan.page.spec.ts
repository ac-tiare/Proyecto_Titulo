import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SafetyPlanPage } from './safety-plan.page';

describe('SafetyPlanPage', () => {
  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
      providers: [provideRouter([])],
    }).compileComponents();

  it('keeps the plan and explains which data is temporarily unavailable', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('no se han eliminado');
    expect(content).toContain('vista previa temporal');
    expect(content).toContain('Mi Plan de Seguridad');
    expect(content).toContain('Mis señales de alerta');
    expect(content).toContain('Acciones que me ayudan');
    expect(content).toContain('Personas y lugares de apoyo');
    expect(content).toContain('Mis contactos de confianza');
    expect(content).toContain('temporalmente inactiva');
    expect(content).toContain('Canales oficiales de ayuda');
    expect(content).toContain('Completar sección');
    expect(content).toContain('Sitio oficial de Metro de Santiago');
    expect(
      fixture.nativeElement.querySelector(
        'a[href="https://www.metro.cl/"]',
      )?.getAttribute('rel'),
    ).toContain('noopener');
  });

  it('lets the user complete and edit local plan sections during the session', async () => {
    await configure();

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
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    const page = fixture.componentInstance;
    page.openEditor('trusted-contacts');
    page.draftText.set('Contacto de ejemplo');
    page.cancelEdit();

    expect(page.sectionEntries('trusted-contacts')).toEqual([]);
    expect(page.editingSection()).toBeNull();
  });

  it('does not present synchronized people and places as an empty list', async () => {
    await configure();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Los registros remotos no se han eliminado',
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      'Aún no has agregado personas o lugares de apoyo.',
    );
    expect(fixture.componentInstance.isSectionComplete('support-places')).toBe(
      false,
    );
  });
});
