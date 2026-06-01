import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { OrgDashboard } from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <!-- Bienvenida -->
      <div class="welcome-banner">
        <div class="welcome-text">
          <p class="welcome-label">Panel de organización</p>
          <h1>{{ orgNombre || 'Organización' }}</h1>
          <span class="plan-badge" *ngIf="kpis?.plan">{{ kpis!.plan | titlecase }}</span>
        </div>
      </div>

      <!-- KPIs -->
      <div class="kpi-grid" *ngIf="kpis && !loading">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#eff6ff;color:#3b82f6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ kpis.total_talleres }}</span>
            <span class="kpi-lbl">Talleres</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#f0fdf4;color:#16a34a">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ kpis.total_tecnicos }}</span>
            <span class="kpi-lbl">Técnicos</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fff7ed;color:#ea580c">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ kpis.total_incidentes }}</span>
            <span class="kpi-lbl">Incidentes totales</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fefce8;color:#ca8a04">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ kpis.incidentes_en_progreso }}</span>
            <span class="kpi-lbl">En progreso</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#f0fdf4;color:#15803d">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val green">Bs. {{ kpis.ingresos_totales | number:'1.0-0' }}</span>
            <span class="kpi-lbl">Ingresos totales</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fef2f2;color:#dc2626">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val red">Bs. {{ kpis.comisiones_plataforma | number:'1.0-0' }}</span>
            <span class="kpi-lbl">Comisiones</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#eff6ff;color:#2563eb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ kpis.incidentes_completados }}</span>
            <span class="kpi-lbl">Completados</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fefce8;color:#b45309">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ kpis.calificacion_promedio | number:'1.1-1' }} ⭐</span>
            <span class="kpi-lbl">Calificación promedio</span>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner-lg"></div>
        <p>Cargando KPIs...</p>
      </div>

      <!-- Error si las vistas SQL no existen aún -->
      <div class="error-state" *ngIf="error && !loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <p>{{ error }}</p>
      </div>

      <!-- Accesos rápidos -->
      <div class="quick-links" *ngIf="!loading">
        <h2 class="section-title">Accesos rápidos</h2>
        <div class="links-grid">
          <a routerLink="/organizacion/talleres" class="link-card">
            <div class="link-icon" style="background:#f0fdfa;color:#5cbdb9">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>
            <div>
              <h3>Gestionar talleres</h3>
              <p>Ver y crear talleres en tu organización</p>
            </div>
            <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a routerLink="/organizacion/tecnicos" class="link-card">
            <div class="link-icon" style="background:#f0fdf4;color:#16a34a">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h3>Ver técnicos</h3>
              <p>Equipo técnico de toda la organización</p>
            </div>
            <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a routerLink="/organizacion/incidentes" class="link-card">
            <div class="link-icon" style="background:#fff7ed;color:#ea580c">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
            <div>
              <h3>Seguir incidentes</h3>
              <p>Estado de todas las emergencias</p>
            </div>
            <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>

          <a routerLink="/organizacion/reportes" class="link-card">
            <div class="link-icon" style="background:#f5f3ff;color:#7c3aed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="20" x2="18" y2="10"/>
                <line x1="12" y1="20" x2="12" y2="4"/>
                <line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <div>
              <h3>Reportes financieros</h3>
              <p>Ingresos y comisiones por taller</p>
            </div>
            <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </a>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }

    /* Bienvenida */
    .welcome-banner {
      background: linear-gradient(135deg, #5cbdb9 0%, #1a6b68 100%);
      border-radius: 16px; padding: 1.5rem 1.75rem;
      margin-bottom: 1.5rem; color: white;
    }

    .welcome-label { font-size: 0.78rem; font-weight: 600; opacity: 0.75; margin: 0 0 0.2rem; text-transform: uppercase; letter-spacing: 0.05em; }

    .welcome-banner h1 { font-size: 1.5rem; font-weight: 800; margin: 0 0 0.5rem; }

    .plan-badge {
      display: inline-block; background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.35); border-radius: 99px;
      padding: 0.2rem 0.7rem; font-size: 0.78rem; font-weight: 600;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 1rem; margin-bottom: 1.75rem;
    }

    .kpi-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1.1rem 1.25rem; display: flex; align-items: center; gap: 0.9rem;
      transition: box-shadow 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.07); }

    .kpi-icon {
      width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 20px; height: 20px; }

    .kpi-data { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .kpi-val { font-size: 1.25rem; font-weight: 800; color: #0f172a; white-space: nowrap; }
    .kpi-val.green { color: #15803d; }
    .kpi-val.red   { color: #dc2626; }
    .kpi-lbl { font-size: 0.72rem; color: #94a3b8; font-weight: 500; }

    /* Loading/Error */
    .loading-state, .error-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3rem 1rem; gap: 0.75rem; color: #94a3b8;
    }
    .error-state svg { width: 40px; height: 40px; }
    .error-state p { font-size: 0.9rem; text-align: center; }

    .spinner-lg {
      width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Quick links */
    .section-title {
      font-size: 0.95rem; font-weight: 700; color: #0f172a;
      margin: 0 0 0.9rem;
    }

    .links-grid {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
    }

    .link-card {
      display: flex; align-items: center; gap: 0.9rem;
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1rem 1.25rem; text-decoration: none;
      transition: all 0.18s ease;
    }
    .link-card:hover {
      border-color: #5cbdb9; box-shadow: 0 4px 12px rgba(92,189,185,0.12);
      transform: translateY(-1px);
    }

    .link-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .link-icon svg { width: 18px; height: 18px; }

    .link-card h3 { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin: 0 0 0.15rem; }
    .link-card p  { font-size: 0.78rem; color: #94a3b8; margin: 0; }

    .arrow { width: 16px; height: 16px; color: #cbd5e1; margin-left: auto; flex-shrink: 0; }

    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .links-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class OrgDashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  kpis: OrgDashboard | null = null;
  loading = true;
  error = '';
  orgNombre = '';

  ngOnInit(): void {
    const user = this.authService.getAuthState().currentUser;
    this.orgNombre = user?.organizacion_nombre || '';
    const orgId = user?.organizacion_id;

    if (!orgId) { this.loading = false; return; }

    this.orgService.getDashboard(orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.kpis = data;
          this.orgNombre = data.organizacion_nombre;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.detail || 'Error cargando KPIs. Verifica que las vistas SQL estén creadas.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
