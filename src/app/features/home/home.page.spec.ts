import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { EmotionalSessionService } from '../wellbeing/emotional-session';
import { HomePage } from './home.page';

function dispatchMousePointer(
  target: HTMLElement,
  type: string,
  pointerId: number,
  clientY: number,
): void {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: 'mouse' },
    button: { value: 0 },
    clientY: { value: clientY },
  });
  target.dispatchEvent(event);
}

describe('HomePage', () => {
  it('shows the greeting, emotional options, supportive message, and support links', async () => {
    await TestBed.configureTestingModule({
      imports: [HomePage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomePage);
    fixture.detectChanges();

    const contentElement = fixture.nativeElement.querySelector(
      'ion-content',
    ) as HTMLIonContentElement;
    expect(contentElement.scrollY).toBe(true);

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
    expect(session.records()).toHaveLength(0);
    expect(session.draft()?.moodId).toBe('bien');
    expect(navigate).toHaveBeenCalledWith(['/registro-emocional']);
  });

  it('supports mouse-drag scrolling in a mobile-width viewport', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 375,
    });

    try {
      await TestBed.configureTestingModule({
        imports: [HomePage],
        providers: [provideRouter([])],
      }).compileComponents();

      const fixture = TestBed.createComponent(HomePage);
      fixture.detectChanges();
      await fixture.whenStable();

      const scrollElement = document.createElement('div');
      Reflect.set(fixture.componentInstance, 'scrollElement', scrollElement);
      const home = fixture.nativeElement.querySelector(
        '.home-page',
      ) as HTMLElement;

      dispatchMousePointer(home, 'pointerdown', 7, 300);
      dispatchMousePointer(home, 'pointermove', 7, 180);

      expect(scrollElement.scrollTop).toBe(120);

      dispatchMousePointer(home, 'pointerup', 7, 180);
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      });
    }
  });

  it('loads the Ionic scroll element when a mobile mouse drag starts', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 375,
    });

    try {
      await TestBed.configureTestingModule({
        imports: [HomePage],
        providers: [provideRouter([])],
      }).compileComponents();

      const fixture = TestBed.createComponent(HomePage);
      fixture.detectChanges();

      const scrollElement = document.createElement('div');
      const getScrollElement = vi.fn().mockResolvedValue(scrollElement);
      Reflect.set(fixture.componentInstance, 'content', () => ({
        getScrollElement,
      }));

      const home = fixture.nativeElement.querySelector(
        '.home-page',
      ) as HTMLElement;
      dispatchMousePointer(home, 'pointerdown', 10, 300);
      await Promise.resolve();
      dispatchMousePointer(home, 'pointermove', 10, 180);

      expect(getScrollElement).toHaveBeenCalledOnce();
      expect(scrollElement.scrollTop).toBe(120);

      dispatchMousePointer(home, 'pointerup', 10, 180);
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      });
    }
  });

  it('does not convert mouse drags into scrolling on desktop-width viewports', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 900,
    });

    try {
      await TestBed.configureTestingModule({
        imports: [HomePage],
        providers: [provideRouter([])],
      }).compileComponents();

      const fixture = TestBed.createComponent(HomePage);
      fixture.detectChanges();
      await fixture.whenStable();

      const scrollElement = document.createElement('div');
      Reflect.set(fixture.componentInstance, 'scrollElement', scrollElement);
      const home = fixture.nativeElement.querySelector(
        '.home-page',
      ) as HTMLElement;

      dispatchMousePointer(home, 'pointerdown', 8, 300);
      dispatchMousePointer(home, 'pointermove', 8, 180);

      expect(scrollElement.scrollTop).toBe(0);
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      });
    }
  });

  it('keeps button interaction areas out of mouse-drag scrolling', async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 375,
    });

    try {
      await TestBed.configureTestingModule({
        imports: [HomePage],
        providers: [provideRouter([])],
      }).compileComponents();

      const fixture = TestBed.createComponent(HomePage);
      fixture.detectChanges();
      await fixture.whenStable();

      const scrollElement = document.createElement('div');
      Reflect.set(fixture.componentInstance, 'scrollElement', scrollElement);
      const button = fixture.nativeElement.querySelector(
        '.mood-option',
      ) as HTMLButtonElement;
      const home = fixture.nativeElement.querySelector(
        '.home-page',
      ) as HTMLElement;

      dispatchMousePointer(button, 'pointerdown', 9, 300);
      dispatchMousePointer(home, 'pointermove', 9, 180);

      expect(scrollElement.scrollTop).toBe(0);
    } finally {
      Object.defineProperty(window, 'innerWidth', {
        configurable: true,
        value: originalWidth,
      });
    }
  });
});
