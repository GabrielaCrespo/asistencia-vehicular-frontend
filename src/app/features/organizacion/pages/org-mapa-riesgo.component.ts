import {
  Component, OnInit, OnDestroy, AfterViewInit,
  inject, ChangeDetectorRef, ChangeDetectionStrategy,
  ViewChild, ElementRef, NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import {
  MapaRiesgoResponse, MapaRiesgoFiltros,
  PuntoCalor, ZonaPeligrosa,
} from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-mapa-riesgo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  template: `
  <div class="page">

    <!-- ── HEADER ─────────────────────────────────────────────── -->
    <div class="page-header">
      <div class="header-info">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div>
          <h1 class="page-title">Mapa Inteligente de Riesgo Vehicular</h1>
          <p class="page-sub">Análisis geográfico de emergencias — datos en tiempo real</p>
        </div>
      </div>
      <button class="btn-refresh" (click)="cargar()" [disabled]="loading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             [class.spin]="loading">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        Actualizar
      </button>
    </div>

    <!-- ── FILTROS ─────────────────────────────────────────────── -->
    <div class="filters-panel">
      <div class="filters-grid">

        <div class="filter-group">
          <label>Fecha inicio</label>
          <input type="date" [(ngModel)]="filtros.fecha_desde" (change)="cargar()">
        </div>

        <div class="filter-group">
          <label>Fecha fin</label>
          <input type="date" [(ngModel)]="filtros.fecha_hasta" (change)="cargar()">
        </div>

        <div class="filter-group">
          <label>Tipo de incidente</label>
          <select [(ngModel)]="filtros.tipo_problema" (change)="cargar()">
            <option value="">Todos</option>
            <option value="bateria">Batería</option>
            <option value="llanta">Llanta</option>
            <option value="motor">Motor</option>
            <option value="accidente">Accidente</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Taller</label>
          <select [(ngModel)]="filtros.taller_id" (change)="cargar()">
            <option [ngValue]="undefined">Todos</option>
            <option *ngFor="let t of data?.talleres" [ngValue]="t.taller_id">
              {{ t.razon_social }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label>Estado</label>
          <select [(ngModel)]="filtros.estado" (change)="cargar()">
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="atendido">Atendido</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>

        <div class="filter-group filter-actions">
          <button class="btn-clear" (click)="limpiarFiltros()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            Limpiar
          </button>
        </div>

      </div>
    </div>

    <!-- ── ERROR ───────────────────────────────────────────────── -->
    <div class="center-state error-state" *ngIf="error && !loading">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p>{{ error }}</p>
    </div>

    <!-- ── KPI CARDS (solo con datos) ─────────────────────────── -->
    <div class="kpi-row" *ngIf="data && !loading">

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#eff6ff;color:#3b82f6">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div class="kpi-data">
          <span class="kpi-val">{{ data.kpis.total_emergencias }}</span>
          <span class="kpi-lbl">Total emergencias</span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#fef2f2;color:#ef4444">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="kpi-data">
          <span class="kpi-val zone-name-kpi">
            {{ data.kpis.zona_mayor_riesgo?.nombre ?? '—' }}
          </span>
          <span class="kpi-lbl">Zona mayor riesgo</span>
          <span class="kpi-sub" *ngIf="data.kpis.zona_mayor_riesgo">
            {{ data.kpis.zona_mayor_riesgo.cantidad }} incidentes
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#fff7ed;color:#f97316">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <div class="kpi-data">
          <span class="kpi-val">{{ tipoLabel(data.kpis.tipo_mas_frecuente?.tipo) }}</span>
          <span class="kpi-lbl">Incidente más frecuente</span>
          <span class="kpi-sub" *ngIf="data.kpis.tipo_mas_frecuente">
            {{ data.kpis.tipo_mas_frecuente.cantidad }} casos ({{ data.kpis.tipo_mas_frecuente.porcentaje }}%)
          </span>
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
          <span class="kpi-val">
            {{ data.kpis.horario_mayor_incidencia ? formatHora(data.kpis.horario_mayor_incidencia.hora) : '—' }}
          </span>
          <span class="kpi-lbl">Hora con mayor incidencia</span>
          <span class="kpi-sub" *ngIf="data.kpis.horario_mayor_incidencia">
            {{ data.kpis.horario_mayor_incidencia.cantidad }} emergencias
          </span>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background:#f5f3ff;color:#7c3aed">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        </div>
        <div class="kpi-data">
          <span class="kpi-val" *ngIf="data.kpis.tiempo_promedio_atencion_min !== null">
            {{ data.kpis.tiempo_promedio_atencion_min | number:'1.1-1' }} min
          </span>
          <span class="kpi-val" *ngIf="data.kpis.tiempo_promedio_atencion_min === null">—</span>
          <span class="kpi-lbl">T. promedio atención</span>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════════ -->
    <!-- MAPA + ZONAS — el contenedor del mapa SIEMPRE está en DOM -->
    <!-- para que Leaflet pueda inicializarse en ngAfterViewInit   -->
    <!-- ══════════════════════════════════════════════════════════ -->
    <div class="map-section">

      <!-- Mapa de calor -->
      <div class="map-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/>
            <line x1="8" y1="2" x2="8" y2="18"/>
            <line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <span>Mapa de Calor de Emergencias</span>
          <span class="badge" *ngIf="data && data.puntos_calor.length > 0">
            {{ data.puntos_calor.length }} zonas
          </span>
        </div>

        <!-- Wrapper con mapa + overlays -->
        <div class="map-wrapper">
          <!-- SIEMPRE en el DOM — requerido por Leaflet -->
          <div class="map-container" #mapContainer></div>

          <!-- Overlay de carga -->
          <div class="map-overlay" *ngIf="loading">
            <div class="spinner"></div>
            <p>Cargando datos…</p>
          </div>

          <!-- Overlay sin datos -->
          <div class="map-overlay" *ngIf="!loading && data && data.puntos_calor.length === 0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <p>Sin datos geográficos para el período seleccionado</p>
          </div>

          <!-- Overlay estado inicial (sin primera carga) -->
          <div class="map-overlay" *ngIf="!loading && !data && !error">
            <div class="spinner"></div>
            <p>Inicializando…</p>
          </div>
        </div>

        <div class="map-legend" *ngIf="data && data.puntos_calor.length > 0">
          <span class="legend-title">Concentración:</span>
          <span class="legend-item">
            <span class="legend-dot" style="background:#22c55e"></span>Baja
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background:#f59e0b"></span>Media
          </span>
          <span class="legend-item">
            <span class="legend-dot" style="background:#ef4444"></span>Alta
          </span>
        </div>
      </div>

      <!-- Zonas peligrosas -->
      <div class="zones-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>Zonas Peligrosas</span>
        </div>

        <!-- Loading skeleton -->
        <div class="zones-empty" *ngIf="loading">Cargando zonas…</div>

        <div class="zones-empty"
             *ngIf="!loading && data && data.zonas_peligrosas.length === 0">
          Sin datos disponibles
        </div>

        <div class="zones-list"
             *ngIf="!loading && data && data.zonas_peligrosas.length > 0">
          <div class="zone-item" *ngFor="let zona of data.zonas_peligrosas"
               (click)="flyToZone(zona)">
            <div class="zone-left">
              <div class="zone-rank" [class]="'risk-' + zona.nivel_riesgo">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div class="zone-info">
                <span class="zone-name">{{ zona.nombre }}</span>
                <span class="zone-geocoding" *ngIf="zona.geocoding">
                  {{ zona.geocoding }}
                </span>
              </div>
            </div>
            <div class="zone-right">
              <span class="zone-count">{{ zona.cantidad }}</span>
              <span class="zone-label">incidentes</span>
              <span class="risk-badge" [class]="'risk-badge-' + zona.nivel_riesgo">
                {{ zona.nivel_riesgo | titlecase }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ── CHARTS ROW (solo con datos) ────────────────────────── -->
    <div class="charts-row" *ngIf="data && !loading">

      <!-- Tipos de incidente -->
      <div class="chart-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          <span>Tipos de Incidente Frecuentes</span>
        </div>

        <div class="chart-empty" *ngIf="data.tipos_incidente.length === 0">Sin datos</div>

        <div class="tipo-chart" *ngIf="data.tipos_incidente.length > 0">
          <div class="tipo-item" *ngFor="let t of data.tipos_incidente">
            <div class="tipo-header">
              <div class="tipo-left">
                <span class="tipo-dot" [style.background]="tipoColor(t.tipo)"></span>
                <span class="tipo-name">{{ tipoLabel(t.tipo) }}</span>
              </div>
              <span class="tipo-pct">{{ t.porcentaje }}%</span>
            </div>
            <div class="tipo-bar-track">
              <div class="tipo-bar-fill"
                   [style.width.%]="t.porcentaje"
                   [style.background]="tipoColor(t.tipo)">
              </div>
            </div>
            <span class="tipo-count">{{ t.cantidad }} incidente{{ t.cantidad !== 1 ? 's' : '' }}</span>
          </div>
        </div>
      </div>

      <!-- Horarios críticos -->
      <div class="chart-card">
        <div class="card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <span>Horarios Críticos</span>
        </div>

        <!-- Por hora -->
        <p class="chart-subtitle">Emergencias por hora del día</p>
        <div class="hour-chart" *ngIf="maxHora > 0; else noHourData">
          <div class="hour-bars">
            <div class="hour-bar-wrap" *ngFor="let h of data.horarios_criticos.por_hora"
                 [title]="formatHora(h.hora) + ': ' + h.cantidad + ' emergencias'">
              <div class="hour-bar"
                   [style.height.%]="(h.cantidad / maxHora) * 100"
                   [class.hour-bar-peak]="h.cantidad === maxHora">
              </div>
              <span class="hour-tick" *ngIf="h.hora % 6 === 0">{{ h.hora }}h</span>
            </div>
          </div>
        </div>
        <ng-template #noHourData><p class="chart-empty">Sin datos</p></ng-template>

        <!-- Por día -->
        <p class="chart-subtitle" style="margin-top:1.25rem">Emergencias por día de la semana</p>
        <div class="day-chart" *ngIf="maxDia > 0; else noDayData">
          <div class="day-item" *ngFor="let d of data.horarios_criticos.por_dia">
            <span class="day-label">{{ d.nombre_dia.substring(0, 3) }}</span>
            <div class="day-bar-track">
              <div class="day-bar-fill"
                   [style.width.%]="(d.cantidad / maxDia) * 100"
                   [class.day-bar-peak]="d.cantidad === maxDia">
              </div>
            </div>
            <span class="day-count">{{ d.cantidad }}</span>
          </div>
        </div>
        <ng-template #noDayData><p class="chart-empty">Sin datos</p></ng-template>
      </div>

    </div>

  </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .page {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #1e293b;
    }

    /* ── HEADER ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .header-info { display: flex; align-items: center; gap: 0.875rem; }
    .header-icon {
      width: 48px; height: 48px; border-radius: 12px;
      background: linear-gradient(135deg, #5cbdb9, #3aa7a2);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .header-icon svg { width: 24px; height: 24px; stroke: white; }
    .page-title { margin: 0 0 0.2rem; font-size: 1.35rem; font-weight: 700; color: #0f172a; }
    .page-sub { margin: 0; font-size: 0.82rem; color: #64748b; }

    .btn-refresh {
      display: flex; align-items: center; gap: 0.4rem;
      background: #5cbdb9; color: white; border: none;
      border-radius: 8px; padding: 0.55rem 1rem;
      font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: background 0.18s; flex-shrink: 0;
    }
    .btn-refresh svg { width: 15px; height: 15px; }
    .btn-refresh:hover { background: #3aa7a2; }
    .btn-refresh:disabled { opacity: 0.6; cursor: not-allowed; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.9s linear infinite; }

    /* ── FILTERS ── */
    .filters-panel {
      background: white; border-radius: 12px;
      border: 1px solid #e2e8f0; padding: 1rem 1.25rem;
      margin-bottom: 1.25rem;
    }
    .filters-grid {
      display: flex; flex-wrap: wrap; gap: 0.75rem; align-items: flex-end;
    }
    .filter-group { display: flex; flex-direction: column; gap: 0.3rem; min-width: 140px; }
    .filter-group label { font-size: 0.75rem; font-weight: 600; color: #475569; }
    .filter-group input,
    .filter-group select {
      padding: 0.45rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 7px;
      font-size: 0.82rem; color: #1e293b; background: white;
      outline: none; transition: border-color 0.18s;
    }
    .filter-group input:focus,
    .filter-group select:focus { border-color: #5cbdb9; }
    .filter-actions { justify-content: flex-end; }
    .btn-clear {
      display: flex; align-items: center; gap: 0.35rem;
      background: #f1f5f9; border: 1px solid #cbd5e1;
      color: #64748b; border-radius: 7px;
      padding: 0.45rem 0.75rem; font-size: 0.82rem;
      cursor: pointer; transition: all 0.18s;
    }
    .btn-clear svg { width: 13px; height: 13px; }
    .btn-clear:hover { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

    /* ── STATES ── */
    .center-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 0.75rem; padding: 3rem;
      color: #64748b;
    }
    .error-state { color: #ef4444; }
    .spinner {
      width: 36px; height: 36px; border: 3px solid #e2e8f0;
      border-top-color: #5cbdb9; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* ── KPI ROW ── */
    .kpi-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.875rem; margin-bottom: 1.25rem;
    }
    .kpi-card {
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      padding: 1rem; display: flex; align-items: center; gap: 0.875rem;
    }
    .kpi-icon {
      width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .kpi-icon svg { width: 20px; height: 20px; }
    .kpi-data { display: flex; flex-direction: column; min-width: 0; }
    .kpi-val {
      font-size: 1.25rem; font-weight: 700; color: #0f172a;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .zone-name-kpi { font-size: 0.9rem; white-space: normal; line-height: 1.3; }
    .kpi-lbl { font-size: 0.72rem; color: #64748b; font-weight: 500; margin-top: 1px; }
    .kpi-sub { font-size: 0.7rem; color: #94a3b8; margin-top: 2px; }

    /* ── MAP SECTION ── */
    .map-section {
      display: grid; grid-template-columns: 1fr 340px;
      gap: 1rem; margin-bottom: 1.25rem;
    }
    @media (max-width: 900px) {
      .map-section { grid-template-columns: 1fr; }
    }

    .map-card, .zones-card {
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      overflow: hidden;
    }

    .card-header {
      display: flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem; font-weight: 600; color: #374151;
    }
    .card-header svg { width: 16px; height: 16px; color: #5cbdb9; }
    .badge {
      margin-left: auto; background: #f0fdfa; color: #0d9488;
      border: 1px solid #99f6e4; border-radius: 99px;
      padding: 0.15rem 0.55rem; font-size: 0.72rem; font-weight: 600;
    }

    /* Map wrapper + overlay system */
    .map-wrapper {
      position: relative; height: 420px;
    }
    .map-container {
      width: 100%; height: 100%;
    }
    .map-overlay {
      position: absolute; inset: 0; z-index: 500;
      background: rgba(255,255,255,0.88);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 0.75rem; color: #64748b;
    }
    .map-overlay svg { width: 40px; height: 40px; }

    .map-legend {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 0.6rem 1rem; background: #f8fafc; border-top: 1px solid #f1f5f9;
      font-size: 0.75rem; color: #64748b;
    }
    .legend-title { font-weight: 600; }
    .legend-item { display: flex; align-items: center; gap: 0.3rem; }
    .legend-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }

    /* ── ZONES LIST ── */
    .zones-list { overflow-y: auto; max-height: 440px; }
    .zones-empty {
      padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.85rem;
    }
    .zone-item {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem 1rem; border-bottom: 1px solid #f8fafc;
      cursor: pointer; transition: background 0.15s;
    }
    .zone-item:hover { background: #f8fafc; }
    .zone-item:last-child { border-bottom: none; }
    .zone-left { display: flex; align-items: center; gap: 0.65rem; }
    .zone-rank {
      width: 32px; height: 32px; border-radius: 8px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .zone-rank svg { width: 16px; height: 16px; }
    .zone-rank.risk-alto  { background: #fef2f2; color: #ef4444; }
    .zone-rank.risk-medio { background: #fff7ed; color: #f59e0b; }
    .zone-rank.risk-bajo  { background: #f0fdf4; color: #22c55e; }
    .zone-info { display: flex; flex-direction: column; }
    .zone-name { font-size: 0.82rem; font-weight: 600; color: #1e293b; }
    .zone-geocoding {
      font-size: 0.7rem; color: #64748b; margin-top: 1px;
      max-width: 170px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .zone-right {
      display: flex; flex-direction: column; align-items: flex-end; gap: 2px;
    }
    .zone-count { font-size: 1rem; font-weight: 700; color: #0f172a; }
    .zone-label { font-size: 0.68rem; color: #94a3b8; }
    .risk-badge {
      font-size: 0.65rem; font-weight: 700; padding: 0.15rem 0.5rem;
      border-radius: 99px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .risk-badge-alto  { background: #fef2f2; color: #ef4444; }
    .risk-badge-medio { background: #fff7ed; color: #d97706; }
    .risk-badge-bajo  { background: #f0fdf4; color: #15803d; }

    /* ── CHARTS ROW ── */
    .charts-row {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }
    .chart-card {
      background: white; border-radius: 12px; border: 1px solid #e2e8f0;
      padding: 0 0 1rem;
    }
    .chart-empty { padding: 2rem; text-align: center; color: #94a3b8; font-size: 0.85rem; }
    .chart-subtitle {
      font-size: 0.78rem; font-weight: 600; color: #64748b;
      margin: 1rem 1rem 0.5rem; text-transform: uppercase; letter-spacing: 0.05em;
    }

    /* Tipos de incidente */
    .tipo-chart { padding: 0.5rem 1rem 0; display: flex; flex-direction: column; gap: 0.875rem; }
    .tipo-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .tipo-header { display: flex; align-items: center; justify-content: space-between; }
    .tipo-left { display: flex; align-items: center; gap: 0.4rem; }
    .tipo-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .tipo-name { font-size: 0.82rem; font-weight: 500; color: #374151; }
    .tipo-pct { font-size: 0.8rem; font-weight: 700; color: #374151; }
    .tipo-bar-track {
      height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
    }
    .tipo-bar-fill { height: 100%; border-radius: 99px; transition: width 0.5s ease; }
    .tipo-count { font-size: 0.7rem; color: #94a3b8; }

    /* Hour chart */
    .hour-chart { padding: 0 1rem; }
    .hour-bars {
      display: flex; align-items: flex-end; gap: 3px;
      height: 80px; padding-bottom: 16px; position: relative;
    }
    .hour-bar-wrap {
      flex: 1; display: flex; flex-direction: column; align-items: center;
      justify-content: flex-end; height: 100%; position: relative;
    }
    .hour-bar {
      width: 100%; background: #99f6e4; border-radius: 3px 3px 0 0;
      min-height: 2px; transition: height 0.4s ease;
    }
    .hour-bar.hour-bar-peak { background: #0d9488; }
    .hour-tick {
      position: absolute; bottom: -14px; font-size: 0.6rem; color: #94a3b8;
      white-space: nowrap;
    }

    /* Day chart */
    .day-chart { padding: 0 1rem; display: flex; flex-direction: column; gap: 0.45rem; }
    .day-item { display: flex; align-items: center; gap: 0.5rem; }
    .day-label { font-size: 0.72rem; font-weight: 600; color: #64748b; width: 28px; flex-shrink: 0; }
    .day-bar-track { flex: 1; height: 8px; background: #f1f5f9; border-radius: 99px; overflow: hidden; }
    .day-bar-fill { height: 100%; background: #a7f3d0; border-radius: 99px; transition: width 0.4s ease; }
    .day-bar-fill.day-bar-peak { background: #059669; }
    .day-count { font-size: 0.72rem; font-weight: 600; color: #374151; width: 22px; text-align: right; flex-shrink: 0; }

    @media (max-width: 640px) {
      .kpi-row { grid-template-columns: 1fr 1fr; }
      .map-wrapper { height: 300px; }
    }
  `],
})
export class OrgMapaRiesgoComponent implements OnInit, AfterViewInit, OnDestroy {
  // Static: true porque el div #mapContainer es parte del template estático
  // (no está dentro de *ngIf), por lo que siempre está en el DOM.
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;

