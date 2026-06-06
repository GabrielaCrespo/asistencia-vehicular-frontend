import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-kpis',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
  template: `
    <div class="sa-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">KPIs Globales</h1>
          <p class="page-sub">Indicadores de rendimiento por organización y por taller</p>
        </div>
        <div class="header-right">
          <div class="tab-switch">
            <button [class.active]="view === 'orgs'" (click)="switchView('orgs')">Organizaciones</button>
            <button [class.active]="view === 'talleres'" (click)="switchView('talleres')">Talleres</button>
          </div>
          <button class="btn-refresh" (click)="reload()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="alert-error" *ngIf="error">{{ error }}</div>
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando KPIs...</span>
      </div>

      <!-- ============================================================ -->
      <!-- VISTA ORGANIZACIONES -->
      <!-- ============================================================ -->
      <ng-container *ngIf="!loading && view === 'orgs'">

        <!-- Summary cards -->
        <div class="summary-cards" *ngIf="kpisOrgs.length > 0">
          <div class="s-card s-card--purple">
            <span class="s-val">{{ kpisOrgs.length }}</span>
            <span class="s-lbl">Organizaciones</span>
          </div>
          <div class="s-card s-card--indigo">
            <span class="s-val">{{ sumOrgs('total_talleres') }}</span>
            <span class="s-lbl">Total talleres</span>
          </div>
          <div class="s-card s-card--blue">
            <span class="s-val">{{ sumOrgs('total_tecnicos') }}</span>
            <span class="s-lbl">Total técnicos</span>
          </div>
          <div class="s-card s-card--orange">
            <span class="s-val">{{ sumOrgs('total_incidentes') }}</span>
            <span class="s-lbl">Total incidentes</span>
          </div>
          <div class="s-card s-card--green">
            <span class="s-val">{{ avgOrgs('calificacion_promedio') | number:'1.1-1' }}</span>
            <span class="s-lbl">Rating promedio</span>
          </div>
        </div>

        <div class="table-card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Organización</th>
                  <th>Plan</th>
                  <th>Talleres</th>
                  <th>Técnicos</th>
                  <th>Incidentes</th>
                  <th>Completados</th>
                  <th>Calificación</th>
                  <th>Tiempo prom.</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let k of kpisOrgs">
                  <td class="name-cell">{{ k.organizacion_nombre }}</td>
                  <td><span class="badge badge-plan">{{ k.plan || 'basico' }}</span></td>
                  <td>{{ k.total_talleres ?? '—' }}</td>
                  <td>{{ k.total_tecnicos ?? '—' }}</td>
                  <td>{{ k.total_incidentes ?? '—' }}</td>
                  <td>
                    <span class="pill-green" *ngIf="k.incidentes_completados">{{ k.incidentes_completados }}</span>
                    <span class="muted" *ngIf="!k.incidentes_completados">0</span>
                  </td>
                  <td>
                    <div class="rating" *ngIf="k.calificacion_promedio > 0">
                      <span class="star">★</span> {{ k.calificacion_promedio | number:'1.1-1' }}
                    </div>
                    <span class="muted" *ngIf="!k.calificacion_promedio || k.calificacion_promedio === 0">—</span>
                  </td>
                  <td class="muted">
                    {{ k.prom_asignacion_min != null ? (k.prom_asignacion_min | number:'1.0-0') + ' min' : '—' }}
                  </td>
                  <td>
                    <div class="sla-wrap" *ngIf="k.sla_cumplimiento_pct != null">
                      <div class="sla-track">
                        <div class="sla-fill"
                          [style.width.%]="k.sla_cumplimiento_pct"
                          [class.sla-bad]="k.sla_cumplimiento_pct < 70"
                          [class.sla-ok]="k.sla_cumplimiento_pct >= 70 && k.sla_cumplimiento_pct < 90"
                          [class.sla-good]="k.sla_cumplimiento_pct >= 90">
                        </div>
                      </div>
                      <span class="sla-pct">{{ k.sla_cumplimiento_pct | number:'1.0-0' }}%</span>
                    </div>
                    <span class="muted" *ngIf="k.sla_cumplimiento_pct == null">—</span>
                  </td>
                </tr>
                <tr *ngIf="kpisOrgs.length === 0">
                  <td colspan="9" class="empty-msg">Sin datos de KPIs.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>

      <!-- ============================================================ -->
      <!-- VISTA TALLERES -->
      <!-- ============================================================ -->
      <ng-container *ngIf="!loading && view === 'talleres'">

        <!-- Summary cards -->
        <div class="summary-cards" *ngIf="kpisTalleres.length > 0">
          <div class="s-card s-card--purple">
            <span class="s-val">{{ kpisTalleres.length }}</span>
            <span class="s-lbl">Talleres</span>
          </div>
          <div class="s-card s-card--orange">
            <span class="s-val">{{ sumTalleres('total_incidentes') }}</span>
            <span class="s-lbl">Incidentes</span>
          </div>
          <div class="s-card s-card--green">
            <span class="s-val">{{ sumTalleres('servicios_completados') }}</span>
            <span class="s-lbl">Completados</span>
          </div>
          <div class="s-card s-card--amber">
            <span class="s-val">{{ avgTalleres('calificacion_promedio') | number:'1.1-1' }}</span>
            <span class="s-lbl">Rating promedio</span>
          </div>
          <div class="s-card s-card--teal">
            <span class="s-val">{{ avgTalleres('prom_respuesta_min') != null ? (avgTalleres('prom_respuesta_min') | number:'1.0-0') + ' min' : 'N/A' }}</span>
            <span class="s-lbl">Resp. promedio</span>
          </div>
        </div>

        <div class="table-card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Taller</th>
                  <th>Organización</th>
                  <th>Estado</th>
                  <th>Técnicos</th>
                  <th>Incidentes</th>
                  <th>Completados</th>
                  <th>Calificación</th>
                  <th>Resp. prom.</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let k of kpisTalleres">
                  <td class="name-cell">{{ k.razon_social }}</td>
                  <td>
                    <span class="org-chip" *ngIf="k.organizacion_nombre">{{ k.organizacion_nombre }}</span>
                    <span class="muted" *ngIf="!k.organizacion_nombre">—</span>
                  </td>
                  <td>
                    <span class="badge"
                      [class.badge-active]="k.estado === 'activo'"
                      [class.badge-inactive]="k.estado === 'inactivo'"
                      [class.badge-pending]="k.estado === 'pendiente_asignacion'">
                      {{ k.estado === 'pendiente_asignacion' ? 'Pendiente' : k.estado }}
                    </span>
                  </td>
                  <td>{{ k.total_tecnicos ?? '—' }}</td>
                  <td>{{ k.total_incidentes ?? '—' }}</td>
                  <td>
                    <span class="pill-green" *ngIf="k.servicios_completados">{{ k.servicios_completados }}</span>
                    <span class="muted" *ngIf="!k.servicios_completados">0</span>
                  </td>
                  <td>
                    <div class="rating" *ngIf="k.calificacion_promedio > 0">
                      <span class="star">★</span> {{ k.calificacion_promedio | number:'1.1-1' }}
                    </div>
                    <span class="muted" *ngIf="!k.calificacion_promedio || k.calificacion_promedio === 0">—</span>
                  </td>
                  <td class="muted">
                    {{ k.prom_respuesta_min != null ? (k.prom_respuesta_min | number:'1.0-0') + ' min' : '—' }}
                  </td>
                  <td>
                    <div class="sla-wrap" *ngIf="k.sla_cumplimiento_pct != null">
                      <div class="sla-track">
                        <div class="sla-fill"
                          [style.width.%]="k.sla_cumplimiento_pct"
                          [class.sla-bad]="k.sla_cumplimiento_pct < 70"
                          [class.sla-ok]="k.sla_cumplimiento_pct >= 70 && k.sla_cumplimiento_pct < 90"
                          [class.sla-good]="k.sla_cumplimiento_pct >= 90">
                        </div>
                      </div>
                      <span class="sla-pct">{{ k.sla_cumplimiento_pct | number:'1.0-0' }}%</span>
                    </div>
                    <span class="muted" *ngIf="k.sla_cumplimiento_pct == null">—</span>
                  </td>
                </tr>
                <tr *ngIf="kpisTalleres.length === 0">
                  <td colspan="9" class="empty-msg">Sin datos de KPIs de talleres.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .sa-page { max-width: 1300px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub   { font-size: 0.875rem; color: #64748b; margin: 0; }

    .header-right { display: flex; align-items: center; gap: 0.6rem; }

    .tab-switch {
      display: flex; border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden;
    }
    .tab-switch button {
      padding: 0.5rem 1rem; font-size: 0.83rem; font-weight: 600; border: none;
      background: white; color: #64748b; cursor: pointer; transition: all 0.15s;
    }
    .tab-switch button.active { background: #7c3aed; color: white; }
    .tab-switch button:not(.active):hover { background: #f8fafc; }

    .btn-refresh {
      width: 36px; height: 36px; border: 1.5px solid #e2e8f0; border-radius: 9px;
      background: white; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: #64748b; transition: all 0.15s;
    }
    .btn-refresh svg { width: 14px; height: 14px; }
    .btn-refresh:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }

    /* Summary cards */
    .summary-cards {
      display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;
    }
    .s-card {
      flex: 1; min-width: 120px; max-width: 180px;
      border-radius: 12px; padding: 0.85rem 1rem;
      display: flex; flex-direction: column; gap: 0.15rem;
      border: 1px solid transparent;
    }
    .s-val  { font-size: 1.4rem; font-weight: 800; line-height: 1.1; }
    .s-lbl  { font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.75; }

    .s-card--purple { background: #f5f3ff; color: #6d28d9; border-color: #ede9fe; }
    .s-card--indigo { background: #eef2ff; color: #4338ca; border-color: #e0e7ff; }
    .s-card--blue   { background: #eff6ff; color: #2563eb; border-color: #dbeafe; }
    .s-card--orange { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
    .s-card--green  { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
    .s-card--amber  { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .s-card--teal   { background: #f0fdfa; color: #0f766e; border-color: #99f6e4; }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.875rem;
    }
    .loading-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 2rem; color: #64748b; }
    .spinner {
      width: 22px; height: 22px; border: 3px solid #e2e8f0;
      border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden;
    }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    th {
      padding: 0.65rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em;
      border-bottom: 1px solid #f1f5f9; background: #fafafa; white-space: nowrap;
    }
    td { padding: 0.7rem 1rem; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }

    .name-cell { font-weight: 600; color: #1e293b; max-width: 180px; }
    .muted { color: #94a3b8; font-size: 0.8rem; }
    .org-chip {
      background: #f5f3ff; color: #7c3aed; padding: 0.15rem 0.5rem;
      border-radius: 99px; font-size: 0.75rem; font-weight: 600;
    }

    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-plan     { background: #f5f3ff; color: #7c3aed; }
    .badge-active   { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }
    .badge-pending  { background: #fef3c7; color: #b45309; }

    .pill-green {
      background: #dcfce7; color: #15803d; padding: 0.15rem 0.5rem;
      border-radius: 99px; font-size: 0.75rem; font-weight: 700;
    }

    .rating { display: flex; align-items: center; gap: 0.2rem; font-weight: 600; font-size: 0.85rem; }
    .star { color: #f59e0b; }
    .empty-msg { text-align: center; color: #94a3b8; padding: 2rem !important; }

    .sla-wrap {
      display: flex; align-items: center; gap: 0.5rem; min-width: 90px;
    }
    .sla-track {
      flex: 1; max-width: 60px; height: 7px; border-radius: 99px; background: #e2e8f0; overflow: hidden;
    }
    .sla-fill {
      height: 100%; border-radius: 99px; transition: width 0.4s;
    }
    .sla-bad  { background: #ef4444; }
    .sla-ok   { background: #f59e0b; }
    .sla-good { background: #22c55e; }
    .sla-pct { font-size: 0.75rem; font-weight: 700; color: #475569; white-space: nowrap; }

    @media (max-width: 700px) {
      .summary-cards { gap: 0.5rem; }
      .s-card { min-width: 90px; }
    }
  `]
})
export class SaKpisComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  view: 'orgs' | 'talleres' = 'orgs';
  kpisOrgs: any[] = [];
  kpisTalleres: any[] = [];
  loading = false;
  error = '';

  ngOnInit(): void { this.loadOrgsKpis(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  switchView(v: 'orgs' | 'talleres'): void {
    this.view = v;
    if (v === 'orgs'     && this.kpisOrgs.length === 0)     this.loadOrgsKpis();
    if (v === 'talleres' && this.kpisTalleres.length === 0)  this.loadTalleresKpis();
  }

  reload(): void {
    if (this.view === 'orgs') { this.kpisOrgs = [];     this.loadOrgsKpis(); }
    else                      { this.kpisTalleres = []; this.loadTalleresKpis(); }
  }

  loadOrgsKpis(): void {
    this.loading = true; this.error = '';
    this.cdr.markForCheck();
    this.http.get<any>(`${environment.api.baseUrl}/api/superadmin/kpis/organizaciones`,
      { headers: this.headers() }).subscribe({
      next: (res) => {
        this.kpisOrgs = res.data ?? res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al cargar KPIs de organizaciones';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadTalleresKpis(): void {
    this.loading = true; this.error = '';
    this.cdr.markForCheck();
    this.http.get<any>(`${environment.api.baseUrl}/api/superadmin/kpis/talleres`,
      { headers: this.headers() }).subscribe({
      next: (res) => {
        this.kpisTalleres = res.data ?? res;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al cargar KPIs de talleres';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  sumOrgs(field: string): number {
    return this.kpisOrgs.reduce((acc, k) => acc + (Number(k[field]) || 0), 0);
  }
  avgOrgs(field: string): number {
    if (!this.kpisOrgs.length) return 0;
    return this.sumOrgs(field) / this.kpisOrgs.length;
  }
  sumTalleres(field: string): number {
    return this.kpisTalleres.reduce((acc, k) => acc + (Number(k[field]) || 0), 0);
  }
  avgTalleres(field: string): number | null {
    const vals = this.kpisTalleres.map(k => k[field]).filter(v => v != null && v > 0);
    if (!vals.length) return null;
    return vals.reduce((a: number, b: number) => a + b, 0) / vals.length;
  }
}
