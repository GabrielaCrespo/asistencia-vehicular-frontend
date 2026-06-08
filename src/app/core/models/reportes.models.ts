export type FormatoExport = 'csv' | 'pdf' | 'excel';

export type TipoReporte =
  | 'emergencias'
  | 'historial-servicios'
  | 'ingresos'
  | 'calificaciones'
  | 'kpis'
  | 'incidentes-tipo'
  | 'sla';

export interface ReporteFiltrosBase {
  fecha_desde?: string;
  fecha_hasta?: string;
  taller_id?: number;
  org_id?: number;
}

export interface ReporteDinamicoFiltros extends ReporteFiltrosBase {
  tipo_incidente?: string;
  estado?: string;
  tecnico_id?: number;
  zona?: string;
}

// ─── Respuestas estáticas ────────────────────────────────────────────────────

export interface EmergenciasReport {
  resumen: { total: number; completadas: number; monto_total: number };
  datos: Record<string, any>[];
}

export interface HistorialReport {
  resumen: { total_servicios: number; ingresos_totales: number; calificacion_promedio: number };
  datos: Record<string, any>[];
}

export interface IngresosReport {
  resumen: { total_transacciones: number; ingresos_brutos: number; ingresos_netos: number; comisiones: number };
  datos: Record<string, any>[];
}

export interface CalificacionesReport {
  resumen: { total_calificaciones: number; promedio_general: number; distribucion: Record<string, number> };
  datos: Record<string, any>[];
}

export interface KpisReport {
  resumen: { total_servicios: number; completados: number; tasa_completacion_pct: number; ingresos_totales: number };
  por_taller: Record<string, any>[];
}

export interface IncidentesTipoReport {
  datos: Record<string, any>[];
}

export interface SlaReport {
  resumen: { promedio_cumplimiento_sla_pct: number };
  por_taller: Record<string, any>[];
}

export interface DinamicoReport {
  filtros_aplicados: Record<string, any>;
  resumen: { total_registros: number; ingresos_totales: number; calificacion_promedio: number };
  datos: Record<string, any>[];
}

// ─── Reporte por voz ─────────────────────────────────────────────────────────

export interface VozRequest {
  texto: string;
  taller_id?: number;
  org_id?: number;
}

export interface VozFiltrosAplicados {
  fecha_desde?: string;
  fecha_hasta?: string;
  tipo_incidente?: string;
  estado?: string;
}

export interface VozResponse {
  tipo_reporte: TipoReporte | 'dinamico';
  mensaje_confirmacion: string;
  formato_exportar: FormatoExport | null;
  filtros_aplicados: VozFiltrosAplicados;
  resultado: EmergenciasReport | HistorialReport | IngresosReport | DinamicoReport | any;
}

// ─── UI helpers ──────────────────────────────────────────────────────────────

export interface ReporteEstatico {
  tipo: TipoReporte;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
}

export const REPORTES_ESTATICOS: ReporteEstatico[] = [
  { tipo: 'emergencias',       titulo: 'Emergencias Atendidas',   descripcion: 'Todas las emergencias registradas y su estado.',        icono: '🚨', color: '#dc2626' },
  { tipo: 'historial-servicios', titulo: 'Historial de Servicios', descripcion: 'Registro completo de servicios realizados.',            icono: '🔧', color: '#2563eb' },
  { tipo: 'ingresos',          titulo: 'Ingresos Generados',       descripcion: 'Transacciones, montos y comisiones por período.',       icono: '💰', color: '#16a34a' },
  { tipo: 'calificaciones',    titulo: 'Calificaciones',           descripcion: 'Puntuaciones y comentarios de clientes.',               icono: '⭐', color: '#d97706' },
  { tipo: 'kpis',              titulo: 'KPIs Operacionales',       descripcion: 'Indicadores clave de rendimiento por taller.',          icono: '📊', color: '#7c3aed' },
  { tipo: 'incidentes-tipo',   titulo: 'Incidentes por Tipo',      descripcion: 'Distribución de incidentes según categoría.',           icono: '🗂️', color: '#0891b2' },
  { tipo: 'sla',               titulo: 'Cumplimiento SLA',         descripcion: 'Tiempos de respuesta y cumplimiento de acuerdos.',      icono: '⏱️', color: '#be185d' },
];
