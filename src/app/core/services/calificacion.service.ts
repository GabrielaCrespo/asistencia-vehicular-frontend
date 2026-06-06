import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { CalificacionesTallerResponse } from '../models/organizacion.models';

@Injectable({ providedIn: 'root' })
export class CalificacionService {
  private http = inject(HttpClient);
  private base = `${environment.api.baseUrl}/api/calificacion`;

  getCalificacionesTaller(
    tallerId: number,
    limit = 20,
    offset = 0,
  ): Observable<CalificacionesTallerResponse> {
    return this.http.get<CalificacionesTallerResponse>(
      `${this.base}/taller/${tallerId}?limit=${limit}&offset=${offset}`,
    );
  }
}
