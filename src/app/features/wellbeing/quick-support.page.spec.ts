import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { BehaviorSubject } from 'rxjs';
import type { ParamMap } from '@angular/router';

import { QuickSupportPage } from './quick-support.page';

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn().mockResolvedValue(undefined) },
  ImpactStyle: { Light: 'LIGHT' },
}));

describe('QuickSupportPage', () => {
  let routeParameters: BehaviorSubject<ParamMap>;
  let queryParameters: BehaviorSubject<ParamMap>;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const createPage = async (activity: string, returnTo: string | null = null) => {
    routeParameters = new BehaviorSubject(
      convertToParamMap({ activity }),
    );
    queryParameters = new BehaviorSubject(
      convertToParamMap(returnTo ? { returnTo } : {}),
    );
    await TestBed.configureTestingModule({
      imports: [QuickSupportPage],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: routeParameters.asObservable(),
            queryParamMap: queryParameters.asObservable(),
            snapshot: { paramMap: routeParameters.value },
          },
        },
      ],
    }).compileComponents();
    return TestBed.createComponent(QuickSupportPage);
  };

  it('shows the immersive short guide with layered rings and rotating grounding copy', async () => {
    const fixture = await createPage('calmarme');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.crisis-content')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.calm-ring')).toHaveLength(3);
    expect(fixture.nativeElement.querySelector('.calm-experience .intro')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Vamos paso a paso');
    expect(fixture.nativeElement.querySelector('.calm-anchor')?.textContent).toContain(
      'Estás a salvo en este momento',
    );
    expect(fixture.nativeElement.textContent).toContain('Inhala suavemente');
    expect(
      fixture.nativeElement
        .querySelector('.support-header .back-link')
        ?.getAttribute('href'),
    ).toBe('/inicio');
    fixture.componentInstance.remainingSeconds.set(58);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Toma un poco más de aire',
    );
    fixture.componentInstance.remainingSeconds.set(44);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.calm-anchor')?.textContent).toContain(
      'Apoya ambos pies en el suelo del vagón',
    );
    expect(fixture.nativeElement.querySelector('.better-button')?.textContent).toContain(
      'Me siento un poco mejor',
    );
    const hapticsToggle = fixture.nativeElement.querySelector(
      '.calm-experience .haptics-toggle',
    ) as HTMLButtonElement;
    expect(hapticsToggle.classList).not.toContain('is-enabled');
    hapticsToggle.click();
    fixture.detectChanges();
    expect(hapticsToggle.classList).toContain('is-enabled');
    fixture.destroy();
  });

  it('offers personalized duration and breathing rhythms with an animated petal guide', async () => {
    const fixture = await createPage('respirar');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Respira a tu manera');
    expect(fixture.nativeElement.querySelector('.personal-breath-content')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.breathing-petal')).toHaveLength(8);
    expect(
      fixture.nativeElement.querySelector(
        '.breathing-guide .petal-visualizer',
      ),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector(
        '.breathing-guide .breathing-guidance .breathing-cue',
      ),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.selector-group')).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('.breathing-cue')?.textContent).toContain(
      'Inhala a tu ritmo',
    );
    expect(fixture.nativeElement.textContent).toContain('1:00 restantes');

    fixture.componentInstance.selectBreathingRhythm('balanced');
    fixture.componentInstance.remainingSeconds.set(56);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.breathing-cue')?.textContent).toContain(
      'Exhala · 4',
    );

    fixture.componentInstance.selectBreathingRhythm('deep');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.breathing-cue')?.textContent).toContain(
      'Sostén sin esfuerzo · 7',
    );

    fixture.componentInstance.selectBreathingDuration(3);
    fixture.detectChanges();
    expect(fixture.componentInstance.remainingSeconds()).toBe(180);
    expect(fixture.nativeElement.textContent).toContain('3:00 restantes');
    fixture.destroy();
  });

  it('shows the grounding exercise locally', async () => {
    const haptic = vi.mocked(Haptics.impact);
    const fixture = await createPage('enraizar');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Enfoque sensorial en el vagón',
    );
    const steps = fixture.nativeElement.querySelectorAll('.grounding-step');
    expect(steps).toHaveLength(5);
    (steps[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(steps[0].getAttribute('aria-expanded')).toBe('true');
    expect(steps[0].classList).toContain('is-active');
    const bubbles = fixture.nativeElement.querySelectorAll('.grounding-bubble');
    expect(bubbles).toHaveLength(5);
    (bubbles[0] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(bubbles[0].getAttribute('aria-pressed')).toBe('true');
    expect(bubbles[0].classList).toContain('is-marked');
    expect(haptic).toHaveBeenCalledTimes(2);
    expect(haptic).toHaveBeenCalledWith({ style: ImpactStyle.Light });
    for (const bubble of Array.from(bubbles).slice(1)) {
      (bubble as HTMLButtonElement).click();
      fixture.detectChanges();
    }
    expect(steps[0].classList).toContain('is-selected');
    for (const [index, count] of [4, 3, 2, 1].entries()) {
      (steps[index + 1] as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.grounding-bubble')).toHaveLength(count);
    }
    fixture.destroy();
  });

  it('opens the three new mental health tools through the shared offline support route', async () => {
    const fixture = await createPage('sonidos');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Sonidos para aislar el ruido',
    );
    expect(fixture.nativeElement.textContent).toContain('Ruido marrón');

    routeParameters.next(convertToParamMap({ activity: 'pensamientos' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Soltar pensamientos intrusivos',
    );

    routeParameters.next(convertToParamMap({ activity: 'cuerpo' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Soltar tensión del cuerpo',
    );
    expect(fixture.nativeElement.textContent).toContain('90 segundos');
    fixture.destroy();
  });

  it('guides sensory overload through physical grounding without listening tasks', async () => {
    const haptic = vi.mocked(Haptics.impact);
    const fixture = await createPage('sobrecarga');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.overload-content')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Mucho ruido en el metro');
    expect(fixture.nativeElement.textContent).toContain(
      'apoya firme ambos pies en el piso del vagón',
    );
    expect(fixture.nativeElement.textContent).not.toContain('escucha');
    const rainAudioButton = fixture.nativeElement.querySelector(
      '.rain-audio-button',
    ) as HTMLButtonElement;
    expect(rainAudioButton.disabled).toBe(false);
    expect(rainAudioButton.getAttribute('aria-pressed')).toBe('false');

    fixture.nativeElement.querySelector('.overload-primary').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.overloadStep()).toBe(2);
    expect(fixture.componentInstance.focusPointSeconds()).toBe(15);
    expect(haptic).toHaveBeenCalledWith({ style: ImpactStyle.Light });

    fixture.componentInstance.nextOverloadStep();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Suelta un poco de tensión');
    fixture.nativeElement.querySelector('.overload-primary').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.tensionReleaseStarted()).toBe(true);
    fixture.componentInstance.tensionReleaseSeconds.set(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Suelta las manos y deja salir el aire.',
    );
    expect(fixture.nativeElement.querySelector('.close-exercise')).not.toBeNull();
    fixture.destroy();
  });

  it('starts and stops optional rain audio on the overload screen', async () => {
    const originalAudioContext = window.AudioContext;
    const source = {
      buffer: null as AudioBuffer | null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
    const createFilter = () => ({
      type: 'lowpass' as BiquadFilterType,
      frequency: { value: 0 },
      Q: { value: 0 },
      connect: vi.fn(),
    });
    const audioContext = {
      currentTime: 0,
      destination: {},
      sampleRate: 8000,
      state: 'running' as AudioContextState,
      close: vi.fn().mockResolvedValue(undefined),
      resume: vi.fn().mockResolvedValue(undefined),
      createBuffer: vi.fn((_channels: number, length: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
      })),
      createBufferSource: vi.fn(() => source),
      createBiquadFilter: vi.fn(createFilter),
      createGain: vi.fn(() => ({
        gain: { value: 0 },
        connect: vi.fn(),
      })),
    };
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: vi.fn(function mockAudioContext() {
        return audioContext;
      }),
    });

    try {
      const fixture = await createPage('sobrecarga');
      fixture.detectChanges();

      const button = fixture.nativeElement.querySelector(
        '.rain-audio-button',
      ) as HTMLButtonElement;
      button.click();
      await vi.waitFor(() => expect(source.start).toHaveBeenCalledOnce());
      fixture.detectChanges();
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(fixture.nativeElement.textContent).toContain(
        'La lluvia está sonando suavemente.',
      );

      button.click();
      fixture.detectChanges();
      expect(source.stop).toHaveBeenCalledOnce();
      expect(audioContext.close).toHaveBeenCalledOnce();
      expect(button.getAttribute('aria-pressed')).toBe('false');
      fixture.destroy();
    } finally {
      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: originalAudioContext,
      });
    }
  });

  it('updates the activity when Angular reuses the dynamic support route', async () => {
    const fixture = await createPage('enraizar');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Enfoque sensorial en el vagón',
    );

    routeParameters.next(convertToParamMap({ activity: 'sobrecarga' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mucho ruido en el metro');
    expect(fixture.nativeElement.querySelector('.overload-page')).not.toBeNull();

    routeParameters.next(convertToParamMap({ activity: 'no-existe' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No encontramos esa herramienta',
    );
    fixture.destroy();
  });

  it('presents the mind-clearing text one short step at a time', async () => {
    const fixture = await createPage('despejar');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.reading-step')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Paso 1 de 12');
    expect(
      fixture.nativeElement.querySelector('.reading-progress-track').getAttribute('aria-valuenow'),
    ).toBe('1');
    const previous = fixture.nativeElement.querySelector(
      '.reading-previous',
    ) as HTMLButtonElement;
    const next = fixture.nativeElement.querySelector('.reading-next') as HTMLButtonElement;
    expect(previous.disabled).toBe(true);

    next.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paso 2 de 12');
    expect(previous.disabled).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.reading-step')).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelector('.reading-progress-track').getAttribute('aria-valuenow'),
    ).toBe('2');
    fixture.destroy();
  });

  it('offers a clear finish action on the final reading step', async () => {
    const fixture = await createPage('despejar');
    for (let step = 0; step < 11; step += 1) {
      fixture.componentInstance.nextReadingStep();
    }
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Paso 12 de 12');
    expect(
      fixture.nativeElement.querySelector('.reading-progress-track').getAttribute('aria-valuenow'),
    ).toBe('12');
    expect(
      fixture.nativeElement.querySelector('.reading-finish').textContent,
    ).toContain('Terminar lectura');
    fixture.nativeElement.querySelector('.reading-finish').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Qué bueno que te tomaste este momento.',
    );
    fixture.destroy();
  });

  it('returns tools opened from Bienvenida to Bienvenida on exit', async () => {
    const fixture = await createPage('despejar', 'bienvenida');
    fixture.detectChanges();

    expect(fixture.componentInstance.returnRoute()).toBe('/bienvenida');
    expect(
      fixture.nativeElement
        .querySelector('.support-header .back-link')
        .getAttribute('href'),
    ).toBe('/bienvenida');
    expect(
      fixture.nativeElement.querySelector('.support-header .back-link').textContent,
    ).toContain('Volver');

    fixture.componentInstance.closeExercise();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.secondary-button').getAttribute('href'),
    ).toBe('/bienvenida');
    expect(
      fixture.nativeElement.querySelector('.secondary-button').textContent,
    ).toContain('Volver a bienvenida');
    fixture.destroy();
  });

  it('returns an Explore practice to Explore from the exit link and completion card', async () => {
    const fixture = await createPage('sonidos', 'explorar');
    fixture.detectChanges();

    expect(fixture.componentInstance.returnRoute()).toBe('/explorar');
    expect(
      fixture.nativeElement
        .querySelector('.support-header .back-link')
        .getAttribute('href'),
    ).toBe('/explorar');

    fixture.componentInstance.closeExercise();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('.secondary-button').getAttribute('href'),
    ).toBe('/explorar');
    expect(fixture.nativeElement.textContent).toContain('Volver a Explorar');
    fixture.destroy();
  });

  it('shows a warm, non-judgmental message when an exercise is closed early', async () => {
    const fixture = await createPage('calmarme');
    fixture.componentInstance.closeExercise();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Qué bueno que te tomaste este momento. Buen viaje.',
    );
    expect(fixture.nativeElement.textContent).not.toMatch(/incompleto|fallaste/i);
    expect(
      fixture.nativeElement.querySelector('.exit-card .secondary-button')?.getAttribute('href'),
    ).toBe('/inicio');
    expect(
      fixture.nativeElement.querySelector('.support-header a.back-link')?.getAttribute('href'),
    ).toBe('/inicio');
    fixture.destroy();
  });

  it('lets guests explore the local practices, including the sensory refuge', async () => {
    const fixture = await createPage('herramientas');
    fixture.detectChanges();

    expect(
      Array.from(
        fixture.nativeElement.querySelectorAll('.tool-links a'),
        (link: Element) => link.getAttribute('href'),
      ),
    ).toEqual([
      '/apoyo/calmarme',
      '/apoyo/enraizar',
      '/apoyo/sobrecarga',
      '/apoyo/despejar',
    ]);
    fixture.destroy();
  });
});
