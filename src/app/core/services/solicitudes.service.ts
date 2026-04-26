import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import {
  SolicitudDisponible,
  SolicitudAsignada,
  DetalleIncidente,
  AceptarSolicitudRequest,
  RechazarSolicitudRequest,
  AsignarTecnicoRequest,
  ActualizarEstadoRequest,
  DiagnosticoRequest,
  AsignacionResponse,
  SolicitudesState,
} from '../models/solicitudes.models';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/asignacion`;

  private state = new BehaviorSubject<SolicitudesState>({
    disponibles: [],
    asignadas: [],
    historial: [],
    loading: false,
    error: null,
  });

  public state$ = this.state.asObservable();

  getDisponibles$(): Observable<SolicitudDisponible[]> {
    return this.state$.pipe(map(s => s.disponibles));
  }

  getAsignadas$(): Observable<SolicitudAsignada[]> {
    return this.state$.pipe(map(s => s.asignadas));
  }

  getHistorial$(): Observable<SolicitudAsignada[]> {
    return this.state$.pipe(map(s => s.historial));
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

  private patch(partial: Partial<SolicitudesState>) {
    this.state.next({ ...this.state.value, ...partial });
  }

  cargarDisponibles(): Observable<SolicitudDisponible[]> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<SolicitudDisponible[]>(`${this.apiUrl}/solicitudes/disponibles`, {
        headers: this.getHeaders(),
        timeout: environment.api.timeout,
      })
      .pipe(
        tap(disponibles => this.patch({ disponibles, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando solicitudes disponibles';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarAsignadas(tallerId: number): Observable<SolicitudAsignada[]> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<SolicitudAsignada[]>(`${this.apiUrl}/${tallerId}/asignadas`, {
        headers: this.getHeaders(),
        timeout: environment.api.timeout,
      })
      .pipe(
        tap(asignadas => this.patch({ asignadas, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando solicitudes asignadas';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarHistorial(tallerId: number): Observable<SolicitudAsignada[]> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<SolicitudAsignada[]>(`${this.apiUrl}/${tallerId}/historial`, {
        headers: this.getHeaders(),
        timeout: environment.api.timeout,
      })
      .pipe(
        tap(historial => this.patch({ historial, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando historial';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  obtenerDetalle(incidenteId: number): Observable<DetalleIncidente> {
    return this.http
      .get<DetalleIncidente>(`${this.apiUrl}/incidente/${incidenteId}/detalle`, {
        headers: this.getHeaders(),
        timeout: environment.api.timeout,
      })
      .pipe(
        catchError(err => {
          const msg = err?.error?.detail || 'Error obteniendo detalle del incidente';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  aceptarSolicitud(tallerId: number, payload: AceptarSolicitudRequest): Observable<AsignacionResponse> {
    return this.http
      .post<AsignacionResponse>(`${this.apiUrl}/${tallerId}/aceptar`, payload, {
        headers: this.getHeaders(),
        timeout: environment.api.timeout,
      })
      .pipe(
        tap(() => {
          // Quitar de disponibles y recargar asignadas
          const disponibles = this.state.value.disponibles.filter(
            d => d.incidente_id !== payload.incidente_id
          );
          this.patch({ disponibles });
        }),
        catchError(err => {
          const msg = err?.error?.detail || 'Error aceptando solicitud';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  rechazarSolicitud(tallerId: number, payload: RechazarSolicitudRequest): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(`${this.apiUrl}/${tallerId}/rechazar`, payload, {
        headers: this.getHeaders(),
        timeout: environment.api.timeout,
      })
      .pipe(
        tap(() => {
          const disponibles = this.state.value.disponibles.filter(
            d => d.incidente_id !== payload.incidente_id
          );
          this.patch({ disponibles });
        }),
        catchError(err => {
          const msg = err?.error?.detail || 'Error rechazando solicitud';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  asignarTecnico(tallerId: number, asignacionId: number, payload: AsignarTecnicoRequest): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/${tallerId}/${asignacionId}/asignar-tecnico`, payload,
        { headers: this.getHeaders(), timeout: environment.api.timeout }
      )
      .pipe(
        catchError(err => {
          const msg = err?.error?.detail || 'Error asignando técnico';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  actualizarEstado(tallerId: number, asignacionId: number, payload: ActualizarEstadoRequest): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/${tallerId}/${asignacionId}/estado`, payload,
        { headers: this.getHeaders(), timeout: environment.api.timeout }
      )
      .pipe(
        tap(() => {
          if (payload.estado === 'completada') {
            const asignadas = this.state.value.asignadas.filter(a => a.asignacion_id !== asignacionId);
            this.patch({ asignadas });
          } else {
            const asignadas = this.state.value.asignadas.map(a =>
              a.asignacion_id === asignacionId ? { ...a, estado: payload.estado } : a
            );
            this.patch({ asignadas });
          }
        }),
        catchError(err => {
          const msg = err?.error?.detail || 'Error actualizando estado';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  registrarDiagnostico(tallerId: number, asignacionId: number, payload: DiagnosticoRequest): Observable<{ success: boolean; message: string }> {
    return this.http
      .put<{ success: boolean; message: string }>(
        `${this.apiUrl}/${tallerId}/${asignacionId}/diagnostico`, payload,
        { headers: this.getHeaders(), timeout: environment.api.timeout }
      )
      .pipe(
        tap(() => {
          const asignadas = this.state.value.asignadas.filter(a => a.asignacion_id !== asignacionId);
          this.patch({ asignadas });
        }),
        catchError(err => {
          const msg = err?.error?.detail || 'Error registrando diagnóstico';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  analizarConIA(incidenteId: number): Observable<{ success: boolean; analisis: any }> {
    return this.http
      .post<{ success: boolean; analisis: any }>(
        `${environment.api.baseUrl}/api/emergencia/analizar-ia/${incidenteId}`,
        {},
        { headers: this.getHeaders(), timeout: environment.api.timeout }
      )
      .pipe(
        catchError(err => {
          const msg = err?.error?.detail || 'Error en análisis de IA';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  limpiarEstado() {
    this.state.next({
      disponibles: [],
      asignadas: [],
      historial: [],
      loading: false,
      error: null,
    });
  }
}
