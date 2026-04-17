import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { TallerProfile, TallerProfileUpdate } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class TallerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.api.baseUrl}/api/taller`;

  getProfile(tallerId: number): Observable<TallerProfile> {
    return this.http.get<TallerProfile>(`${this.baseUrl}/profile/${tallerId}`)
      .pipe(timeout(10000)); // 10 segundos máximo
  }

  updateProfile(tallerId: number, data: TallerProfileUpdate): Observable<TallerProfile> {
    return this.http.put<TallerProfile>(`${this.baseUrl}/profile/${tallerId}`, data)
      .pipe(timeout(55000)); // 55 segundos — margen para cold start de Render
  }
}
