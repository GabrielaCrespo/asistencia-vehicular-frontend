/**
 * SERVICIO DE SERVICIOS - Frontend
 * 
 * Orquesta todas las operaciones CRUD de servicios
 * Incluye:
 * - Catálogo global de servicios
 * - Servicios del taller (TALLER_SERVICIO)
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError, tap, finalize } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import {
  ServicioCatalogoCreateRequest,
  TallerServicioCreateRequest,
  TallerServicioUpdateRequest,
  TallerServicioDirectoCreateRequest,
  ServicioCatalogoResponse,
  ServicioCatalogoListaResponse,
  TallerServicioResponse,
  TallerServicioListaResponse,
  ServicioCatalogo,
  TallerServicio,
  ServiciosState,
} from '../models/servicios.models';

@Injectable({
  providedIn: 'root'
})
export class ServiciosService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/servicios`;

  // Estado reactivo de servicios
  private serviciosState = new BehaviorSubject<ServiciosState>({
    catalogo: [],
    servicios_taller: [],
    loading: false,
    error: null,
    selectedServicio: null,
  });

  public servicios$ = this.serviciosState.asObservable();

  constructor() {
    // Cargar catálogo al inicializar
    this.listarCatalogo().subscribe();
  }

  // ============== GETTERS ==============

  /**
   * Retorna catálogo global de servicios
   */
  getCatalogo$(): Observable<ServicioCatalogo[]> {
    return this.servicios$.pipe(
      map(state => state.catalogo)
    );
  }

  /**
   * Retorna servicios del taller actual
   */
  getServiciosTaller$(): Observable<TallerServicio[]> {
    return this.servicios$.pipe(
      map(state => state.servicios_taller)
    );
  }

  /**
   * Retorna estado de carga
   */
  isLoading$(): Observable<boolean> {
    return this.servicios$.pipe(
      map(state => state.loading)
    );
  }

  /**
   * Retorna error actual
   */
  error$(): Observable<string | null> {
    return this.servicios$.pipe(
      map(state => state.error)
    );
  }

  /**
   * Retorna servicio seleccionado
   */
  selectedServicio$(): Observable<TallerServicio | null> {
    return this.servicios$.pipe(
      map(state => state.selectedServicio)
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
  private setState(newState: Partial<ServiciosState>) {
    const currentState = this.serviciosState.value;
    this.serviciosState.next({ ...currentState, ...newState });
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

  // ============== CATÁLOGO OPERATIONS ==============

  /**
   * CREAR: Nuevo servicio en el catálogo global
   */
  crearServicioCatalogo(data: ServicioCatalogoCreateRequest): Observable<ServicioCatalogo> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<any>(
      `${this.apiUrl}/catalogo`,
      data,
      { headers: this.getAuthHeader() }
    ).pipe(
      map((s) => ({
        servicio_id: s.servicio_id,
        nombre: s.nombre,
        descripcion: s.descripcion || undefined,
        categoria: s.categoria || undefined,
        precio_base: s.precio_base,
        creado_en: s.creado_en,
      })),
      tap((nuevo) => {
        const catalogo = [...this.serviciosState.value.catalogo, nuevo];
        this.setState({ catalogo, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error creando servicio';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * LISTAR: Obtener catálogo global de servicios
   */
  listarCatalogo(): Observable<ServicioCatalogo[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<ServicioCatalogoListaResponse>(
      `${this.apiUrl}/catalogo/todos`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      map((response) => {
        return response.data.map(s => ({
          servicio_id: s.servicio_id,
          nombre: s.nombre,
          descripcion: s.descripcion || undefined,
          categoria: s.categoria || undefined,
          precio_base: s.precio_base,
          creado_en: s.creado_en,
        }));
      }),
      tap((catalogo) => {
        this.setState({ catalogo, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error listando catálogo';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  // ============== TALLER SERVICIOS OPERATIONS ==============

  /**
   * NUEVO FLUJO: Crea un servicio directamente en el taller (un solo paso).
   * El backend se encarga de buscar o crear en el catálogo automáticamente.
   */
  crearServicioDirectoEnTaller(
    taller_id: number,
    data: TallerServicioDirectoCreateRequest
  ): Observable<TallerServicio> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<TallerServicioResponse>(
      `${this.apiUrl}/${taller_id}/crear`,
      data,
      { headers: this.getAuthHeader() }
    ).pipe(
      map((s) => ({
        taller_servicio_id: s.taller_servicio_id,
        taller_id: s.taller_id,
        servicio_id: s.servicio_id,
        nombre_servicio: s.nombre_servicio,
        descripcion: s.descripcion || undefined,
        categoria: s.categoria || undefined,
        precio_base: s.precio_base,
        precio_personalizado: s.precio_personalizado || undefined,
        disponible: s.disponible,
        creado_en: s.creado_en,
      })),
      tap((nuevo) => {
        const currentServicios = this.serviciosState.value.servicios_taller;
        this.setState({
          servicios_taller: [...currentServicios, nuevo],
          loading: false,
        });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error creando servicio';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * AGREGAR: Servicio del catálogo al taller (flujo legado)
   */
  agregarServicioAlTaller(
    taller_id: number,
    data: TallerServicioCreateRequest
  ): Observable<TallerServicioResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.post<TallerServicioResponse>(
      `${this.apiUrl}/${taller_id}`,
      data,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap((servicio) => {
        // Agregar a la lista de servicios del taller
        const currentServicios = this.serviciosState.value.servicios_taller;
        const nuevoServicio: TallerServicio = {
          taller_servicio_id: servicio.taller_servicio_id,
          taller_id: servicio.taller_id,
          servicio_id: servicio.servicio_id,
          nombre_servicio: servicio.nombre_servicio,
          descripcion: servicio.descripcion || undefined,
          categoria: servicio.categoria || undefined,
          precio_base: servicio.precio_base,
          precio_personalizado: servicio.precio_personalizado || undefined,
          disponible: servicio.disponible,
          creado_en: servicio.creado_en,
        };
        this.setState({
          servicios_taller: [...currentServicios, nuevoServicio],
          loading: false
        });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error agregando servicio';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * LISTAR: Obtener servicios del taller
   */
  listarServiciosTaller(taller_id: number): Observable<TallerServicio[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TallerServicioListaResponse>(
      `${this.apiUrl}/${taller_id}`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      map((response) => {
        return response.data.map(s => ({
          taller_servicio_id: s.taller_servicio_id,
          taller_id: s.taller_id,
          servicio_id: s.servicio_id,
          nombre_servicio: s.nombre_servicio,
          descripcion: s.descripcion || undefined,
          categoria: s.categoria || undefined,
          precio_base: s.precio_base,
          precio_personalizado: s.precio_personalizado || undefined,
          disponible: s.disponible,
          creado_en: s.creado_en,
        }));
      }),
      tap((servicios_taller) => {
        this.setState({ servicios_taller, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error listando servicios del taller';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * OBTENER: Detalles de un servicio del taller
   */
  obtenerServicioTaller(
    taller_id: number,
    taller_servicio_id: number
  ): Observable<TallerServicio> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<TallerServicioResponse>(
      `${this.apiUrl}/${taller_id}/${taller_servicio_id}`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      map((servicio) => ({
        taller_servicio_id: servicio.taller_servicio_id,
        taller_id: servicio.taller_id,
        servicio_id: servicio.servicio_id,
        nombre_servicio: servicio.nombre_servicio,
        descripcion: servicio.descripcion || undefined,
        categoria: servicio.categoria || undefined,
        precio_base: servicio.precio_base,
        precio_personalizado: servicio.precio_personalizado || undefined,
        disponible: servicio.disponible,
        creado_en: servicio.creado_en,
      })),
      tap((servicio) => {
        this.setState({ selectedServicio: servicio, loading: false });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error obteniendo servicio';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * ACTUALIZAR: Datos del servicio en el taller
   */
  actualizarServicioTaller(
    taller_id: number,
    taller_servicio_id: number,
    data: TallerServicioUpdateRequest
  ): Observable<TallerServicioResponse> {
    this.setLoading(true);
    this.clearError();

    return this.http.put<TallerServicioResponse>(
      `${this.apiUrl}/${taller_id}/${taller_servicio_id}`,
      data,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap((servicio) => {
        // Actualizar en la lista
        const currentServicios = this.serviciosState.value.servicios_taller;
        const servicioActualizado: TallerServicio = {
          taller_servicio_id: servicio.taller_servicio_id,
          taller_id: servicio.taller_id,
          servicio_id: servicio.servicio_id,
          nombre_servicio: servicio.nombre_servicio,
          descripcion: servicio.descripcion || undefined,
          categoria: servicio.categoria || undefined,
          precio_base: servicio.precio_base,
          precio_personalizado: servicio.precio_personalizado || undefined,
          disponible: servicio.disponible,
          creado_en: servicio.creado_en,
        };
        const servicios_taller = currentServicios.map(s =>
          s.taller_servicio_id === taller_servicio_id ? servicioActualizado : s
        );
        this.setState({
          servicios_taller,
          selectedServicio: servicioActualizado,
          loading: false
        });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error actualizando servicio';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * ELIMINAR: Un servicio del taller
   */
  removerServicioDelTaller(
    taller_id: number,
    taller_servicio_id: number
  ): Observable<any> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete(
      `${this.apiUrl}/${taller_id}/${taller_servicio_id}`,
      { headers: this.getAuthHeader(), timeout: environment.api.timeout }
    ).pipe(
      tap(() => {
        // Remover de la lista
        const currentServicios = this.serviciosState.value.servicios_taller;
        const servicios_taller = currentServicios.filter(
          s => s.taller_servicio_id !== taller_servicio_id
        );
        this.setState({
          servicios_taller,
          selectedServicio: null,
          loading: false
        });
      }),
      finalize(() => this.setLoading(false)),
      catchError((error) => {
        const errorMsg = error?.error?.detail || 'Error eliminando servicio';
        this.setError(errorMsg);
        return throwError(() => ({ message: errorMsg }));
      })
    );
  }

  /**
   * Limpia el estado
   */
  limpiarEstado() {
    this.serviciosState.next({
      catalogo: [],
      servicios_taller: [],
      loading: false,
      error: null,
      selectedServicio: null,
    });
  }
}
