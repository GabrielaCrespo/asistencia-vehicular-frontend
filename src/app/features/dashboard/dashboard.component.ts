/**
 * DASHBOARD - Centro de Control del Taller
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { NotificacionesService } from '../../core/services/notificaciones.service';
import { CurrentUser } from '../../core/models/auth.models';
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
  private authService = inject(AuthService);
  private notifService = inject(NotificacionesService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  showMobileMenu = false;
  noLeidas = 0;

  navItems: NavItem[] = [
    { label: 'Solicitudes', url: '/solicitudes', description: 'Recibe y gestiona emergencias en tiempo real',             color: '#ea580c', bgColor: '#fff7ed' },
    { label: 'Técnicos',   url: '/tecnicos',    description: 'Administra la disponibilidad de tu equipo',                color: '#0891b2', bgColor: '#ecfeff' },
    { label: 'Servicios',  url: '/servicios',   description: 'Configura coberturas y precios de tus servicios',          color: '#2563eb', bgColor: '#eff6ff' },
    { label: 'Ingresos',   url: '/ingresos',    description: 'Visualiza ingresos y gestiona comisiones de la plataforma',color: '#16a34a', bgColor: '#f0fdf4' },
    { label: 'Historial',  url: '/historial',   description: 'Registro completo de solicitudes, servicios y transacciones', color: '#7c3aed', bgColor: '#f5f3ff' },
    { label: 'Perfil',     url: '/perfil',      description: 'Actualiza la información y horario de tu taller',          color: '#db2777', bgColor: '#fdf2f8' },
  ];

  ngOnInit(): void {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => { this.currentUser = user; });

    this.notifService.startPolling();
    this.notifService.noLeidas$
      .pipe(takeUntil(this.destroy$))
      .subscribe(n => { this.noLeidas = n; });
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
