import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { OrgReportesResponse, ReporteTaller } from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-reportes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Reportes Financieros</h1>
          <p class="page-sub">Ingresos y comisiones por taller</p>
        </div>
      </div>

      <!-- Filtros de periodo -->
      <div class="filter-card">
        <form [formGroup]="filtroForm" (ngSubmit)="cargar()" class="filter-row">
          <div class="field">
            <label>Desde</label>
            <input formControlName="fechaDesde" type="date"/>
          </div>
          <div class="field">
            <label>Hasta</label>
            <input formControlName="fechaHasta" type="date"/>
          </div>
          <button type="submit" class="btn-primary" [disabled]="loading">
            {{ loading ? 'Cargando...' : 'Aplicar' }}
          </button>
          <button type="button" class="btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
        </form>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner-lg"></div>
        <p>Cargando reporte...</p>
        <p class="loading-hint" *ngIf="showRetry">El servidor está despertando, puede tardar hasta 1 minuto</p>
        <button class="btn-retry" *ngIf="showRetry" (click)="reintentar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reintentar
        </button>
      </div>

      <ng-container *ngIf="!loading && reporte">
        <!-- Resumen global -->
        <div class="summary-cards">
          <div class="summary-card">
            <span class="s-label">Total Facturado (bruto)</span>
            <span class="s-value green">Bs. {{ reporte.resumen.total_ingresos | number:'1.2-2' }}</span>
          </div>
          <div class="summary-card">
            <span class="s-label">Comisiones Plataforma (10%)</span>
            <span class="s-value orange">Bs. {{ reporte.resumen.total_comisiones | number:'1.2-2' }}</span>
          </div>
          <div class="summary-card">
            <span class="s-label">Ingresos Talleres (90%)</span>
            <span class="s-value blue">Bs. {{ reporte.resumen.ingresos_netos | number:'1.2-2' }}</span>
          </div>
        </div>

        <!-- Tabla por taller -->
        <div class="table-wrap" *ngIf="reporte.por_taller.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th>Taller</th>
                <th class="num">Transacciones</th>
                <th class="num">Total Cobrado</th>
                <th class="num">Ing. Netos (90%)</th>
                <th class="num">Comisión</th>
                <th class="num">Calificación</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of reporte.por_taller">
                <td>
                  <div class="cell-taller">
                    <div class="taller-dot"></div>
                    {{ t.razon_social }}
                  </div>
                </td>
                <td class="num">{{ t.total_transacciones }}</td>
                <td class="num green-txt">Bs. {{ t.ingresos_brutos | number:'1.2-2' }}</td>
                <td class="num">Bs. {{ t.ingresos_talleres | number:'1.2-2' }}</td>
                <td class="num orange-txt">Bs. {{ t.comisiones | number:'1.2-2' }}</td>
                <td class="num">
                  <span class="rating">⭐ {{ t.calificacion_promedio | number:'1.1-1' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="reporte.por_taller.length === 0">
          <p>No hay transacciones en el período seleccionado</p>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }

    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .filter-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1rem 1.25rem; margin-bottom: 1.25rem;
    }

    .filter-row {
      display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap;
    }

    .field { display: flex; flex-direction: column; gap: 0.3rem; }
    .field label { font-size: 0.78rem; font-weight: 600; color: #475569; }
    .field input {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155;
    }
    .field input:focus { outline: none; border-color: #5cbdb9; }

    .btn-primary {
      padding: 0.55rem 1rem; background: #5cbdb9; color: white;
      border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #3aa7a2; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-secondary {
      padding: 0.55rem 1rem; background: #f1f5f9; color: #475569;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    .summary-cards {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .summary-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1.25rem; display: flex; flex-direction: column; gap: 0.4rem;
    }

    .s-label { font-size: 0.8rem; color: #64748b; font-weight: 600; }
    .s-value { font-size: 1.3rem; font-weight: 800; }
    .green   { color: #15803d; }
    .orange  { color: #c2410c; }
    .blue    { color: #1d4ed8; }

    .loading-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 1rem; gap: 1rem; color: #94a3b8;
    }

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

    .empty-state {
      display: flex; justify-content: center; padding: 3rem 1rem; color: #94a3b8;
      font-size: 0.95rem;
    }

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
    .data-table th.num { text-align: right; }

    .data-table td {
      padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem; color: #334155;
    }
    .data-table td.num { text-align: right; }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }

    .cell-taller { display: flex; align-items: center; gap: 0.6rem; }
    .taller-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #5cbdb9; flex-shrink: 0;
    }

    .green-txt { color: #15803d; font-weight: 600; }
    .orange-txt { color: #c2410c; }

    .rating { font-size: 0.82rem; color: #64748b; }

    @media (max-width: 768px) {
      .summary-cards { grid-template-columns: 1fr; }
      .data-table th:nth-child(4),
      .data-table td:nth-child(4),
      .data-table th:nth-child(6),
      .data-table td:nth-child(6) { display: none; }
    }
  `]
})
export class OrgReportesComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  reporte: OrgReportesResponse | null = null;
  loading = false;
  showRetry = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  filtroForm!: FormGroup;

  ngOnInit(): void {
    this.filtroForm = this.fb.group({ fechaDesde: [''], fechaHasta: [''] });
    this.cargar();
  }

  reintentar(): void { this.showRetry = false; this.cargar(); }

  cargar(): void {
    const orgId = this.authService.getAuthState().currentUser?.organizacion_id;
    if (!orgId) return;

    this.loading = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => { this.showRetry = true; this.cdr.markForCheck(); }, 8000);

    const { fechaDesde, fechaHasta } = this.filtroForm.value;

    this.orgService.getReportes(orgId, fechaDesde || undefined, fechaHasta || undefined)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = false;
          this.reporte = res;
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

  limpiarFiltros(): void {
    this.filtroForm.reset();
    this.cargar();
  }

  ngOnDestroy(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }
}
