/**
 * SERVICIO DE AUTENTICACIÓN - CORE
 * 
 * Orquesta toda la lógica de autenticación:
 * - login
 * - registro
 * - logout
 * - estado reactivo
 * - manejo de errores
 * 
 * Este es el corazón de la autenticación. Todos los componentes
 * deben usar este servicio.
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import {
  TallerRegisterRequest,
  LoginRequest,
  LoginResponse,
  RegisterResponse,
  AuthState,
  CurrentUser,
  AuthErrorType,
  RolEnum,
  ApiErrorResponse,
} from '../models/auth.models';

import { StorageService } from './storage.service';
import { JwtService } from './jwt.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);
  private jwtService = inject(JwtService);

  private apiUrl = `${environment.api.baseUrl}/api/taller`;

  // Estado reactivo de autenticación
  private authState = new BehaviorSubject<AuthState>({
    isAuthenticated: this.storageService.hasToken(),
    currentUser: this.storageService.getCurrentUser(),
    token: this.storageService.getToken(),
    loading: false,
    error: null,
  });

  public auth$ = this.authState.asObservable();

  constructor() {
    // En caso de que el token esté expirado al iniciar la aplicación
    this.validateStoredToken();
  }

  /**
   * REGISTRO: Registra un nuevo taller
   */
  register(data: TallerRegisterRequest): Observable<RegisterResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/register`,
      data,
      { timeout: environment.api.timeout }
    ).pipe(
      tap(() => {
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        const errorType = this.parseErrorType(error);
        this.setError(error?.error?.detail || 'Error en el registro');
        return throwError(() => ({
          type: errorType,
          message: error?.error?.detail || 'Error en el registro'
        }));
      })
    );
  }

  /**
   * LOGIN: Autentica un taller y obtiene el token JWT
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      credentials,
      { timeout: environment.api.timeout }
    ).pipe(
      tap((response) => {
        // El backend retorna access_token, nosotros lo usamos como token
        const token = response.access_token || response.token;
        if (!token) {
          throw new Error('No token received from server');
        }
        
        const user = response.user;
        if (!user) {
          throw new Error('No user data received from server');
        }

        // Crear objeto CurrentUser desde la respuesta
        const currentUser: CurrentUser = {
          usuario_id: user.usuario_id,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono,
          documento_identidad: user.documento_identidad,
          taller_id: user.taller_id || 0,
          razon_social: user.razon_social || '',
          rol_id: user.rol_id,
          direccion: user.direccion,
          telefono_operativo: user.telefono_operativo,
          horario_inicio: user.horario_inicio,
          horario_fin: user.horario_fin,
        };

        // Guardar en storage
        this.storageService.setToken(token as string);
        this.storageService.setCurrentUser(currentUser);

        // Actualizar estado
        this.authState.next({
          isAuthenticated: true,
          currentUser,
          token: token as string,
          loading: false,
          error: null,
        });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        this.setLoading(false);
        const errorType = this.parseErrorType(error);
        const message = error?.error?.detail || 'Credenciales inválidas';
        this.setError(message);
        
        return throwError(() => ({
          type: errorType,
          message
        }));
      })
    );
  }

  /**
   * LOGOUT: Cierra la sesión
   */
  logout(): void {
    this.storageService.clearAll();
    this.authState.next({
      isAuthenticated: false,
      currentUser: null,
      token: null,
      loading: false,
      error: null,
    });
  }

  /**
   * Obtiene el estado actual de autenticación
   */
  getAuthState(): AuthState {
    return this.authState.value;
  }

  /**
   * Observables individuales para suscribirse a partes específicas del estado
   */
  isAuthenticated$(): Observable<boolean> {
    return this.auth$.pipe(map(state => state.isAuthenticated));
  }

  currentUser$(): Observable<CurrentUser | null> {
    return this.auth$.pipe(map(state => state.currentUser));
  }

  loading$(): Observable<boolean> {
    return this.auth$.pipe(map(state => state.loading));
  }

  error$(): Observable<string | null> {
    return this.auth$.pipe(map(state => state.error));
  }

  /**
   * Obtiene el token actual
   */
  getToken(): string | null {
    return this.authState.value.token;
  }

  /**
   * Actualiza campos del usuario actual en estado y localStorage.
   * Llamar después de editar el perfil para evitar re-login.
   */
  updateCurrentUserFields(updates: Partial<CurrentUser>): void {
    const current = this.authState.value;
    if (!current.currentUser) return;
    const updated: CurrentUser = { ...current.currentUser, ...updates };
    this.storageService.setCurrentUser(updated);
    this.authState.next({ ...current, currentUser: updated });
  }

  /**
   * Valida el token almacenado al iniciar la aplicación
   */
  private validateStoredToken(): void {
    const token = this.storageService.getToken();
    
    if (token && !this.jwtService.isTokenValid(token)) {
      // Token expirado, limpiar sesión
      this.logout();
    }
  }

  /**
   * Setea el estado de carga
   */
  private setLoading(loading: boolean): void {
    const currentState = this.authState.value;
    this.authState.next({ ...currentState, loading });
  }

  /**
   * Setea un error
   */
  private setError(error: string): void {
    const currentState = this.authState.value;
    this.authState.next({ ...currentState, error });
  }

  /**
   * Limpia el mensaje de error
   */
  private clearError(): void {
    const currentState = this.authState.value;
    this.authState.next({ ...currentState, error: null });
  }

  /**
   * Parsea el tipo de error desde la respuesta HTTP
   */
  private parseErrorType(error: any): AuthErrorType {
    if (!error.status) {
      return AuthErrorType.NETWORK_ERROR;
    }

    switch (error.status) {
      case 400:
        if (error.error?.detail?.includes('correo')) {
          return AuthErrorType.EMAIL_ALREADY_REGISTERED;
        }
        return AuthErrorType.VALIDATION_ERROR;
      case 401:
        return AuthErrorType.INVALID_CREDENTIALS;
      case 500:
      case 502:
      case 503:
        return AuthErrorType.SERVER_ERROR;
      default:
        return AuthErrorType.UNKNOWN;
    }
  }
}
