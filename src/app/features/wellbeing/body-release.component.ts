import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { GuestSessionService } from '../../core/guest-session.service';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

type RelaxationPhase = 'shoulders' | 'hands' | 'jaw';

@Component({
  selector: 'app-body-release',
  templateUrl: './body-release.component.html',
  styleUrl: './body-release.component.scss',
})
export class BodyReleaseComponent {
  readonly guestSession = inject(GuestSessionService);
  readonly totalSeconds = 90;
  readonly remainingSeconds = signal(this.totalSeconds);
  readonly started = signal(false);
  readonly paused = signal(false);
  readonly hapticsUnavailable = signal(false);
  readonly progress = computed(
    () =>
      Math.round(
        ((this.totalSeconds - this.remainingSeconds()) / this.totalSeconds) *
          100,
      ),
  );
  readonly phase = computed<RelaxationPhase>(() => {
    const elapsed = this.totalSeconds - this.remainingSeconds();
    if (elapsed < 30) return 'shoulders';
    if (elapsed < 60) return 'hands';
    return 'jaw';
  });
  readonly phaseCopy = computed(() => {
    switch (this.phase()) {
      case 'shoulders':
        return {
          title: 'Afloja los hombros',
          instruction:
            'Si te acomoda, elévalos apenas por un instante y déjalos descansar. También puedes solo notar su apoyo.',
        };
      case 'hands':
        return {
          title: 'Descansa las manos',
          instruction:
            'Suelta los dedos sobre tu regazo. No necesitas apretar ni hacer ningún movimiento.',
        };
      case 'jaw':
        return {
          title: 'Deja descansar la mandíbula',
          instruction:
            'Separa suavemente los dientes y permite que la lengua descanse. Haz solo lo que se sienta cómodo.',
        };
    }
  });
  readonly timerLabel = computed(() => {
    const minutes = Math.floor(this.remainingSeconds() / 60);
    const seconds = String(this.remainingSeconds() % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  });
  private readonly destroyRef = inject(DestroyRef);
  private intervalId: number | null = null;

  constructor() {
    this.guestSession.initialize();
    this.destroyRef.onDestroy(() => this.stopTimer());
  }

  toggleTimer(): void {
    if (this.started() && !this.paused()) {
      this.stopTimer();
      this.paused.set(true);
      return;
    }
    if (this.remainingSeconds() === 0) this.remainingSeconds.set(this.totalSeconds);
    this.started.set(true);
    this.paused.set(false);
    let previousPhase = this.phase();
    this.intervalId = window.setInterval(() => {
      const remaining = this.remainingSeconds();
      if (remaining <= 1) {
        this.remainingSeconds.set(0);
        this.stopTimer();
        return;
      }
      this.remainingSeconds.set(remaining - 1);
      const nextPhase = this.phase();
      if (nextPhase !== previousPhase) {
        previousPhase = nextPhase;
        this.pulse();
      }
    }, 1000);
  }

  toggleHaptics(): void {
    this.guestSession.toggleVibration();
    if (this.guestSession.vibrationEnabled()) this.pulse();
  }

  private pulse(): void {
    if (!this.guestSession.vibrationEnabled() || this.hapticsUnavailable()) return;
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() =>
      this.hapticsUnavailable.set(true),
    );
  }

  private stopTimer(): void {
    if (this.intervalId === null) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }
}
