import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { OrgIncidente } from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-incidentes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Incidentes</h1>
          <p class="page-sub">Seguimiento de emergencias en toda la organización</p>
        </div>
        <div class="filters">
          <select class="filter-select" [(ngModel)]="filtroEstado" (change)="aplicarFiltro()" [ngModelOptions]="{standalone: true}">
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="asignado">Asignado</option>
            <option value="en_camino">En camino</option>
            <option value="en_servicio">En servicio</option>
            <option value="atendido">Atendido</option>
          </select>
        </div>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner-lg"></div>
        <p>Cargando incidentes...</p>
        <p class="loading-hint" *ngIf="showRetry">El servidor está despertando, puede tardar hasta 1 minuto</p>
        <button class="btn-retry" *ngIf="showRetry" (click)="reintentar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reintentar
        </button>
      </div>

      <div class="empty-state" *ngIf="!loading && incidentes.length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        </svg>
        <p>No hay incidentes{{ filtroEstado ? ' con este estado' : '' }}</p>
      </div>

      <div class="info-bar" *ngIf="!loading && total > 0">
        Mostrando {{ incidentes.length }} de {{ total }} incidentes
      </div>

      <div class="table-wrap" *ngIf="!loading && incidentes.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Cliente</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Taller</th>
              <th>Técnico</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let inc of incidentes">
              <td class="cell-id">#{{ inc.incidente_id }}</td>
              <td>{{ inc.cliente_nombre }}</td>
              <td class="cell-muted">{{ inc.tipo_problema || '—' }}</td>
              <td>
                <span class="estado-badge estado-{{ inc.estado_incidente }}">
                  {{ inc.estado_incidente | titlecase }}
                </span>
              </td>
              <td class="cell-muted">{{ inc.taller_nombre || '—' }}</td>
              <td class="cell-muted">{{ inc.tecnico_nombre || '—' }}</td>
              <td class="cell-muted">{{ inc.fecha_creacion | date:'dd/MM/yy' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination" *ngIf="!loading && total > limit">
        <button class="page-btn" [disabled]="offset === 0" (click)="paginar(-1)">← Anterior</button>
        <span class="page-info">Pág. {{ currentPage + 1 }} / {{ totalPages }}</span>
        <button class="page-btn" [disabled]="offset + limit >= total" (click)="paginar(1)">Siguiente →</button>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.25rem; gap: 1rem; flex-wrap: wrap;
    }

    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .filter-select {
      padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white; cursor: pointer;
    }
    .filter-select:focus { outline: none; border-color: #5cbdb9; }

    .info-bar {
      font-size: 0.82rem; color: #94a3b8; margin-bottom: 0.75rem;
    }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 1rem; gap: 1rem; color: #94a3b8;
    }
    .empty-state svg { width: 48px; height: 48px; }
    .empty-state p { font-size: 0.95rem; margin: 0; }

    .spinner-lg {
      width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-hint { font-size: 0.78rem; color: #94a3b8; text-align: center; margin: 0; }
    .btn-retry {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem; background: white; border: 1.5px solid #5cbdb9;
      border-radius: 8px; color: #5cbdb9; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s; margin-top: 0.25rem;
    }
    .btn-retry svg { width: 14px; height: 14px; }
    .btn-retry:hover { background: #5cbdb9; color: white; }

    .table-wrap {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
    }

    .data-table { width: 100%; border-collapse: collapse; }

    .data-table th {
      background: #f8fafc; padding: 0.75rem 1rem;
      font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; color: #64748b; text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.8rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem; color: #334155;
    }

    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }

    .cell-muted { color: #94a3b8; }
    .cell-id { font-weight: 700; color: #64748b; }

    .estado-badge {
      padding: 0.2rem 0.6rem; border-radius: 99px;
      font-size: 0.74rem; font-weight: 600;
    }
    .estado-pendiente  { background: #fef9c3; color: #854d0e; }
    .estado-asignado   { background: #dbeafe; color: #1d4ed8; }
    .estado-en_camino  { background: #e0f2fe; color: #0369a1; }
    .estado-en_servicio{ background: #ede9fe; color: #7c3aed; }
    .estado-atendido   { background: #dcfce7; color: #15803d; }

    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 1rem; margin-top: 1rem;
    }

    .page-btn {
      padding: 0.45rem 0.9rem; background: white; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: #334155;
      cursor: pointer; transition: all 0.18s;
    }
    .page-btn:hover:not(:disabled) { border-color: #5cbdb9; color: #5cbdb9; }
    .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .page-info { font-size: 0.85rem; color: #64748b; }

    @media (max-width: 640px) {
      .data-table th:nth-child(5),
      .data-table td:nth-child(5),
      .data-table th:nth-child(6),
      .data-table td:nth-child(6) { display: none; }
    }
  `]
})
export class OrgIncidentesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  incidentes: OrgIncidente[] = [];
  loading = true;
  showRetry = false;
  total = 0;
  limit = 50;
  offset = 0;
  filtroEstado = '';
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  get currentPage(): number { return Math.floor(this.offset / this.limit); }
  get totalPages(): number { return Math.ceil(this.total / this.limit); }

  ngOnInit(): void { this.cargar(); }
  aplicarFiltro(): void { this.offset = 0; this.cargar(); }
  reintentar(): void { this.showRetry = false; this.cargar(); }

  paginar(dir: 1 | -1): void {
    this.offset = Math.max(0, this.offset + dir * this.limit);
    this.cargar();
  }

  private cargar(): void {
    const orgId = this.authService.getAuthState().currentUser?.organizacion_id;
    if (!orgId) { this.loading = false; return; }

    this.loading = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => { this.showRetry = true; this.cdr.markForCheck(); }, 8000);

    this.orgService.getIncidentes(orgId, this.filtroEstado || undefined, this.limit, this.offset)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = false;
          this.incidentes = res.data;
          this.total = res.total;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = true;
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnDestroy(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
