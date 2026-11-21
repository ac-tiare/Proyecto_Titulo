import { Injectable, signal } from '@angular/core';

const GUEST_SESSION_KEY = 'contigo.guest-session';
const REDUCE_MOTION_KEY = 'contigo.guest.reduce-motion';
const VIBRATION_KEY = 'contigo.guest.vibration';

@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  readonly reduceMotion = signal(false);
  readonly vibrationEnabled = signal(false);
  readonly persistenceWarning = signal(false);
  private initialized = false;

  initialize(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.reduceMotion.set(
      typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );

    try {
      localStorage.setItem(GUEST_SESSION_KEY, 'active');
      const savedPreference = localStorage.getItem(REDUCE_MOTION_KEY);
      if (savedPreference !== null) {
        this.reduceMotion.set(savedPreference === 'true');
      }
      this.vibrationEnabled.set(localStorage.getItem(VIBRATION_KEY) === 'true');
    } catch {
      this.persistenceWarning.set(true);
    }
  }

  toggleReducedMotion(): void {
    this.reduceMotion.update((enabled) => !enabled);
    try {
      localStorage.setItem(REDUCE_MOTION_KEY, String(this.reduceMotion()));
    } catch {
      this.persistenceWarning.set(true);
    }
  }

  toggleVibration(): void {
    this.vibrationEnabled.update((enabled) => !enabled);
    try {
      localStorage.setItem(VIBRATION_KEY, String(this.vibrationEnabled()));
    } catch {
      this.persistenceWarning.set(true);
    }
  }
}
