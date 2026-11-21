import { TestBed } from '@angular/core/testing';
import { Haptics } from '@capacitor/haptics';

import { BodyReleaseComponent } from './body-release.component';
import { OfflineSoundsComponent } from './offline-sounds.component';
import { ThoughtDefusionComponent } from './thought-defusion.component';

vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn().mockResolvedValue(undefined) },
  ImpactStyle: { Light: 'LIGHT' },
}));

describe('Offline wellbeing tools', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('generates and controls an offline piano sound with an automatic timer choice', async () => {
    const originalAudioContext = window.AudioContext;
    const source = {
      buffer: null as AudioBuffer | null,
      loop: false,
      connect: vi.fn(),
      start: vi.fn(),
    };
    const audioContext = {
      destination: {},
      sampleRate: 1000,
      state: 'running' as AudioContextState,
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createBuffer: vi.fn((_channels: number, length: number) => ({
        getChannelData: vi.fn(() => new Float32Array(length)),
      })),
      createBufferSource: vi.fn(() => source),
      createGain: vi.fn(() => ({
        gain: { value: 0 },
        connect: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass' as BiquadFilterType,
        frequency: { value: 0 },
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
      await TestBed.configureTestingModule({
        imports: [OfflineSoundsComponent],
      }).compileComponents();
      const fixture = TestBed.createComponent(OfflineSoundsComponent);
      fixture.detectChanges();
      const component = fixture.componentInstance;

      (fixture.nativeElement.querySelectorAll(
        '.sound-choice',
      )[2] as HTMLButtonElement).click();
      fixture.nativeElement
        .querySelector('.duration-options button:nth-child(2)')
        .click();
      fixture.detectChanges();
      expect(component.durationMinutes()).toBe(5);
      expect(component.remainingSeconds()).toBe(300);

      fixture.nativeElement.querySelector('.sound-play').click();
      await vi.waitFor(() => expect(source.start).toHaveBeenCalledOnce());
      fixture.detectChanges();
      expect(component.playing()).toBe(true);
      expect(component.selectedTrack()).toBe('piano');
      expect(
        fixture.nativeElement.querySelector('.sound-play').getAttribute('aria-label'),
      ).toBe('Pausar sonido');

      fixture.nativeElement.querySelector('.sound-play').click();
      fixture.detectChanges();
      expect(component.playing()).toBe(false);
      expect(audioContext.close).toHaveBeenCalledOnce();
      fixture.destroy();
    } finally {
      Object.defineProperty(window, 'AudioContext', {
        configurable: true,
        value: originalAudioContext,
      });
    }
  });

  it('guides thought defusion through three steps without text input', async () => {
    await TestBed.configureTestingModule({
      imports: [ThoughtDefusionComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ThoughtDefusionComponent);
    fixture.detectChanges();

    let next = fixture.nativeElement.querySelector(
      '.thought-primary',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('input, textarea')).toBeNull();

    fixture.nativeElement.querySelector('.thought-choices button').click();
    fixture.detectChanges();
    expect(next.disabled).toBe(false);
    next.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'Estoy notando el pensamiento:',
    );
    next.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paso 3 de 3');
    next = fixture.nativeElement.querySelector(
      '.thought-primary',
    ) as HTMLButtonElement;
    expect(next.disabled).toBe(true);
    fixture.nativeElement.querySelector('.reframe-choices button').click();
    fixture.detectChanges();
    expect(next.disabled).toBe(false);
    expect(fixture.nativeElement.querySelector('.reframe-message')).not.toBeNull();
    fixture.destroy();
  });

  it('runs a silent 90-second body pause with optional haptics', async () => {
    await TestBed.configureTestingModule({
      imports: [BodyReleaseComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(BodyReleaseComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.remainingSeconds()).toBe(90);
    expect(fixture.nativeElement.textContent).toContain('Afloja los hombros');
    expect(fixture.nativeElement.textContent).toContain('Activar vibración opcional');

    fixture.nativeElement.querySelector('.body-primary').click();
    component.remainingSeconds.set(60);
    fixture.detectChanges();
    expect(component.phase()).toBe('hands');
    expect(fixture.nativeElement.textContent).toContain('Descansa las manos');

    component.remainingSeconds.set(30);
    fixture.detectChanges();
    expect(component.phase()).toBe('jaw');
    expect(fixture.nativeElement.textContent).toContain(
      'Deja descansar la mandíbula',
    );

    component.remainingSeconds.set(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('La pausa terminó');

    fixture.nativeElement.querySelector('.body-haptics').click();
    fixture.detectChanges();
    expect(component.guestSession.vibrationEnabled()).toBe(true);
    expect(vi.mocked(Haptics.impact)).toHaveBeenCalledOnce();
    fixture.destroy();
  });
});
