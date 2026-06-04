import {
  Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { AnaliticaGlobal, AnaliticaTaller, TallerResumen } from '../../../core/models/organizacion.models';

const NO_DATA = 'No existen datos suficientes para calcular este KPI.';

@Component({
  selector: 'app-org-analitica',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page">

    <!-- ── HEADER ──────────────────────────────────────────────────── -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Analítica Operacional</h1>
        <p class="page-sub">KPIs calculados en tiempo real desde la base de datos</p>
      </div>
      <button class="btn-refresh" (click)="reload()" [disabled]="loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             [class.spin]="loading">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Actualizar
      </button>
    </div>

    <!-- ── LOADING ─────────────────────────────────────────────────── -->
    <div class="center-state" *ngIf="loading">
      <div class="spinner"></div>
      <p>Calculando KPIs…</p>
    </div>

    <!-- ── ERROR ───────────────────────────────────────────────────── -->
    <div class="center-state error" *ngIf="error && !loading">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
    </div>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- SECCIÓN 1 – RESUMEN GLOBAL DEL TENANT                        -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <ng-container *ngIf="global && !loading">

      <h2 class="section-title">
        <span class="section-dot" style="background:#5cbdb9"></span>
        Resumen global del tenant
      </h2>

      <!-- KPI Cards -->
      <div class="kpi-grid">

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#eff6ff;color:#3b82f6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val">{{ totalEmergencias }}</span>
            <span class="kpi-lbl">Emergencias totales</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#f0fdf4;color:#16a34a">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val" *ngIf="global.tiempos.promedio_asignacion_min !== null">
              {{ global.tiempos.promedio_asignacion_min | number:'1.1-1' }} min
            </span>
            <span class="kpi-val no-data" *ngIf="global.tiempos.promedio_asignacion_min === null">—</span>
            <span class="kpi-lbl">T. promedio asignación</span>
            <span class="kpi-hint" *ngIf="global.tiempos.promedio_asignacion_min === null">{{ noDataMsg }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fff7ed;color:#ea580c">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val" *ngIf="global.tiempos.promedio_llegada_min !== null">
              {{ global.tiempos.promedio_llegada_min | number:'1.1-1' }} min
            </span>
            <span class="kpi-val no-data" *ngIf="global.tiempos.promedio_llegada_min === null">—</span>
            <span class="kpi-lbl">T. promedio llegada</span>
            <span class="kpi-hint" *ngIf="global.tiempos.promedio_llegada_min === null">{{ noDataMsg }}</span>
          </div>
        </div>

        <div class="kpi-card" [class.kpi-good]="slaOk" [class.kpi-bad]="!slaOk && global.sla_cumplimiento_pct !== null">
          <div class="kpi-icon" [style.background]="slaOk ? '#f0fdf4' : '#fef2f2'"
               [style.color]="slaOk ? '#15803d' : '#dc2626'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val" *ngIf="global.sla_cumplimiento_pct !== null"
                  [class.green]="slaOk" [class.red]="!slaOk">
              {{ global.sla_cumplimiento_pct | number:'1.1-1' }}%
            </span>
            <span class="kpi-val no-data" *ngIf="global.sla_cumplimiento_pct === null">—</span>
            <span class="kpi-lbl">SLA cumplido (≤15 min)</span>
            <span class="kpi-hint" *ngIf="global.sla_cumplimiento_pct === null">{{ noDataMsg }}</span>
          </div>
        </div>

        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fef2f2;color:#dc2626">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <div class="kpi-data">
            <span class="kpi-val red">{{ global.casos_cancelados }}</span>
            <span class="kpi-lbl">Casos cancelados</span>
          </div>
        </div>

      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- SECCIÓN 2 – GRÁFICOS                                      -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <h2 class="section-title" style="margin-top:2rem">
        <span class="section-dot" style="background:#7c3aed"></span>
        Distribución y tendencias
      </h2>

      <div class="charts-grid">

        <!-- Incidentes por tipo -->
        <div class="chart-card">
          <h3 class="chart-title">Incidentes por tipo</h3>
          <ng-container *ngIf="global.incidentes_por_tipo.length > 0; else noChart">
            <div class="bar-list">
              <div class="bar-row" *ngFor="let row of global.incidentes_por_tipo">
                <span class="bar-label">{{ row.tipo }}</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="barPct(row.cantidad, maxPorTipo)"
                       style="background:#5cbdb9"></div>
                </div>
                <span class="bar-count">{{ row.cantidad }}</span>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Zonas con más incidentes -->
        <div class="chart-card">
          <h3 class="chart-title">Zonas con más incidentes</h3>
          <ng-container *ngIf="global.zonas_top.length > 0; else noChart">
            <div class="bar-list">
              <div class="bar-row" *ngFor="let z of global.zonas_top; let i = index">
                <span class="bar-label">Zona {{ i + 1 }} ({{ z.lat }}, {{ z.lng }})</span>
                <div class="bar-track">
                  <div class="bar-fill" [style.width.%]="barPct(z.cantidad, global.zonas_top[0].cantidad)"
                       style="background:#7c3aed"></div>
                </div>
                <span class="bar-count">{{ z.cantidad }}</span>
              </div>
            </div>
          </ng-container>
        </div>

        <!-- Ranking de talleres más eficientes -->
        <div class="chart-card chart-wide">
          <h3 class="chart-title">Ranking de talleres más eficientes</h3>
          <ng-container *ngIf="global.ranking_talleres.length > 0; else noChart">
            <div class="ranking-table">
              <div class="rank-header">
                <span>#</span>
                <span>Taller</span>
                <span>Score</span>
                <span>Completados</span>
                <span>Calificación</span>
                <span>T. asign.</span>
              </div>
              <div class="rank-row" *ngFor="let t of global.ranking_talleres; let i = index"
                   [class.rank-top]="i === 0">
                <span class="rank-pos">
                  <ng-container *ngIf="i === 0">🥇</ng-container>
                  <ng-container *ngIf="i === 1">🥈</ng-container>
                  <ng-container *ngIf="i === 2">🥉</ng-container>
                  <ng-container *ngIf="i > 2">{{ i + 1 }}</ng-container>
                </span>
                <span class="rank-nombre">{{ t.nombre }}</span>
                <span>
                  <div class="score-bar-wrap">
                    <div class="score-bar" [style.width.%]="t.score"
                         [style.background]="scoreColor(t.score)"></div>
                    <span class="score-lbl">{{ t.score | number:'1.1-1' }}%</span>
                  </div>
                </span>
                <span>{{ t.completados }} / {{ t.total }}</span>
                <span>
                  <span class="star-badge">★ {{ t.calificacion | number:'1.1-1' }}</span>
                </span>
                <span>
                  <ng-container *ngIf="t.tiempo_prom_asignacion_min > 0">
                    {{ t.tiempo_prom_asignacion_min | number:'1.1-1' }} min
                  </ng-container>
                  <ng-container *ngIf="t.tiempo_prom_asignacion_min === 0">—</ng-container>
                </span>
              </div>
            </div>
          </ng-container>
        </div>

      </div>

    </ng-container>

    <!-- ══════════════════════════════════════════════════════════════ -->
    <!-- SECCIÓN 3 – ANÁLISIS POR TALLER                              -->
    <!-- ══════════════════════════════════════════════════════════════ -->
    <div class="taller-section">
      <h2 class="section-title" style="margin-top:2rem">
        <span class="section-dot" style="background:#ea580c"></span>
        Análisis por taller
      </h2>

      <!-- Selector -->
      <div class="selector-row">
        <label class="selector-label" for="tallerSel">Seleccionar taller:</label>
        <select id="tallerSel" class="taller-select" [(ngModel)]="selectedTallerId"
                (ngModelChange)="onTallerChange($event)" [disabled]="talleres.length === 0">
          <option [ngValue]="null">— Elige un taller —</option>
          <option *ngFor="let t of talleres" [ngValue]="t.taller_id">{{ t.razon_social }}</option>
        </select>
      </div>

      <!-- Loading taller -->
      <div class="center-state" *ngIf="loadingTaller">
        <div class="spinner"></div>
        <p>Cargando KPIs del taller…</p>
      </div>

      <!-- Error taller -->
      <div class="center-state error" *ngIf="errorTaller && !loadingTaller">
        <p>{{ errorTaller }}</p>
      </div>

      <!-- KPIs del taller seleccionado -->
      <ng-container *ngIf="tallerData && !loadingTaller">

        <div class="taller-header-banner">
          <h3>{{ tallerData.taller_nombre }}</h3>
          <span class="taller-badge">{{ tallerData.total_emergencias }} emergencias atendidas</span>
        </div>

        <!-- KPI Cards taller -->
        <div class="kpi-grid">

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#eff6ff;color:#3b82f6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-val">{{ tallerData.total_emergencias }}</span>
              <span class="kpi-lbl">Total emergencias</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#f0fdf4;color:#16a34a">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-val" *ngIf="tallerData.tiempos.promedio_asignacion_min !== null">
                {{ tallerData.tiempos.promedio_asignacion_min | number:'1.1-1' }} min
              </span>
              <span class="kpi-val no-data" *ngIf="tallerData.tiempos.promedio_asignacion_min === null">—</span>
              <span class="kpi-lbl">T. asignación</span>
              <span class="kpi-hint" *ngIf="tallerData.tiempos.promedio_asignacion_min === null">{{ noDataMsg }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#fff7ed;color:#ea580c">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
              </svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-val" *ngIf="tallerData.tiempos.promedio_llegada_min !== null">
                {{ tallerData.tiempos.promedio_llegada_min | number:'1.1-1' }} min
              </span>
              <span class="kpi-val no-data" *ngIf="tallerData.tiempos.promedio_llegada_min === null">—</span>
              <span class="kpi-lbl">T. llegada</span>
              <span class="kpi-hint" *ngIf="tallerData.tiempos.promedio_llegada_min === null">{{ noDataMsg }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#f5f3ff;color:#7c3aed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <polyline points="9 11 12 14 22 4"/>
              </svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-val" *ngIf="tallerData.tiempos.promedio_resolucion_min !== null">
                {{ tallerData.tiempos.promedio_resolucion_min | number:'1.1-1' }} min
              </span>
              <span class="kpi-val no-data" *ngIf="tallerData.tiempos.promedio_resolucion_min === null">—</span>
              <span class="kpi-lbl">T. resolución</span>
              <span class="kpi-hint" *ngIf="tallerData.tiempos.promedio_resolucion_min === null">{{ noDataMsg }}</span>
            </div>
          </div>

          <div class="kpi-card" [class.kpi-good]="tallerSlaOk"
               [class.kpi-bad]="!tallerSlaOk && tallerData.sla_cumplimiento_pct !== null">
            <div class="kpi-icon"
                 [style.background]="tallerSlaOk ? '#f0fdf4' : '#fef2f2'"
                 [style.color]="tallerSlaOk ? '#15803d' : '#dc2626'">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-val" *ngIf="tallerData.sla_cumplimiento_pct !== null"
                    [class.green]="tallerSlaOk" [class.red]="!tallerSlaOk">
                {{ tallerData.sla_cumplimiento_pct | number:'1.1-1' }}%
              </span>
              <span class="kpi-val no-data" *ngIf="tallerData.sla_cumplimiento_pct === null">—</span>
              <span class="kpi-lbl">SLA cumplido</span>
              <span class="kpi-hint" *ngIf="tallerData.sla_cumplimiento_pct === null">{{ noDataMsg }}</span>
            </div>
          </div>

          <div class="kpi-card">
            <div class="kpi-icon" style="background:#fef2f2;color:#dc2626">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="kpi-data">
              <span class="kpi-val red">{{ tallerData.casos_cancelados }}</span>
              <span class="kpi-lbl">Casos cancelados</span>
            </div>
          </div>

        </div>

        <!-- Charts taller -->
        <div class="charts-grid" style="margin-top:1.25rem">

          <!-- Incidentes por tipo del taller -->
          <div class="chart-card">
            <h3 class="chart-title">Incidentes por tipo</h3>
            <ng-container *ngIf="tallerData.incidentes_por_tipo.length > 0; else noChart">
              <div class="bar-list">
                <div class="bar-row" *ngFor="let row of tallerData.incidentes_por_tipo">
                  <span class="bar-label">{{ row.tipo }}</span>
                  <div class="bar-track">
                    <div class="bar-fill"
                         [style.width.%]="barPct(row.cantidad, maxTipoTaller)"
                         style="background:#ea580c"></div>
                  </div>
                  <span class="bar-count">{{ row.cantidad }}</span>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Rendimiento mensual -->
          <div class="chart-card">
            <h3 class="chart-title">Rendimiento mensual (últimos 12 meses)</h3>
            <ng-container *ngIf="tallerData.rendimiento_mensual.length > 0; else noChart">
              <div class="month-chart">
                <div class="month-col" *ngFor="let m of tallerData.rendimiento_mensual">
                  <div class="month-bars">
                    <div class="month-bar total"
                         [style.height.%]="barPct(m.total, maxMensual)"></div>
                    <div class="month-bar comp"
                         [style.height.%]="barPct(m.completados, maxMensual)"></div>
                  </div>
                  <span class="month-lbl">{{ m.mes_nombre }}</span>
                  <span class="month-val">{{ m.total }}</span>
                </div>
              </div>
              <div class="month-legend">
                <span class="legend-dot" style="background:#94a3b8"></span> Total
                <span class="legend-dot" style="background:#5cbdb9; margin-left:1rem"></span> Completados
              </div>
            </ng-container>
          </div>

          <!-- Comparación vs tenant -->
          <div class="chart-card chart-wide">
            <h3 class="chart-title">Comparación vs promedio del tenant</h3>
            <div class="comparison-grid">

              <div class="comp-row">
                <span class="comp-metric">T. asignación</span>
                <div class="comp-bars">
                  <div class="comp-bar-wrap">
                    <div class="comp-bar-fill"
                         [style.background]="compColor(tallerData.tiempos.promedio_asignacion_min, tallerData.comparacion_tenant.promedio_asignacion_min, true)"
                         [style.width.%]="compWidth(tallerData.tiempos.promedio_asignacion_min, tallerData.comparacion_tenant.promedio_asignacion_min)">
                    </div>
                    <span class="comp-val">
                      {{ tallerData.tiempos.promedio_asignacion_min !== null
                          ? (tallerData.tiempos.promedio_asignacion_min | number:'1.1-1') + ' min'
                          : '—' }}
                    </span>
                  </div>
                  <span class="comp-vs">Tenant: {{ tallerData.comparacion_tenant.promedio_asignacion_min !== null
                    ? (tallerData.comparacion_tenant.promedio_asignacion_min | number:'1.1-1') + ' min'
                    : noDataMsg }}</span>
                </div>
              </div>

              <div class="comp-row">
                <span class="comp-metric">T. llegada</span>
                <div class="comp-bars">
                  <div class="comp-bar-wrap">
                    <div class="comp-bar-fill"
                         [style.background]="compColor(tallerData.tiempos.promedio_llegada_min, tallerData.comparacion_tenant.promedio_llegada_min, true)"
                         [style.width.%]="compWidth(tallerData.tiempos.promedio_llegada_min, tallerData.comparacion_tenant.promedio_llegada_min)">
                    </div>
                    <span class="comp-val">
                      {{ tallerData.tiempos.promedio_llegada_min !== null
                          ? (tallerData.tiempos.promedio_llegada_min | number:'1.1-1') + ' min'
                          : '—' }}
                    </span>
                  </div>
                  <span class="comp-vs">Tenant: {{ tallerData.comparacion_tenant.promedio_llegada_min !== null
                    ? (tallerData.comparacion_tenant.promedio_llegada_min | number:'1.1-1') + ' min'
                    : noDataMsg }}</span>
                </div>
              </div>

              <div class="comp-row">
                <span class="comp-metric">T. resolución</span>
                <div class="comp-bars">
                  <div class="comp-bar-wrap">
                    <div class="comp-bar-fill"
                         [style.background]="compColor(tallerData.tiempos.promedio_resolucion_min, tallerData.comparacion_tenant.promedio_finalizacion_min, true)"
                         [style.width.%]="compWidth(tallerData.tiempos.promedio_resolucion_min, tallerData.comparacion_tenant.promedio_finalizacion_min)">
                    </div>
                    <span class="comp-val">
                      {{ tallerData.tiempos.promedio_resolucion_min !== null
                          ? (tallerData.tiempos.promedio_resolucion_min | number:'1.1-1') + ' min'
                          : '—' }}
                    </span>
                  </div>
                  <span class="comp-vs">Tenant: {{ tallerData.comparacion_tenant.promedio_finalizacion_min !== null
                    ? (tallerData.comparacion_tenant.promedio_finalizacion_min | number:'1.1-1') + ' min'
                    : noDataMsg }}</span>
                </div>
              </div>

              <div class="comp-row">
                <span class="comp-metric">SLA cumplido</span>
                <div class="comp-bars">
                  <div class="comp-bar-wrap">
                    <div class="comp-bar-fill"
                         [style.background]="compColor(tallerData.sla_cumplimiento_pct, tallerData.comparacion_tenant.sla_cumplimiento_pct, false)"
                         [style.width.%]="tallerData.sla_cumplimiento_pct ?? 0">
                    </div>
                    <span class="comp-val">
                      {{ tallerData.sla_cumplimiento_pct !== null
                          ? (tallerData.sla_cumplimiento_pct | number:'1.1-1') + '%'
                          : '—' }}
                    </span>
                  </div>
                  <span class="comp-vs">Tenant: {{ tallerData.comparacion_tenant.sla_cumplimiento_pct !== null
                    ? (tallerData.comparacion_tenant.sla_cumplimiento_pct | number:'1.1-1') + '%'
                    : noDataMsg }}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </ng-container>
    </div>

  </div>

  <!-- Template sin datos -->
  <ng-template #noChart>
    <p class="no-data-msg">{{ noDataMsg }}</p>
  </ng-template>
  `,
  styles: [`
    .page { max-width: 1200px; }

    /* ── Header ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; gap: 1rem;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub   { font-size: 0.8rem; color: #94a3b8; margin: 0; }

    .btn-refresh {
      display: flex; align-items: center; gap: 0.4rem;
      background: white; border: 1px solid #e2e8f0; border-radius: 8px;
      padding: 0.5rem 1rem; font-size: 0.82rem; font-weight: 600;
      color: #475569; cursor: pointer; transition: all 0.2s; white-space: nowrap;
    }
    .btn-refresh:hover:not(:disabled) { border-color: #5cbdb9; color: #5cbdb9; }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-refresh svg { width: 15px; height: 15px; }
    .spin { animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Section titles ── */
    .section-title {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem;
    }
    .section-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }

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

    /* ── KPI Grid ── */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(5, 1fr);
      gap: 0.9rem; margin-bottom: 1.5rem;
    }

    .kpi-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1rem 1.1rem; display: flex; align-items: flex-start;
      gap: 0.75rem; transition: box-shadow 0.2s;
    }
    .kpi-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .kpi-card.kpi-good { border-color: #bbf7d0; }
    .kpi-card.kpi-bad  { border-color: #fecaca; }

    .kpi-icon {
      width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 18px; height: 18px; }

    .kpi-data { display: flex; flex-direction: column; gap: 0.1rem; min-width: 0; }
    .kpi-val  { font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .kpi-val.green  { color: #15803d; }
    .kpi-val.red    { color: #dc2626; }
    .kpi-val.no-data { color: #94a3b8; }
    .kpi-lbl  { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }
    .kpi-hint { font-size: 0.65rem; color: #cbd5e1; margin-top: 0.1rem; line-height: 1.3; }

    /* ── Charts grid ── */
    .charts-grid {
      display: grid; grid-template-columns: repeat(2, 1fr);
      gap: 1rem; margin-bottom: 1.5rem;
    }
    .chart-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem;
    }
    .chart-wide { grid-column: span 2; }
    .chart-title {
      font-size: 0.875rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem;
    }

    /* ── Horizontal bar chart ── */
    .bar-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .bar-row  { display: grid; grid-template-columns: 140px 1fr 36px; align-items: center; gap: 0.6rem; }
    .bar-label { font-size: 0.78rem; color: #475569; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bar-track { background: #f1f5f9; border-radius: 99px; height: 8px; overflow: hidden; }
    .bar-fill  { height: 100%; border-radius: 99px; min-width: 4px; transition: width 0.4s ease; }
    .bar-count { font-size: 0.78rem; font-weight: 700; color: #475569; text-align: right; }

    /* ── Ranking table ── */
    .ranking-table { overflow-x: auto; }
    .rank-header, .rank-row {
      display: grid;
      grid-template-columns: 36px 1fr 180px 110px 100px 100px;
      gap: 0.5rem; align-items: center; padding: 0.5rem 0.25rem;
    }
    .rank-header {
      font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;
      border-bottom: 1px solid #f1f5f9; padding-bottom: 0.5rem;
    }
    .rank-row { border-bottom: 1px solid #f8fafc; font-size: 0.82rem; color: #475569; }
    .rank-row:last-child { border-bottom: none; }
    .rank-top { background: #f0fdfa; border-radius: 8px; }
    .rank-pos   { font-size: 1rem; text-align: center; }
    .rank-nombre { font-weight: 600; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .score-bar-wrap { position: relative; background: #f1f5f9; border-radius: 99px; height: 20px; overflow: hidden; display: flex; align-items: center; }
    .score-bar { height: 100%; border-radius: 99px; transition: width 0.4s; }
    .score-lbl { position: absolute; right: 6px; font-size: 0.72rem; font-weight: 700; color: white; mix-blend-mode: difference; }

    .star-badge {
      display: inline-block; background: #fefce8; color: #b45309;
      border-radius: 99px; padding: 0.1rem 0.5rem; font-size: 0.75rem; font-weight: 700;
    }

    /* ── Taller section ── */
    .taller-section { margin-top: 0.5rem; }

    .selector-row { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
    .selector-label { font-size: 0.85rem; font-weight: 600; color: #475569; white-space: nowrap; }
    .taller-select {
      border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.5rem 0.9rem;
      font-size: 0.875rem; color: #0f172a; background: white; min-width: 260px;
      cursor: pointer; outline: none; transition: border-color 0.2s;
    }
    .taller-select:focus { border-color: #5cbdb9; }

    .taller-header-banner {
      background: linear-gradient(135deg, #5cbdb9 0%, #3aa7a2 100%);
      border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 1.25rem;
      display: flex; align-items: center; justify-content: space-between; gap: 1rem;
    }
    .taller-header-banner h3 { font-size: 1.1rem; font-weight: 800; color: white; margin: 0; }
    .taller-badge {
      background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.35);
      color: white; border-radius: 99px; padding: 0.25rem 0.8rem;
      font-size: 0.78rem; font-weight: 600; white-space: nowrap;
    }

    /* ── Monthly vertical bar chart ── */
    .month-chart {
      display: flex; align-items: flex-end; gap: 6px; height: 100px; overflow-x: auto;
    }
    .month-col { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 38px; }
    .month-bars { display: flex; align-items: flex-end; gap: 2px; height: 72px; }
    .month-bar  { width: 14px; border-radius: 3px 3px 0 0; min-height: 2px; transition: height 0.4s; }
    .month-bar.total { background: #94a3b8; }
    .month-bar.comp  { background: #5cbdb9; }
    .month-lbl { font-size: 0.62rem; color: #94a3b8; }
    .month-val { font-size: 0.68rem; font-weight: 700; color: #475569; }
    .month-legend { display: flex; align-items: center; gap: 0.3rem; margin-top: 0.6rem; font-size: 0.75rem; color: #94a3b8; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

    /* ── Comparison section ── */
    .comparison-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .comp-row { display: grid; grid-template-columns: 120px 1fr; align-items: center; gap: 0.75rem; }
    .comp-metric { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .comp-bars { display: flex; flex-direction: column; gap: 0.25rem; }
    .comp-bar-wrap {
      position: relative; background: #f1f5f9; border-radius: 99px; height: 24px;
      overflow: hidden; display: flex; align-items: center;
    }
    .comp-bar-fill { height: 100%; border-radius: 99px; min-width: 4px; transition: width 0.4s; }
    .comp-val {
      position: absolute; right: 8px; font-size: 0.75rem; font-weight: 700;
      color: white; mix-blend-mode: difference;
    }
    .comp-vs { font-size: 0.7rem; color: #94a3b8; }

    /* ── No data ── */
    .no-data-msg { font-size: 0.82rem; color: #94a3b8; font-style: italic; margin: 0.5rem 0; }

    /* ── Responsive ── */
    @media (max-width: 1100px) {
      .kpi-grid { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
      .chart-wide { grid-column: span 1; }
      .rank-header, .rank-row { grid-template-columns: 36px 1fr 90px 70px; }
      .rank-header span:nth-child(5), .rank-header span:nth-child(6),
      .rank-row  span:nth-child(5), .rank-row  span:nth-child(6) { display: none; }
    }
    @media (max-width: 500px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .bar-row { grid-template-columns: 100px 1fr 32px; }
      .comp-row { grid-template-columns: 90px 1fr; }
    }
  `]
})
export class OrgAnaliticaComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private orgSvc  = inject(OrganizacionService);
  private cdr     = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  readonly noDataMsg = NO_DATA;

  loading       = true;
  error         = '';
  loadingTaller = false;
  errorTaller   = '';

  global:     AnaliticaGlobal | null = null;
  tallerData: AnaliticaTaller | null = null;
  talleres:   TallerResumen[]        = [];

  selectedTallerId: number | null = null;
  orgId = 0;

  // ── Derived helpers ──────────────────────────────────────────────

  get totalEmergencias(): number {
    return this.global?.total_emergencias ?? 0;
  }

  get slaOk(): boolean {
    return (this.global?.sla_cumplimiento_pct ?? 0) >= 80;
  }

  get tallerSlaOk(): boolean {
    return (this.tallerData?.sla_cumplimiento_pct ?? 0) >= 80;
  }

  get maxPorTipo(): number {
    return Math.max(...(this.global?.incidentes_por_tipo ?? []).map(r => r.cantidad), 1);
  }

  get maxTipoTaller(): number {
    return Math.max(...(this.tallerData?.incidentes_por_tipo ?? []).map(r => r.cantidad), 1);
  }

  get maxMensual(): number {
    return Math.max(...(this.tallerData?.rendimiento_mensual ?? []).map(m => m.total), 1);
  }

  // ── Lifecycle ────────────────────────────────────────────────────

  ngOnInit(): void {
    const user = this.auth.getAuthState().currentUser;
    this.orgId = user?.organizacion_id ?? 0;
    if (!this.orgId) { this.loading = false; this.error = 'Sin organización asignada.'; return; }
    this.reload();
  }

  ngOnDestroy(): void { this.destroy$.next(); this.destroy$.complete(); }

  reload(): void {
    this.loading = true;
    this.error   = '';
    this.cdr.markForCheck();

    this.orgSvc.getAnaliticaGlobal(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.global  = data;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.error   = err?.error?.detail ?? 'Error cargando analítica global.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });

    this.orgSvc.getTalleres(this.orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: list => { this.talleres = list; this.cdr.markForCheck(); },
        error: () => {}
      });
  }

  onTallerChange(tallerId: number | null): void {
    this.tallerData  = null;
    this.errorTaller = '';
    if (!tallerId) return;

    this.loadingTaller = true;
    this.cdr.markForCheck();

    this.orgSvc.getAnaliticaTaller(this.orgId, tallerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: data => {
          this.tallerData    = data;
          this.loadingTaller = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.errorTaller   = err?.error?.detail ?? 'Error cargando KPIs del taller.';
          this.loadingTaller = false;
          this.cdr.markForCheck();
        }
      });
  }

  // ── Chart helpers ────────────────────────────────────────────────

  barPct(val: number, max: number): number {
    return max > 0 ? Math.round((val / max) * 100) : 0;
  }

  scoreColor(score: number): string {
    if (score >= 75) return '#16a34a';
    if (score >= 50) return '#ca8a04';
    return '#dc2626';
  }

  compColor(taller: number | null, tenant: number | null, lowerIsBetter: boolean): string {
    if (taller === null || tenant === null) return '#94a3b8';
    const better = lowerIsBetter ? taller <= tenant : taller >= tenant;
    return better ? '#16a34a' : '#dc2626';
  }

  compWidth(taller: number | null, tenant: number | null): number {
    if (taller === null || tenant === null || tenant === 0) return 0;
    return Math.min(Math.round((taller / (tenant * 1.5)) * 100), 100);
  }
}
