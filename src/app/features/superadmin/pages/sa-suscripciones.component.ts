import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-suscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-subs-page">

      <!-- ── HEADER ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Suscripciones SaaS</h1>
          <p class="page-subtitle">Monitoreo de planes activos en todas las organizaciones</p>
        </div>
        <button class="btn-refresh" (click)="load()" [disabled]="loading">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- ── KPI CARDS ── -->
      <div class="kpi-row" *ngIf="!loading && data.length > 0">
        <div class="kpi-card">
          <div class="kpi-icon kpi-total">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ data.length }}</div>
            <div class="kpi-label">Organizaciones</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ countByEstado('activa') }}</div>
            <div class="kpi-label">Suscripciones Activas</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-revenue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">\${{ totalRevenue() | number:'1.0-0' }}</div>
            <div class="kpi-label">Ingreso Mensual USD</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon kpi-plan">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div>
            <div class="kpi-value">{{ topPlan() }}</div>
            <div class="kpi-label">Plan Más Adoptado</div>
          </div>
        </div>
      </div>

      <!-- ── FILTERS ── -->
      <div class="filters-row">
        <input class="filter-input" type="text" [(ngModel)]="filtroNombre"
               placeholder="Buscar organización..." (input)="applyFilters()" />
        <select class="filter-select" [(ngModel)]="filtroPlan" (change)="applyFilters()">
          <option value="">Todos los planes</option>
          <option value="basico">Básico</option>
          <option value="profesional">Profesional</option>
          <option value="empresarial">Empresarial</option>
        </select>
        <select class="filter-select" [(ngModel)]="filtroEstado" (change)="applyFilters()">
          <option value="">Todos los estados</option>
          <option value="activa">Activa</option>
          <option value="cancelada">Cancelada</option>
          <option value="vencida">Vencida</option>
          <option value="pendiente">Pendiente</option>
        </select>
        <span class="filter-count">{{ filtered.length }} resultado{{ filtered.length !== 1 ? 's' : '' }}</span>
      </div>

      <!-- ── LOADING ── -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <span>Cargando suscripciones...</span>
      </div>

      <!-- ── ERROR ── -->
      <div class="error-banner" *ngIf="error && !loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ error }}
      </div>

      <!-- ── TABLE ── -->
      <div class="table-card" *ngIf="!loading && filtered.length > 0">
        <table class="subs-table">
          <thead>
            <tr>
              <th>Organización</th>
              <th>Plan</th>
              <th>Estado Susc.</th>
              <th>Monto / mes</th>
              <th>Método</th>
              <th>Renovación</th>
              <th>Talleres</th>
              <th>Técnicos</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered">
              <td>
                <div class="org-cell">
                  <div class="org-avatar">{{ row.nombre.charAt(0).toUpperCase() }}</div>
                  <div>
                    <div class="org-name">{{ row.nombre }}</div>
                    <div class="org-email">{{ row.email_contacto || '—' }}</div>
                  </div>
                </div>
              </td>
              <td>
                <span class="plan-badge" [style.background]="row.plan_color + '22'"
                      [style.color]="row.plan_color" [style.border-color]="row.plan_color + '55'">
                  {{ row.plan_nombre }}
                </span>
              </td>
              <td>
                <span class="estado-badge"
                      [class.est-active]="row.estado_suscripcion === 'activa'"
                      [class.est-canceled]="row.estado_suscripcion === 'cancelada'"
                      [class.est-expired]="row.estado_suscripcion === 'vencida'"
                      [class.est-pending]="row.estado_suscripcion === 'pendiente'">
                  <span class="est-dot"></span>
                  {{ estadoLabel(row.estado_suscripcion) }}
                </span>
              </td>
              <td class="td-amount">
                {{ row.monto_mensual > 0 ? ('$' + (row.monto_mensual | number:'1.2-2') + ' USD') : '—' }}
              </td>
              <td>
                <span class="method-tag"
                      [class.method-stripe]="row.metodo_pago === 'stripe'"
                      [class.method-demo]="row.metodo_pago === 'demo'">
                  {{ row.metodo_pago === 'stripe' ? 'Stripe' : (row.metodo_pago === 'demo' ? 'Demo' : '—') }}
                </span>
              </td>
              <td class="td-date">
                {{ row.fecha_renovacion ? (row.fecha_renovacion | date:'dd/MM/yyyy') : '—' }}
              </td>
              <td class="td-num">{{ row.total_talleres }}</td>
              <td class="td-num">{{ row.total_tecnicos }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- EMPTY STATE -->
      <div class="empty-state" *ngIf="!loading && filtered.length === 0 && !error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        <p>No se encontraron suscripciones con los filtros aplicados</p>
      </div>

      <!-- ── DISTRIBUTION CHART (visual bars) ── -->
      <div class="dist-section" *ngIf="!loading && data.length > 0">
        <h2 class="section-title">Distribución por Plan</h2>
        <div class="dist-grid">
          <div class="dist-card" *ngFor="let plan of planStats">
            <div class="dist-header">
              <span class="dist-pill" [style.background]="plan.color + '22'"
                    [style.color]="plan.color">{{ plan.nombre }}</span>
              <span class="dist-count">{{ plan.count }} org{{ plan.count !== 1 ? 's' : '' }}</span>
            </div>
            <div class="dist-bar-track">
              <div class="dist-bar-fill"
                   [style.width]="(data.length > 0 ? (plan.count / data.length * 100) : 0) + '%'"
                   [style.background]="plan.color">
              </div>
            </div>
            <div class="dist-revenue">\${{ plan.revenue | number:'1.0-0' }} USD/mes</div>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .sa-subs-page {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── HEADER ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem; }
    .page-subtitle { margin: 0; color: #64748b; font-size: 0.875rem; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #6d28d9; color: white; border: none; border-radius: 8px;
      padding: 0.6rem 1.1rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-refresh svg { width: 15px; height: 15px; }
    .btn-refresh:hover:not(:disabled) { background: #5b21b6; }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── KPI ── */
    .kpi-row {
      display: grid; grid-template-columns: repeat(4, 1fr);
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .kpi-card {
      background: white; border-radius: 12px; padding: 1rem 1.25rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      display: flex; align-items: center; gap: 0.9rem;
    }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 20px; height: 20px; }
    .kpi-total   { background: #ede9fe; color: #7c3aed; }
    .kpi-total   svg { stroke: #7c3aed; }
    .kpi-active  { background: #dcfce7; color: #16a34a; }
    .kpi-active  svg { stroke: #16a34a; }
    .kpi-revenue { background: #fef3c7; color: #d97706; }
    .kpi-revenue svg { stroke: #d97706; }
    .kpi-plan    { background: #f0fdfa; color: #0d9488; }
    .kpi-plan    svg { stroke: #0d9488; }
    .kpi-value   { font-size: 1.4rem; font-weight: 800; color: #0f172a; }
    .kpi-label   { font-size: 0.78rem; color: #94a3b8; font-weight: 500; }

    /* ── FILTERS ── */
    .filters-row {
      display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center;
    }
    .filter-input, .filter-select {
      padding: 0.55rem 0.85rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; background: white; outline: none;
      transition: border-color 0.2s; color: #374151;
    }
    .filter-input { min-width: 200px; flex: 1; }
    .filter-select { min-width: 150px; }
    .filter-input:focus, .filter-select:focus { border-color: #7c3aed; }
    .filter-count { font-size: 0.82rem; color: #94a3b8; white-space: nowrap; margin-left: auto; }

    /* ── LOADING / ERROR ── */
    .loading-state {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 3rem; justify-content: center; color: #64748b;
    }
    .spinner {
      width: 24px; height: 24px; border: 3px solid #e2e8f0;
      border-top-color: #7c3aed; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .error-banner {
      display: flex; align-items: center; gap: 0.6rem;
      background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b;
      border-radius: 10px; padding: 1rem; margin-bottom: 1rem; font-size: 0.9rem;
    }
    .error-banner svg { width: 18px; height: 18px; flex-shrink: 0; }

    /* ── TABLE ── */
    .table-card {
      background: white; border-radius: 14px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07); overflow: hidden; margin-bottom: 1.5rem;
    }
    .subs-table { width: 100%; border-collapse: collapse; }
    .subs-table th {
      background: #f8fafc; padding: 0.75rem 1rem; text-align: left;
      font-size: 0.75rem; font-weight: 700; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 0.05em;
      border-bottom: 1px solid #f1f5f9;
    }
    .subs-table td {
      padding: 0.85rem 1rem; border-bottom: 1px solid #f8fafc;
      font-size: 0.875rem; vertical-align: middle;
    }
    .subs-table tr:last-child td { border-bottom: none; }
    .subs-table tr:hover td { background: #fafafa; }

    .org-cell { display: flex; align-items: center; gap: 0.65rem; }
    .org-avatar {
      width: 34px; height: 34px; border-radius: 8px;
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      color: white; font-size: 0.85rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .org-name  { font-weight: 600; color: #1e293b; font-size: 0.875rem; }
    .org-email { font-size: 0.78rem; color: #94a3b8; margin-top: 1px; }

    .plan-badge {
      display: inline-block; padding: 0.25rem 0.65rem; border-radius: 99px;
      font-size: 0.78rem; font-weight: 700; border: 1.5px solid;
    }

    .estado-badge {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.25rem 0.65rem; border-radius: 99px;
      font-size: 0.78rem; font-weight: 600;
    }
    .est-dot {
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    }
    .est-active   { background: #dcfce7; color: #16a34a; }
    .est-active .est-dot   { background: #22c55e; }
    .est-canceled { background: #fee2e2; color: #dc2626; }
    .est-canceled .est-dot { background: #ef4444; }
    .est-expired  { background: #fef3c7; color: #d97706; }
    .est-expired .est-dot  { background: #f59e0b; }
    .est-pending  { background: #f0f9ff; color: #0369a1; }
    .est-pending .est-dot  { background: #38bdf8; }

    .td-amount { font-weight: 600; color: #059669; }
    .td-date   { color: #64748b; font-size: 0.82rem; }
    .td-num    { text-align: center; font-weight: 600; color: #374151; }

    .method-tag {
      padding: 0.2rem 0.5rem; border-radius: 6px;
      font-size: 0.75rem; font-weight: 600;
    }
    .method-stripe { background: #635bff22; color: #635bff; }
    .method-demo   { background: #f1f5f9; color: #64748b; }

    /* ── EMPTY ── */
    .empty-state {
      text-align: center; padding: 3rem; color: #94a3b8;
    }
    .empty-state svg { width: 48px; height: 48px; margin-bottom: 0.75rem; }
    .empty-state p { font-size: 0.9rem; margin: 0; }

    /* ── DISTRIBUTION ── */
    .dist-section { margin-top: 0.5rem; }
    .section-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem; }

    .dist-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
    }
    .dist-card {
      background: white; border-radius: 12px; padding: 1.1rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
    }
    .dist-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.65rem; }
    .dist-pill {
      padding: 0.25rem 0.7rem; border-radius: 99px;
      font-size: 0.8rem; font-weight: 700;
    }
    .dist-count { font-size: 0.85rem; font-weight: 600; color: #0f172a; }

    .dist-bar-track {
      height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
    }
    .dist-bar-fill {
      height: 100%; border-radius: 99px; transition: width 0.5s ease;
      min-width: 0;
    }
    .dist-revenue { margin-top: 0.5rem; font-size: 0.82rem; color: #64748b; }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .kpi-row { grid-template-columns: repeat(2, 1fr); }
      .dist-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .kpi-row { grid-template-columns: 1fr 1fr; }
      .subs-table { display: block; overflow-x: auto; }
    }
  `]
})
export class SaSuscripcionesComponent implements OnInit {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private cdr  = inject(ChangeDetectorRef);

  private baseUrl = environment.api.baseUrl;

  loading = true;
  error   = '';

  data:     any[] = [];
  filtered: any[] = [];

  filtroNombre = '';
  filtroPlan   = '';
  filtroEstado = '';

  planStats: { nombre: string; codigo: string; color: string; count: number; revenue: number }[] = [];

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error   = '';

    this.http.get<any>(`${this.baseUrl}/api/suscripciones/admin/todas`,
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        this.data    = res.data || [];
        this.loading = false;
        this.applyFilters();
        this.calcPlanStats();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error   = err.error?.detail || 'Error al cargar las suscripciones';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  applyFilters(): void {
    const nombre = this.filtroNombre.toLowerCase();
    this.filtered = this.data.filter(r => {
      const matchNombre = !nombre || r.nombre.toLowerCase().includes(nombre);
      const matchPlan   = !this.filtroPlan   || r.plan_codigo === this.filtroPlan;
      const matchEstado = !this.filtroEstado || r.estado_suscripcion === this.filtroEstado;
      return matchNombre && matchPlan && matchEstado;
    });
  }

  calcPlanStats(): void {
    const plans = [
      { nombre: 'Básico',       codigo: 'basico',      color: '#3b82f6' },
      { nombre: 'Profesional',  codigo: 'profesional', color: '#7c3aed' },
      { nombre: 'Empresarial',  codigo: 'empresarial', color: '#059669' },
    ];
    this.planStats = plans.map(p => ({
      ...p,
      count:   this.data.filter(r => r.plan_codigo === p.codigo).length,
      revenue: this.data.filter(r => r.plan_codigo === p.codigo && r.estado_suscripcion === 'activa')
                        .reduce((s, r) => s + (r.monto_mensual || 0), 0),
    }));
  }

  countByEstado(estado: string): number {
    return this.data.filter(r => r.estado_suscripcion === estado).length;
  }

  totalRevenue(): number {
    return this.data
      .filter(r => r.estado_suscripcion === 'activa')
      .reduce((s, r) => s + (r.monto_mensual || 0), 0);
  }

  topPlan(): string {
    if (!this.planStats.length) return '—';
    const top = [...this.planStats].sort((a, b) => b.count - a.count)[0];
    return top.count > 0 ? top.nombre : '—';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      activa:    'Activa',
      cancelada: 'Cancelada',
      vencida:   'Vencida',
      pendiente: 'Pendiente',
    };
    return map[estado] || estado;
  }
}
