import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

import { GuestSessionService } from '../../core/guest-session.service';
import { BodyReleaseComponent } from './body-release.component';
import { OfflineSoundsComponent } from './offline-sounds.component';
import { ThoughtDefusionComponent } from './thought-defusion.component';

type BreathingPhase =
  | 'first-inhale'
  | 'second-inhale'
  | 'inhale'
  | 'hold'
  | 'exhale';

type BreathingRhythm = 'free' | 'balanced' | 'deep';

type SupportActivity =
  | 'calmarme'
  | 'enraizar'
  | 'despejar'
  | 'respirar'
  | 'sobrecarga'
  | 'sonidos'
  | 'pensamientos'
  | 'cuerpo'
  | 'herramientas';

const supportActivities: readonly SupportActivity[] = [
  'calmarme',
  'enraizar',
  'despejar',
  'respirar',
  'sobrecarga',
  'sonidos',
  'pensamientos',
  'cuerpo',
  'herramientas',
];

const isSupportActivity = (value: string | null): value is SupportActivity =>
  value !== null && supportActivities.includes(value as SupportActivity);

@Component({
  selector: 'app-quick-support',
  templateUrl: './quick-support.page.html',
  styleUrl: './quick-support.page.scss',
  imports: [
    BodyReleaseComponent,
    IonContent,
    OfflineSoundsComponent,
    RouterLink,
    ThoughtDefusionComponent,
  ],
})
export class QuickSupportPage {
  readonly guestSession = inject(GuestSessionService);
  readonly activity = signal<SupportActivity | null>(null);
  readonly returnRoute = signal<'/inicio' | '/bienvenida' | '/explorar'>('/inicio');
  readonly remainingSeconds = signal(60);
  readonly durationOptions = [1, 2, 3] as const;
  readonly breathingDurationMinutes = signal<1 | 2 | 3>(1);
  readonly breathingRhythm = signal<BreathingRhythm>('free');
  readonly breathingRhythms: readonly {
    id: BreathingRhythm;
    label: string;
  }[] = [
    { id: 'free', label: 'Ritmo libre' },
    { id: 'balanced', label: 'Equilibrado 4-4' },
    { id: 'deep', label: 'Calma profunda 4-7-8' },
  ];
  readonly petals = [0, 1, 2, 3, 4, 5, 6, 7];
  readonly closing = signal(false);
  readonly activeGroundingStep = signal<string | null>(null);
  readonly markedGroundingBubbles = signal<ReadonlySet<string>>(new Set());
  readonly overloadStep = signal<1 | 2 | 3>(1);
  readonly focusPointSeconds = signal(15);
  readonly tensionReleaseSeconds = signal(3);
  readonly tensionReleaseStarted = signal(false);
  readonly hapticsUnavailable = signal(false);
  readonly rainAudioEnabled = signal(false);
  readonly rainAudioStarting = signal(false);
  readonly rainAudioError = signal('');
  readonly breathingPhase = computed<BreathingPhase>(() => {
    const elapsed =
      this.breathingDurationMinutes() * 60 - this.remainingSeconds();
    const phases = this.breathingPattern();
    const cycleLength = phases.reduce((total, phase) => total + phase.seconds, 0);
    let cycleSecond = elapsed % cycleLength;
    for (const phase of phases) {
      if (cycleSecond < phase.seconds) return phase.name;
      cycleSecond -= phase.seconds;
    }
    return phases[0].name;
  });
  readonly breathingCue = computed(() => {
    const phase = this.breathingPhase();
    if (this.activity() === 'calmarme') {
      const crisisCues: Partial<Record<BreathingPhase, string>> = {
        'first-inhale': 'Inhala suavemente',
        'second-inhale': 'Toma un poco más de aire',
        exhale: 'Suelta el aire lentamente',
      };
      return crisisCues[phase] ?? 'Respira a tu manera';
    }

    if (this.breathingRhythm() === 'free') {
      return phase === 'inhale' ? 'Inhala a tu ritmo' : 'Suelta el aire cuando quieras';
    }
    if (this.breathingRhythm() === 'deep') {
      if (phase === 'inhale') return 'Inhala suavemente · 4';
      if (phase === 'hold') return 'Sostén sin esfuerzo · 7';
      return 'Exhala despacio · 8';
    }
    return phase === 'inhale' ? 'Inhala · 4' : 'Exhala · 4';
  });
  readonly breathingTimerLabel = computed(() => {
    const minutes = Math.floor(this.remainingSeconds() / 60);
    const seconds = String(this.remainingSeconds() % 60).padStart(2, '0');
    return `${minutes}:${seconds} restantes`;
  });
  readonly breathingAnchor = computed(() => {
    const anchors = [
      'Estás a salvo en este momento',
      'Apoya ambos pies en el suelo del vagón',
      'Esta sensación va a pasar',
    ];
    const elapsed = 60 - this.remainingSeconds();
    return anchors[Math.floor(elapsed / 16) % anchors.length];
  });
  readonly isExhaling = computed(
    () => this.breathingPhase() === 'exhale',
  );
  readonly readingSteps = [
    'A veces el trayecto se siente lleno de ruido, movimiento y pensamientos.',
    'No necesitas ordenar todo ahora. Puedes dejar que este momento sea solo un momento.',
    'El vagón sigue su recorrido, estación a estación. Tú solo necesitas estar aquí, tal como estás.',
    'Si te sirve, observa un detalle: una línea en la ventana, un color o el movimiento de las luces.',
    'No hace falta fijar la mirada ni cerrar los ojos. Solo nota un detalle y deja que tu atención descanse.',
    'Si aparece un pensamiento insistente, no tienes que discutir con él.',
    'Puedes reconocerlo y, cuando quieras, volver a una palabra: pausa.',
    'También puedes notar el apoyo de tus pies o del asiento.',
    'Si algo no te acomoda, déjalo pasar y elige otra cosa. No existe una forma correcta.',
    'Tal vez solo necesitas llegar a tu estación. Puedes ir paso a paso, sin exigirte sentir algo determinado.',
    'Lo que estás haciendo en este momento ya es suficiente.',
    'Tómate el tiempo que te sirva. No es necesario terminar la lectura.',
  ];
  readonly readingStep = signal(0);
  readonly readingProgress = computed(() =>
    Math.round(((this.readingStep() + 1) / this.readingSteps.length) * 100),
  );
  readonly groundingSteps = [
    { count: '5', prompt: 'cosas que puedes ver' },
    { count: '4', prompt: 'sensaciones de contacto' },
    { count: '3', prompt: 'sonidos que notas' },
    { count: '2', prompt: 'detalles agradables del entorno' },
    { count: '1', prompt: 'frase amable que quieras decirte' },
  ];
  private intervalId: number | null = null;
  private focusPointIntervalId: number | null = null;
  private tensionReleaseIntervalId: number | null = null;
  private rainAudioContext: AudioContext | null = null;
  private rainNoiseSource: AudioBufferSourceNode | null = null;

