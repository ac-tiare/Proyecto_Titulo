import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from '../wellbeing/emotional-session';
import { HomePage } from './home.page';

describe('HomePage', () => {
  it('shows the welcome, emotional prompt, and primary support links', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const content = fixture.nativeElement.textContent as string;
    expect(content).toContain('Hola, qué bueno que estás aquí.');
    expect(content).toContain('¿Cómo te sientes hoy?');
    expect(content).toContain('Mi plan de seguridad');
    expect(content).toContain('Mi red de apoyo');
    expect(content).toContain('Información y recursos');
    expect(content).toContain('Necesito ayuda');
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

    await fixture.componentInstance.selectMood('bien');

    expect(session.selectedMood()).toBe('bien');
    expect(navigate).toHaveBeenCalledWith(['/registro-emocional']);
  });
});
