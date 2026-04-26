import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { IngresosService } from '../../../core/services/ingresos.service';
import { PagoIngreso } from '../../../core/models/ingresos.models';
import { CurrentUser } from '../../../core/models/auth.models';

type Tab = 'ingresos' | 'pendientes' | 'historial';

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.css'],
})
export class IngresosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private ingresosService = inject(IngresosService);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  activeTab: Tab = 'ingresos';

  ingresos$ = this.ingresosService.getIngresos$();
  comisiones$ = this.ingresosService.getComisiones$();
  resumen$ = this.ingresosService.getResumen$();
  loading$ = this.ingresosService.isLoading$();
  error$ = this.ingresosService.error$();

  // Modal confirmación pago comisión
  showConfirmPago = false;
  pagoSeleccionado: PagoIngreso | null = null;
  procesandoPago = false;

  // Toast
  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  private toastTimer: any;

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
    this.ingresosService.cargarResumen(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.ingresosService.cargarIngresos(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.ingresosService.cargarComisiones(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
  }

  setTab(tab: Tab) {
    this.activeTab = tab;
  }

  comisionesPendientes(comisiones: PagoIngreso[]): PagoIngreso[] {
    return comisiones.filter(c => c.estado_comision === 'pendiente');
  }

  comisionesPagadas(comisiones: PagoIngreso[]): PagoIngreso[] {
    return comisiones.filter(c => c.estado_comision === 'pagado');
  }

  abrirConfirmPago(pago: PagoIngreso) {
    this.pagoSeleccionado = pago;
    this.showConfirmPago = true;
  }

  cerrarConfirmPago() {
    this.showConfirmPago = false;
    this.pagoSeleccionado = null;
    this.procesandoPago = false;
  }

  confirmarPagoComision() {
    if (!this.currentUser || !this.pagoSeleccionado) return;
    this.procesandoPago = true;
    this.ingresosService
      .pagarComision(this.currentUser.taller_id, this.pagoSeleccionado.pago_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.cerrarConfirmPago();
          this.mostrarToast(res.message, 'ok');
          // Recargar resumen para actualizar totales
          this.ingresosService.cargarResumen(this.currentUser!.taller_id)
            .pipe(takeUntil(this.destroy$)).subscribe();
        },
        error: (e) => {
          this.procesandoPago = false;
          this.mostrarToast(e.message || 'Error al registrar el pago', 'err');
        },
      });
  }

  formatMoney(value: number): string {
    return 'Bs. ' + new Intl.NumberFormat('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  metodoPagoLabel(metodo: string | null): string {
    const map: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia',
    };
    return metodo ? (map[metodo] ?? metodo) : '—';
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