  constructor() {
    const destroyRef = inject(DestroyRef);
    const route = inject(ActivatedRoute);
    this.guestSession.initialize();
    route.paramMap
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((parameters) => this.loadActivity(parameters.get('activity')));
    route.queryParamMap
      .pipe(takeUntilDestroyed(destroyRef))
      .subscribe((parameters) => {
        const returnTo = parameters.get('returnTo');
        this.returnRoute.set(
          returnTo === 'bienvenida'
            ? '/bienvenida'
            : returnTo === 'explorar'
              ? '/explorar'
              : '/inicio',
        );
      });
    destroyRef.onDestroy(() => {
      this.stopBreathing();
      this.stopFocusPointTimer();
      this.stopTensionReleaseTimer();
      this.stopRainAudio();
    });
  }

  isBreathingActivity(): boolean {
    return this.activity() === 'calmarme' || this.activity() === 'respirar';
  }

  selectBreathingDuration(minutes: 1 | 2 | 3): void {
    if (this.activity() !== 'respirar') return;
    this.breathingDurationMinutes.set(minutes);
    this.startBreathing();
  }

  selectBreathingRhythm(rhythm: BreathingRhythm): void {
    if (this.activity() === 'respirar') this.breathingRhythm.set(rhythm);
  }

  startBreathing(): void {
    this.stopBreathing();
    this.closing.set(false);
    this.remainingSeconds.set(this.breathingDurationMinutes() * 60);
    this.intervalId = window.setInterval(() => {
      const previousPhase = this.breathingPhase();
      const remaining = this.remainingSeconds();
      if (remaining <= 1) {
        this.remainingSeconds.set(0);
        this.stopBreathing();
        return;
      }
      this.remainingSeconds.set(remaining - 1);
      if (this.breathingPhase() !== previousPhase) this.pulse();
    }, 1000);
  }

