/**
 * DASHBOARD - Centro de Control del Taller
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { CurrentUser } from '../../core/models/auth.models';
import { environment } from '../../environments/environment';

interface DashboardStats {
  servicios_completados: number;
  solicitudes_activas: number;
  calificacion_promedio: number;
  ingresos_netos: number;
}

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
  private authService  = inject(AuthService);
  private notifService = inject(NotificacionesService);
  private http         = inject(HttpClient);
  private router       = inject(Router);
  private cdr          = inject(ChangeDetectorRef);
  private destroy$     = new Subject<void>();

  currentUser: CurrentUser | null = null;
  showMobileMenu = false;
  noLeidas = 0;

  stats: DashboardStats | null = null;
  loadingStats = true;

  navItems: NavItem[] = [
    { label: 'Solicitudes', url: '/solicitudes', description: 'Recibe y gestiona emergencias en tiempo real',              color: '#ea580c', bgColor: '#fff7ed' },
    { label: 'Técnicos',    url: '/tecnicos',    description: 'Administra la disponibilidad de tu equipo',                 color: '#0891b2', bgColor: '#ecfeff' },
    { label: 'Servicios',   url: '/servicios',   description: 'Configura coberturas y precios de tus servicios',           color: '#2563eb', bgColor: '#eff6ff' },
    { label: 'Ingresos',    url: '/ingresos',    description: 'Visualiza ingresos y gestiona comisiones de la plataforma', color: '#16a34a', bgColor: '#f0fdf4' },
    { label: 'Historial',   url: '/historial',   description: 'Registro completo de solicitudes, servicios y transacciones', color: '#7c3aed', bgColor: '#f5f3ff' },
    { label: 'Perfil',      url: '/perfil',      description: 'Actualiza la información y horario de tu taller',           color: '#db2777', bgColor: '#fdf2f8' },
    { label: 'Monitoreo',   url: '/monitoreo',   description: 'Seguimiento en tiempo real de tus técnicos',               color: '#0ea5e9', bgColor: '#f0f9ff' },
    { label: 'Reportes',    url: '/reportes',    description: 'Genera reportes estáticos, dinámicos y por voz exportables', color: '#be185d', bgColor: '#fdf2f8' },
  ];

  ngOnInit(): void {
    // Lee el estado de sesión directamente (sincrónico) para no depender de que el observable emita
    const user = this.authService.getAuthState().currentUser;
    this.currentUser = user;

    if (user?.rol === 'tenant_admin') {
      this.router.navigate([environment.auth.routes.orgDashboard]);
      return;
    }

    if (user?.taller_id) {
      this.cargarStats(user.taller_id);
    }

    // Suscripción reactiva para actualizar nombre/avatar si el perfil cambia
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(updated => { this.currentUser = updated; });

    this.notifService.startPolling();
    this.notifService.noLeidas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => { this.noLeidas = n; });
  }

  private cargarStats(tallerId: number): void {
    this.loadingStats = true;
    this.http
      .get<DashboardStats>(`${environment.api.baseUrl}/api/taller/${tallerId}/stats`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(() => of(null)),
      )
      .subscribe(data => {
        this.stats = data;
        this.loadingStats = false;
        this.cdr.markForCheck();
      });
  }

  formatMoney(val: number | null | undefined): string {
    if (val == null) return '—';
    return 'Bs. ' + new Intl.NumberFormat('es-BO', { maximumFractionDigits: 0 }).format(val);
  }

  formatRating(val: number | null | undefined): string {
    if (val == null || val === 0) return '—';
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
