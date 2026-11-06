import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EmotionalRecordApiService } from '../../core/api/emotional-record-api.service';
import { EmotionalSessionService } from '../wellbeing/emotional-session';
import { HomePage } from './home.page';

describe('HomePage', () => {
  const configure = async (
    preventionInvitation = vi.fn().mockReturnValue(of(false)),
  ) => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [
        provideRouter([]),
        {
          provide: EmotionalRecordApiService,
          useValue: { preventionInvitation },
        },
      ],
    }).compileComponents();
    return preventionInvitation;
  };

  it('shows the greeting, emotional options, supportive message, and support links', async () => {
    await configure();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const contentElement = fixture.nativeElement.querySelector(
      'ion-content',
    ) as HTMLIonContentElement;
    expect(contentElement.scrollY).toBe(false);
    const scrollRegion = fixture.nativeElement.querySelector(
      '.home-scroll',
    ) as HTMLElement;
    expect(scrollRegion.getAttribute('role')).toBe('region');
    expect(scrollRegion.getAttribute('tabindex')).toBe('0');

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
    expect(content).toContain(
      'Selecciona una emoción para continuar. Tu registro se guardará solo al pulsar «Registrar emoción».',
    );
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

  it('shows advice when an emotion is selected and opens its emotional entry on request', async () => {
    await configure();

    const router = TestBed.inject(Router);
    const session = TestBed.inject(EmotionalSessionService);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const bienButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Ver consejos para: Bien"]',
    );
    bienButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sostén lo que te hace bien');
    expect(fixture.nativeElement.textContent).toContain(
      'Mantén algún hábito sencillo que te ayude a estar en equilibrio.',
    );
    expect(navigate).not.toHaveBeenCalled();
    expect(session.draft()).toBeNull();

    const entryButton = fixture.nativeElement.querySelector(
      '.mood-entry-button',
    ) as HTMLIonButtonElement;
    entryButton.click();
    await fixture.whenStable();

    expect(session.selectedMood()).toBe('bien');
    expect(session.draft()?.moodId).toBe('bien');
    expect(session.draft()?.saved).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/registro-emocional']);
  });

  it('shows safety-oriented advice for feeling very bad and lets the selection be dismissed', async () => {
    await configure();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const veryBadButton: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[aria-label="Ver consejos para: Muy mal"]',
    );
    veryBadButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Prioriza tu seguridad y busca apoyo');
    expect(fixture.nativeElement.textContent).toContain(
      'Si estás en peligro inmediato, busca ayuda de emergencia en tu zona.',
    );

    veryBadButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.mood-advice')).toBeNull();
  });

  it('shows the preventive invitation and all four support destinations when active', async () => {
    const preventionInvitation = await configure(
      vi.fn().mockReturnValue(of(true)),
    );
    const fixture = TestBed.createComponent(HomePage);
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    expect(preventionInvitation).toHaveBeenCalledOnce();
    const card = fixture.nativeElement.querySelector(
      '.prevention-invitation',
    ) as HTMLElement;
    expect(card.textContent?.replace(/\s+/g, ' ')).toContain(
      'Hemos notado que en los últimos días has registrado varias veces emociones de malestar. ¿Te gustaría revisar tu plan o hablar con alguien?',
    );
    expect(
      Array.from(
        card.querySelectorAll('.prevention-link'),
        (link: Element) => link.getAttribute('href'),
      ),
    ).toEqual([
      '/bienestar',
      '/plan-seguridad',
      '/red-apoyo',
      '/necesito-ayuda',
    ]);
    expect(card.textContent).not.toMatch(/depresión|trastorno|diagnóstico/i);
  });

  it('does not show the invitation when the condition is false', async () => {
    const preventionInvitation = await configure(
      vi.fn().mockReturnValue(of(false)),
    );
    const fixture = TestBed.createComponent(HomePage);
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    expect(preventionInvitation).toHaveBeenCalledOnce();
    expect(
      fixture.nativeElement.querySelector('.prevention-invitation'),
    ).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Está bien hacer una pausa',
    );
  });

  it('shows a distinct query error and allows retrying', async () => {
    const preventionInvitation = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(true));
    await configure(preventionInvitation);
    const fixture = TestBed.createComponent(HomePage);
    fixture.componentInstance.ionViewWillEnter();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.prevention-error'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.prevention-invitation'),
    ).toBeNull();

    const retryButton = fixture.nativeElement.querySelector(
      '.prevention-retry',
    ) as HTMLIonButtonElement;
    retryButton.click();
    fixture.detectChanges();

    expect(preventionInvitation).toHaveBeenCalledTimes(2);
    expect(
      fixture.nativeElement.querySelector('.prevention-error'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.prevention-invitation'),
    ).not.toBeNull();
  });
});
