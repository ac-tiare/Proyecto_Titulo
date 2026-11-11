import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { apiBaseUrl } from './api.config';
import { ApiResponse } from './api.models';

export type ResourceCategoryId =
  | 'bienestar-emocional'
  | 'senales-alerta'
  | 'autocuidado'
  | 'busqueda-ayuda-prevencion';

export interface ResourceSummary {
  id: string;
  title: string;
  summary: string;
  category: ResourceCategoryId;
  imageUrl: string | null;
  createdAt: string;
}

export interface ResourceLink {
  label: string;
  url: string;
}

export interface ResourceDetail extends ResourceSummary {
  content: string[];
  links: ResourceLink[];
}

@Injectable({ providedIn: 'root' })
export class ResourceApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${apiBaseUrl}/resources`;

  list(category?: ResourceCategoryId): Observable<ResourceSummary[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http
      .get<ApiResponse<ResourceSummary[]>>(this.baseUrl, { params })
      .pipe(map((response) => response.data));
  }

  get(id: string): Observable<ResourceDetail> {
    return this.http
      .get<ApiResponse<ResourceDetail>>(`${this.baseUrl}/${encodeURIComponent(id)}`)
      .pipe(map((response) => response.data));
  }
}
