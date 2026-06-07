import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, concat, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  OrgDashboard,
  TallerResumen,
  TallerEnOrgCreate,
  OrgTecnicosResponse,
  OrgIncidentesResponse,
  OrgReportesResponse,
  AnaliticaGlobal,
  AnaliticaTaller,
  MapaRiesgoResponse,
  MapaRiesgoFiltros,
} from '../models/organizacion.models';

@Injectable({ providedIn: 'root' })
export class OrganizacionService {
  private http  = inject(HttpClient);
  private base  = `${environment.api.baseUrl}/api/organizacion`;
  private cache = new Map<string, unknown>();

  /** Cache-then-network: emite dato cacheado inmediatamente (si existe) y luego el fresco */
  private cachedGet<T>(key: string, url: string): Observable<T> {
    const req = this.http.get<T>(url).pipe(
      tap(data => this.cache.set(key, data))
    );
    const cached = this.cache.get(key) as T | undefined;
    return cached !== undefined ? concat(of(cached), req) : req;
  }

  getDashboard(orgId: number): Observable<OrgDashboard> {
    return this.cachedGet<OrgDashboard>(`dashboard_${orgId}`, `${this.base}/${orgId}/dashboard`);
  }

  getTalleres(orgId: number): Observable<TallerResumen[]> {
    return this.cachedGet<TallerResumen[]>(`talleres_${orgId}`, `${this.base}/${orgId}/talleres`);
  }

  /** Invalida caché de talleres (llamar después de crear uno nuevo) */
  invalidarTalleres(orgId: number): void {
    this.cache.delete(`talleres_${orgId}`);
  }

  toggleDisponibilidad(orgId: number, tallerId: number): Observable<{ success: boolean; taller_id: number; disponible: boolean; message: string }> {
    return this.http.patch<{ success: boolean; taller_id: number; disponible: boolean; message: string }>(
      `${this.base}/${orgId}/talleres/${tallerId}/disponibilidad`,
      {}
    ).pipe(tap(() => this.invalidarTalleres(orgId)));
  }

  crearTaller(orgId: number, data: TallerEnOrgCreate): Observable<{ success: boolean; message: string; taller_id: number; usuario_id: number }> {
    return this.http.post<{ success: boolean; message: string; taller_id: number; usuario_id: number }>(
      `${this.base}/${orgId}/talleres`,
      data
    ).pipe(tap(() => this.invalidarTalleres(orgId)));
  }

  getTecnicos(orgId: number): Observable<OrgTecnicosResponse> {
    return this.cachedGet<OrgTecnicosResponse>(`tecnicos_${orgId}`, `${this.base}/${orgId}/tecnicos`);
  }

  getIncidentes(orgId: number, estado?: string, limit = 50, offset = 0): Observable<OrgIncidentesResponse> {
    const key = `incidentes_${orgId}_${estado ?? ''}_${limit}_${offset}`;
    let url = `${this.base}/${orgId}/incidentes?limit=${limit}&offset=${offset}`;
    if (estado) url += `&estado=${estado}`;
    return this.cachedGet<OrgIncidentesResponse>(key, url);
  }

  getReportes(orgId: number, fechaDesde?: string, fechaHasta?: string): Observable<OrgReportesResponse> {
    const key = `reportes_${orgId}_${fechaDesde ?? ''}_${fechaHasta ?? ''}`;
    let url = `${this.base}/${orgId}/reportes`;
    const params: string[] = [];
    if (fechaDesde) params.push(`fecha_desde=${fechaDesde}`);
    if (fechaHasta) params.push(`fecha_hasta=${fechaHasta}`);
    if (params.length) url += '?' + params.join('&');
    return this.cachedGet<OrgReportesResponse>(key, url);
  }

  getAnaliticaGlobal(orgId: number): Observable<AnaliticaGlobal> {
    return this.http.get<AnaliticaGlobal>(`${this.base}/${orgId}/analitica`);
  }

  getAnaliticaTaller(orgId: number, tallerId: number): Observable<AnaliticaTaller> {
    return this.http.get<AnaliticaTaller>(`${this.base}/${orgId}/analitica/taller/${tallerId}`);
  }

  getMapaRiesgo(orgId: number, filtros: MapaRiesgoFiltros = {}): Observable<MapaRiesgoResponse> {
    const params: string[] = [];
    if (filtros.fecha_desde) params.push(`fecha_desde=${filtros.fecha_desde}`);
    if (filtros.fecha_hasta) params.push(`fecha_hasta=${filtros.fecha_hasta}`);
    if (filtros.tipo_problema) params.push(`tipo_problema=${filtros.tipo_problema}`);
    if (filtros.taller_id) params.push(`taller_id=${filtros.taller_id}`);
    if (filtros.estado) params.push(`estado=${filtros.estado}`);
    const qs = params.length ? `?${params.join('&')}` : '';
    return this.http.get<MapaRiesgoResponse>(`${this.base}/${orgId}/mapa-riesgo${qs}`);
  }
}
