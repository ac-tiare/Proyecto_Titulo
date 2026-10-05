import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from '../wellbeing/emotional-session';
import { HomePage } from './home.page';

describe('HomePage', () => {
  it('shows the greeting, emotional options, supportive message, and support links', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Hola 👋');
    expect(content).toContain('¿Cómo te sientes hoy?');
    expect(content).toContain('Está bien hacer una pausa');
    expect(content).toContain('Respira con calma y recuerda que puedes avanzar a tu propio ritmo.');
    expect(
      fixture.nativeElement.querySelector('.wellbeing-art')?.getAttribute('aria-hidden'),
    ).toBe('true');
    expect(content).toContain('Muy bien');
    expect(content).toContain('Bien');
    expect(content).toContain('Regular');
    expect(content).toContain('Mal');
    expect(content).toContain('Muy mal');
    expect(content).toContain('Mi Plan de Seguridad');
    expect(content).toContain('Mi Red de Apoyo');
    expect(content).toContain('Información y recursos');
    expect(content).toContain('Necesito ayuda');

    const destinations = Array.from(
      fixture.nativeElement.querySelectorAll('.action-card, .home-help-button'),
      (element: Element) => element.getAttribute('href'),
    );
    expect(destinations).toEqual([
      '/plan-seguridad',
      '/red-apoyo',
      '/informacion-recursos',
      '/necesito-ayuda',
    ]);
  });

  it('opens the emotional entry screen with the session-only mood selection', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const router = TestBed.inject(Router);
    const session = TestBed.inject(EmotionalSessionService);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const bienButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Registrar estado emocional: Bien"]',
    );
    bienButton.click();
    await fixture.whenStable();

    expect(session.selectedMood()).toBe('bien');
    expect(navigate).toHaveBeenCalledWith(['/registro-emocional']);
  });
});
