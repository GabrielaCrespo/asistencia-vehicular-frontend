/**
 * MODELOS DE AUTENTICACIÓN
 * 
 * Estas interfaces representan los contratos de datos entre frontend y backend.
 * Mantienen la consistencia con la API FastAPI.
 */

// ==================== REQUEST/PAYLOAD ====================

/**
 * Payload para registro de taller
 * Se envía en POST /api/taller/register
 */
export interface TallerRegisterRequest {
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

/**
 * Payload para login
 * Se envía en POST /api/taller/login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

// ==================== RESPONSE/DTO ====================

/**
 * Información del usuario retornada por el backend
 */
export interface UserResponse {
  usuario_id: number;
  nombre: string;
  email: string;
  documento_identidad: string;
  estado: string;
  rol_id: number;
  taller_id: number;
  razon_social: string;
}

/**
 * Información del taller retornada por el backend
 */
export interface TallerResponse {
  taller_id: number;
  razon_social: string;
}

/**
 * Respuesta de login - contiene token y datos del usuario
 */
export interface LoginResponse {
  success: boolean;
  access_token: string;
  user: UserResponse;
  token?: string;
}

/**
 * Respuesta genérica de registro
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
}

/**
 * Respuesta de error del servidor
 */
export interface ApiErrorResponse {
  detail: string;
}

// ==================== DECODED TOKEN ====================

/**
 * Estructura del JWT decodificado
 * Se usa para stored en memoria y localStorage
 */
export interface DecodedToken {
  sub: string;
  taller_id: number;
  exp: number;
  iat?: number;
}

// ==================== AUTH STATE ====================

/**
 * Estado de autenticación de la aplicación
 * Se usa en servicios reactivos
 */
export interface AuthState {
  isAuthenticated: boolean;
  currentUser: CurrentUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Usuario actual en sesión
 */
export interface CurrentUser {
  usuario_id: number;
  nombre: string;
  email: string;
  taller_id: number;
  razon_social: string;
  rol_id: number;
}

// ==================== ENUMS ====================

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_REGISTERED = 'EMAIL_ALREADY_REGISTERED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN'
}

export enum RolEnum {
  CLIENTE = 1,
  TALLER = 2,
  ADMIN = 3
}
