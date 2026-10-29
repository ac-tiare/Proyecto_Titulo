import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  ApiResponse,
  EmotionalPeriod,
  EmotionalPatterns,
  EmotionalRecord,
  EmotionalRecordRequest,
  Page,
} from './api.models';
import { apiBaseUrl } from './api.config';

@Injectable({ providedIn: 'root' })
export class EmotionalRecordApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${apiBaseUrl}/emociones`;

  list(
    page = 1,
    pageSize = 20,
    period?: EmotionalPeriod,
  ): Observable<Page<EmotionalRecord>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    if (period) params = params.set('period', period);

    return this.http
      .get<ApiResponse<Page<EmotionalRecord>>>(this.baseUrl, { params })
      .pipe(map((response) => response.data));
  }

  patterns(period: EmotionalPeriod): Observable<EmotionalPatterns> {
    return this.http
      .get<ApiResponse<EmotionalPatterns>>(`${this.baseUrl}/patrones`, {
        params: new HttpParams().set('period', period),
      })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<EmotionalRecord> {
    return this.http
      .get<ApiResponse<EmotionalRecord>>(`${this.baseUrl}/${id}`)
      .pipe(map((response) => response.data));
  }

  create(input: EmotionalRecordRequest): Observable<EmotionalRecord> {
    return this.http
      .post<ApiResponse<EmotionalRecord>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }

  update(
    id: string,
    input: EmotionalRecordRequest,
  ): Observable<EmotionalRecord> {
    return this.http
      .put<ApiResponse<EmotionalRecord>>(`${this.baseUrl}/${id}`, input)
      .pipe(map((response) => response.data));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
