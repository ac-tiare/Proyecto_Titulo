import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { GuestSessionService } from '../../core/guest-session.service';
import { HomePage } from './home.page';

describe('HomePage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const configure = async () =>
    TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

  it('offers anonymous one-touch breathing and three silent support tools', async () => {
    await configure();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      '¿Cómo te sientes en este viaje?',
    );
    expect(fixture.nativeElement.textContent).toContain('100% anónimo.');
    expect(fixture.nativeElement.querySelector('.hero-action')?.getAttribute('href'))
      .toBe('/apoyo/calmarme?returnTo=bienvenida');
    expect(fixture.nativeElement.textContent).toContain('Sin audífonos');
    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.quick-action'),
        (link: Element) => link.getAttribute('href'),
      ),
    ).toEqual([
      '/apoyo/sobrecarga?returnTo=bienvenida',
      '/apoyo/despejar?returnTo=bienvenida',
      '/apoyo/respirar?returnTo=bienvenida',
    ]);
    expect(fixture.nativeElement.querySelector('.login-link')?.getAttribute('href'))
      .toBe('/login');
    expect(fixture.nativeElement.querySelector('.login-link')?.textContent)
      .toContain('Mi perfil');
    expect(fixture.nativeElement.querySelector('.login-link')?.getAttribute('aria-label'))
      .toBe('Iniciar sesión para ver mi perfil personal');
    expect(fixture.nativeElement.textContent)
      .toContain('No necesitas explicar nada. Puedes ir a tu ritmo.');
    const emergencyLink = fixture.nativeElement.querySelector(
      '.emergency-button',
    ) as HTMLAnchorElement;
    expect(emergencyLink.getAttribute('href')).toBe('/necesito-ayuda');
    expect(emergencyLink.textContent).toContain(
      'Necesito hablar con alguien ahora',
    );
    expect(
      emergencyLink.querySelector('ion-icon')?.getAttribute('name'),
    ).toBe('alert-circle-outline');
    expect(fixture.nativeElement.textContent).not.toContain('Correo electrónico');
  });

  it('persists guest access and accessibility preferences locally', async () => {
    await configure();

    const fixture = TestBed.createComponent(HomePage);
    const session = TestBed.inject(GuestSessionService);
    fixture.detectChanges();

    expect(localStorage.getItem('contigo.guest-session')).toBe('active');
    session.reduceMotion.set(false);
    session.toggleReducedMotion();
    session.toggleVibration();
    expect(localStorage.getItem('contigo.guest.reduce-motion')).toBe('true');
    expect(localStorage.getItem('contigo.guest.vibration')).toBe('true');

    const restoredSession = new GuestSessionService();
    restoredSession.initialize();
    expect(restoredSession.reduceMotion()).toBe(true);
    expect(restoredSession.vibrationEnabled()).toBe(true);
  });
});
