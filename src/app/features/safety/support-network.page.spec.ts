import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SupportNetworkPage } from './support-network.page';

describe('SupportNetworkPage', () => {
  it('states that remote contacts remain untouched but are unavailable', async () => {
    await TestBed.configureTestingModule({
      imports: [SupportNetworkPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(SupportNetworkPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Contactos no disponibles temporalmente');
    expect(content).toContain('Los datos guardados anteriormente no se han eliminado');
    expect(content).toContain('Ver opciones de ayuda');
    expect(
      fixture.nativeElement.querySelector('ion-button')?.getAttribute('href'),
    ).toBe('/necesito-ayuda');
  });
});
