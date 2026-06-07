import { Component, OnInit, OnDestroy, AfterViewChecked, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { IngresosService } from '../../../core/services/ingresos.service';
import { StripeService } from '../../../core/services/stripe.service';
import { PagoIngreso } from '../../../core/models/ingresos.models';
import { CurrentUser } from '../../../core/models/auth.models';

type Tab = 'ingresos' | 'pendientes' | 'historial';
type MetodoPago = 'qr' | 'transferencia' | 'stripe' | null;

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ingresos.component.html',
  styleUrls: ['./ingresos.component.css'],
})
export class IngresosComponent implements OnInit, OnDestroy, AfterViewChecked {
  private readonly authService = inject(AuthService);
  private readonly ingresosService = inject(IngresosService);
  private readonly stripeService = inject(StripeService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy$ = new Subject<void>();

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
  metodoPagoSeleccionado: MetodoPago = null;

  // Stripe
  stripeClientSecret: string | null = null;
  stripeListo = false;
  stripeMontado = false;
  stripeError: string | null = null;

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

  ngAfterViewChecked() {
    // Montar el card element de Stripe cuando el contenedor esté en el DOM
    if (this.metodoPagoSeleccionado === 'stripe' && this.stripeListo && !this.stripeMontado) {
      const container = document.getElementById('stripe-card-element');
      if (container) {
        this.stripeService.mountCardElement('stripe-card-element');
        this.stripeMontado = true;
        this.cdr.detectChanges();
      }
    }
  }

  private cargarTodo(tallerId: number) {
    this.ingresosService.cargarResumen(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.ingresosService.cargarIngresos(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
    this.ingresosService.cargarComisiones(tallerId).pipe(takeUntil(this.destroy$)).subscribe();
  }

  setTab(tab: Tab) { this.activeTab = tab; }

  comisionesPendientes(comisiones: PagoIngreso[]): PagoIngreso[] {
    return comisiones.filter(c => c.estado_comision === 'pendiente');
  }

  comisionesPagadas(comisiones: PagoIngreso[]): PagoIngreso[] {
    return comisiones.filter(c => c.estado_comision === 'pagado');
  }

  abrirConfirmPago(pago: PagoIngreso) {
    this.pagoSeleccionado = pago;
    this.metodoPagoSeleccionado = null;
    this.stripeClientSecret = null;
    this.stripeListo = false;
    this.stripeMontado = false;
    this.stripeError = null;
    this.showConfirmPago = true;
  }

  cerrarConfirmPago() {
    this.stripeService.destroyCardElement();
    this.showConfirmPago = false;
    this.pagoSeleccionado = null;
    this.procesandoPago = false;
    this.metodoPagoSeleccionado = null;
    this.stripeClientSecret = null;
    this.stripeListo = false;
    this.stripeMontado = false;
    this.stripeError = null;
  }

  async seleccionarMetodo(metodo: MetodoPago) {
    // Si cambia de método, desmontar Stripe si estaba activo
    if (this.stripeMontado) {
      this.stripeService.destroyCardElement();
      this.stripeMontado = false;
    }
    this.stripeListo = false;
    this.stripeClientSecret = null;
    this.stripeError = null;
    this.metodoPagoSeleccionado = metodo;

    if (metodo === 'stripe' && this.pagoSeleccionado) {
      this.procesandoPago = true;
      try {
        await this.stripeService.initStripe();
        this.stripeClientSecret = await this.stripeService.createCommissionPaymentIntent(
          this.pagoSeleccionado.pago_id
        );
        this.stripeListo = true;
      } catch (e: any) {
        this.stripeError = e?.error?.detail ?? e?.message ?? 'Error al iniciar Stripe';
        this.metodoPagoSeleccionado = null;
      } finally {
        this.procesandoPago = false;
        this.cdr.markForCheck();
      }
    }
  }

  async confirmarPagoComision() {
    if (!this.currentUser || !this.pagoSeleccionado) return;

    if (this.metodoPagoSeleccionado === 'stripe') {
      if (!this.stripeClientSecret) return;
      this.procesandoPago = true;
      this.stripeError = null;
      try {
        await this.stripeService.confirmCardPayment(this.stripeClientSecret);
        this.cerrarConfirmPago();
        this.mostrarToast('Pago con tarjeta procesado. La comisión quedará registrada en breve.', 'ok');
        // Dar tiempo al webhook para actualizar y recargar
        setTimeout(() => {
          this.cargarTodo(this.currentUser!.taller_id);
          this.cdr.markForCheck();
        }, 3000);
      } catch (e: any) {
        this.stripeError = e?.message ?? 'Error al procesar el pago con tarjeta';
        this.procesandoPago = false;
        this.cdr.markForCheck();
      }
      return;
    }

    // QR / Transferencia — flujo existente
    this.procesandoPago = true;
    this.ingresosService
      .pagarComision(this.currentUser.taller_id, this.pagoSeleccionado.pago_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.cerrarConfirmPago();
          this.mostrarToast(res.message, 'ok');
          this.cargarTodo(this.currentUser!.taller_id);
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
      stripe: 'Stripe',
    };
    return metodo ? (map[metodo] ?? metodo) : '—';
  }

  private mostrarToast(msg: string, type: 'ok' | 'err') {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; this.cdr.markForCheck(); }, 3500);
  }

  ngOnDestroy() {
    this.stripeService.destroyCardElement();
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }
}
