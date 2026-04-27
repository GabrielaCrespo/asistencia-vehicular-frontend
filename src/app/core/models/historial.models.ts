export interface ResumenHistorial {
  total_solicitudes: number;
  solicitudes_completadas: number;
  solicitudes_pendientes: number;
  solicitudes_en_curso: number;
  solicitudes_rechazadas: number;
  total_ingresos: number;
  calificacion_promedio: number;
  total_calificaciones: number;
  tecnico_mas_activo: string | null;
  servicio_mas_solicitado: string | null;
}

export interface SolicitudHistorial {
  asignacion_id: number;
  incidente_id: number;
  estado: string;
  tipo_problema: string | null;
  prioridad: string;
  descripcion: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  tecnico_nombre: string | null;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_placa: string | null;
  fecha_solicitud: string;
  fecha_aceptacion: string | null;
  fecha_inicio_servicio: string | null;
  fecha_cierre_servicio: string | null;
  duracion_minutos: number | null;
  monto_cobrado: number | null;
  calificacion: number | null;
  observaciones: string | null;
}

export interface ServicioRealizado {
  asignacion_id: number;
  incidente_id: number;
  fecha_servicio: string;
  cliente_nombre: string;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_placa: string | null;
  tecnico_nombre: string | null;
  servicios_realizados: string | null;
  monto_total: number | null;
  monto_taller: number | null;
  calificacion: number | null;
  puntuacion_atencion: number | null;
  puntuacion_puntualidad: number | null;
  puntuacion_limpieza: number | null;
}

export interface Transaccion {
  pago_id: number;
  incidente_id: number;
  asignacion_id: number | null;
  cliente_nombre: string;
  tipo_problema: string | null;
  fecha_pago: string | null;
  monto_total: number;
  monto_servicio: number;
  monto_taller: number;
  comision_plataforma: number;
  metodo_pago: string | null;
  estado: string;
  estado_comision: string;
  creado_en: string;
}

export interface DetalleSolicitud {
  asignacion_id: number;
  incidente_id: number;
  estado: string;
  tipo_problema: string | null;
  prioridad: string;
  descripcion: string | null;
  observaciones: string | null;
  cliente_nombre: string;
  cliente_telefono: string | null;
  cliente_email: string | null;
  vehiculo_marca: string | null;
  vehiculo_modelo: string | null;
  vehiculo_placa: string | null;
  vehiculo_anio: number | null;
  vehiculo_color: string | null;
  tecnico_nombre: string | null;
  tecnico_especialidad: string | null;
  fecha_solicitud: string;
  fecha_aceptacion: string | null;
  fecha_inicio_servicio: string | null;
  fecha_cierre_servicio: string | null;
  tiempo_estimado_minutos: number | null;
  duracion_real_minutos: number | null;
  latitud: number;
  longitud: number;
  imagen_path: string | null;
  audio_path: string | null;
  servicios_realizados: string | null;
  ia_clasificacion: string | null;
  ia_resumen: string | null;
  ia_recomendaciones: string | null;
  monto_total: number | null;
  monto_taller: number | null;
  comision_plataforma: number | null;
  metodo_pago: string | null;
  estado_pago: string | null;
  calificacion: number | null;
  comentario_calificacion: string | null;
}

export interface HistorialState {
  resumen: ResumenHistorial | null;
  solicitudes: SolicitudHistorial[];
  servicios: ServicioRealizado[];
  transacciones: Transaccion[];
  detalle: DetalleSolicitud | null;
  loading: boolean;
  loadingDetalle: boolean;
  error: string | null;
}
