import { Location } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { NeedHelpPage } from './need-help.page';

describe('NeedHelpPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeedHelpPage],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('shows static official support lines, urgent guidance, and direct shortcuts', () => {
    const fixture = TestBed.createComponent(NeedHelpPage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Línea de Prevención del Suicidio · MINSAL');
    expect(content).toContain('Llamar al *4141');
    expect(content).toContain('Salud Responde');
    expect(content).toContain('Fono Drogas y Alcohol · SENDA');
    expect(content).toContain('Emergencia médica · SAMU');
    expect(content).toContain('Programa Quédate');
    expect(content).toContain('Si hay peligro inmediato');
    expect(content).toContain('no se envían automáticamente');
    expect(content).toContain('los datos remotos no se han eliminado');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.call-action'),
        (link: HTMLAnchorElement) => link.getAttribute('href'),
      ),
    ).toEqual([
      'tel:*4141',
      'tel:6003607777',
      'tel:1411',
      'tel:1412',
      'tel:800400035',
      'tel:131',
    ]);
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('ion-button[routerlink]'),
        (button: Element) => button.getAttribute('href'),
      ),
    ).toEqual([
      '/red-apoyo',
      '/red-apoyo',
      '/plan-seguridad',
      '/mi-bienestar',
    ]);
  });

  it('returns to the previous in-app screen when available', () => {
    const fixture = TestBed.createComponent(NeedHelpPage);
    const location = TestBed.inject(Location);
    const back = vi.spyOn(location, 'back');
    window.history.replaceState({ navigationId: 2 }, '', '/necesito-ayuda');

    fixture.nativeElement.querySelector('.back-button').click();

    expect(back).toHaveBeenCalledOnce();
    fixture.destroy();
  });

  it('falls back to Inicio when opened without in-app navigation history', () => {
    const fixture = TestBed.createComponent(NeedHelpPage);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    window.history.replaceState({}, '', '/necesito-ayuda');

    fixture.nativeElement.querySelector('.back-button').click();

    expect(navigate).toHaveBeenCalledWith('/inicio');
    fixture.destroy();
  });

});
