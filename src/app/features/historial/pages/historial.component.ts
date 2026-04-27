import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { HistorialService } from '../../../core/services/historial.service';
import { CurrentUser } from '../../../core/models/auth.models';
import {
  ResumenHistorial, SolicitudHistorial, ServicioRealizado,
  Transaccion, DetalleSolicitud
} from '../../../core/models/historial.models';

type Tab = 'resumen' | 'solicitudes' | 'servicios' | 'transacciones';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css'],
})
export class HistorialComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private historialService = inject(HistorialService);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  activeTab: Tab = 'resumen';

  resumen$ = this.historialService.getResumen$();
  solicitudes$ = this.historialService.getSolicitudes$();
  servicios$ = this.historialService.getServicios$();
  transacciones$ = this.historialService.getTransacciones$();
  detalle$ = this.historialService.getDetalle$();
  loading$ = this.historialService.isLoading$();
  loadingDetalle$ = this.historialService.isLoadingDetalle$();
  error$ = this.historialService.error$();

  // Filtros solicitudes
  filtroSolicitudesEstado = '';
  filtroSolicitudesFechaDesde = '';
  filtroSolicitudesFechaHasta = '';

  // Filtros transacciones
  filtroTransEstadoComision = '';
  filtroTransMetodoPago = '';
  filtroTransFechaDesde = '';
  filtroTransFechaHasta = '';

  // Modal detalle
  showDetalle = false;

  ngOnInit() {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          this.currentUser = user;
          this.cargarTodo(user.taller_id);
        }
      });
  }

  private cargarTodo(tallerId: number) {
    this.historialService.cargarResumen(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.historialService.cargarSolicitudes(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.historialService.cargarServicios(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.historialService.cargarTransacciones(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
  }

  aplicarFiltroSolicitudes() {
    if (!this.currentUser) return;
    this.historialService.cargarSolicitudes(this.currentUser.taller_id, {
      estado: this.filtroSolicitudesEstado || undefined,
      fechaDesde: this.filtroSolicitudesFechaDesde || undefined,
      fechaHasta: this.filtroSolicitudesFechaHasta || undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  limpiarFiltroSolicitudes() {
    this.filtroSolicitudesEstado = '';
    this.filtroSolicitudesFechaDesde = '';
    this.filtroSolicitudesFechaHasta = '';
    if (this.currentUser) {
      this.historialService.cargarSolicitudes(this.currentUser.taller_id)
        .pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  aplicarFiltroTransacciones() {
    if (!this.currentUser) return;
    this.historialService.cargarTransacciones(this.currentUser.taller_id, {
      estado_comision: this.filtroTransEstadoComision || undefined,
      metodo_pago: this.filtroTransMetodoPago || undefined,
      fechaDesde: this.filtroTransFechaDesde || undefined,
      fechaHasta: this.filtroTransFechaHasta || undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe();
  }

  limpiarFiltroTransacciones() {
    this.filtroTransEstadoComision = '';
    this.filtroTransMetodoPago = '';
    this.filtroTransFechaDesde = '';
    this.filtroTransFechaHasta = '';
    if (this.currentUser) {
      this.historialService.cargarTransacciones(this.currentUser.taller_id)
        .pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  verDetalle(incidenteId: number) {
    if (!this.currentUser) return;
    this.showDetalle = true;
    this.historialService.cargarDetalle(this.currentUser.taller_id, incidenteId)
      .pipe(takeUntil(this.destroy$)).subscribe();
  }

  cerrarDetalle() {
    this.showDetalle = false;
    this.historialService.limpiarDetalle();
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'Pendiente',
      aceptada: 'Aceptada',
      en_camino: 'En camino',
      en_servicio: 'En servicio',
      completada: 'Completada',
      rechazada: 'Rechazada',
    };
    return map[estado] ?? estado;
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      pendiente: 'estado-pendiente',
      aceptada: 'estado-aceptada',
      en_camino: 'estado-en-camino',
      en_servicio: 'estado-en-servicio',
      completada: 'estado-completada',
      rechazada: 'estado-rechazada',
    };
    return map[estado] ?? '';
  }

  prioridadClass(prioridad: string): string {
    return prioridad === 'alta' ? 'prio-alta' : prioridad === 'media' ? 'prio-media' : 'prio-normal';
  }

  formatMoney(value: number | null): string {
    if (value == null) return '—';
    return 'Bs. ' + new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-BO', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatDateTime(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString('es-BO', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  starsArray(n: number | null): number[] {
    return n ? Array(n).fill(0) : [];
  }

  metodoPagoLabel(metodo: string | null): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
    };
    return metodo ? (map[metodo] ?? metodo) : '—';
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
