import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import {
  Cotizacion,
  CotizacionesState,
  CotizacionMessageResponse,
  RegistrarCotizacionRequest,
  RegistrarCotizacionResponse,
} from '../models/cotizaciones.models';

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/cotizacion`;

  private state = new BehaviorSubject<CotizacionesState>({
    cotizaciones: [],
    loading: false,
    error: null,
  });

  state$ = this.state.asObservable();

  getCotizaciones$(): Observable<Cotizacion[]> {
    return this.state$.pipe(map(s => s.cotizaciones));
  }

  isLoading$(): Observable<boolean> {
    return this.state$.pipe(map(s => s.loading));
  }

  error$(): Observable<string | null> {
    return this.state$.pipe(map(s => s.error));
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.storageService.getToken()}`,
      'Content-Type': 'application/json',
    });
  }

  private patch(partial: Partial<CotizacionesState>): void {
    this.state.next({ ...this.state.value, ...partial });
  }

  cargarMisCotizaciones(tallerId: number): Observable<Cotizacion[]> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<Cotizacion[]>(`${this.apiUrl}/${tallerId}/mis-cotizaciones`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(cotizaciones => this.patch({ cotizaciones, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail ?? 'Error cargando cotizaciones';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        }),
      );
  }

  registrarCotizacion(
    tallerId: number,
    payload: RegistrarCotizacionRequest,
  ): Observable<RegistrarCotizacionResponse> {
    return this.http
      .post<RegistrarCotizacionResponse>(
        `${this.apiUrl}/${tallerId}/registrar`,
        payload,
        { headers: this.getHeaders() },
      )
      .pipe(
        catchError(err => {
          const msg = err?.error?.detail ?? 'Error registrando cotización';
          return throwError(() => ({ message: msg }));
        }),
      );
  }

  actualizarCotizacion(
    tallerId: number,
    cotizacionId: number,
    payload: { costo_estimado: number; tiempo_estimado: number; observaciones?: string },
  ): Observable<CotizacionMessageResponse> {
    return this.http
      .put<CotizacionMessageResponse>(
        `${this.apiUrl}/${tallerId}/${cotizacionId}`,
        payload,
        { headers: this.getHeaders() },
      )
      .pipe(
        tap(() => {
          const cotizaciones = this.state.value.cotizaciones.map(c =>
            c.cotizacion_id === cotizacionId
              ? { ...c, ...payload }
              : c,
          );
          this.patch({ cotizaciones });
        }),
        catchError(err => {
          const msg = err?.error?.detail ?? 'Error actualizando cotización';
          return throwError(() => ({ message: msg }));
        }),
      );
  }

  eliminarCotizacion(
    tallerId: number,
    cotizacionId: number,
  ): Observable<CotizacionMessageResponse> {
    return this.http
      .delete<CotizacionMessageResponse>(
        `${this.apiUrl}/${tallerId}/${cotizacionId}`,
        { headers: this.getHeaders() },
      )
      .pipe(
        tap(() => {
          const cotizaciones = this.state.value.cotizaciones.filter(
            c => c.cotizacion_id !== cotizacionId,
          );
          this.patch({ cotizaciones });
        }),
        catchError(err => {
          const msg = err?.error?.detail ?? 'Error eliminando cotización';
          return throwError(() => ({ message: msg }));
        }),
      );
  }

  limpiarEstado(): void {
    this.state.next({ cotizaciones: [], loading: false, error: null });
  }
}
