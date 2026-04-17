/**
 * MODELOS PARA GESTIÓN DE TÉCNICOS
 * 
 * Técnicos pertenecen a un taller específico
 * Cada técnico tiene especialidad y disponibilidad
 */

// ==================== REQUEST/PAYLOAD ====================

export interface TecnicoCreateRequest {
  nombre: string;
  especialidad?: string;
}

export interface TecnicoUpdateRequest {
  nombre?: string;
  especialidad?: string;
  disponible?: boolean;
}

export interface TecnicoUbicacionRequest {
  latitud: number;
  longitud: number;
}

// ==================== RESPONSE/DTO ====================

export interface TecnicoResponse {
  tecnico_id: number;
  taller_id: number;
  nombre: string;
  especialidad?: string | null;
  latitud_actual?: number | null;
  longitud_actual?: number | null;
  disponible: boolean;
  fecha_ultima_ubicacion?: string | null;
  creado_en: string;
}

export interface TecnicoListaResponse {
  success: boolean;
  data: TecnicoResponse[];
  total: number;
}

// ==================== MODELOS PARA VISTA ====================

export interface Tecnico {
  tecnico_id: number;
  taller_id: number;
  nombre: string;
  especialidad?: string | null;
  latitud_actual?: number | null;
  longitud_actual?: number | null;
  disponible: boolean;
  fecha_ultima_ubicacion?: string | null;
  creado_en: string;
}

export interface TecnicoState {
  tecnicos: Tecnico[];
  loading: boolean;
  error: string | null;
  selectedTecnico: Tecnico | null;
}