  private auth     = inject(AuthService);
  private orgSvc   = inject(OrganizacionService);
  private http     = inject(HttpClient);
  private ngZone   = inject(NgZone);
  private cdr      = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  loading = false;
  error: string | null = null;
  data: MapaRiesgoResponse | null = null;

  filtros: MapaRiesgoFiltros = {};
  orgId = 0;

  private map: L.Map | null = null;
  private heatLayers: L.Layer[] = [];
  private geocodeTimers: ReturnType<typeof setTimeout>[] = [];

  // ── Computed ──────────────────────────────────────────────────
  get maxHora(): number {
    if (!this.data) return 0;
    return Math.max(...this.data.horarios_criticos.por_hora.map(h => h.cantidad), 0);
  }

  get maxDia(): number {
    if (!this.data) return 0;
    return Math.max(...this.data.horarios_criticos.por_dia.map(d => d.cantidad), 0);
  }

  tipoLabel(tipo?: string): string {
    const labels: Record<string, string> = {
      bateria: 'Batería', llanta: 'Llanta', motor: 'Motor',
      accidente: 'Accidente', otro: 'Otro',
    };
    return tipo ? (labels[tipo] ?? tipo) : '—';
  }

  tipoColor(tipo: string): string {
    const colors: Record<string, string> = {
      bateria: '#3b82f6', llanta: '#f97316',
      motor: '#ef4444', accidente: '#991b1b', otro: '#94a3b8',
    };
    return colors[tipo] ?? '#94a3b8';
  }

