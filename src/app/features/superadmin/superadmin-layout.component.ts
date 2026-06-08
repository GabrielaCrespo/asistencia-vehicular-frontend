import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { CurrentUser } from '../../core/models/auth.models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="sa-shell">

      <!-- TOPBAR -->
      <header class="topbar">
        <div class="topbar-inner">

          <div class="topbar-left">
            <button class="hamburger" (click)="sidebarOpen = !sidebarOpen"
                    [attr.aria-label]="sidebarOpen ? 'Cerrar menú' : 'Abrir menú'">
              <span></span><span></span><span></span>
            </button>
            <a routerLink="/superadmin/dashboard" class="brand">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span class="brand-name">Super Administración</span>
            </a>
          </div>

          <div class="topbar-center">
            <span class="admin-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Plataforma Global
            </span>
          </div>

          <div class="topbar-right">
            <div class="user-pill">
              <div class="user-avatar">{{ initials }}</div>
              <span class="user-name">{{ currentUser?.nombre }}</span>
            </div>
            <button class="btn-logout" (click)="logout()" title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span class="btn-logout-txt">Salir</span>
            </button>
          </div>

        </div>
      </header>

      <!-- BODY -->
      <div class="body">
        <div class="overlay" [class.visible]="sidebarOpen" (click)="sidebarOpen = false"></div>

        <aside class="sidebar" [class.open]="sidebarOpen">
          <nav class="sidebar-nav">

            <a routerLink="/superadmin/dashboard" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <span>Dashboard Global</span>
            </a>

            <a routerLink="/superadmin/organizaciones" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="2" y="7" width="20" height="14" rx="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              </div>
              <span>Organizaciones</span>
            </a>

            <a routerLink="/superadmin/talleres" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span>Talleres</span>
            </a>

            <a routerLink="/superadmin/usuarios" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span>Usuarios</span>
            </a>

            <a routerLink="/superadmin/kpis" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <span>KPIs Globales</span>
            </a>

            <a routerLink="/superadmin/bitacora" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <span>Bitácora</span>
            </a>

            <a routerLink="/superadmin/reportes" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <line x1="10" y1="9" x2="8" y2="9"/>
                </svg>
              </div>
              <span>Reportes</span>
            </a>

            <a routerLink="/superadmin/configuracion" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </div>
              <span>Configuración</span>
            </a>

          </nav>
        </aside>

        <main class="main">
          <router-outlet (activate)="onRouteActivate()"></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .sa-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* TOPBAR */
    .topbar {
      background: linear-gradient(135deg, #6d28d9 0%, #4c1d95 100%);
      box-shadow: 0 2px 20px rgba(109,40,217,0.35);
      position: sticky;
      top: 0;
      z-index: 200;
      flex-shrink: 0;
    }

    .topbar-inner {
      height: 60px;
      padding: 0 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .topbar-left { display: flex; align-items: center; gap: 0.75rem; }

    .hamburger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 34px; height: 34px;
      background: rgba(255,255,255,0.15);
      border: none; border-radius: 8px; cursor: pointer; padding: 6px;
      flex-shrink: 0;
    }
    .hamburger span { display: block; height: 2px; background: white; border-radius: 2px; }

    .brand {
      display: flex; align-items: center; gap: 0.5rem;
      text-decoration: none; color: white;
    }
    .brand svg { width: 22px; height: 22px; flex-shrink: 0; }
    .brand-name { font-size: 1rem; font-weight: 700; letter-spacing: -0.2px; white-space: nowrap; }

    .topbar-center { flex: 1; display: flex; justify-content: center; }

    .admin-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3);
      color: white; border-radius: 99px;
      padding: 0.3rem 0.9rem; font-size: 0.82rem; font-weight: 600;
    }
    .admin-chip svg { width: 13px; height: 13px; flex-shrink: 0; }

    .topbar-right { display: flex; align-items: center; gap: 0.75rem; }

    .user-pill {
      display: flex; align-items: center; gap: 0.5rem;
      background: rgba(255,255,255,0.15); border-radius: 99px;
      padding: 0.25rem 0.75rem 0.25rem 0.3rem;
    }
    .user-avatar {
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(255,255,255,0.3); border: 1.5px solid rgba(255,255,255,0.5);
      color: white; font-size: 0.72rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .user-name { font-size: 0.82rem; font-weight: 600; color: white; }

    .btn-logout {
      display: flex; align-items: center; gap: 0.35rem;
      background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.25);
      color: white; border-radius: 8px; padding: 0.4rem 0.75rem;
      font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: background 0.2s;
    }
    .btn-logout svg { width: 15px; height: 15px; }
    .btn-logout:hover { background: rgba(255,255,255,0.22); }

    /* BODY */
    .body { flex: 1; display: flex; position: relative; }

    .overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(15,23,42,0.45); z-index: 150;
      opacity: 0; transition: opacity 0.25s;
    }
    .overlay.visible { opacity: 1; }

    /* SIDEBAR */
    .sidebar {
      width: 220px; min-width: 220px;
      background: white; border-right: 1px solid #e2e8f0;
      position: sticky; top: 60px;
      height: calc(100vh - 60px); overflow-y: auto; flex-shrink: 0;
    }

    .sidebar-nav { padding: 1rem 0.75rem; display: flex; flex-direction: column; gap: 0.2rem; }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.9rem; border-radius: 10px;
      text-decoration: none; color: #64748b;
      font-size: 0.875rem; font-weight: 500; transition: all 0.18s ease;
    }
    .nav-icon {
      width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #f8fafc; transition: all 0.18s;
    }
    .nav-icon svg { width: 17px; height: 17px; }

    .nav-item:hover { color: #7c3aed; background: #f5f3ff; }
    .nav-item:hover .nav-icon { background: #ede9fe; color: #7c3aed; }

    .nav-item.active { color: #7c3aed; background: #f5f3ff; font-weight: 600; }
    .nav-item.active .nav-icon { background: #7c3aed; color: white; }
    .nav-item.active .nav-icon svg { stroke: white; }

    /* MAIN */
    .main { flex: 1; padding: 1.5rem; overflow-x: hidden; min-width: 0; }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .topbar-center { display: none; }
      .btn-logout-txt { display: none; }
      .user-name { display: none; }
      .sidebar {
        position: fixed; top: 0; left: 0; bottom: 0;
        z-index: 160; width: 260px; min-width: 260px;
        transform: translateX(-100%); transition: transform 0.25s ease;
        height: 100vh; box-shadow: 4px 0 24px rgba(0,0,0,0.12);
      }
      .sidebar.open { transform: translateX(0); }
      .overlay { display: block; }
      .main { padding: 1rem; }
    }
  `]
})
export class SuperAdminLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private http        = inject(HttpClient);
  private cdr         = inject(ChangeDetectorRef);
  private destroy$    = new Subject<void>();

  currentUser: CurrentUser | null = null;
  sidebarOpen = false;

  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;

  get initials(): string {
    return (this.currentUser?.nombre || 'SA').substring(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => { this.currentUser = user; this.cdr.markForCheck(); });

    // Force change detection after each navigation (required for zoneless mode)
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd), takeUntil(this.destroy$))
      .subscribe(() => this.cdr.markForCheck());

    this.pingBackend();
    this.keepaliveInterval = setInterval(() => this.pingBackend(), 4 * 60 * 1000);
  }

  onRouteActivate(): void {
    this.cdr.markForCheck();
  }

  private pingBackend(): void {
    this.http.get(`${environment.api.baseUrl}/health`)
      .pipe(takeUntil(this.destroy$))
      .subscribe({ error: () => {} });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  ngOnDestroy(): void {
    if (this.keepaliveInterval) clearInterval(this.keepaliveInterval);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
