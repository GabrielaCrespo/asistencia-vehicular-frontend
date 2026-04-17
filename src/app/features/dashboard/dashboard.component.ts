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
  icon: string;
  description: string;
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
    { label: 'Técnicos',  url: '/tecnicos', icon: '👨‍🔧', description: 'Gestiona los técnicos de tu taller' },
    { label: 'Servicios', url: '/servicios', icon: '🔧',    description: 'Configura servicios ofrecidos' }
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
