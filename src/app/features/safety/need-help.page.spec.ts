import { TestBed } from '@angular/core/testing';

import { NeedHelpPage } from './need-help.page';

describe('NeedHelpPage', () => {
  it('guides people toward human support without inventing emergency resources', async () => {
    await TestBed.configureTestingModule({
      imports: [NeedHelpPage],
    }).compileComponents();

    const fixture = TestBed.createComponent(NeedHelpPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Habla con alguien');
    expect(content).toContain('peligro inmediato');
    expect(content).toContain('servicios de emergencia locales');
    expect(content).toContain('No hay teléfonos de ayuda verificados');
    expect(content).toContain('no diagnostica ni reemplaza');
    expect(fixture.nativeElement.querySelector('a[href^="tel:"]')).toBeNull();
  });
});
