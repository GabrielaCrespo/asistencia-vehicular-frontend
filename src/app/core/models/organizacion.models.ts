export interface OrgDashboard {
  organizacion_id: number;
  organizacion_nombre: string;
  plan: string;
  total_talleres: number;
  total_tecnicos: number;
  total_incidentes: number;
  incidentes_completados: number;
  incidentes_pendientes: number;
  incidentes_en_progreso: number;
  ingresos_totales: number;
  ingresos_talleres: number;
  comisiones_plataforma: number;
  calificacion_promedio: number;
}

export interface TallerResumen {
  taller_id: number;
  razon_social: string;
  direccion?: string;
  telefono_operativo?: string;
  horario_inicio?: string;
  horario_fin?: string;
  disponible: boolean;
  calificacion_promedio: number;
  total_tecnicos: number;
  tecnicos_disponibles: number;
  servicios_completados: number;
  ingresos_totales: number;
  latitud?: number;
  longitud?: number;
}

export interface TallerEnOrgCreate {
  nombre_contacto: string;
  email: string;
  telefono: string;
  password: string;
  documento_identidad: string;
  razon_social: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono_operativo: string;
  horario_inicio: string;
  horario_fin: string;
}

export interface OrgTecnico {
  tecnico_id: number;
  tecnico_nombre: string;
  especialidad?: string;
  disponible: boolean;
  latitud_actual?: number;
  longitud_actual?: number;
  fecha_ultima_ubicacion?: string;
  taller_id: number;
  taller_nombre: string;
}

export interface OrgTecnicosResponse {
  success: boolean;
  organizacion_id: number;
  total: number;
  data: OrgTecnico[];
}

export interface OrgIncidente {
  incidente_id: number;
  estado_incidente: string;
  tipo_problema?: string;
  prioridad: string;
  fecha_creacion: string;
  cliente_nombre: string;
  cliente_email?: string;
  cliente_telefono?: string;
  taller_id?: number;
  taller_nombre?: string;
  organizacion_id?: number;
  asignacion_id?: number;
  estado_asignacion?: string;
  tecnico_id?: number;
  tecnico_nombre?: string;
  monto_total?: number;
  estado_pago?: string;
}

export interface OrgIncidentesResponse {
  success: boolean;
  organizacion_id: number;
  total: number;
  limit: number;
  offset: number;
  data: OrgIncidente[];
}

export interface ReporteTaller {
  taller_id: number;
  razon_social: string;
  total_transacciones: number;
  ingresos_brutos: number;
  ingresos_talleres: number;
  comisiones: number;
  pagos_completados: number;
  pagos_pendientes: number;
  calificacion_promedio: number;
}

export interface OrgReportesResponse {
  success: boolean;
  organizacion_id: number;
  periodo: { desde?: string; hasta?: string };
  resumen: {
    total_ingresos: number;
    total_comisiones: number;
    ingresos_netos: number;
  };
  por_taller: ReporteTaller[];
}

// ── Analítica Operacional ────────────────────────────────────────────────────

export interface TiemposPromedio {
  promedio_asignacion_min: number | null;
  promedio_llegada_min: number | null;
  promedio_finalizacion_min: number | null;
}

export interface IncidentePorTipo {
  tipo: string;
  cantidad: number;
}

export interface ZonaTop {
  lat: number;
  lng: number;
  cantidad: number;
}

export interface RankingTaller {
  taller_id: number;
  nombre: string;
  completados: number;
  total: number;
  calificacion: number;
  tiempo_prom_asignacion_min: number;
  score: number;
}

// ── Satisfacción y Valoraciones ─────────────────────────────────────────────

export interface SatisfaccionTaller {
  taller_id: number;
  nombre: string;
  promedio: number;
  cantidad: number;
}

export interface DistribucionCalificacion {
  estrellas: number;
  cantidad: number;
}

export interface SatisfaccionGlobal {
  promedio_tenant: number;
  total_calificaciones: number;
  pct_satisfaccion: number;
  taller_mejor_valorado: SatisfaccionTaller | null;
  top5_talleres: SatisfaccionTaller[];
  distribucion: DistribucionCalificacion[];
}

export interface CalificacionItem {
  calificacion_id: number;
  puntuacion: number;
  puntuacion_servicio?: number;
  comentario?: string;
  fecha_calificacion: string;
  cliente_nombre: string;
  tipo_problema?: string;
  incidente_descripcion?: string;
}

export interface CalificacionesTallerResponse {
  taller_id: number;
  total: number;
  promedio: number;
  promedio_servicio: number;
  limit: number;
  offset: number;
  data: CalificacionItem[];
}

export interface AnaliticaGlobal {
  organizacion_id: number;
  total_emergencias: number;
  tiempos: TiemposPromedio;
  casos_cancelados: number;
  sla_cumplimiento_pct: number | null;
  sla_total_evaluados: number;
  incidentes_por_tipo: IncidentePorTipo[];
  zonas_top: ZonaTop[];
  ranking_talleres: RankingTaller[];
  satisfaccion?: SatisfaccionGlobal;
}

export interface MesMensual {
  anio: number;
  mes: number;
  mes_nombre: string;
  total: number;
  completados: number;
}

export interface ComparacionTenant {
  promedio_asignacion_min: number | null;
  promedio_llegada_min: number | null;
  promedio_finalizacion_min: number | null;
  sla_cumplimiento_pct: number | null;
}

export interface TiemposTaller {
  promedio_asignacion_min: number | null;
  promedio_llegada_min: number | null;
  promedio_resolucion_min: number | null;
}

export interface AnaliticaTaller {
  taller_id: number;
  taller_nombre: string;
  total_emergencias: number;
  casos_cancelados: number;
  tiempos: TiemposTaller;
  sla_cumplimiento_pct: number | null;
  sla_total_evaluados: number;
  incidentes_por_tipo: IncidentePorTipo[];
  rendimiento_mensual: MesMensual[];
  comparacion_tenant: ComparacionTenant;
}