  formatHora(hora: number): string {
    return `${hora.toString().padStart(2, '0')}:00`;
  }

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    const user = this.auth.getAuthState().currentUser;
    this.orgId = user?.organizacion_id ?? 0;
    this.cargar();
  }

  ngAfterViewInit(): void {
    // El div #mapContainer tiene static:true, siempre está disponible aquí
    this.ngZone.runOutsideAngular(() => {
      this.map = L.map(this.mapContainer.nativeElement, {
        zoomControl: true,
        attributionControl: true,
      }).setView([-17.7833, -63.1821], 12);

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this.map);
    });
  }

  ngOnDestroy(): void {
    this.geocodeTimers.forEach(t => clearTimeout(t));
    if (this.map) { this.map.remove(); this.map = null; }
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ──────────────────────────────────────────────
  cargar(): void {
    if (!this.orgId) return;
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.orgSvc.getMapaRiesgo(this.orgId, this.filtros)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.data = res;
          this.loading = false;
          this.cdr.markForCheck();
          this.renderHeatMap();
          this.geocodeZones(res.zonas_peligrosas);
        },
        error: (e) => {
          this.error = e?.error?.detail ?? 'Error al cargar el mapa de riesgo';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  limpiarFiltros(): void {
    this.filtros = {};
    this.cargar();
  }

  flyToZone(zona: ZonaPeligrosa): void {
    if (!this.map) return;
    this.ngZone.runOutsideAngular(() => {
      this.map!.flyTo([zona.lat, zona.lng], 15, { duration: 1.2 });
    });
  }

  // ── Geocoding inverso (Nominatim / OpenStreetMap) ─────────────
  // Obtiene nombres legibles de calles/barrios para cada zona.
  // Respeta el límite de 1 req/s de Nominatim.
  private geocodeZones(zonas: ZonaPeligrosa[]): void {
    this.geocodeTimers.forEach(t => clearTimeout(t));
    this.geocodeTimers = [];

    zonas.forEach((zona, i) => {
      const timer = setTimeout(() => {
        const url = `https://nominatim.openstreetmap.org/reverse` +
          `?lat=${zona.lat}&lon=${zona.lng}&format=json&accept-language=es&zoom=16`;

        this.http.get<NominatimResult>(url, {
          headers: { 'User-Agent': 'AsistenciaVehicular/1.0 (asistencia.vehicular@app)' },
        }).subscribe({
          next: (res) => {
            const a = res.address ?? {};
            // Prioridad: calle → barrio → zona → distrito → ciudad
            const nombre =
              a.road ||
              a.neighbourhood ||
              a.suburb ||
              a.city_district ||
              a.quarter ||
              a.town ||
              a.city ||
              a.county ||
              zona.nombre;

            // Información adicional: ciudad o municipio
            const detalle =
              a.city || a.town || a.village || a.municipality || '';

            zona.nombre   = nombre;
            zona.geocoding = detalle ? `${detalle}` : '';
            this.cdr.markForCheck();
          },
          error: () => {
            // Si falla el geocoding, el nombre por defecto ("Zona #N") se mantiene
          },
        });
      }, i * 1200);  // 1.2 s entre peticiones

      this.geocodeTimers.push(timer);
    });
  }

  // ── Mapa de calor ─────────────────────────────────────────────
  private renderHeatMap(): void {
    if (!this.map || !this.data) return;

    this.ngZone.runOutsideAngular(() => {
      // Limpiar capas anteriores
      this.heatLayers.forEach(l => this.map!.removeLayer(l));
      this.heatLayers = [];

      const puntos: PuntoCalor[] = this.data!.puntos_calor;
      if (puntos.length === 0) return;

      const maxCant = Math.max(...puntos.map(p => p.cantidad));

      puntos.forEach(p => {
        const fillColor = p.intensidad >= 0.66 ? '#ef4444'
                        : p.intensidad >= 0.33 ? '#f59e0b'
                        : '#22c55e';
        const radius      = 400 + p.intensidad * 1400;
        const fillOpacity = 0.12 + p.intensidad * 0.30;

        const circle = L.circle([p.lat, p.lng], {
          radius,
          color:       'transparent',
          fillColor,
          fillOpacity,
          weight:      0,
        });

        circle.bindPopup(
          `<b style="font-size:.85rem">Concentración ${p.nivel}</b>` +
          `<br>Emergencias: <b>${p.cantidad}</b>` +
          `<br>Intensidad: <b>${Math.round(p.intensidad * 100)}%</b>`
        );
        circle.addTo(this.map!);
        this.heatLayers.push(circle);

        // Marca el centroide del punto de mayor concentración
        if (p.cantidad === maxCant) {
          const dot = L.circleMarker([p.lat, p.lng], {
            radius:      6,
            color:       '#7f1d1d',
            fillColor:   '#ef4444',
            fillOpacity: 0.9,
            weight:      2,
          });
          dot.bindPopup(`<b>Máxima concentración</b><br>${p.cantidad} emergencias`);
          dot.addTo(this.map!);
          this.heatLayers.push(dot);
        }
      });

      // Ajustar vista a todos los puntos
      const bounds = L.latLngBounds(puntos.map(p => [p.lat, p.lng] as [number, number]));
      this.map!.fitBounds(bounds, { padding: [40, 40] });
      // Forzar recálculo del tamaño en caso de que el contenedor haya cambiado
      setTimeout(() => this.map!.invalidateSize(), 50);
    });
  }
}

// Tipado mínimo de la respuesta de Nominatim
interface NominatimResult {
  address?: {
    road?:          string;
    neighbourhood?: string;
    suburb?:        string;
    city_district?: string;
    quarter?:       string;
    town?:          string;
    city?:          string;
    village?:       string;
    municipality?:  string;
    county?:        string;
  };
}
