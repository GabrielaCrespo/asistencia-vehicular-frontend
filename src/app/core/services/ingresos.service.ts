import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import { PagoIngreso, ResumenIngresos, IngresosState } from '../models/ingresos.models';

@Injectable({ providedIn: 'root' })
export class IngresosService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/pagos`;

  private state = new BehaviorSubject<IngresosState>({
    ingresos: [],
    comisiones: [],
    resumen: null,
    loading: false,
    error: null,
  });

  public state$ = this.state.asObservable();

  getIngresos$(): Observable<PagoIngreso[]> {
    return this.state$.pipe(map(s => s.ingresos));
  }

  getComisiones$(): Observable<PagoIngreso[]> {
    return this.state$.pipe(map(s => s.comisiones));
  }

  getResumen$(): Observable<ResumenIngresos | null> {
    return this.state$.pipe(map(s => s.resumen));
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

  private patch(partial: Partial<IngresosState>) {
    this.state.next({ ...this.state.value, ...partial });
  }

  cargarResumen(tallerId: number): Observable<ResumenIngresos> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<ResumenIngresos>(`${this.apiUrl}/${tallerId}/resumen`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(resumen => this.patch({ resumen, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando resumen de ingresos';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarIngresos(tallerId: number): Observable<PagoIngreso[]> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<PagoIngreso[]>(`${this.apiUrl}/${tallerId}/ingresos`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(ingresos => this.patch({ ingresos, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando ingresos';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  cargarComisiones(tallerId: number): Observable<PagoIngreso[]> {
    this.patch({ loading: true, error: null });
    return this.http
      .get<PagoIngreso[]>(`${this.apiUrl}/${tallerId}/comisiones`, {
        headers: this.getHeaders(),
      })
      .pipe(
        tap(comisiones => this.patch({ comisiones, loading: false })),
        finalize(() => this.patch({ loading: false })),
        catchError(err => {
          const msg = err?.error?.detail || 'Error cargando comisiones';
          this.patch({ error: msg });
          return throwError(() => ({ message: msg }));
        })
      );
  }

  pagarComision(tallerId: number, pagoId: number): Observable<{ success: boolean; message: string }> {
    return this.http
      .post<{ success: boolean; message: string }>(
        `${this.apiUrl}/${tallerId}/${pagoId}/pagar-comision`,
        {},
        { headers: this.getHeaders() }
      )
      .pipe(
        tap(() => {
          // Actualizar estado local del pago en ambas listas
          const updatePago = (p: PagoIngreso) =>
            p.pago_id === pagoId
              ? { ...p, estado_comision: 'pagado', fecha_pago_comision: new Date().toISOString() }
              : p;
          this.patch({
            ingresos: this.state.value.ingresos.map(updatePago),
            comisiones: this.state.value.comisiones.map(updatePago),
          });
        }),
        catchError(err => {
          const msg = err?.error?.detail || 'Error al pagar comisión';
          return throwError(() => ({ message: msg }));
        })
      );
  }

  limpiarEstado() {
    this.state.next({ ingresos: [], comisiones: [], resumen: null, loading: false, error: null });
  }
}
