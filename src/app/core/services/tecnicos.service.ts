/**
 * SERVICIO DE TÉCNICOS - Frontend
 * 
 * Orquesta todas las operaciones CRUD de técnicos
 * Mantiene estado reactivo y manejo de errores
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import {
  TecnicoCreateRequest,
  TecnicoUpdateRequest,
  TecnicoUbicacionRequest,
  TecnicoResponse,
  TecnicoListaResponse,
  Tecnico,
  TecnicoState,
} from '../models/tecnicos.models';

@Injectable({
  providedIn: 'root'
})
export class TecnicosService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/tecnicos`;

  // Estado reactivo de técnicos
  private tecnicosState = new BehaviorSubject<TecnicoState>({
    tecnicos: [],
    loading: false,
    error: null,
    selectedTecnico: null,
  });

  public tecnicos$ = this.tecnicosState.asObservable();

  constructor() {}

  // ============== GETTERS ==============

  /**
   * Retorna lista observable de técnicos
   */
  getTecnicos$(): Observable<Tecnico[]> {
    return this.tecnicos$.pipe(
      map(state => state.tecnicos)
    );
  }

  /**
   * Retorna estado de carga
   */
  isLoading$(): Observable<boolean> {
    return this.tecnicos$.pipe(
      map(state => state.loading)
    );
  }

  /**
   * Retorna error actual
   */
  error$(): Observable<string | null> {
    return this.tecnicos$.pipe(
      map(state => state.error)
    );
  }

  /**
   * Retorna técnico seleccionado
   */
  selectedTecnico$(): Observable<Tecnico | null> {
    return this.tecnicos$.pipe(
      map(state => state.selectedTecnico)
    );
  }

  // ============== PRIVATE HELPERS ==============

  /**
   * Obtiene el token JWT del storage
   */
  private getAuthHeader(): HttpHeaders {
    const token = this.storageService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  /**
   * Actualiza el estado
   */
  private setState(newState: Partial<TecnicoState>) {
    const currentState = this.tecnicosState.value;
    this.tecnicosState.next({ ...currentState, ...newState });
  }

  /**
   * Establece estado de carga
   */
  private setLoading(loading: boolean) {
    this.setState({ loading });
  }

  /**
   * Limpia errores
   */
  private clearError() {
    this.setState({ error: null });
  }

  /**
   * Establece error
   */
  private setError(error: string) {
    this.setState({ error });
  }

  // ============== CRUD OPERATIONS ==============

  /**
   * CREAR: Nuevo técnico en el taller
   */
  crearTecnico(taller_id: number, data: TecnicoCreateRequest): Observable<TecnicoResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<TecnicoResponse>(
      `${this.apiUrl}/${taller_id}`,
      data,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap((tecnico) => {
        // Agregar a la lista
        const currentTecnicos = this.tecnicosState.value.tecnicos;
        const nuevoTecnico: Tecnico = {
          tecnico_id: tecnico.tecnico_id,
          taller_id: tecnico.taller_id,
          nombre: tecnico.nombre,
          especialidad: tecnico.especialidad || undefined,
          latitud_actual: tecnico.latitud_actual || undefined,
          longitud_actual: tecnico.longitud_actual || undefined,
          disponible: tecnico.disponible,
          fecha_ultima_ubicacion: tecnico.fecha_ultima_ubicacion || undefined,
          creado_en: tecnico.creado_en,
        };
        this.setState({
          tecnicos: [nuevoTecnico, ...currentTecnicos],
          loading: false
        });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error creando técnico';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * LISTAR: Obtener todos los técnicos del taller
   */
  listarTecnicos(taller_id: number): Observable<Tecnico[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TecnicoListaResponse>(
      `${this.apiUrl}/${taller_id}`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      map((response) => {
        const tecnicos = response.data.map(t => ({
          tecnico_id: t.tecnico_id,
          taller_id: t.taller_id,
          nombre: t.nombre,
          especialidad: t.especialidad || undefined,
          latitud_actual: t.latitud_actual || undefined,
          longitud_actual: t.longitud_actual || undefined,
          disponible: t.disponible,
          fecha_ultima_ubicacion: t.fecha_ultima_ubicacion || undefined,
          creado_en: t.creado_en,
        }));
        this.setState({ tecnicos, loading: false });
        return tecnicos;
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error listando técnicos';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * OBTENER: Detalles de un técnico específico
   */
  obtenerTecnico(taller_id: number, tecnico_id: number): Observable<Tecnico> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TecnicoResponse>(
      `${this.apiUrl}/${taller_id}/${tecnico_id}`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      map((tecnico) => ({
        tecnico_id: tecnico.tecnico_id,
        taller_id: tecnico.taller_id,
        nombre: tecnico.nombre,
        especialidad: tecnico.especialidad || undefined,
        latitud_actual: tecnico.latitud_actual || undefined,
        longitud_actual: tecnico.longitud_actual || undefined,
        disponible: tecnico.disponible,
        fecha_ultima_ubicacion: tecnico.fecha_ultima_ubicacion || undefined,
        creado_en: tecnico.creado_en,
      })),
      tap((tecnico) => {
        this.setState({ selectedTecnico: tecnico, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error obteniendo técnico';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * ACTUALIZAR: Datos del técnico
   */
  actualizarTecnico(
    taller_id: number,
    tecnico_id: number,
    data: TecnicoUpdateRequest
  ): Observable<TecnicoResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<TecnicoResponse>(
      `${this.apiUrl}/${taller_id}/${tecnico_id}`,
      data,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap((tecnico) => {
        // Actualizar en la lista
        const currentTecnicos = this.tecnicosState.value.tecnicos;
        const tecnicoActualizado: Tecnico = {
          tecnico_id: tecnico.tecnico_id,
          taller_id: tecnico.taller_id,
          nombre: tecnico.nombre,
          especialidad: tecnico.especialidad || undefined,
          latitud_actual: tecnico.latitud_actual || undefined,
          longitud_actual: tecnico.longitud_actual || undefined,
          disponible: tecnico.disponible,
          fecha_ultima_ubicacion: tecnico.fecha_ultima_ubicacion || undefined,
          creado_en: tecnico.creado_en,
        };
        const tecnicos = currentTecnicos.map(t =>
          t.tecnico_id === tecnico_id ? tecnicoActualizado : t
        );
        this.setState({ tecnicos, selectedTecnico: tecnicoActualizado, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error actualizando técnico';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * ELIMINAR: Un técnico
   */
  eliminarTecnico(taller_id: number, tecnico_id: number): Observable<any> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete(
      `${this.apiUrl}/${taller_id}/${tecnico_id}`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap(() => {
        // Remover de la lista
        const currentTecnicos = this.tecnicosState.value.tecnicos;
        const tecnicos = currentTecnicos.filter(t => t.tecnico_id !== tecnico_id);
        this.setState({ tecnicos, selectedTecnico: null, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error eliminando técnico';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * ACTUALIZAR UBICACIÓN: Ubicación en tiempo real del técnico
   */
  actualizarUbicacion(
    taller_id: number,
    tecnico_id: number,
    ubicacion: TecnicoUbicacionRequest
  ): Observable<TecnicoResponse> {
    return this.http.put<TecnicoResponse>(
      `${this.apiUrl}/${taller_id}/${tecnico_id}/ubicacion`,
      ubicacion,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap((tecnico) => {
        // Actualizar solo ubicación en la lista
        const currentTecnicos = this.tecnicosState.value.tecnicos;
        const tecnicoActualizado: Tecnico = {
          ...currentTecnicos.find(t => t.tecnico_id === tecnico_id)!,
          latitud_actual: tecnico.latitud_actual,
          longitud_actual: tecnico.longitud_actual,
          fecha_ultima_ubicacion: tecnico.fecha_ultima_ubicacion,
        };
        const tecnicos = currentTecnicos.map(t =>
          t.tecnico_id === tecnico_id ? tecnicoActualizado : t
        );
        this.setState({ tecnicos, selectedTecnico: tecnicoActualizado });
      }),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error actualizando ubicación';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * Limpia el estado
   */
  limpiarEstado() {
    this.tecnicosState.next({
      tecnicos: [],
      loading: false,
      error: null,
      selectedTecnico: null,
    });
  }
}
