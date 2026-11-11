import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  NotificationPreferenceApiService,
  NotificationPreferences,
} from '../api/notification-preference-api.service';

export type { NotificationPreferences } from '../api/notification-preference-api.service';

export type NotificationPreferenceKey = keyof NotificationPreferences;
export type PreferenceSyncState = 'synced' | 'stale' | 'pending';

export interface LocalNotificationPreferenceState {
  preferences: NotificationPreferences;
  pendingKeys: NotificationPreferenceKey[];
  persisted: boolean;
  hasStoredValue: boolean;
  needsMigration: boolean;
}

export interface NotificationPreferenceResult {
  preferences: NotificationPreferences;
  syncState: PreferenceSyncState;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emotionalCheckIns: false,
  preventiveWellbeing: false,
  safetyPlanUpdates: false,
};

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly api = inject(NotificationPreferenceApiService);

  load(userId: string): NotificationPreferences {
    return this.loadState(userId).preferences;
  }

  save(userId: string, preferences: NotificationPreferences): void {
    this.saveState(userId, {
      preferences,
      pendingKeys: [],
      persisted: true,
      hasStoredValue: true,
      needsMigration: false,
    });
  }

  async synchronize(userId: string): Promise<NotificationPreferenceResult> {
    const local = this.loadState(userId);
    try {
      const remote = await firstValueFrom(this.api.get());
      if (local.pendingKeys.length) {
        const merged = { ...remote.preferences };
        for (const key of local.pendingKeys) {
          merged[key] = local.preferences[key];
        }
        const saved = await firstValueFrom(this.api.save(merged));
        this.saveRemoteState(userId, saved.preferences, saved.persisted);
        return { preferences: saved.preferences, syncState: 'synced' };
      }

      if (!remote.persisted && local.needsMigration) {
        const saved = await firstValueFrom(this.api.save(local.preferences));
        this.saveRemoteState(userId, saved.preferences, saved.persisted);
        return { preferences: saved.preferences, syncState: 'synced' };
      }

      this.saveRemoteState(userId, remote.preferences, remote.persisted);
      return { preferences: remote.preferences, syncState: 'synced' };
    } catch (error) {
      if (!this.isTemporaryFailure(error)) throw error;
      if (!local.hasStoredValue) throw error;
      return {
        preferences: local.preferences,
        syncState:
          local.pendingKeys.length || local.needsMigration
            ? 'pending'
            : 'stale',
      };
    }
  }

  async update(
    userId: string,
    key: NotificationPreferenceKey,
    enabled: boolean,
  ): Promise<NotificationPreferenceResult> {
    const previous = this.loadState(userId);
    const preferences = { ...previous.preferences, [key]: enabled };
    const pendingKeys = [...new Set([...previous.pendingKeys, key])];
    this.saveState(userId, {
      ...previous,
      preferences,
      pendingKeys,
      hasStoredValue: true,
      needsMigration: false,
    });

    try {
      const remote = await firstValueFrom(this.api.save(preferences));
      this.saveRemoteState(userId, remote.preferences, remote.persisted);
      return { preferences: remote.preferences, syncState: 'synced' };
    } catch (error) {
      if (this.isTemporaryFailure(error)) {
        return { preferences, syncState: 'pending' };
      }
      if (previous.hasStoredValue) this.saveState(userId, previous);
      else localStorage.removeItem(this.storageKey(userId));
      throw error;
    }
  }

  loadState(userId: string): LocalNotificationPreferenceState {
    const stored = localStorage.getItem(this.storageKey(userId));
    if (stored === null) {
      return {
        preferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
        pendingKeys: [],
        persisted: false,
        hasStoredValue: false,
        needsMigration: false,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      throw new Error('Las preferencias guardadas no tienen un formato válido.');
    }

    if (this.isPreferences(parsed)) {
      return {
        preferences: parsed,
        pendingKeys: [],
        persisted: false,
        hasStoredValue: true,
        needsMigration: true,
      };
    }

    if (typeof parsed === 'object' && parsed !== null) {
      const state = parsed as Record<string, unknown>;
      const pendingKeys = state['pendingKeys'];
      if (
        this.isPreferences(state['preferences']) &&
        this.isPreferenceKeys(pendingKeys) &&
        typeof state['persisted'] === 'boolean' &&
        typeof state['needsMigration'] === 'boolean'
      ) {
        return {
          preferences: state['preferences'],
          pendingKeys,
          persisted: state['persisted'],
          hasStoredValue: true,
          needsMigration: state['needsMigration'],
        };
      }
    }

    throw new Error('Las preferencias guardadas no tienen un formato válido.');
  }

  private storageKey(userId: string): string {
    return `contigo.notification-preferences.${encodeURIComponent(userId)}`;
  }

  private saveRemoteState(
    userId: string,
    preferences: NotificationPreferences,
    persisted: boolean,
  ): void {
    this.saveState(userId, {
      preferences,
      pendingKeys: [],
      persisted,
      hasStoredValue: true,
      needsMigration: false,
    });
  }

  private saveState(
    userId: string,
    state: LocalNotificationPreferenceState,
  ): void {
    localStorage.setItem(this.storageKey(userId), JSON.stringify(state));
  }

  private isTemporaryFailure(error: unknown): boolean {
    return (
      error instanceof HttpErrorResponse &&
      (error.status === 0 || error.status >= 500)
    );
  }

  private isPreferenceKey(value: unknown): value is NotificationPreferenceKey {
    return (
      value === 'emotionalCheckIns' ||
      value === 'preventiveWellbeing' ||
      value === 'safetyPlanUpdates'
    );
  }

  private isPreferenceKeys(
    value: unknown,
  ): value is NotificationPreferenceKey[] {
    return Array.isArray(value) && value.every((key) => this.isPreferenceKey(key));
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
