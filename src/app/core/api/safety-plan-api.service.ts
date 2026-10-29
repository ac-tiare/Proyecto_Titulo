import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, SafetyPlan, SafetyPlanRequest } from './api.models';
import { apiBaseUrl } from './api.config';

@Injectable({ providedIn: 'root' })
export class SafetyPlanApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${apiBaseUrl}/plan-seguridad`;

  get(): Observable<SafetyPlan> {
    return this.http
      .get<ApiResponse<SafetyPlan>>(this.url)
      .pipe(map((response) => response.data));
  }

  save(input: SafetyPlanRequest): Observable<SafetyPlan> {
    return this.http
      .put<ApiResponse<SafetyPlan>>(this.url, input)
      .pipe(map((response) => response.data));
  }
}
