export interface Notificacion {
  notificacion_id: number;
  tipo: string;
  titulo: string;
  descripcion: string;
  datos_asociados: Record<string, any> | null;
  leida: boolean;
  fecha_creacion: string;
}

export interface NotificacionesResponse {
  success: boolean;
  notificaciones: Notificacion[];
  no_leidas: number;
}

export interface NotificacionesState {
  notificaciones: Notificacion[];
  noLeidas: number;
  loading: boolean;
  error: string | null;
}
