/**
 * MODELOS PARA GESTIÓN DE SERVICIOS
 * 
 * Servicios son un catálogo global pero cada taller
 * puede agregar/configurar los que ofrece con precios personalizados
 */

// ==================== REQUEST/PAYLOAD ====================

export interface ServicioCatalogoCreateRequest {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_base: number;
}

export interface TallerServicioCreateRequest {
  servicio_id: number;
  precio_personalizado?: number;
  disponible: boolean;
}

export interface TallerServicioUpdateRequest {
  precio_personalizado?: number;
  disponible?: boolean;
}

/** Nuevo flujo: el taller crea un servicio directo, sin pasar por el catálogo manualmente */
export interface TallerServicioDirectoCreateRequest {
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio: number;
  disponible: boolean;
}

// ==================== RESPONSE/DTO ====================

export interface ServicioCatalogoResponse {
  servicio_id: number;
  nombre: string;
  descripcion?: string | null;
  categoria?: string | null;
  precio_base: number;
  creado_en: string;
}

export interface ServicioCatalogoListaResponse {
  success: boolean;
  data: ServicioCatalogoResponse[];
  total: number;
}

export interface TallerServicioResponse {
  taller_servicio_id: number;
  taller_id: number;
  servicio_id: number;
  nombre_servicio: string;
  descripcion?: string | null;
  categoria?: string | null;
  precio_base: number;
  precio_personalizado?: number | null;
  disponible: boolean;
  creado_en: string;
}

export interface TallerServicioListaResponse {
  success: boolean;
  data: TallerServicioResponse[];
  total: number;
}

// ==================== MODELOS PARA VISTA ====================

export interface ServicioCatalogo {
  servicio_id: number;
  nombre: string;
  descripcion?: string;
  categoria?: string;
  precio_base: number;
  creado_en: string;
}

export interface TallerServicio {
  taller_servicio_id: number;
  taller_id: number;
  servicio_id: number;
  nombre_servicio: string;
  descripcion?: string;
  categoria?: string;
  precio_base: number;
  precio_personalizado?: number;
  disponible: boolean;
  creado_en: string;
}

export interface ServiciosState {
  catalogo: ServicioCatalogo[];
  servicios_taller: TallerServicio[];
  loading: boolean;
  error: string | null;
  selectedServicio: TallerServicio | null;
}