  closeExercise(): void {
    this.stopBreathing();
    this.stopFocusPointTimer();
    this.stopTensionReleaseTimer();
    this.stopRainAudio();
    this.closing.set(true);
  }

  async toggleRainAudio(): Promise<void> {
    if (this.rainAudioStarting()) return;
    if (this.rainAudioEnabled()) {
      this.stopRainAudio();
      return;
    }

    this.rainAudioError.set('');
    const AudioContextConstructor = window.AudioContext;
    if (typeof AudioContextConstructor !== 'function') {
      this.rainAudioError.set(
        'El sonido no está disponible en este dispositivo. Puedes continuar en silencio.',
      );
      return;
    }

    this.rainAudioStarting.set(true);
    let context: AudioContext | null = null;
    try {
      context = new AudioContextConstructor();
      this.rainAudioContext = context;
      await context.resume();
      if (this.rainAudioContext !== context || this.activity() !== 'sobrecarga') {
        return;
      }

      const noiseBuffer = context.createBuffer(
        1,
        context.sampleRate * 4,
        context.sampleRate,
      );
      const noise = noiseBuffer.getChannelData(0);
      for (let index = 0; index < noise.length; index += 1) {
        noise[index] = Math.random() * 2 - 1;
      }

      const source = context.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const highPass = context.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 350;

      const lowPass = context.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 2800;

      const volume = context.createGain();
      volume.gain.value = 0.035;

      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(volume);
      volume.connect(context.destination);
      source.start();

      this.rainNoiseSource = source;
      this.rainAudioEnabled.set(true);
    } catch {
      if (context && this.rainAudioContext === context) {
        this.stopRainAudio();
      }
      this.rainAudioError.set(
        'No pudimos activar el sonido. Puedes continuar con la guía en silencio.',
      );
    } finally {
      this.rainAudioStarting.set(false);
    }
  }

  confirmOverloadAnchor(): void {
    if (this.activity() !== 'sobrecarga' || this.overloadStep() !== 1) return;
    this.triggerHaptic();
    this.overloadStep.set(2);
    this.focusPointSeconds.set(15);
    this.focusPointIntervalId = window.setInterval(() => {
      const remaining = this.focusPointSeconds();
      if (remaining <= 1) {
        this.focusPointSeconds.set(0);
        this.stopFocusPointTimer();
        return;
      }
      this.focusPointSeconds.set(remaining - 1);
    }, 1000);
  }

  nextOverloadStep(): void {
    if (this.activity() !== 'sobrecarga' || this.overloadStep() !== 2) return;
    this.stopFocusPointTimer();
    this.overloadStep.set(3);
    this.tensionReleaseSeconds.set(3);
    this.tensionReleaseStarted.set(false);
  }

  startTensionRelease(): void {
    if (this.activity() !== 'sobrecarga' || this.overloadStep() !== 3) return;
    this.stopTensionReleaseTimer();
    this.tensionReleaseStarted.set(true);
    this.tensionReleaseSeconds.set(3);
    this.tensionReleaseIntervalId = window.setInterval(() => {
      const remaining = this.tensionReleaseSeconds();
      if (remaining <= 1) {
        this.tensionReleaseSeconds.set(0);
        this.stopTensionReleaseTimer();
        return;
      }
      this.tensionReleaseSeconds.set(remaining - 1);
    }, 1000);
  }

  toggleGroundingStep(count: string): void {
    this.activeGroundingStep.update((active) =>
      active === count ? null : count,
    );
    this.triggerHaptic();
  }

  groundingBubbles(count: string): number[] {
    return Array.from({ length: Number(count) }, (_, index) => index + 1);
  }

