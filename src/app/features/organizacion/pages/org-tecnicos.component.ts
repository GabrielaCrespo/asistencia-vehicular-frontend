import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { OrgTecnico } from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-tecnicos',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Técnicos</h1>
          <p class="page-sub">Vista consolidada de todos los técnicos de la organización</p>
        </div>
        <div class="badge-total" *ngIf="!loading">
          {{ tecnicos.length }} técnicos en total
        </div>
      </div>

      <div class="loading-state" *ngIf="loading">
        <div class="spinner-lg"></div>
        <p>Cargando técnicos...</p>
        <p class="loading-hint" *ngIf="showRetry">El servidor está despertando, puede tardar hasta 1 minuto</p>
        <button class="btn-retry" *ngIf="showRetry" (click)="reintentar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reintentar
        </button>
      </div>

      <div class="empty-state" *ngIf="!loading && tecnicos.length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
        </svg>
        <p>No hay técnicos registrados</p>
      </div>

      <div class="table-wrap" *ngIf="!loading && tecnicos.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th>Técnico</th>
              <th>Especialidad</th>
              <th>Taller</th>
              <th>Estado</th>
              <th>Última ubicación</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tecnicos">
              <td>
                <div class="cell-person">
                  <div class="avatar">{{ t.tecnico_nombre.charAt(0) }}</div>
                  <span>{{ t.tecnico_nombre }}</span>
                </div>
              </td>
              <td class="cell-muted">{{ t.especialidad || '—' }}</td>
              <td>
                <span class="chip-taller">{{ t.taller_nombre }}</span>
              </td>
              <td>
                <span class="badge" [class.badge-green]="t.disponible" [class.badge-gray]="!t.disponible">
                  {{ t.disponible ? 'Disponible' : 'Ocupado' }}
                </span>
              </td>
              <td class="cell-muted">
                {{ t.fecha_ultima_ubicacion ? (t.fecha_ultima_ubicacion | date:'dd/MM/yy HH:mm') : '—' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
    }

    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .badge-total {
      background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe;
      padding: 0.4rem 0.85rem; border-radius: 8px; font-size: 0.82rem; font-weight: 600;
      white-space: nowrap; align-self: flex-start;
    }

    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 1rem; gap: 1rem; color: #94a3b8;
    }
    .empty-state svg { width: 48px; height: 48px; }
    .empty-state p { font-size: 0.95rem; margin: 0; }

    .spinner-lg {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: #5cbdb9;
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
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      overflow: hidden;
    }

    .data-table { width: 100%; border-collapse: collapse; }

    .data-table th {
      background: #f8fafc; padding: 0.75rem 1rem;
      font-size: 0.78rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em; color: #64748b; text-align: left;
      border-bottom: 1px solid #e2e8f0;
    }

    .data-table td {
      padding: 0.85rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem; color: #334155; vertical-align: middle;
    }

    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }

    .cell-muted { color: #94a3b8; }

    .cell-person { display: flex; align-items: center; gap: 0.6rem; }

    .avatar {
      width: 30px; height: 30px; border-radius: 50%;
      background: #e0f2fe; color: #0284c7;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.78rem; font-weight: 700; flex-shrink: 0;
    }

    .chip-taller {
      background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;
      padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.78rem; font-weight: 600;
    }

    .badge { padding: 0.2rem 0.6rem; border-radius: 99px; font-size: 0.75rem; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-gray  { background: #f1f5f9; color: #64748b; }

    @media (max-width: 640px) {
      .data-table th:nth-child(4),
      .data-table td:nth-child(4),
      .data-table th:nth-child(5),
      .data-table td:nth-child(5) { display: none; }
    }
  `]
})
export class OrgTecnicosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  tecnicos: OrgTecnico[] = [];
  loading = true;
  showRetry = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void { this.cargar(); }

  reintentar(): void { this.showRetry = false; this.cargar(); }

  private cargar(): void {
    const orgId = this.authService.getAuthState().currentUser?.organizacion_id;
    if (!orgId) { this.loading = false; return; }

    this.loading = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => { this.showRetry = true; this.cdr.markForCheck(); }, 8000);

    this.orgService.getTecnicos(orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = false;
          this.tecnicos = res.data ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = true;
          this.tecnicos = [];
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
