import { TestBed } from '@angular/core/testing';

import { SafetyPlanPage } from './safety-plan.page';

describe('SafetyPlanPage', () => {
  it('identifies the prompts as demo content, not a saved personal plan', async () => {
    await TestBed.configureTestingModule({
      imports: [SafetyPlanPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(SafetyPlanPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Contenido orientativo de demostración');
    expect(content).toContain('no es un plan personal');
    expect(content).toContain('no se guarda en esta versión');
    expect(content).not.toContain('Plan guardado');
  });
});
