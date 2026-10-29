import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, Page, TrustedContact, TrustedContactRequest } from './api.models';
import { apiBaseUrl } from './api.config';

@Injectable({ providedIn: 'root' })
export class TrustedContactApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${apiBaseUrl}/contactos`;

  list(page = 1, pageSize = 20): Observable<Page<TrustedContact>> {
    const params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);
    return this.http
      .get<ApiResponse<Page<TrustedContact>>>(this.baseUrl, { params })
      .pipe(map((response) => response.data));
  }

  create(input: TrustedContactRequest): Observable<TrustedContact> {
    return this.http
      .post<ApiResponse<TrustedContact>>(this.baseUrl, input)
      .pipe(map((response) => response.data));
  }

  update(id: string, input: TrustedContactRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, input);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
