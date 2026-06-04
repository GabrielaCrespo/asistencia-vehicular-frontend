import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { CotizacionesService } from '../../../core/services/cotizaciones.service';
import { TecnicosService } from '../../../core/services/tecnicos.service';
import { environment } from '../../../environments/environment';
import {
  SolicitudDisponible,
  SolicitudAsignada,
  DetalleIncidente,
} from '../../../core/models/solicitudes.models';
import { Cotizacion } from '../../../core/models/cotizaciones.models';
import { Tecnico } from '../../../core/models/tecnicos.models';
import { CurrentUser } from '../../../core/models/auth.models';

type Tab = 'disponibles' | 'asignadas' | 'historial' | 'mis-cotizaciones';

@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './solicitudes.component.html',
  styleUrls: ['./solicitudes.component.css'],
})
export class SolicitudesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private solicitudesService = inject(SolicitudesService);
  private cotizacionesService = inject(CotizacionesService);
  private tecnicosService = inject(TecnicosService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  activeTab: Tab = 'disponibles';

  disponibles$  = this.solicitudesService.getDisponibles$();
  asignadas$    = this.solicitudesService.getAsignadas$();
  historial$    = this.solicitudesService.getHistorial$();
  cotizaciones$ = this.cotizacionesService.getCotizaciones$();
  loading$      = this.solicitudesService.isLoading$();
  error$        = this.solicitudesService.error$();
  loadingCot$   = this.cotizacionesService.isLoading$();
  errorCot$     = this.cotizacionesService.error$();
  tecnicos$     = this.tecnicosService.getTecnicos$();

  // Detail modal
  showDetalle = false;
  loadingDetalle = false;
  detalle: DetalleIncidente | null = null;

  // Modal: enviar / editar cotización
  showEnviarCotizacion = false;
  incidenteParaCotizar: SolicitudDisponible | null = null;
  cotizacionParaEditar: Cotizacion | null = null;
  formCosto: number | null = null;
  formTiempo: number | null = null;
  formObservaciones = '';
  enviando = false;

  // Mapa rápido incidente_id → cotización ya enviada
  cotizacionesPorIncidente = new Map<number, Cotizacion>();

  // Modal: eliminar cotización
  showEliminarCot = false;
  cotizacionAEliminar: Cotizacion | null = null;

  // Asignar técnico modal
  showAsignarTecnico = false;
  asignarAsignacionId: number | null = null;
  asignarTecnicoId: number | null = null;
  tecnicosDisponibles: Tecnico[] = [];

  // Diagnóstico / costo modal
  showDiagnostico = false;
  diagnosticoAsignacion: SolicitudAsignada | null = null;
  diagnosticoObservaciones = '';
  diagnosticoCosto: number | null = null;
  diagnosticoMetodoPago = '';

  // IA
  analizandoIA = false;

  // Feedback toast
  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  private toastTimer: any;

  // ── Filtros ──────────────────────────────────────────────────
  filtroPrioridades: Record<string, boolean> = {};
  filtroDistanciaMax: number | null = null;
  filtroFechaDesde = '';
  filtroFechaHasta = '';
  ordenFecha: 'asc' | 'desc' = 'desc';

  toggleFiltroPrioridad(p: string): void {
    this.filtroPrioridades = { ...this.filtroPrioridades, [p]: !this.filtroPrioridades[p] };
  }

  setFiltroDistancia(km: number): void {
    this.filtroDistanciaMax = this.filtroDistanciaMax === km ? null : km;
  }

  setOrdenFecha(orden: 'asc' | 'desc'): void {
    this.ordenFecha = orden;
  }

  hayFiltrosActivos(): boolean {
    return Object.values(this.filtroPrioridades).some(Boolean)
      || this.filtroDistanciaMax !== null
      || !!this.filtroFechaDesde
      || !!this.filtroFechaHasta;
  }

  limpiarFiltros(): void {
    this.filtroPrioridades = {};
    this.filtroDistanciaMax = null;
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
  }

  private normalizarPrioridad(p: string): string {
    return p === 'urgente' ? 'alta' : p;
  }

  private fechaStr(ts: string): string {
    if (!ts) return '';
    const d = new Date(ts.replace(' ', 'T'));
    if (isNaN(d.getTime())) return ts.substring(0, 10);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  filtrarDisponibles(lista: SolicitudDisponible[]): SolicitudDisponible[] {
    const prioActivas = Object.entries(this.filtroPrioridades).filter(([, v]) => v).map(([k]) => k);
    const filtered = lista.filter(s => {
      if (prioActivas.length > 0 && !prioActivas.includes(this.normalizarPrioridad(s.prioridad))) return false;
      if (this.filtroDistanciaMax !== null && s.distancia_km != null && +s.distancia_km > this.filtroDistanciaMax) return false;
      const fecha = this.fechaStr(s.fecha_creacion);
      if (this.filtroFechaDesde && fecha < this.filtroFechaDesde) return false;
      if (this.filtroFechaHasta && fecha > this.filtroFechaHasta) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const diff = this.fechaStr(a.fecha_creacion).localeCompare(this.fechaStr(b.fecha_creacion));
      return this.ordenFecha === 'desc' ? -diff : diff;
    });
  }

  filtrarAsignadas(lista: SolicitudAsignada[]): SolicitudAsignada[] {
    const prioActivas = Object.entries(this.filtroPrioridades).filter(([, v]) => v).map(([k]) => k);
    const filtered = lista.filter(a => {
      if (prioActivas.length > 0 && !prioActivas.includes(this.normalizarPrioridad(a.prioridad))) return false;
      const fecha = this.fechaStr(a.fecha_asignacion);
      if (this.filtroFechaDesde && fecha < this.filtroFechaDesde) return false;
      if (this.filtroFechaHasta && fecha > this.filtroFechaHasta) return false;
      return true;
    });
    return filtered.sort((a, b) => {
      const diff = this.fechaStr(a.fecha_asignacion).localeCompare(this.fechaStr(b.fecha_asignacion));
      return this.ordenFecha === 'desc' ? -diff : diff;
    });
  }

  ngOnInit() {
    this.authService.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.currentUser) {
          this.currentUser = authState.currentUser;
          this.cargarTab('disponibles');
          // Cargar mis cotizaciones en background para saber cuáles ya fueron enviadas
          this.cotizacionesService.cargarMisCotizaciones(authState.currentUser.taller_id)
            .pipe(takeUntil(this.destroy$)).subscribe();
          this.tecnicosService.listarTecnicos(authState.currentUser.taller_id)
            .pipe(takeUntil(this.destroy$)).subscribe();
        }
      });

    // Mantener el mapa incidente_id → cotización actualizado
    this.cotizaciones$
      .pipe(takeUntil(this.destroy$))
      .subscribe(cots => {
        this.cotizacionesPorIncidente = new Map(cots.map(c => [c.incidente_id, c]));
      });
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
    this.cargarTab(tab);
  }

  private cargarTab(tab: Tab) {
    if (!this.currentUser) return;
    const id = this.currentUser.taller_id;

    if (tab === 'disponibles') {
      this.solicitudesService.cargarDisponibles().pipe(takeUntil(this.destroy$)).subscribe();
    } else if (tab === 'asignadas') {
      this.solicitudesService.cargarAsignadas(id).pipe(takeUntil(this.destroy$)).subscribe();
    } else if (tab === 'historial') {
      this.solicitudesService.cargarHistorial(id).pipe(takeUntil(this.destroy$)).subscribe();
    } else if (tab === 'mis-cotizaciones') {
      this.cotizacionesService.cargarMisCotizaciones(id).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  // ── Detalle ──────────────────────────────────────────────────────────────

  abrirDetalle(incidenteId: number) {
    this.showDetalle = true;
    this.loadingDetalle = true;
    this.detalle = null;
    this.solicitudesService
      .obtenerDetalle(incidenteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.detalle = d; this.loadingDetalle = false; this.cdr.detectChanges(); },
        error: () => { this.loadingDetalle = false; this.cdr.detectChanges(); },
      });
  }

  cerrarDetalle() {
    this.showDetalle = false;
    this.detalle = null;
  }

  // ── Enviar cotización ────────────────────────────────────────────────────

  cotizacionDeIncidente(incidenteId: number): Cotizacion | undefined {
    return this.cotizacionesPorIncidente.get(incidenteId);
  }

  abrirEnviarCotizacion(s: SolicitudDisponible): void {
    this.incidenteParaCotizar = s;
    const existente = this.cotizacionDeIncidente(s.incidente_id);
    if (existente) {
      this.cotizacionParaEditar = existente;
      this.formCosto = existente.costo_estimado;
      this.formTiempo = existente.tiempo_estimado;
      this.formObservaciones = existente.observaciones ?? '';
    } else {
      this.cotizacionParaEditar = null;
      this.formCosto = null;
      this.formTiempo = null;
      this.formObservaciones = '';
    }
    this.showEnviarCotizacion = true;
  }

  confirmarCotizacion(): void {
    if (!this.currentUser || !this.incidenteParaCotizar || !this.formCosto || !this.formTiempo) return;
    this.enviando = true;

    const payload = {
      costo_estimado: this.formCosto,
      tiempo_estimado: Math.round(this.formTiempo),
      observaciones: this.formObservaciones || undefined,
    };

    const request$ = this.cotizacionParaEditar
      ? this.cotizacionesService.actualizarCotizacion(
          this.currentUser.taller_id,
          this.cotizacionParaEditar.cotizacion_id,
          payload,
        )
      : this.cotizacionesService.registrarCotizacion(this.currentUser.taller_id, {
          incidente_id: this.incidenteParaCotizar.incidente_id,
          ...payload,
        });

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.enviando = false;
        this.showEnviarCotizacion = false;
        const msg = this.cotizacionParaEditar
          ? 'Cotización actualizada correctamente'
          : 'Cotización enviada — el cliente será notificado';
        this.mostrarToast(msg, 'ok');
        // Refrescar el mapa de cotizaciones
        this.cotizacionesService.cargarMisCotizaciones(this.currentUser!.taller_id)
          .pipe(takeUntil(this.destroy$)).subscribe();
        if (!this.cotizacionParaEditar) {
          this.setTab('mis-cotizaciones');
        }
      },
      error: e => {
        this.enviando = false;
        this.mostrarToast(e.message ?? 'Error al procesar cotización', 'err');
      },
    });
  }

  cerrarEnviarCotizacion(): void {
    this.showEnviarCotizacion = false;
    this.incidenteParaCotizar = null;
    this.cotizacionParaEditar = null;
  }

  // ── Eliminar cotización ──────────────────────────────────────────────────

  abrirEliminarCot(c: Cotizacion): void {
    this.cotizacionAEliminar = c;
    this.showEliminarCot = true;
  }

  confirmarEliminarCot(): void {
    if (!this.currentUser || !this.cotizacionAEliminar) return;
    this.cotizacionesService
      .eliminarCotizacion(this.currentUser.taller_id, this.cotizacionAEliminar.cotizacion_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showEliminarCot = false;
          this.mostrarToast('Cotización eliminada', 'ok');
        },
        error: e => this.mostrarToast(e.message ?? 'Error al eliminar', 'err'),
      });
  }

  cerrarEliminarCot(): void {
    this.showEliminarCot = false;
    this.cotizacionAEliminar = null;
  }

  // ── Asignar técnico ──────────────────────────────────────────────────────

  abrirAsignarTecnico(asignacion: SolicitudAsignada) {
    this.tecnicosService.getTecnicos$().pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.tecnicosDisponibles = t.filter(tc => tc.disponible);
    });
    this.asignarAsignacionId = asignacion.asignacion_id;
    this.asignarTecnicoId = asignacion.tecnico_id;
    this.showAsignarTecnico = true;
  }

  confirmarAsignarTecnico() {
    if (!this.currentUser || !this.asignarAsignacionId || !this.asignarTecnicoId) return;
    this.solicitudesService
      .asignarTecnico(this.currentUser.taller_id, this.asignarAsignacionId, { tecnico_id: this.asignarTecnicoId })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showAsignarTecnico = false;
          this.mostrarToast('Técnico asignado correctamente', 'ok');
          this.solicitudesService.cargarAsignadas(this.currentUser!.taller_id)
            .pipe(takeUntil(this.destroy$)).subscribe();
        },
        error: (e) => this.mostrarToast(e.message || 'Error asignando técnico', 'err'),
      });
  }

  cerrarAsignarTecnico() {
    this.showAsignarTecnico = false;
    this.asignarAsignacionId = null;
    this.asignarTecnicoId = null;
  }

  // ── Actualizar estado ────────────────────────────────────────────────────

  actualizarEstado(asignacion: SolicitudAsignada, estado: string) {
    if (!this.currentUser) return;
    this.solicitudesService
      .actualizarEstado(this.currentUser.taller_id, asignacion.asignacion_id, { estado })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.mostrarToast(`Estado actualizado a "${estado}"`, 'ok');
          if (estado === 'completada') {
            this.solicitudesService.cargarHistorial(this.currentUser!.taller_id)
              .pipe(takeUntil(this.destroy$)).subscribe();
          }
        },
        error: (e) => this.mostrarToast(e.message || 'Error actualizando estado', 'err'),
      });
  }

  // ── Diagnóstico / costo ──────────────────────────────────────────────────

  abrirDiagnostico(asignacion: SolicitudAsignada) {
    this.diagnosticoAsignacion = asignacion;
    this.diagnosticoObservaciones = asignacion.observaciones || '';
    this.diagnosticoCosto = null;
    this.diagnosticoMetodoPago = '';
    this.showDiagnostico = true;
  }

  confirmarDiagnostico() {
    if (!this.currentUser || !this.diagnosticoAsignacion || !this.diagnosticoCosto) return;
    this.solicitudesService
      .registrarDiagnostico(
        this.currentUser.taller_id,
        this.diagnosticoAsignacion.asignacion_id,
        {
          observaciones: this.diagnosticoObservaciones,
          costo: this.diagnosticoCosto,
          metodo_pago: this.diagnosticoMetodoPago || undefined,
        }
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showDiagnostico = false;
          this.mostrarToast('Diagnóstico y costo registrados', 'ok');
          this.solicitudesService.cargarHistorial(this.currentUser!.taller_id)
            .pipe(takeUntil(this.destroy$)).subscribe();
        },
        error: (e) => this.mostrarToast(e.message || 'Error registrando diagnóstico', 'err'),
      });
  }

  cerrarDiagnostico() {
    this.showDiagnostico = false;
    this.diagnosticoAsignacion = null;
  }

  // ── Helpers de estado ────────────────────────────────────────────────────

  abrirMapa(lat: number, lng: number) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  imagenUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const clean = path.startsWith('/') ? path.slice(1) : path;
    const filename = clean.replace(/^imagenes_incidentes\//, '');
    return `${environment.api.baseUrl}/imagenes/${filename}`;
  }

  audioUrl(path: string): string {
    if (path.includes('cloudinary.com') && path.includes('/video/upload/')) {
      return path.replace('/video/upload/', '/video/upload/f_mp3/');
    }
    return path;
  }

  onImgError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const fallback = img.nextElementSibling as HTMLElement | null;
    if (fallback) fallback.style.display = 'block';
  }

  estadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente:   'badge-pending',
      asignada:    'badge-assigned',
      aceptada:    'badge-assigned',
      en_camino:   'badge-camino',
      en_servicio: 'badge-service',
      completada:  'badge-closed',
      cerrada:     'badge-closed',
      rechazada:   'badge-rejected',
    };
    return map[estado] ?? 'badge-pending';
  }

  estadoCotBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente:       'badge-pending',
      aceptada:        'badge-assigned',
      rechazada:       'badge-rejected',
      no_seleccionada: 'badge-no-sel',
    };
    return map[estado] ?? 'badge-pending';
  }

  estadoCotLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente:       'Pendiente',
      aceptada:        'Aceptada',
      rechazada:       'Rechazada',
      no_seleccionada: 'No seleccionada',
    };
    return map[estado] ?? estado;
  }

  prioridadClass(prioridad: string): string {
    const map: Record<string, string> = {
      alta: 'badge-alta', urgente: 'badge-alta',
      normal: 'badge-normal',
      baja: 'badge-baja',
    };
    return map[prioridad] ?? 'badge-normal';
  }

  prioridadLabel(prioridad: string): string {
    const map: Record<string, string> = {
      alta: 'Alta', urgente: 'Alta',
      normal: 'Normal',
      baja: 'Baja',
    };
    return map[prioridad] ?? prioridad;
  }

  contarFiltrosActivos(): number {
    let n = 0;
    if (Object.values(this.filtroPrioridades).some(Boolean)) n++;
    if (this.filtroDistanciaMax !== null) n++;
    if (this.filtroFechaDesde || this.filtroFechaHasta) n++;
    return n;
  }

  siguienteEstado(estado: string): string | null {
    const flujo: Record<string, string> = {
      aceptada: 'en_camino',
      en_camino: 'en_servicio',
      en_servicio: 'completada',
    };
    return flujo[estado] ?? null;
  }

  etiquetaEstadoDisplay(estado: string): string {
    const map: Record<string, string> = {
      aceptada:    'Aceptada',
      en_camino:   'En camino',
      en_servicio: 'En servicio',
      completada:  'Completada',
      rechazada:   'Rechazada',
      pendiente:   'Pendiente',
      asignada:    'Asignada',
    };
    return map[estado] ?? estado;
  }

  getStepClass(estadoActual: string, stepEstado: string): string {
    const order = ['aceptada', 'en_camino', 'en_servicio', 'completada'];
    const ci = order.indexOf(estadoActual);
    const si = order.indexOf(stepEstado);
    if (ci > si) return 'step-done';
    if (ci === si) return 'step-active';
    return 'step-pending';
  }

  ctaLabel(estado: string): string {
    const map: Record<string, string> = {
      aceptada:    'Técnico en camino',
      en_camino:   'Técnico llegó · Iniciar servicio',
      en_servicio: 'Completar y registrar diagnóstico',
    };
    return map[estado] ?? '';
  }

  ctaClass(estado: string): string {
    const map: Record<string, string> = {
      aceptada:    'cta-camino',
      en_camino:   'cta-servicio',
      en_servicio: 'cta-completar',
    };
    return map[estado] ?? '';
  }

  onCtaClick(a: SolicitudAsignada) {
    if (a.estado === 'aceptada') {
      this.actualizarEstado(a, 'en_camino');
    } else if (a.estado === 'en_camino') {
      this.actualizarEstado(a, 'en_servicio');
    } else if (a.estado === 'en_servicio') {
      this.abrirDiagnostico(a);
    }
  }

  analizarIA(incidenteId: number) {
    this.analizandoIA = true;
    this.solicitudesService
      .analizarConIA(incidenteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.analizandoIA = false;
          this.mostrarToast('Análisis de IA completado', 'ok');
          this.abrirDetalle(incidenteId);
          this.cargarTab(this.activeTab);
        },
        error: (e) => {
          this.analizandoIA = false;
          this.mostrarToast(e.message || 'Error en análisis de IA', 'err');
        },
      });
  }

  private mostrarToast(msg: string, type: 'ok' | 'err') {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, 3500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }
}
