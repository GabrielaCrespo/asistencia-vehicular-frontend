import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  ReporteFiltrosBase,
  ReporteDinamicoFiltros,
  VozRequest,
  VozResponse,
  EmergenciasReport,
  HistorialReport,
  IngresosReport,
  CalificacionesReport,
  KpisReport,
  IncidentesTipoReport,
  SlaReport,
  DinamicoReport,
  FormatoExport,
  TipoReporte,
} from '../models/reportes.models';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private http = inject(HttpClient);
  private base = `${environment.api.baseUrl}/api/reportes`;

  private toParams(f: ReporteFiltrosBase): Record<string, string> {
    const p: Record<string, string> = {};
    if (f.fecha_desde) p['fecha_desde'] = f.fecha_desde;
    if (f.fecha_hasta) p['fecha_hasta'] = f.fecha_hasta;
    if (f.taller_id)   p['taller_id']   = String(f.taller_id);
    if (f.org_id)      p['org_id']       = String(f.org_id);
    return p;
  }

  getEmergencias(f: ReporteFiltrosBase): Observable<EmergenciasReport> {
    return this.http.get<EmergenciasReport>(`${this.base}/emergencias`, { params: this.toParams(f) });
  }

  getHistorial(f: ReporteFiltrosBase): Observable<HistorialReport> {
    return this.http.get<HistorialReport>(`${this.base}/historial-servicios`, { params: this.toParams(f) });
  }

  getIngresos(f: ReporteFiltrosBase): Observable<IngresosReport> {
    return this.http.get<IngresosReport>(`${this.base}/ingresos`, { params: this.toParams(f) });
  }

  getCalificaciones(f: ReporteFiltrosBase): Observable<CalificacionesReport> {
    return this.http.get<CalificacionesReport>(`${this.base}/calificaciones`, { params: this.toParams(f) });
  }

  getKpis(f: ReporteFiltrosBase): Observable<KpisReport> {
    return this.http.get<KpisReport>(`${this.base}/kpis`, { params: this.toParams(f) });
  }

  getIncidentesTipo(f: ReporteFiltrosBase): Observable<IncidentesTipoReport> {
    return this.http.get<IncidentesTipoReport>(`${this.base}/incidentes-tipo`, { params: this.toParams(f) });
  }

  getSla(f: ReporteFiltrosBase): Observable<SlaReport> {
    return this.http.get<SlaReport>(`${this.base}/sla`, { params: this.toParams(f) });
  }

  getDinamico(filtros: ReporteDinamicoFiltros): Observable<DinamicoReport> {
    return this.http.post<DinamicoReport>(`${this.base}/dinamico`, filtros);
  }

  consultarVoz(body: VozRequest): Observable<VozResponse> {
    return this.http.post<VozResponse>(`${this.base}/voz`, body);
  }

  exportar(tipo: TipoReporte | string, formato: FormatoExport, f: ReporteFiltrosBase): Observable<Blob> {
    const params: Record<string, string> = { tipo, formato, ...this.toParams(f) };
    return this.http.get(`${this.base}/exportar`, { params, responseType: 'blob' });
  }

  exportarDinamico(filtros: ReporteDinamicoFiltros, formato: FormatoExport): Observable<Blob> {
    return this.http.post(`${this.base}/exportar-dinamico?formato=${formato}`, filtros, {
      responseType: 'blob',
    });
  }
}
