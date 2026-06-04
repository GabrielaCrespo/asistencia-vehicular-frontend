/**
 * DASHBOARD - Centro de Control del Taller
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { HistorialService } from '../../core/services/historial.service';
import { IngresosService } from '../../core/services/ingresos.service';
import { CurrentUser } from '../../core/models/auth.models';
import { ResumenHistorial } from '../../core/models/historial.models';
import { ResumenIngresos } from '../../core/models/ingresos.models';
import { environment } from '../../environments/environment';

interface NavItem {
  label: string;
  url: string;
  description: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService      = inject(AuthService);
  private notifService     = inject(NotificacionesService);
  private historialService = inject(HistorialService);
  private ingresosService  = inject(IngresosService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  showMobileMenu = false;
  noLeidas = 0;

  historialResumen: ResumenHistorial | null = null;
  ingresosResumen:  ResumenIngresos  | null = null;
  loadingStats = true;

  navItems: NavItem[] = [
    { label: 'Solicitudes', url: '/solicitudes', description: 'Recibe y gestiona emergencias en tiempo real',             color: '#ea580c', bgColor: '#fff7ed' },
    { label: 'Técnicos',   url: '/tecnicos',    description: 'Administra la disponibilidad de tu equipo',                color: '#0891b2', bgColor: '#ecfeff' },
    { label: 'Servicios',  url: '/servicios',   description: 'Configura coberturas y precios de tus servicios',          color: '#2563eb', bgColor: '#eff6ff' },
    { label: 'Ingresos',   url: '/ingresos',    description: 'Visualiza ingresos y gestiona comisiones de la plataforma',color: '#16a34a', bgColor: '#f0fdf4' },
    { label: 'Historial',  url: '/historial',   description: 'Registro completo de solicitudes, servicios y transacciones', color: '#7c3aed', bgColor: '#f5f3ff' },
    { label: 'Perfil',     url: '/perfil',      description: 'Actualiza la información y horario de tu taller',          color: '#db2777', bgColor: '#fdf2f8' },
    { label: 'Monitoreo',  url: '/monitoreo',   description: 'Seguimiento en tiempo real de tus técnicos', color: '#0ea5e9', bgColor: '#f0f9ff' },
  ];

  ngOnInit(): void {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        // Redirigir al portal de organización si el usuario es tenant_admin
        if (user?.rol === 'tenant_admin') {
          this.router.navigate([environment.auth.routes.orgDashboard]);
          return;
        }
        if (user?.taller_id) this.cargarStats(user.taller_id);
      });

    this.notifService.startPolling();
    this.notifService.noLeidas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => { this.noLeidas = n; });
  }

  private cargarStats(tallerId: number): void {
    this.loadingStats = true;
    forkJoin({
      historial: this.historialService.cargarResumen(tallerId),
      ingresos:  this.ingresosService.cargarResumen(tallerId),
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ historial, ingresos }) => {
        this.historialResumen = historial;
        this.ingresosResumen  = ingresos;
        this.loadingStats = false;
      },
      error: () => { this.loadingStats = false; },
    });
  }

  formatMoney(val: number | null | undefined): string {
    if (val == null) return '—';
    return 'Bs. ' + new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(val);
  }

  formatRating(val: number | null | undefined): string {
    if (!val) return '—';
    return val.toFixed(1) + ' ★';
  }

  logout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate([environment.auth.routes.login]);
    }
  }

  toggleMobileMenu(): void { this.showMobileMenu = !this.showMobileMenu; }

  navigate(url: string): void {
    this.showMobileMenu = false;
    this.router.navigate([url]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
