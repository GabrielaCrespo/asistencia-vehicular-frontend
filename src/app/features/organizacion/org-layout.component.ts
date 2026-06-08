import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { CurrentUser } from '../../core/models/auth.models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-org-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="org-shell">

      <!-- ══ TOPBAR (teal gradient, igual al dashboard de taller) ══ -->
      <header class="topbar">
        <div class="topbar-inner">

          <div class="topbar-left">
            <button class="hamburger" (click)="sidebarOpen = !sidebarOpen"
                    [attr.aria-label]="sidebarOpen ? 'Cerrar menú' : 'Abrir menú'">
              <span></span><span></span><span></span>
            </button>
            <a routerLink="/organizacion/dashboard" class="brand">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              <span class="brand-name">Asistencia Vehicular</span>
            </a>
          </div>

          <div class="topbar-center">
            <span class="org-chip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
              {{ currentUser?.organizacion_nombre || 'Organización' }}
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

      <!-- ══ BODY ══ -->
      <div class="body">

        <!-- Overlay móvil -->
        <div class="overlay" [class.visible]="sidebarOpen" (click)="sidebarOpen = false"></div>

        <!-- Sidebar blanco con acentos teal -->
        <aside class="sidebar" [class.open]="sidebarOpen">
          <nav class="sidebar-nav">

            <a routerLink="/organizacion/dashboard" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7" rx="1"/>
                  <rect x="14" y="3" width="7" height="7" rx="1"/>
                  <rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="14" y="14" width="7" height="7" rx="1"/>
                </svg>
              </div>
              <span>Dashboard</span>
            </a>

            <a routerLink="/organizacion/talleres" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
              </div>
              <span>Talleres</span>
            </a>

            <a routerLink="/organizacion/tecnicos" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span>Técnicos</span>
            </a>

            <a routerLink="/organizacion/incidentes" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <span>Incidentes</span>
            </a>

            <a routerLink="/organizacion/reportes" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="20" x2="18" y2="10"/>
                  <line x1="12" y1="20" x2="12" y2="4"/>
                  <line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </div>
              <span>Ingresos</span>
            </a>

            <a routerLink="/organizacion/reportes-avanzados" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </div>
              <span>Reportes Avanzados</span>
            </a>

            <a routerLink="/organizacion/analitica" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <span>Analítica</span>
            </a>

            <a routerLink="/organizacion/calificaciones" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              </div>
              <span>Calificaciones</span>
            </a>

            <a routerLink="/organizacion/mapa-riesgo" routerLinkActive="active"
               class="nav-item" (click)="sidebarOpen = false">
              <div class="nav-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span>Mapa de Riesgo</span>
            </a>

          </nav>
        </aside>

        <!-- Contenido -->
        <main class="main">
          <router-outlet></router-outlet>
        </main>

      </div>
    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .org-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ══ TOPBAR ══ */
    .topbar {
      background: linear-gradient(135deg, #5cbdb9 0%, #3aa7a2 100%);
      box-shadow: 0 2px 20px rgba(58,167,162,0.3);
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

    /* Left */
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
    .hamburger span {
      display: block; height: 2px; background: white; border-radius: 2px;
      transition: all 0.2s;
    }

    .brand {
      display: flex; align-items: center; gap: 0.5rem;
      text-decoration: none; color: white;
    }
    .brand svg { width: 24px; height: 24px; flex-shrink: 0; }
    .brand-name {
      font-size: 1rem; font-weight: 700; letter-spacing: -0.2px;
      white-space: nowrap;
    }

    /* Center */
    .topbar-center { flex: 1; display: flex; justify-content: center; }

    .org-chip {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3);
      color: white; border-radius: 99px;
      padding: 0.3rem 0.9rem; font-size: 0.82rem; font-weight: 600;
      max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .org-chip svg { width: 13px; height: 13px; flex-shrink: 0; }

    /* Right */
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

    /* ══ BODY ══ */
    .body {
      flex: 1;
      display: flex;
      position: relative;
    }

    /* ══ OVERLAY ══ */
    .overlay {
      display: none;
      position: fixed; inset: 0;
      background: rgba(15,23,42,0.45);
      z-index: 150;
      opacity: 0; transition: opacity 0.25s;
    }
    .overlay.visible { opacity: 1; }

    /* ══ SIDEBAR ══ */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: white;
      border-right: 1px solid #e2e8f0;
      position: sticky;
      top: 60px;          /* altura del topbar */
      height: calc(100vh - 60px);
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-nav {
      padding: 1rem 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .nav-item {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.65rem 0.9rem; border-radius: 10px;
      text-decoration: none; color: #64748b;
      font-size: 0.875rem; font-weight: 500;
      transition: all 0.18s ease;
    }

    .nav-icon {
      width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: #f8fafc; transition: all 0.18s;
    }
    .nav-icon svg { width: 17px; height: 17px; }

    .nav-item:hover {
      color: #5cbdb9;
      background: #f0fdfa;
    }
    .nav-item:hover .nav-icon {
      background: #ccfbf1;
      color: #5cbdb9;
    }

    .nav-item.active {
      color: #5cbdb9;
      background: #f0fdfa;
      font-weight: 600;
    }
    .nav-item.active .nav-icon {
      background: #5cbdb9;
      color: white;
    }
    .nav-item.active .nav-icon svg { stroke: white; }

    /* ══ MAIN ══ */
    .main {
      flex: 1;
      padding: 1.5rem;
      overflow-x: hidden;
      min-width: 0;
    }

    /* ══ RESPONSIVE ══ */
    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .topbar-center { display: none; }
      .btn-logout-txt { display: none; }
      .user-name { display: none; }

      .sidebar {
        position: fixed;
        top: 0; left: 0; bottom: 0;
        z-index: 160;
        width: 260px;
        min-width: 260px;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        height: 100vh;
        box-shadow: 4px 0 24px rgba(0,0,0,0.12);
      }
      .sidebar.open { transform: translateX(0); }
      .overlay { display: block; }
      .main { padding: 1rem; }
    }
  `]
})
export class OrgLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private http        = inject(HttpClient);
  private destroy$    = new Subject<void>();

  currentUser: CurrentUser | null = null;
  sidebarOpen = false;

  private keepaliveInterval: ReturnType<typeof setInterval> | null = null;

  get initials(): string {
    return (this.currentUser?.nombre || 'U').substring(0, 2).toUpperCase();
  }

  ngOnInit(): void {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => { this.currentUser = user; });

    this.pingBackend();
    this.keepaliveInterval = setInterval(() => this.pingBackend(), 4 * 60 * 1000);
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
