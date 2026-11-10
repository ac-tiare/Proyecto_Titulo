import { Injectable } from '@angular/core';

export interface NotificationPreferences {
  emotionalCheckIns: boolean;
  preventiveWellbeing: boolean;
  safetyPlanUpdates: boolean;
}

export type NotificationPreferenceKey = keyof NotificationPreferences;

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emotionalCheckIns: false,
  preventiveWellbeing: false,
  safetyPlanUpdates: false,
};

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  load(userId: string): NotificationPreferences {
    const stored = localStorage.getItem(this.storageKey(userId));
    if (stored === null) return { ...DEFAULT_NOTIFICATION_PREFERENCES };

    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      throw new Error('Las preferencias guardadas no tienen un formato válido.');
    }

    if (!this.isPreferences(parsed)) {
      throw new Error('Las preferencias guardadas no tienen un formato válido.');
    }

    return parsed;
  }

  save(userId: string, preferences: NotificationPreferences): void {
    localStorage.setItem(this.storageKey(userId), JSON.stringify(preferences));
  }

  private storageKey(userId: string): string {
    return `contigo.notification-preferences.${encodeURIComponent(userId)}`;
  }

  private isPreferences(value: unknown): value is NotificationPreferences {
    if (typeof value !== 'object' || value === null) return false;
    const preferences = value as Record<string, unknown>;
    return (
      typeof preferences['emotionalCheckIns'] === 'boolean' &&
      typeof preferences['preventiveWellbeing'] === 'boolean' &&
      typeof preferences['safetyPlanUpdates'] === 'boolean'
    );
  }
}
