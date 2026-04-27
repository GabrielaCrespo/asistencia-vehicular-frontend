import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import {
  HistorialState, ResumenHistorial, SolicitudHistorial,
  ServicioRealizado, Transaccion, DetalleSolicitud
} from '../models/historial.models';

@Injectable({ providedIn: 'root' })
export class HistorialService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/historial`;

  private state = new BehaviorSubject<HistorialState>({
    resumen: null,
    solicitudes: [],
    servicios: [],
    transacciones: [],
    detalle: null,
    loading: false,
    loadingDetalle: false,
    error: null,
  });

  public state$ = this.state.asObservable();

  getResumen$(): Observable<ResumenHistorial | null> { return this.state$.pipe(map(s => s.resumen)); }
  getSolicitudes$(): Observable<SolicitudHistorial[]> { return this.state$.pipe(map(s => s.solicitudes)); }
  getServicios$(): Observable<ServicioRealizado[]> { return this.state$.pipe(map(s => s.servicios)); }
  getTransacciones$(): Observable<Transaccion[]> { return this.state$.pipe(map(s => s.transacciones)); }
  getDetalle$(): Observable<DetalleSolicitud | null> { return this.state$.pipe(map(s => s.detalle)); }
  isLoading$(): Observable<boolean> { return this.state$.pipe(map(s => s.loading)); }
  isLoadingDetalle$(): Observable<boolean> { return this.state$.pipe(map(s => s.loadingDetalle)); }
  error$(): Observable<string | null> { return this.state$.pipe(map(s => s.error)); }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.storageService.getToken()}`,
      'Content-Type': 'application/json',
    });
  }

  private patch(partial: Partial<HistorialState>) {
    this.state.next({ ...this.state.value, ...partial });
  }

  cargarResumen(tallerId: number, fechaDesde?: string, fechaHasta?: string): Observable<ResumenHistorial> {
    this.patch({ loading: true, error: null });
    let params = new HttpParams();
    if (fechaDesde) params = params.set('fecha_desde', fechaDesde);
    if (fechaHasta) params = params.set('fecha_hasta', fechaHasta);
    return this.http
      .get<ResumenHistorial>(`${this.apiUrl}/${tallerId}/resumen`, { headers: this.getHeaders(), params })
      .pipe(
        tap(resumen => this.patch({ resumen })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando resumen';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarSolicitudes(
    tallerId: number,
    opts: { fechaDesde?: string; fechaHasta?: string; estado?: string; tipo_problema?: string } = {}
  ): Observable<SolicitudHistorial[]> {
    this.patch({ loading: true, error: null });
    let params = new HttpParams().set('limit', '100').set('offset', '0');
    if (opts.fechaDesde) params = params.set('fecha_desde', opts.fechaDesde);
    if (opts.fechaHasta) params = params.set('fecha_hasta', opts.fechaHasta);
    if (opts.estado) params = params.set('estado', opts.estado);
    if (opts.tipo_problema) params = params.set('tipo_problema', opts.tipo_problema);
    return this.http
      .get<SolicitudHistorial[]>(`${this.apiUrl}/${tallerId}/solicitudes`, { headers: this.getHeaders(), params })
      .pipe(
        tap(solicitudes => this.patch({ solicitudes })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando solicitudes';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarServicios(
    tallerId: number,
    opts: { fechaDesde?: string; fechaHasta?: string; tecnico_id?: number } = {}
  ): Observable<ServicioRealizado[]> {
    this.patch({ loading: true, error: null });
    let params = new HttpParams().set('limit', '100').set('offset', '0');
    if (opts.fechaDesde) params = params.set('fecha_desde', opts.fechaDesde);
    if (opts.fechaHasta) params = params.set('fecha_hasta', opts.fechaHasta);
    if (opts.tecnico_id) params = params.set('tecnico_id', String(opts.tecnico_id));
    return this.http
      .get<ServicioRealizado[]>(`${this.apiUrl}/${tallerId}/servicios`, { headers: this.getHeaders(), params })
      .pipe(
        tap(servicios => this.patch({ servicios })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando servicios';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarTransacciones(
    tallerId: number,
    opts: { fechaDesde?: string; fechaHasta?: string; estado_comision?: string; metodo_pago?: string } = {}
  ): Observable<Transaccion[]> {
    this.patch({ loading: true, error: null });
    let params = new HttpParams().set('limit', '100').set('offset', '0');
    if (opts.fechaDesde) params = params.set('fecha_desde', opts.fechaDesde);
    if (opts.fechaHasta) params = params.set('fecha_hasta', opts.fechaHasta);
    if (opts.estado_comision) params = params.set('estado_comision', opts.estado_comision);
    if (opts.metodo_pago) params = params.set('metodo_pago', opts.metodo_pago);
    return this.http
      .get<Transaccion[]>(`${this.apiUrl}/${tallerId}/transacciones`, { headers: this.getHeaders(), params })
      .pipe(
        tap(transacciones => this.patch({ transacciones })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando transacciones';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarDetalle(tallerId: number, incidenteId: number): Observable<DetalleSolicitud> {
    this.patch({ loadingDetalle: true });
    return this.http
      .get<DetalleSolicitud>(`${this.apiUrl}/${tallerId}/solicitud/${incidenteId}`, { headers: this.getHeaders() })
      .pipe(
        tap(detalle => this.patch({ detalle })),
        finalize(() => this.patch({ loadingDetalle: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando detalle';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  limpiarDetalle() {
    this.patch({ detalle: null });
  }

  limpiarEstado() {
    this.state.next({
      resumen: null, solicitudes: [], servicios: [], transacciones: [],
      detalle: null, loading: false, loadingDetalle: false, error: null,
    });
  }
}
