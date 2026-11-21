import { Component, DestroyRef, computed, inject, signal } from '@angular/core';

type SoundTrack = 'brown-noise' | 'rain' | 'piano';
type SoundDuration = 3 | 5;

@Component({
  selector: 'app-offline-sounds',
  templateUrl: './offline-sounds.component.html',
  styleUrl: './offline-sounds.component.scss',
})
export class OfflineSoundsComponent {
  readonly tracks: readonly { id: SoundTrack; label: string; detail: string }[] = [
    {
      id: 'brown-noise',
      label: 'Ruido marrón',
      detail: 'Un sonido profundo y constante',
    },
    { id: 'rain', label: 'Lluvia suave', detail: 'Un murmullo ligero y parejo' },
    { id: 'piano', label: 'Piano lento', detail: 'Notas tranquilas sintetizadas' },
  ];
  readonly durations: readonly SoundDuration[] = [3, 5];
  readonly selectedTrack = signal<SoundTrack>('brown-noise');
  readonly durationMinutes = signal<SoundDuration>(3);
  readonly remainingSeconds = signal(180);
  readonly playing = signal(false);
  readonly starting = signal(false);
  readonly errorMessage = signal('');
  readonly timerLabel = computed(() => {
    const minutes = Math.floor(this.remainingSeconds() / 60);
    const seconds = String(this.remainingSeconds() % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  });
  private readonly destroyRef = inject(DestroyRef);
  private audioContext: AudioContext | null = null;
  private intervalId: number | null = null;
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.stopPlayback();
    });
  }

  selectTrack(track: SoundTrack): void {
    if (this.playing()) this.pausePlayback();
    this.selectedTrack.set(track);
    this.errorMessage.set('');
  }

  selectDuration(minutes: SoundDuration): void {
    if (this.playing()) this.pausePlayback();
    this.durationMinutes.set(minutes);
    this.remainingSeconds.set(minutes * 60);
  }

  async togglePlayback(): Promise<void> {
    if (this.starting()) return;
    if (this.playing()) {
      this.pausePlayback();
      return;
    }

    const AudioContextConstructor = window.AudioContext;
    if (typeof AudioContextConstructor !== 'function') {
      this.errorMessage.set(
        'El audio no está disponible en este dispositivo. Puedes continuar sin sonido.',
      );
      return;
    }

    if (this.remainingSeconds() === 0) {
      this.remainingSeconds.set(this.durationMinutes() * 60);
    }
    this.errorMessage.set('');
    this.starting.set(true);

    let context: AudioContext | null = null;
    try {
      context = new AudioContextConstructor();
      this.audioContext = context;
      await context.resume();
      if (this.destroyed || this.audioContext !== context) return;

      this.createTrack(context, this.selectedTrack());
      this.playing.set(true);
      this.intervalId = window.setInterval(() => {
        const remaining = this.remainingSeconds();
        if (remaining <= 1) {
          this.remainingSeconds.set(0);
          this.stopPlayback();
          return;
        }
        this.remainingSeconds.set(remaining - 1);
      }, 1000);
    } catch {
      if (context && this.audioContext === context) this.stopPlayback();
      this.errorMessage.set(
        'No pudimos iniciar el sonido. Revisa el volumen o continúa en silencio.',
      );
    } finally {
      this.starting.set(false);
    }
  }

  private createTrack(context: AudioContext, track: SoundTrack): void {
    const buffer = context.createBuffer(
      1,
      context.sampleRate * 8,
      context.sampleRate,
    );
    const samples = buffer.getChannelData(0);

    if (track === 'piano') {
      this.fillPianoBuffer(samples, context.sampleRate);
    } else {
      this.fillNoiseBuffer(samples, track);
    }

    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const volume = context.createGain();
    volume.gain.value = track === 'piano' ? 0.48 : 0.055;

    if (track === 'brown-noise') {
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 520;
      source.connect(filter);
      filter.connect(volume);
    } else if (track === 'rain') {
      const highPass = context.createBiquadFilter();
      highPass.type = 'highpass';
      highPass.frequency.value = 360;
      const lowPass = context.createBiquadFilter();
      lowPass.type = 'lowpass';
      lowPass.frequency.value = 2600;
      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(volume);
    } else {
      source.connect(volume);
    }

    volume.connect(context.destination);
    source.start();
  }

  private fillNoiseBuffer(samples: Float32Array, track: 'brown-noise' | 'rain'): void {
    let brown = 0;
    for (let index = 0; index < samples.length; index += 1) {
      const white = Math.random() * 2 - 1;
      if (track === 'rain') {
        samples[index] = white;
      } else {
        brown = (brown + 0.025 * white) / 1.025;
        samples[index] = brown * 3.2;
      }
    }
  }

  private fillPianoBuffer(samples: Float32Array, sampleRate: number): void {
    const notes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
    for (let index = 0; index < samples.length; index += 1) {
      const time = index / sampleRate;
      const noteTime = time % 1;
      const frequency = notes[Math.floor(time) % notes.length];
      const envelope = Math.min(1, noteTime * 24) * Math.exp(-noteTime * 3.1);
      samples[index] =
        envelope *
        (Math.sin(2 * Math.PI * frequency * noteTime) +
          0.2 * Math.sin(4 * Math.PI * frequency * noteTime)) *
        0.12;
    }
  }

  private pausePlayback(): void {
    this.stopPlayback();
  }

  private stopPlayback(): void {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.playing.set(false);
    const context = this.audioContext;
    this.audioContext = null;
    if (context && context.state !== 'closed') {
      void context.close().catch(() => {
        this.errorMessage.set(
          'El sonido se detuvo, pero el dispositivo no pudo liberar el audio.',
        );
      });
    }
  }
}