  isGroundingBubbleMarked(count: string, bubble: number): boolean {
    return this.markedGroundingBubbles().has(`${count}-${bubble}`);
  }

  isGroundingStepComplete(count: string): boolean {
    return this.groundingBubbles(count).every((bubble) =>
      this.isGroundingBubbleMarked(count, bubble),
    );
  }

  toggleGroundingBubble(count: string, bubble: number): void {
    const key = `${count}-${bubble}`;
    this.markedGroundingBubbles.update((marked) => {
      const updated = new Set(marked);
      if (updated.has(key)) updated.delete(key);
      else updated.add(key);
      return updated;
    });
    this.triggerHaptic();
  }

  previousReadingStep(): void {
    const step = this.readingStep();
    if (step === 0) return;
    this.readingStep.set(step - 1);
    this.pulse();
  }

  nextReadingStep(): void {
    const step = this.readingStep();
    if (step >= this.readingSteps.length - 1) return;
    this.readingStep.set(step + 1);
    this.pulse();
  }

  toggleHaptics(): void {
    this.guestSession.toggleVibration();
    if (this.guestSession.vibrationEnabled()) this.triggerHaptic();
  }

  private pulse(): void {
    if (!this.guestSession.vibrationEnabled()) return;
    this.triggerHaptic();
  }

  private triggerHaptic(): void {
    if (this.hapticsUnavailable()) return;
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() =>
      this.hapticsUnavailable.set(true),
    );
  }

  private breathingPattern(): readonly {
    name: BreathingPhase;
    seconds: number;
  }[] {
    if (this.activity() === 'calmarme') {
      return [
        { name: 'first-inhale', seconds: 2 },
        { name: 'second-inhale', seconds: 1 },
        { name: 'exhale', seconds: 4 },
      ];
    }

    switch (this.breathingRhythm()) {
      case 'balanced':
        return [
          { name: 'inhale', seconds: 4 },
          { name: 'exhale', seconds: 4 },
        ];
      case 'deep':
        return [
          { name: 'inhale', seconds: 4 },
          { name: 'hold', seconds: 7 },
          { name: 'exhale', seconds: 8 },
        ];
      default:
        return [
          { name: 'inhale', seconds: 5 },
          { name: 'exhale', seconds: 5 },
        ];
    }
  }

  private loadActivity(value: string | null): void {
    this.stopBreathing();
    this.stopFocusPointTimer();
    this.stopTensionReleaseTimer();
    this.stopRainAudio();
    this.rainAudioError.set('');
    this.activity.set(isSupportActivity(value) ? value : null);
    this.closing.set(false);
    this.activeGroundingStep.set(null);
    this.markedGroundingBubbles.set(new Set());
    this.overloadStep.set(1);
    this.focusPointSeconds.set(15);
    this.tensionReleaseSeconds.set(3);
    this.tensionReleaseStarted.set(false);
    this.readingStep.set(0);
    if (this.isBreathingActivity()) this.startBreathing();
  }

  private stopBreathing(): void {
    if (this.intervalId === null) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private stopFocusPointTimer(): void {
    if (this.focusPointIntervalId === null) return;
    window.clearInterval(this.focusPointIntervalId);
    this.focusPointIntervalId = null;
  }

  private stopTensionReleaseTimer(): void {
    if (this.tensionReleaseIntervalId === null) return;
    window.clearInterval(this.tensionReleaseIntervalId);
    this.tensionReleaseIntervalId = null;
  }

  private stopRainAudio(): void {
    const context = this.rainAudioContext;
    const source = this.rainNoiseSource;
    this.rainAudioContext = null;
    this.rainNoiseSource = null;
    this.rainAudioEnabled.set(false);
    this.rainAudioStarting.set(false);

    if (source) {
      try {
        source.stop();
      } catch {
        this.rainAudioError.set(
          'El sonido no se pudo detener correctamente. Revisa el volumen del dispositivo.',
        );
      }
    }
    if (context && context.state !== 'closed') {
      void context.close().catch(() => {
        this.rainAudioError.set(
          'El sonido se detuvo, pero el dispositivo no pudo liberar el audio.',
        );
      });
    }
  }
}
