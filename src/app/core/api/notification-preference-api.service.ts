import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { apiBaseUrl } from './api.config';
import { ApiResponse } from './api.models';

export interface NotificationPreferences {
  emotionalCheckIns: boolean;
  preventiveWellbeing: boolean;
  safetyPlanUpdates: boolean;
}

export interface RemoteNotificationPreferences {
  preferences: NotificationPreferences;
  persisted: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationPreferenceApiService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${apiBaseUrl}/users/preferences`;

  get(): Observable<RemoteNotificationPreferences> {
    return this.http
      .get<ApiResponse<RemoteNotificationPreferences>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  save(
    preferences: NotificationPreferences,
  ): Observable<RemoteNotificationPreferences> {
    return this.http
      .put<ApiResponse<RemoteNotificationPreferences>>(
        this.endpoint,
        preferences,
      )
      .pipe(map((response) => response.data));
  }
}
