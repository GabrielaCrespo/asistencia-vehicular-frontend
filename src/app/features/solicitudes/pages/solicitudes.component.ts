import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { TecnicosService } from '../../../core/services/tecnicos.service';
import { environment } from '../../../environments/environment';
import {
  SolicitudDisponible,
  SolicitudAsignada,
  DetalleIncidente,
} from '../../../core/models/solicitudes.models';
import { Tecnico } from '../../../core/models/tecnicos.models';
import { CurrentUser } from '../../../core/models/auth.models';

type Tab = 'disponibles' | 'asignadas' | 'historial';

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
  private tecnicosService = inject(TecnicosService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  activeTab: Tab = 'disponibles';

  disponibles$ = this.solicitudesService.getDisponibles$();
  asignadas$   = this.solicitudesService.getAsignadas$();
  historial$   = this.solicitudesService.getHistorial$();
  loading$     = this.solicitudesService.isLoading$();
  error$       = this.solicitudesService.error$();
  tecnicos$    = this.tecnicosService.getTecnicos$();

  // Detail modal
  showDetalle = false;
  loadingDetalle = false;
  detalle: DetalleIncidente | null = null;

  // Reject modal
  showRechazar = false;
  rechazarIncidenteId: number | null = null;
  rechazarObservaciones = '';

  // Accept confirmation modal
  showAceptarModal = false;
  aceptarSolicitudActual: SolicitudDisponible | null = null;
  aceptarTecnicoId: number | null = null;
  aceptarTiempoEstimado: number | null = null;

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

  // Feedback toast
  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  private toastTimer: any;

  hayTecnicosDisponibles = true;

  ngOnInit() {
    this.authService.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.currentUser) {
          this.currentUser = authState.currentUser;
          this.cargarTab('disponibles');
          this.tecnicosService.listarTecnicos(authState.currentUser.taller_id)
            .pipe(takeUntil(this.destroy$)).subscribe();
        }
      });

    this.tecnicosService.getTecnicos$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(tecnicos => {
        this.hayTecnicosDisponibles = tecnicos.some(t => t.disponible);
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
    } else {
      this.solicitudesService.cargarHistorial(id).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

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

  abrirAceptarModal(s: SolicitudDisponible) {
    this.aceptarSolicitudActual = s;
    this.aceptarTecnicoId = null;
    this.aceptarTiempoEstimado = null;
    this.tecnicosService.getTecnicos$().pipe(takeUntil(this.destroy$)).subscribe(t => {
      this.tecnicosDisponibles = t.filter(tc => tc.disponible);
    });
    this.showAceptarModal = true;
  }

  confirmarAceptar() {
    if (!this.currentUser || !this.aceptarSolicitudActual) return;
    this.solicitudesService
      .aceptarSolicitud(this.currentUser.taller_id, {
        incidente_id: this.aceptarSolicitudActual.incidente_id,
        tecnico_id: this.aceptarTecnicoId ?? undefined,
        tiempo_estimado_minutos: this.aceptarTiempoEstimado ?? undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showAceptarModal = false;
          this.mostrarToast('Solicitud aceptada correctamente', 'ok');
          this.setTab('asignadas');
        },
        error: (e) => this.mostrarToast(e.message || 'Error al aceptar', 'err'),
      });
  }

  cerrarAceptarModal() {
    this.showAceptarModal = false;
    this.aceptarSolicitudActual = null;
  }

  abrirRechazar(incidenteId: number) {
    this.rechazarIncidenteId = incidenteId;
    this.rechazarObservaciones = '';
    this.showRechazar = true;
  }

  confirmarRechazar() {
    if (!this.currentUser || !this.rechazarIncidenteId) return;
    this.solicitudesService
      .rechazarSolicitud(this.currentUser.taller_id, {
        incidente_id: this.rechazarIncidenteId,
        observaciones: this.rechazarObservaciones || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showRechazar = false;
          this.mostrarToast('Solicitud rechazada', 'ok');
        },
        error: (e) => this.mostrarToast(e.message || 'Error al rechazar', 'err'),
      });
  }

  cerrarRechazar() {
    this.showRechazar = false;
    this.rechazarIncidenteId = null;
  }

  abrirMapa(lat: number, lng: number) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  imagenUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    // compatibilidad con paths locales anteriores: "imagenes_incidentes/uuid.ext"
    const clean = path.startsWith('/') ? path.slice(1) : path;
    const filename = clean.replace(/^imagenes_incidentes\//, '');
    return `${environment.api.baseUrl}/imagenes/${filename}`;
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

  prioridadClass(prioridad: string): string {
    return prioridad === 'urgente' ? 'badge-urgente' : 'badge-normal';
  }

  // ── Asignar técnico ──────────────────────────────────────────────────
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

  // ── Actualizar estado ────────────────────────────────────────────────
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

  // ── Diagnóstico / costo ──────────────────────────────────────────────
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

  siguienteEstado(estado: string): string | null {
    const flujo: Record<string, string> = {
      aceptada: 'en_camino',
      en_camino: 'en_servicio',
      en_servicio: 'completada',
    };
    return flujo[estado] ?? null;
  }

  etiquetaEstado(estado: string): string {
    const map: Record<string, string> = {
      en_camino: 'En camino',
      en_servicio: 'En servicio',
      completada: 'Completada',
    };
    return map[estado] ?? estado;
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

  private mostrarToast(msg: string, type: 'ok' | 'err') {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; }, 3500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }
}
