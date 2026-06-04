export interface Cotizacion {
  cotizacion_id: number;
  incidente_id: number;
  taller_id: number;
  taller_nombre: string;
  calificacion_promedio: number;
  costo_estimado: number;
  tiempo_estimado: number;
  observaciones?: string;
  estado: 'pendiente' | 'aceptada' | 'rechazada' | 'no_seleccionada';
  fecha_creacion: string;
}

export interface RegistrarCotizacionRequest {
  incidente_id: number;
  costo_estimado: number;
  tiempo_estimado: number;
  observaciones?: string;
}

export interface RegistrarCotizacionResponse {
  success: boolean;
  message: string;
  cotizacion_id: number;
}

export interface CotizacionMessageResponse {
  success: boolean;
  message: string;
}

export interface CotizacionesState {
  cotizaciones: Cotizacion[];
  loading: boolean;
  error: string | null;
}
