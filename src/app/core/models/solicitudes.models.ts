export interface SolicitudDisponible {
  incidente_id: number;
  descripcion: string;
  latitud: number;
  longitud: number;
  estado: string;
  prioridad: string;
  fecha_creacion: string;
  imagen_path: string | null;
  audio_path: string | null;
  tipo_problema: string | null;
  cliente_nombre: string;
  cliente_telefono: string;
  marca: string;
  modelo: string;
  placa: string;
  vehiculo_tipo: string | null;
  distancia_km: number | null;
}

export interface SolicitudAsignada {
  asignacion_id: number;
  incidente_id: number;
  tecnico_id: number | null;
  tecnico_nombre: string | null;
  taller_id: number;
  estado: string;
  tiempo_estimado_minutos: number | null;
  fecha_asignacion: string;
  observaciones: string | null;
  descripcion: string;
  latitud: number;
  longitud: number;
  imagen_path: string | null;
  audio_path: string | null;
  prioridad: string;
  cliente_nombre: string;
  cliente_telefono: string;
  marca: string;
  modelo: string;
  placa: string;
}

export interface AsignarTecnicoRequest {
  tecnico_id: number;
}

export interface ActualizarEstadoRequest {
  estado: string;
}

export interface DiagnosticoRequest {
  observaciones: string;
  costo: number;
  metodo_pago?: string;
}

export interface IaAnalisis {
  tipo_entrada: string | null;
  transcripcion_audio: string | null;
  clasificacion: string | null;
  nivel_confianza: number | null;
  resultado_imagen: string | null;
  resumen_automatico: string | null;
  recomendaciones: string | null;
  fecha_analisis: string | null;
}

export interface DetalleIncidente {
  incidente_id: number;
  descripcion: string;
  tipo_problema: string | null;
  latitud: number;
  longitud: number;
  estado: string;
  prioridad: string;
  fecha_creacion: string;
  imagen_path: string | null;
  audio_path: string | null;
  cliente_nombre: string;
  cliente_telefono: string;
  cliente_email: string;
  marca: string;
  modelo: string;
  placa: string;
  vehiculo_tipo: string | null;
  anio: number | null;
  ia_analisis: IaAnalisis | null;
}

export interface AceptarSolicitudRequest {
  incidente_id: number;
  tecnico_id?: number;
  tiempo_estimado_minutos?: number;
}

export interface RechazarSolicitudRequest {
  incidente_id: number;
  observaciones?: string;
}

export interface AsignacionResponse {
  success: boolean;
  message: string;
  asignacion_id: number;
}

export interface SolicitudesState {
  disponibles: SolicitudDisponible[];
  asignadas: SolicitudAsignada[];
  historial: SolicitudAsignada[];
  loading: boolean;
  error: string | null;
}
