/**
 * DASHBOARD - Centro de Control del Taller
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
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
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: CurrentUser | null = null;
  showMobileMenu = false;

  navItems: NavItem[] = [
    { label: 'Solicitudes', url: '/solicitudes', description: 'Recibe y gestiona emergencias en tiempo real',        color: '#f97316', bgColor: '#fff7ed' },
    { label: 'Técnicos',   url: '/tecnicos',    description: 'Administra la disponibilidad de tu equipo',           color: '#5cbdb9', bgColor: '#ebf6f5' },
    { label: 'Servicios',  url: '/servicios',   description: 'Configura coberturas y precios de tus servicios',     color: '#3b82f6', bgColor: '#eff6ff' },
    { label: 'Perfil',     url: '/perfil',      description: 'Actualiza la información y horario de tu taller',     color: '#8b5cf6', bgColor: '#f5f3ff' },
  ];

  ngOnInit(): void {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => { this.currentUser = user; });
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
