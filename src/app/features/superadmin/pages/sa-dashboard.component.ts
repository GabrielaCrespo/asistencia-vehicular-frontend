import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="sa-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Dashboard Global</h1>
          <p class="page-sub">Indicadores generales de toda la plataforma</p>
        </div>
        <button class="btn-refresh" (click)="loadData()" [disabled]="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Error -->
      <div class="alert-error" *ngIf="error">{{ error }}</div>

      <!-- Loading -->
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div>
        <span>Cargando indicadores...</span>
      </div>

      <ng-container *ngIf="!loading && data">

        <!-- KPI Cards -->
        <div class="kpi-grid">
          <div class="kpi-card kpi-purple">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.totales.organizaciones }}</span>
              <span class="kpi-lbl">Organizaciones</span>
              <span class="kpi-sub">{{ data.totales.tenants_activos }} activas</span>
            </div>
          </div>

          <div class="kpi-card kpi-indigo">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.totales.talleres }}</span>
              <span class="kpi-lbl">Talleres</span>
              <span class="kpi-sub kpi-warn" *ngIf="data.totales.talleres_pendientes_asignacion > 0">
                {{ data.totales.talleres_pendientes_asignacion }} pendientes
              </span>
              <span class="kpi-sub" *ngIf="data.totales.talleres_pendientes_asignacion === 0">
                {{ data.totales.talleres_disponibles }} disponibles
              </span>
            </div>
          </div>

          <div class="kpi-card kpi-blue">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.totales.tecnicos }}</span>
              <span class="kpi-lbl">Técnicos</span>
            </div>
          </div>

          <div class="kpi-card kpi-teal">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.totales.clientes }}</span>
              <span class="kpi-lbl">Clientes</span>
            </div>
          </div>

          <div class="kpi-card kpi-orange">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.totales.emergencias }}</span>
              <span class="kpi-lbl">Emergencias</span>
            </div>
          </div>

          <div class="kpi-card kpi-amber">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.totales.pagos_completados }}</span>
              <span class="kpi-lbl">Pagos completados</span>
              <span class="kpi-sub">{{ data.totales.ingresos_plataforma | currency:'COP':'symbol':'1.0-0' }}</span>
            </div>
          </div>

          <div class="kpi-card kpi-green">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.sla.cumplimiento_pct !== null ? (data.sla.cumplimiento_pct + '%') : 'N/A' }}</span>
              <span class="kpi-lbl">SLA Global</span>
              <span class="kpi-sub">{{ data.sla.evaluados }} evaluados</span>
            </div>
          </div>

          <div class="kpi-card kpi-slate">
            <div class="kpi-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-body">
              <span class="kpi-val">{{ data.sla.prom_asignacion_min !== null ? (data.sla.prom_asignacion_min + ' min') : 'N/A' }}</span>
              <span class="kpi-lbl">Tiempo prom. asignación</span>
              <span class="kpi-sub" *ngIf="data.sla.prom_llegada_min !== null">llegada: {{ data.sla.prom_llegada_min }} min</span>
            </div>
          </div>
        </div>

        <!-- Bottom sections -->
        <div class="bottom-grid">

          <!-- Top talleres calificados -->
          <div class="card">
            <div class="card-head">
              <h3>Talleres Mejor Calificados</h3>
              <a routerLink="/superadmin/kpis" class="card-link">Ver KPIs</a>
            </div>
            <div class="table-wrap" *ngIf="data.top_talleres_calificados.length > 0; else noTalleres">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Taller</th>
                    <th>Organización</th>
                    <th>Calificación</th>
                    <th>Reseñas</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let t of data.top_talleres_calificados; let i = index">
                    <td class="rank">{{ i + 1 }}</td>
                    <td class="bold">{{ t.razon_social }}</td>
                    <td class="muted">{{ t.organizacion }}</td>
                    <td>
                      <span class="stars">★ {{ t.calificacion | number:'1.1-2' }}</span>
                    </td>
                    <td>{{ t.resenas }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noTalleres>
              <p class="empty-msg">Aún no hay calificaciones registradas.</p>
            </ng-template>
          </div>

          <!-- Top organizaciones activas -->
          <div class="card">
            <div class="card-head">
              <h3>Organizaciones más Activas</h3>
              <a routerLink="/superadmin/organizaciones" class="card-link">Gestionar</a>
            </div>
            <div class="table-wrap" *ngIf="data.top_organizaciones_activas.length > 0; else noOrgs">
              <table>
                <thead>
                  <tr>
                    <th>Organización</th>
                    <th>Plan</th>
                    <th>Talleres</th>
                    <th>Incidentes</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of data.top_organizaciones_activas">
                    <td class="bold">{{ o.nombre }}</td>
                    <td><span class="badge badge-plan">{{ o.plan }}</span></td>
                    <td>{{ o.talleres }}</td>
                    <td>{{ o.incidentes }}</td>
                    <td>
                      <span class="badge" [class.badge-active]="o.estado === 'activo'" [class.badge-inactive]="o.estado !== 'activo'">
                        {{ o.estado }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <ng-template #noOrgs>
              <p class="empty-msg">Sin organizaciones registradas.</p>
            </ng-template>
          </div>

        </div>

      </ng-container>
    </div>
  `,
  styles: [`
    .sa-page { max-width: 1400px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem; background: #7c3aed; color: white;
      border: none; border-radius: 10px; font-size: 0.85rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-refresh svg { width: 15px; height: 15px; }
    .btn-refresh:hover:not(:disabled) { background: #6d28d9; }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .loading-wrap {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 2rem; color: #64748b; font-size: 0.9rem;
    }
    .spinner {
      width: 22px; height: 22px; border: 3px solid #e2e8f0;
      border-top-color: #7c3aed; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: white; border-radius: 14px;
      padding: 1.1rem 1.25rem;
      display: flex; align-items: flex-start; gap: 0.85rem;
      box-shadow: 0 1px 3px rgba(0,0,0,.06);
      border: 1px solid #e2e8f0;
    }

    .kpi-icon {
      width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 20px; height: 20px; }

    .kpi-body { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .kpi-val { font-size: 1.5rem; font-weight: 800; color: #0f172a; line-height: 1.1; }
    .kpi-lbl { font-size: 0.75rem; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
    .kpi-sub { font-size: 0.78rem; color: #94a3b8; }
    .kpi-warn { color: #f59e0b !important; font-weight: 600; }

    .kpi-purple .kpi-icon { background: #f5f3ff; color: #7c3aed; }
    .kpi-indigo .kpi-icon { background: #eef2ff; color: #4f46e5; }
    .kpi-blue   .kpi-icon { background: #eff6ff; color: #3b82f6; }
    .kpi-teal   .kpi-icon { background: #f0fdfa; color: #14b8a6; }
    .kpi-orange .kpi-icon { background: #fff7ed; color: #f97316; }
    .kpi-amber  .kpi-icon { background: #fffbeb; color: #f59e0b; }
    .kpi-green  .kpi-icon { background: #f0fdf4; color: #22c55e; }
    .kpi-slate  .kpi-icon { background: #f8fafc; color: #64748b; }

    /* Bottom grid */
    .bottom-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem;
    }

    .card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden;
    }

    .card-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #f1f5f9;
    }
    .card-head h3 { font-size: 0.9rem; font-weight: 700; color: #0f172a; margin: 0; }
    .card-link { font-size: 0.8rem; color: #7c3aed; text-decoration: none; font-weight: 600; }
    .card-link:hover { text-decoration: underline; }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.82rem; }
    th { padding: 0.6rem 1rem; text-align: left; font-size: 0.72rem; font-weight: 700;
         text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em;
         border-bottom: 1px solid #f1f5f9; }
    td { padding: 0.7rem 1rem; border-bottom: 1px solid #f8fafc; color: #334155; }
    tr:last-child td { border-bottom: none; }

    .rank { color: #94a3b8; font-weight: 700; }
    .bold { font-weight: 600; color: #1e293b; }
    .muted { color: #94a3b8; }

    .stars { color: #f59e0b; font-weight: 700; }

    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-plan { background: #f5f3ff; color: #7c3aed; }
    .badge-active { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }

    .empty-msg { padding: 1.5rem; text-align: center; color: #94a3b8; font-size: 0.875rem; }

    @media (max-width: 900px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .bottom-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 480px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SaDashboardComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  data: any = null;
  loading = false;
  error = '';

  ngOnInit(): void { this.loadData(); }

  loadData(): void {
    this.loading = true;
    this.error = '';
    this.cdr.markForCheck();
    const headers = new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });

    this.http.get(`${environment.api.baseUrl}/api/superadmin/dashboard`, { headers })
      .subscribe({
        next: (res: any) => {
          this.data = res;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.error = err?.error?.detail || 'Error al cargar el dashboard';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
