import {
  Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { CalificacionService } from '../../../core/services/calificacion.service';
import {
  TallerResumen,
  CalificacionesTallerResponse,
  CalificacionItem,
} from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-calificaciones',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page">

    <!-- ── HEADER ──────────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Calificaciones y Valoraciones</h1>
        <p class="page-sub">Reseñas registradas por los clientes desde la aplicación móvil</p>
      </div>
    </div>

    <!-- ── SELECTOR DE TALLER ─────────────────────────────────────── -->
    <div class="selector-row">
      <label class="selector-label" for="tallerSel">Taller:</label>
      <select id="tallerSel" class="taller-select"
              [(ngModel)]="selectedTallerId"
              (ngModelChange)="onTallerChange($event)"
              [disabled]="talleres.length === 0">
        <option [ngValue]="null">— Selecciona un taller —</option>
        <option *ngFor="let t of talleres" [ngValue]="t.taller_id">{{ t.razon_social }}</option>
      </select>
    </div>

    <!-- ── ESTADO INICIAL ─────────────────────────────────────────── -->
    <div class="center-state" *ngIf="!selectedTallerId && !loading">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <p>Selecciona un taller para ver sus valoraciones</p>
    </div>

    <!-- ── LOADING ────────────────────────────────────────────────── -->
    <div class="center-state" *ngIf="loading">
      <div class="spinner"></div>
      <p>Cargando valoraciones…</p>
    </div>

    <!-- ── ERROR ──────────────────────────────────────────────────── -->
    <div class="center-state error" *ngIf="error && !loading">
      <p>{{ error }}</p>
    </div>

    <!-- ── CONTENIDO ─────────────────────────────────────────────── -->
    <ng-container *ngIf="data && !loading">

      <!-- Stats del taller -->
      <div class="stats-row">

        <div class="stat-card">
          <span class="stat-icon" style="background:#fefce8;color:#b45309">★</span>
          <div class="stat-body">
            <span class="stat-val">{{ data.promedio | number:'1.1-1' }}</span>
            <span class="stat-lbl">Calificación promedio</span>
          </div>
        </div>

        <div class="stat-card">
          <span class="stat-icon" style="background:#f0fdf4;color:#16a34a">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </span>
          <div class="stat-body">
            <span class="stat-val">{{ data.total }}</span>
            <span class="stat-lbl">Reseñas totales</span>
          </div>
        </div>

        <div class="stat-card" *ngIf="data.promedio_servicio > 0">
          <span class="stat-icon" style="background:#eff6ff;color:#3b82f6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          <div class="stat-body">
            <span class="stat-val">{{ data.promedio_servicio | number:'1.1-1' }}</span>
            <span class="stat-lbl">Promedio del servicio</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stars-large">
            <span *ngFor="let s of starsRange(5)"
                  [class.filled]="s <= roundedPromedio">★</span>
          </div>
          <div class="stat-body">
            <span class="stat-lbl" style="margin-top:0.25rem">
              {{ pctSatisfaccion | number:'1.0-0' }}% satisfacción
            </span>
          </div>
        </div>

      </div>

      <!-- Sin reseñas -->
      <div class="center-state" *ngIf="data.total === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <p>Este taller aún no tiene valoraciones registradas</p>
      </div>

      <!-- Lista de reseñas -->
      <div class="reviews-list" *ngIf="data.total > 0">

        <div class="review-card" *ngFor="let r of data.data">

          <div class="review-header">
            <div class="review-avatar">{{ r.cliente_nombre.charAt(0).toUpperCase() }}</div>
            <div class="review-meta">
              <span class="review-autor">{{ r.cliente_nombre }}</span>
              <span class="review-fecha">{{ r.fecha_calificacion | date:'d MMM y, HH:mm' }}</span>
            </div>
            <div class="review-stars">
              <span *ngFor="let s of starsRange(5)"
                    [class.star-filled]="s <= r.puntuacion"
                    [class.star-empty]="s > r.puntuacion">★</span>
              <span class="review-score">{{ r.puntuacion }}/5</span>
            </div>
          </div>

          <div class="review-body">
            <div class="review-tipo" *ngIf="r.tipo_problema">
              <span class="tipo-badge">{{ r.tipo_problema }}</span>
            </div>

            <div class="review-servicio" *ngIf="r.puntuacion_servicio">
              <span class="servicio-lbl">Calidad del servicio:</span>
              <span *ngFor="let s of starsRange(5)"
                    [class.star-filled]="s <= r.puntuacion_servicio"
                    [class.star-empty]="s > (r.puntuacion_servicio ?? 0)">★</span>
              <span class="review-score">{{ r.puntuacion_servicio }}/5</span>
            </div>

            <p class="review-comment" *ngIf="r.comentario">{{ r.comentario }}</p>
            <p class="review-no-comment" *ngIf="!r.comentario">Sin comentario adicional</p>
          </div>

        </div>

        <!-- Paginación -->
        <div class="pagination" *ngIf="data.total > pageSize">
          <button class="btn-page" [disabled]="currentPage === 0"
                  (click)="prevPage()">← Anterior</button>
          <span class="page-info">
            {{ currentPage * pageSize + 1 }}–{{ min((currentPage + 1) * pageSize, data.total) }}
            de {{ data.total }}
          </span>
          <button class="btn-page" [disabled]="(currentPage + 1) * pageSize >= data.total"
                  (click)="nextPage()">Siguiente →</button>
        </div>

      </div>

    </ng-container>

  </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .page {
      max-width: 900px;
      margin: 0 auto;
      padding: 0.25rem 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub   { font-size: 0.8rem; color: #94a3b8; margin: 0; }

    .selector-row {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.5rem;
    }
    .selector-label { font-size: 0.85rem; font-weight: 600; color: #475569; white-space: nowrap; }
    .taller-select {
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.9rem;
      font-size: 0.875rem; color: #0f172a; background: white; min-width: 280px;
      cursor: pointer; outline: none; transition: border-color 0.2s;
    }
    .taller-select:focus { border-color: #5cbdb9; }

    /* ── Stats ── */
    .stats-row {
      display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;
    }
    .stat-card {
      display: flex; align-items: center; gap: 0.75rem;
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 0.9rem 1.1rem; flex: 1; min-width: 150px;
    }
    .stat-icon {
      width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
    }
    .stat-icon svg { width: 18px; height: 18px; }
    .stat-body { display: flex; flex-direction: column; }
    .stat-val  { font-size: 1.35rem; font-weight: 800; color: #0f172a; line-height: 1; }
    .stat-lbl  { font-size: 0.7rem; color: #94a3b8; font-weight: 500; margin-top: 0.15rem; }

    .stars-large {
      font-size: 1.3rem; color: #d1d5db; letter-spacing: 2px;
    }
    .stars-large .filled { color: #f59e0b; }

    /* ── States ── */
    .center-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 3rem 1rem; gap: 0.75rem; color: #94a3b8;
    }
    .center-state.error { color: #ef4444; }
    .center-state svg { width: 40px; height: 40px; }
    .center-state p { font-size: 0.9rem; text-align: center; margin: 0; }

    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0;
      border-top-color: #5cbdb9; border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Reviews ── */
    .reviews-list {
      display: flex; flex-direction: column; gap: 1rem;
    }

    .review-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.1rem 1.25rem;
      transition: box-shadow 0.2s;
    }
    .review-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

    .review-header {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;
    }
    .review-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #5cbdb9, #3aa7a2);
      color: white; font-size: 0.85rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .review-meta { flex: 1; display: flex; flex-direction: column; }
    .review-autor { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .review-fecha { font-size: 0.72rem; color: #94a3b8; }

    .review-stars { display: flex; align-items: center; gap: 2px; font-size: 1rem; }
    .star-filled { color: #f59e0b; }
    .star-empty  { color: #d1d5db; }
    .review-score {
      font-size: 0.75rem; font-weight: 700; color: #475569;
      margin-left: 0.35rem;
    }

    .review-body { display: flex; flex-direction: column; gap: 0.4rem; }
    .review-tipo { display: flex; align-items: center; }
    .tipo-badge {
      font-size: 0.7rem; background: #eff6ff; color: #3b82f6;
      border-radius: 99px; padding: 0.15rem 0.6rem; font-weight: 600;
    }

    .review-servicio {
      display: flex; align-items: center; gap: 0.3rem;
      font-size: 0.8rem;
    }
    .servicio-lbl { color: #64748b; font-weight: 500; margin-right: 0.2rem; }

    .review-comment {
      font-size: 0.875rem; color: #334155; line-height: 1.55;
      background: #f8fafc; border-radius: 8px; padding: 0.65rem 0.85rem;
      margin: 0; border-left: 3px solid #5cbdb9;
    }
    .review-no-comment { font-size: 0.8rem; color: #cbd5e1; font-style: italic; margin: 0; }

    /* ── Pagination ── */
    .pagination {
      display: flex; align-items: center; justify-content: center;
      gap: 1rem; margin-top: 1rem; padding: 0.5rem 0;
    }
    .btn-page {
      background: white; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 0.45rem 1rem; font-size: 0.82rem; font-weight: 600;
      color: #475569; cursor: pointer; transition: all 0.2s;
    }
    .btn-page:hover:not(:disabled) { border-color: #5cbdb9; color: #5cbdb9; }
    .btn-page:disabled { opacity: 0.4; cursor: not-allowed; }
    .page-info { font-size: 0.82rem; color: #94a3b8; }

    @media (max-width: 600px) {
      .stats-row { flex-direction: column; }
      .stat-card { min-width: 0; }
    }
  `]
})
export class OrgCalificacionesComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private orgSvc  = inject(OrganizacionService);
  private calSvc  = inject(CalificacionService);
  private cdr     = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  loading  = false;
  error    = '';

  talleres:         TallerResumen[] = [];
  selectedTallerId: number | null   = null;
  data: CalificacionesTallerResponse | null = null;

  readonly pageSize = 10;
  currentPage = 0;
  orgId = 0;

  get roundedPromedio(): number {
    return Math.round(this.data?.promedio ?? 0);
  }

  get pctSatisfaccion(): number {
    return this.data ? (this.data.promedio / 5) * 100 : 0;
  }

  ngOnInit(): void {
    const user = this.auth.getAuthState().currentUser;
    this.orgId = user?.organizacion_id ?? 0;
    this.orgSvc.getTalleres(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: list => { this.talleres = list; this.cdr.markForCheck(); },
        error: () => {}
      });
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  onTallerChange(id: number | null): void {
    this.data         = null;
    this.currentPage  = 0;
    this.error        = '';
    if (!id) return;
    this.loadPage();
  }

  private loadPage(): void {
    if (!this.selectedTallerId) return;
    this.loading = true;
    this.cdr.markForCheck();

    this.calSvc.getCalificacionesTaller(
      this.selectedTallerId,
      this.pageSize,
      this.currentPage * this.pageSize,
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.data    = res;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.error   = err?.error?.detail ?? 'Error cargando calificaciones.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  prevPage(): void {
    if (this.currentPage > 0) { this.currentPage--; this.loadPage(); }
  }

  nextPage(): void {
    if (this.data && (this.currentPage + 1) * this.pageSize < this.data.total) {
      this.currentPage++;
      this.loadPage();
    }
  }

  starsRange(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i + 1);
  }

  min(a: number, b: number): number { return Math.min(a, b); }
}
