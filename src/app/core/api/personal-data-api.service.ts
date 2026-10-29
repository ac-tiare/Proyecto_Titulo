import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse } from './api.models';

export interface PersonalDataExport {
  exportedAt: string;
  profile: {
    id: string;
    name: string;
    surname: string | null;
    email: string;
    createdAt: string;
  };
  emotionalRecords: Array<{
    id: string;
    mood: string;
    emotions: string[];
    note: string | null;
    otherEmotion: string | null;
    recordedAt: string;
    createdAt: string;
  }>;
  safetyPlan: {
    createdAt: string;
    updatedAt: string;
    items: Array<{
      type: string;
      content: string;
      position: number;
    }>;
  } | null;
  trustedContacts: Array<{
    id: string;
    name: string;
    phone: string;
    relationship: string | null;
    details: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
}

@Injectable({ providedIn: 'root' })
export class PersonalDataApiService {
  private readonly http = inject(HttpClient);

  exportData(): Observable<PersonalDataExport> {
    return this.http
      .get<ApiResponse<PersonalDataExport>>('/api/privacy/export')
      .pipe(map((response) => response.data));
  }

  deleteAccount(): Observable<void> {
    return this.http.delete<void>('/api/privacy/account', {
      body: { confirmation: 'ELIMINAR MI CUENTA' },
    });
  }
}
