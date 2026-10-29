import { Capacitor } from '@capacitor/core';
import { Injectable } from '@angular/core';

import type { AuthCredentials } from './api.models';

interface StoredCredentials {
  accessToken: string;
  refreshToken: string;
}

const credentialsKey = 'contigo-session-credentials';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  !(value instanceof Date);

@Injectable({ providedIn: 'root' })
export class NativeSessionStore {
  private readonly native = Capacitor.isNativePlatform();

  async save(credentials: AuthCredentials): Promise<void> {
    if (!this.native) return;
    if (!credentials.accessToken || !credentials.refreshToken) {
      throw new Error('The native session response did not contain credentials.');
    }

    const { SecureStorage } = await import(
      '@aparajita/capacitor-secure-storage'
    );
    await SecureStorage.set(credentialsKey, {
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
    });
  }

  async accessToken(): Promise<string | null> {
    return (await this.credentials())?.accessToken ?? null;
  }

  async refreshToken(): Promise<string | null> {
    return (await this.credentials())?.refreshToken ?? null;
  }

  async clear(): Promise<void> {
    if (!this.native) return;
    const { SecureStorage } = await import(
      '@aparajita/capacitor-secure-storage'
    );
    await SecureStorage.remove(credentialsKey);
  }

  private async credentials(): Promise<StoredCredentials | null> {
    if (!this.native) return null;
    const { SecureStorage } = await import(
      '@aparajita/capacitor-secure-storage'
    );
    const value = await SecureStorage.get(credentialsKey);
    if (value === null) return null;

    if (
      !isRecord(value) ||
      typeof value['accessToken'] !== 'string' ||
      typeof value['refreshToken'] !== 'string'
    ) {
      throw new Error('Stored native session credentials are invalid.');
    }
    return {
      accessToken: value['accessToken'],
      refreshToken: value['refreshToken'],
    };
  }
}
