import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { CotizacionesService } from '../../../core/services/cotizaciones.service';
import { SolicitudesService } from '../../../core/services/solicitudes.service';
import { Cotizacion } from '../../../core/models/cotizaciones.models';
import { SolicitudDisponible, DetalleIncidente } from '../../../core/models/solicitudes.models';
import { CurrentUser } from '../../../core/models/auth.models';
import { environment } from '../../../environments/environment';

type Tab = 'disponibles' | 'mis-cotizaciones';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './cotizaciones.component.html',
  styleUrls: ['./cotizaciones.component.css'],
})
export class CotizacionesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private cotizacionesService = inject(CotizacionesService);
  private solicitudesService = inject(SolicitudesService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  activeTab: Tab = 'disponibles';

  disponibles$ = this.solicitudesService.getDisponibles$();
  cotizaciones$ = this.cotizacionesService.getCotizaciones$();
  loadingDisp$ = this.solicitudesService.isLoading$();
  loadingCot$ = this.cotizacionesService.isLoading$();
  errorDisp$ = this.solicitudesService.error$();
  errorCot$ = this.cotizacionesService.error$();

  // Modal: nueva cotización
  showNuevaCotizacion = false;
  incidenteSeleccionado: SolicitudDisponible | null = null;
  formCosto: number | null = null;
  formTiempo: number | null = null;
  formObservaciones = '';
  enviando = false;

  // Modal: confirmación eliminar
  showEliminar = false;
  cotizacionAEliminar: Cotizacion | null = null;

  // Modal: detalle del incidente
  showDetalle = false;
  loadingDetalle = false;
  detalle: DetalleIncidente | null = null;
  analizandoIA = false;

  // Toast
  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.authService.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.currentUser) {
          this.currentUser = authState.currentUser;
          this.cargarTab('disponibles');
        }
      });
  }

  setTab(tab: Tab): void {
    this.activeTab = tab;
    this.cargarTab(tab);
  }

  private cargarTab(tab: Tab): void {
    if (!this.currentUser) return;
    if (tab === 'disponibles') {
      this.solicitudesService
        .cargarDisponibles()
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    } else {
      this.cotizacionesService
        .cargarMisCotizaciones(this.currentUser.taller_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe();
    }
  }

  // ── Nueva cotización ─────────────────────────────────────────────────────

  abrirNuevaCotizacion(solicitud: SolicitudDisponible): void {
    this.incidenteSeleccionado = solicitud;
    this.formCosto = null;
    this.formTiempo = null;
    this.formObservaciones = '';
    this.showNuevaCotizacion = true;
  }

  confirmarCotizacion(): void {
    if (
      !this.currentUser ||
      !this.incidenteSeleccionado ||
      !this.formCosto ||
      !this.formTiempo
    )
      return;

    this.enviando = true;
    this.cotizacionesService
      .registrarCotizacion(this.currentUser.taller_id, {
        incidente_id: this.incidenteSeleccionado.incidente_id,
        costo_estimado: this.formCosto,
        tiempo_estimado: this.formTiempo,
        observaciones: this.formObservaciones || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.enviando = false;
          this.showNuevaCotizacion = false;
          this.mostrarToast('Cotización enviada correctamente', 'ok');
          this.setTab('mis-cotizaciones');
        },
        error: e => {
          this.enviando = false;
          this.mostrarToast(e.message ?? 'Error al enviar cotización', 'err');
        },
      });
  }

  cerrarNuevaCotizacion(): void {
    this.showNuevaCotizacion = false;
    this.incidenteSeleccionado = null;
  }

  // ── Eliminar cotización ──────────────────────────────────────────────────

  abrirEliminar(cotizacion: Cotizacion): void {
    this.cotizacionAEliminar = cotizacion;
    this.showEliminar = true;
  }

  confirmarEliminar(): void {
    if (!this.currentUser || !this.cotizacionAEliminar) return;
    this.cotizacionesService
      .eliminarCotizacion(
        this.currentUser.taller_id,
        this.cotizacionAEliminar.cotizacion_id,
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showEliminar = false;
          this.mostrarToast('Cotización eliminada', 'ok');
        },
        error: e =>
          this.mostrarToast(e.message ?? 'Error al eliminar', 'err'),
      });
  }

  cerrarEliminar(): void {
    this.showEliminar = false;
    this.cotizacionAEliminar = null;
  }

  // ── Detalle del incidente ────────────────────────────────────────────────

  abrirDetalle(incidenteId: number): void {
    this.showDetalle = true;
    this.loadingDetalle = true;
    this.detalle = null;
    this.solicitudesService.obtenerDetalle(incidenteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: d => { this.detalle = d; this.loadingDetalle = false; },
        error: () => {
          this.loadingDetalle = false;
          this.cerrarDetalle();
          this.mostrarToast('No se pudo cargar el detalle del incidente', 'err');
        },
      });
  }

  cerrarDetalle(): void {
    this.showDetalle = false;
    this.detalle = null;
  }

  imagenUrl(path: string): string {
    return path?.startsWith('http') ? path : `${environment.api.baseUrl}/${path}`;
  }

  audioUrl(path: string): string {
    return path?.startsWith('http') ? path : `${environment.api.baseUrl}/${path}`;
  }

  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img) {
      img.style.display = 'none';
      const fallback = img.nextElementSibling as HTMLElement;
      if (fallback) fallback.style.display = 'block';
    }
  }

  analizarIA(incidenteId: number): void {
    if (this.analizandoIA) return;
    this.analizandoIA = true;
    this.solicitudesService.analizarConIA(incidenteId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.analizandoIA = false;
          if (this.detalle) this.detalle = { ...this.detalle, ia_analisis: res.analisis };
          this.mostrarToast('Análisis de IA completado', 'ok');
        },
        error: e => {
          this.analizandoIA = false;
          this.mostrarToast(e.message ?? 'Error en análisis de IA', 'err');
        },
      });
  }

  abrirMapa(lat: number, lng: number): void {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  estadoBadgeClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'badge-pending',
      aceptada: 'badge-aceptada',
      no_seleccionada: 'badge-no-sel',
      rechazada: 'badge-rejected',
    };
    return map[estado] ?? 'badge-pending';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      no_seleccionada: 'No seleccionada',
      rechazada: 'Rechazada',
    };
    return map[estado] ?? estado;
  }

  prioridadClass(prioridad: string): string {
    const map: Record<string, string> = {
      alta: 'badge-alta',
      urgente: 'badge-alta',
      normal: 'badge-normal',
      baja: 'badge-baja',
    };
    return map[prioridad] ?? 'badge-normal';
  }

  prioridadLabel(p: string): string {
    const map: Record<string, string> = { alta: 'Alta', urgente: 'Urgente', normal: 'Normal', baja: 'Baja' };
    return map[p] ?? p;
  }

  private mostrarToast(msg: string, type: 'ok' | 'err'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => {
      this.toastMsg = '';
      this.cdr.markForCheck();
    }, 3500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}
