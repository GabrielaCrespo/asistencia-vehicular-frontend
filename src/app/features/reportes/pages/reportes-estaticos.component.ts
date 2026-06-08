import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { ReportesService } from '../../../core/services/reportes.service';
import {
  REPORTES_ESTATICOS,
  ReporteEstatico,
  TipoReporte,
  FormatoExport,
  ReporteFiltrosBase,
  ReporteDinamicoFiltros,
} from '../../../core/models/reportes.models';

const ESTADOS = ['pendiente', 'asignado', 'en_camino', 'en_servicio', 'completada'];
const TIPOS_INCIDENTE = ['batería', 'llanta', 'combustible', 'mecánico', 'accidente', 'otro'];

const COLUMNAS: Record<TipoReporte, string[]> = {
  'emergencias':         ['fecha_creacion', 'tipo_problema', 'estado_asignacion', 'prioridad', 'cliente', 'vehiculo', 'taller', 'tecnico', 'monto_total'],
  'historial-servicios': ['fecha_asignacion', 'tipo_problema', 'estado', 'cliente', 'vehiculo', 'taller', 'tecnico', 'monto_total', 'calificacion'],
  'ingresos':            ['fecha_pago', 'taller', 'cliente', 'tipo_problema', 'monto_total', 'monto_taller', 'comision_plataforma', 'metodo_pago'],
  'calificaciones':      ['fecha_calificacion', 'taller', 'cliente', 'tipo_problema', 'puntuacion', 'puntuacion_servicio', 'comentario'],
  'kpis':                ['taller', 'total_servicios', 'completados', 'pendientes', 'urgentes', 'ingresos_netos', 'calificacion_promedio', 'tiempo_respuesta_prom'],
  'incidentes-tipo':     ['tipo_problema', 'total', 'completados', 'urgentes', 'ticket_promedio'],
  'sla':                 ['taller', 'total_servicios', 'completados', 'tiempo_respuesta_prom_min', 'cumplimiento_sla_pct'],
};

const COL_LABELS: Record<string, string> = {
  fecha_creacion: 'Fecha', fecha_asignacion: 'Fecha', fecha_pago: 'Fecha Pago',
  fecha_calificacion: 'Fecha', tipo_problema: 'Tipo Incidente',
  estado_asignacion: 'Estado', estado: 'Estado', prioridad: 'Prioridad',
  cliente: 'Cliente', vehiculo: 'Vehículo', taller: 'Taller', tecnico: 'Técnico',
  monto_total: 'Monto Total', monto_taller: 'Monto Taller', comision_plataforma: 'Comisión',
  metodo_pago: 'Método Pago', puntuacion: 'Puntuación', puntuacion_servicio: 'Punt. Servicio',
  comentario: 'Comentario', total_servicios: 'Total', completados: 'Completados',
  pendientes: 'Pendientes', urgentes: 'Urgentes', ingresos_netos: 'Ingresos Netos',
  calificacion_promedio: 'Cal. Prom.', calificacion: 'Calificación',
  tiempo_respuesta_prom: 'T. Resp. (min)', tiempo_respuesta_prom_min: 'T. Resp. (min)',
  cumplimiento_sla_pct: 'SLA %', ticket_promedio: 'Ticket Prom.', total: 'Total',
};

const REPORT_BG: Record<TipoReporte, string> = {
  'emergencias':         '#fef2f2',
  'historial-servicios': '#eff6ff',
  'ingresos':            '#f0fdf4',
  'calificaciones':      '#fefce8',
  'kpis':                '#f5f3ff',
  'incidentes-tipo':     '#ecfeff',
  'sla':                 '#fdf2f8',
};

const MONEY_COLS  = new Set(['monto_total', 'monto_taller', 'comision_plataforma', 'ingresos_netos', 'ticket_promedio']);
const PCT_COLS    = new Set(['cumplimiento_sla_pct', 'tasa_completacion_pct']);
const DATE_COLS   = new Set(['fecha_creacion', 'fecha_asignacion', 'fecha_pago', 'fecha_calificacion']);
const STATUS_COLS = new Set(['estado', 'estado_asignacion', 'prioridad']);

const REPORT_ICONS: Record<TipoReporte, string> = {
  'emergencias': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,
  'historial-servicios': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>`,
  'ingresos': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
    <polyline points="17 6 23 6 23 12"/>
  </svg>`,
  'calificaciones': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>`,
  'kpis': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
  </svg>`,
  'incidentes-tipo': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>`,
  'sla': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>`,
};

@Component({
  selector: 'app-reportes-estaticos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">

      <!-- Cabecera de página -->
      <div class="page-banner">
        <div class="banner-text">
          <p class="banner-label">Centro de análisis</p>
          <h1>Reportes</h1>
        </div>
        <svg class="banner-deco" viewBox="0 0 80 60" fill="none">
          <rect x="4" y="20" width="12" height="36" rx="3" fill="rgba(255,255,255,0.25)"/>
          <rect x="22" y="8" width="12" height="48" rx="3" fill="rgba(255,255,255,0.18)"/>
          <rect x="40" y="28" width="12" height="28" rx="3" fill="rgba(255,255,255,0.25)"/>
          <rect x="58" y="14" width="12" height="42" rx="3" fill="rgba(255,255,255,0.18)"/>
        </svg>
      </div>

      <!-- Selector de tipo de reporte -->
      <p class="section-title">Tipo de reporte</p>
      <div class="type-grid">
        <button *ngFor="let r of reportes"
                class="type-card"
                [class.active]="tipoActivo === r.tipo"
                (click)="seleccionarTipo(r)">
          <div class="type-icon-box" [style.background]="getBg(r.tipo)" [style.color]="r.color"
               [innerHTML]="getIcon(r.tipo)">
          </div>
          <div class="type-body">
            <div class="type-title">{{ r.titulo }}</div>
            <div class="type-desc">{{ r.descripcion }}</div>
          </div>
          <svg class="type-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <!-- Filtros (visibles tras seleccionar tipo) -->
      <ng-container *ngIf="tipoActivo">
        <p class="section-title">Filtros</p>
        <div class="filter-card">
          <form [formGroup]="filtroForm" class="filter-row">

            <div class="field">
              <label>Desde</label>
              <input formControlName="fecha_desde" type="date" />
            </div>
            <div class="field">
              <label>Hasta</label>
              <input formControlName="fecha_hasta" type="date" />
            </div>

            <!-- Filtros avanzados solo para historial de servicios -->
            <ng-container *ngIf="tipoActivo === 'historial-servicios'">
              <div class="field">
                <label>Tipo incidente</label>
                <select formControlName="tipo_incidente">
                  <option value="">Todos</option>
                  <option *ngFor="let t of tipos" [value]="t">{{ t | titlecase }}</option>
                </select>
              </div>
              <div class="field">
                <label>Estado</label>
                <select formControlName="estado">
                  <option value="">Todos</option>
                  <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
                </select>
              </div>
              <div class="field field--wide">
                <label>Zona / Ciudad</label>
                <input formControlName="zona" type="text" placeholder="Ej: La Paz, Miraflores..." />
              </div>
            </ng-container>

            <div class="filter-actions">
              <button type="button" class="btn-primary" (click)="cargar()" [disabled]="loading">
                <svg *ngIf="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                  <polyline points="1 4 1 10 7 10"/>
                  <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                </svg>
                <span class="spin-sm" *ngIf="loading"></span>
                {{ loading ? 'Generando...' : 'Generar reporte' }}
              </button>
              <button type="button" class="btn-secondary" (click)="limpiarFiltros()">Limpiar</button>
            </div>

          </form>
        </div>

        <!-- Sección de resultados -->
        <div class="result-card">

          <!-- Cabecera resultado -->
          <div class="result-header">
            <div class="result-left">
              <div class="result-icon" [style.background]="getBg(tipoActivo!)" [style.color]="reporteActivo?.color"
                   [innerHTML]="getIcon(tipoActivo!)">
              </div>
              <div>
                <h2 class="result-title">{{ reporteActivo?.titulo }}</h2>
                <span class="row-badge" *ngIf="!loading && filas.length">
                  {{ filas.length }} registro{{ filas.length !== 1 ? 's' : '' }}
                </span>
              </div>
            </div>
            <div class="export-group" *ngIf="!loading && filas.length">
              <span class="exp-lbl">Exportar</span>
              <button class="btn-exp" (click)="exportar('csv')"   [disabled]="exportLoading" title="Descargar CSV">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                CSV
              </button>
              <button class="btn-exp" (click)="exportar('excel')" [disabled]="exportLoading" title="Descargar Excel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M8 12l4 4 4-4M12 8v8"/>
                </svg>
                Excel
              </button>
              <button class="btn-exp btn-exp--pdf" (click)="exportar('pdf')" [disabled]="exportLoading" title="Descargar PDF">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                PDF
              </button>
            </div>
          </div>

          <!-- Cargando -->
          <div class="loading-row" *ngIf="loading">
            <div class="spinner-lg"></div>
            <span>Generando reporte...</span>
          </div>

          <!-- Error -->
          <div class="alert-error" *ngIf="error && !loading">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <!-- KPIs de resumen -->
          <div class="summary-strip" *ngIf="!loading && resumen.length">
            <div class="s-kpi" *ngFor="let s of resumen">
              <span class="s-val" [style.color]="s.color || '#0f172a'">{{ s.valor }}</span>
              <span class="s-lbl">{{ s.label }}</span>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-wrap" *ngIf="!loading && filas.length">
            <table class="data-table">
              <thead>
                <tr>
                  <th *ngFor="let col of columnas">{{ getLabel(col) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let fila of filas">
                  <td *ngFor="let col of columnas">
                    <span *ngIf="isStatusCol(col)" class="badge" [class]="badgeClass(col, fila[col])">
                      {{ fila[col] ?? '—' }}
                    </span>
                    <span *ngIf="!isStatusCol(col)">{{ formatCell(col, fila[col]) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Estado inicial -->
          <div class="empty-state" *ngIf="!loading && !filas.length && !error">
            <svg viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            <p>Haz clic en <strong>Generar reporte</strong> para cargar los datos</p>
          </div>

        </div>
      </ng-container>

      <!-- Estado sin selección -->
      <div class="select-prompt" *ngIf="!tipoActivo">
        <svg viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
          <line x1="18" y1="20" x2="18" y2="10"/>
          <line x1="12" y1="20" x2="12" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="14"/>
          <line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        <p>Selecciona un tipo de reporte para comenzar</p>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    .page { max-width: 1100px; }

    /* Banner */
    .page-banner {
      background: linear-gradient(135deg, #5cbdb9 0%, #1a6b68 100%);
      border-radius: 16px; padding: 1.4rem 1.75rem; margin-bottom: 1.5rem;
      color: white; display: flex; align-items: center; justify-content: space-between; overflow: hidden;
    }
    .banner-label {
      font-size: 0.75rem; font-weight: 600; opacity: 0.75; margin: 0 0 0.2rem;
      text-transform: uppercase; letter-spacing: 0.06em;
    }
    .page-banner h1 { font-size: 1.5rem; font-weight: 800; margin: 0; }
    .banner-deco { width: 80px; height: 60px; flex-shrink: 0; opacity: 0.85; }

    /* Section title */
    .section-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 0.85rem; }

    /* Tipo grid */
    .type-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 0.75rem; margin-bottom: 1.5rem;
    }
    .type-card {
      display: flex; align-items: center; gap: 0.9rem; background: white;
      border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.25rem;
      cursor: pointer; text-align: left; transition: all 0.18s ease; width: 100%;
    }
    .type-card:hover {
      border-color: #5cbdb9; box-shadow: 0 4px 12px rgba(92,189,185,0.12);
      transform: translateY(-1px);
    }
    .type-card.active { border-color: #5cbdb9; background: #f0fdfa; }

    .type-icon-box {
      width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1.3rem;
    }
    .type-icon-box ::ng-deep svg { width: 20px; height: 20px; }
    .result-icon ::ng-deep svg   { width: 18px; height: 18px; }
    .type-body { flex: 1; min-width: 0; }
    .type-title { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin-bottom: 0.15rem; }
    .type-desc { font-size: 0.75rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .type-arrow { width: 16px; height: 16px; color: #cbd5e1; flex-shrink: 0; transition: color 0.18s; }
    .type-card:hover .type-arrow, .type-card.active .type-arrow { color: #5cbdb9; }

    /* Filtros */
    .filter-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1.1rem 1.25rem; margin-bottom: 1.25rem;
    }
    .filter-row { display: flex; align-items: flex-end; gap: 0.75rem; flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: 0.3rem; }
    .field--wide { flex: 1; min-width: 180px; }
    .field label { font-size: 0.75rem; font-weight: 600; color: #64748b; }
    .field input, .field select {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white; min-width: 140px;
      transition: border-color 0.18s;
    }
    .field input:focus, .field select:focus { outline: none; border-color: #5cbdb9; }

    .filter-actions { display: flex; align-items: flex-end; gap: 0.5rem; flex-shrink: 0; }

    .btn-primary {
      display: flex; align-items: center; gap: 0.4rem;
      padding: 0.55rem 1.1rem; background: #5cbdb9; color: white;
      border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: background 0.18s; white-space: nowrap;
    }
    .btn-primary svg { width: 14px; height: 14px; }
    .btn-primary:hover:not(:disabled) { background: #3aa7a2; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .spin-sm {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }

    .btn-secondary {
      padding: 0.55rem 1rem; background: #f1f5f9; color: #475569;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer; transition: background 0.18s;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    /* Result card */
    .result-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
    }
    .result-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.75rem;
    }
    .result-left { display: flex; align-items: center; gap: 0.75rem; }
    .result-icon {
      width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .result-title { font-size: 0.95rem; font-weight: 700; color: #0f172a; margin: 0 0 0.15rem; }
    .row-badge {
      background: #f1f5f9; color: #475569; font-size: 0.72rem; font-weight: 600;
      padding: 0.15rem 0.55rem; border-radius: 20px;
    }

    .export-group { display: flex; align-items: center; gap: 0.5rem; }
    .exp-lbl { font-size: 0.75rem; color: #94a3b8; font-weight: 600; }

    .btn-exp {
      display: flex; align-items: center; gap: 0.35rem;
      padding: 0.4rem 0.75rem; background: #f8fafc; color: #334155;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s; white-space: nowrap;
    }
    .btn-exp svg { width: 13px; height: 13px; }
    .btn-exp:hover:not(:disabled) { background: #e2e8f0; border-color: #cbd5e1; }
    .btn-exp--pdf { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .btn-exp--pdf:hover:not(:disabled) { background: #fecaca; }
    .btn-exp:disabled { opacity: 0.45; cursor: not-allowed; }

    /* Loading */
    .loading-row {
      display: flex; align-items: center; gap: 0.9rem; padding: 2rem 1.25rem;
      color: #94a3b8; font-size: 0.875rem;
    }
    .spinner-lg {
      width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Error */
    .alert-error {
      display: flex; align-items: center; gap: 0.6rem;
      margin: 1rem 1.25rem; padding: 0.75rem 1rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;
      color: #dc2626; font-size: 0.875rem;
    }
    .alert-error svg { width: 16px; height: 16px; flex-shrink: 0; }

    /* Summary strip */
    .summary-strip {
      display: flex; gap: 0.75rem; flex-wrap: wrap;
      padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; background: #f8fafc;
    }
    .s-kpi {
      display: flex; flex-direction: column; gap: 0.1rem;
      background: white; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 0.7rem 1rem; min-width: 110px;
    }
    .s-val { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
    .s-lbl { font-size: 0.68rem; color: #94a3b8; font-weight: 500; text-transform: uppercase; letter-spacing: 0.04em; }

    /* Tabla */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      background: #f8fafc; padding: 0.6rem 1rem; font-size: 0.68rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;
      border-bottom: 1px solid #e2e8f0; white-space: nowrap; text-align: left;
    }
    .data-table td {
      padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.825rem; color: #334155; white-space: nowrap;
      max-width: 220px; overflow: hidden; text-overflow: ellipsis;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }

    /* Badges */
    .badge { display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; }
    .badge--completada   { background: #dcfce7; color: #15803d; }
    .badge--pendiente    { background: #fef9c3; color: #854d0e; }
    .badge--en_servicio  { background: #dbeafe; color: #1d4ed8; }
    .badge--en_camino    { background: #ede9fe; color: #7c3aed; }
    .badge--asignado     { background: #e0f2fe; color: #0369a1; }
    .badge--prio-urgente { background: #fee2e2; color: #dc2626; }
    .badge--prio-alta    { background: #ffedd5; color: #c2410c; }
    .badge--prio-media   { background: #fef9c3; color: #854d0e; }
    .badge--prio-baja    { background: #f0fdf4; color: #15803d; }

    /* Estados vacíos */
    .empty-state {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 3rem 1rem; color: #94a3b8; font-size: 0.9rem;
    }
    .empty-state svg { width: 40px; height: 40px; }
    .empty-state strong { color: #5cbdb9; }

    .select-prompt {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
      padding: 4rem 1rem; color: #94a3b8; font-size: 0.9rem;
    }
    .select-prompt svg { width: 40px; height: 40px; }
    .select-prompt p { margin: 0; }

    @media (max-width: 900px) {
      .type-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .type-grid { grid-template-columns: 1fr; }
      .filter-row { flex-direction: column; align-items: stretch; }
      .filter-actions { flex-direction: row; }
      .export-group { flex-wrap: wrap; }
      .banner-deco { display: none; }
    }
  `],
})
export class ReportesEstaticosComponent implements OnInit, OnDestroy {
  private readonly auth      = inject(AuthService);
  private readonly svc       = inject(ReportesService);
  private readonly fb        = inject(FormBuilder);
  private readonly cdr       = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroy$  = new Subject<void>();

  reportes = REPORTES_ESTATICOS;
  estados  = ESTADOS;
  tipos    = TIPOS_INCIDENTE;
  filtroForm!: FormGroup;

  tipoActivo:    TipoReporte | null = null;
  reporteActivo: ReporteEstatico | null = null;

  loading      = false;
  exportLoading = false;
  error: string | null = null;
  filas: Record<string, any>[] = [];
  columnas: string[] = [];
  resumen: { label: string; valor: string; color?: string }[] = [];

  ngOnInit(): void {
    this.filtroForm = this.fb.group({
      fecha_desde:    [''],
      fecha_hasta:    [''],
      tipo_incidente: [''],
      estado:         [''],
      zona:           [''],
    });
  }

  getBg(tipo: TipoReporte): string {
    return REPORT_BG[tipo] ?? '#f1f5f9';
  }

  seleccionarTipo(r: ReporteEstatico): void {
    const cambio = this.tipoActivo !== r.tipo;
    this.tipoActivo    = r.tipo;
    this.reporteActivo = r;
    if (cambio) {
      this.filas   = [];
      this.resumen = [];
      this.error   = null;
      if (r.tipo !== 'historial-servicios') {
        this.filtroForm.patchValue({ tipo_incidente: '', estado: '', zona: '' });
      }
      this.cargar();
    }
  }

  cargar(): void {
    if (!this.tipoActivo) return;
    this.loading = true;
    this.error   = null;
    this.filas   = [];
    this.resumen = [];

    this.buildQuery().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res: any) => {
        const rawFilas: Record<string, any>[] = res.datos ?? res.por_taller ?? [];
        const cols = COLUMNAS[this.tipoActivo!];
        this.columnas = rawFilas.length > 0
          ? cols.filter(c => c in rawFilas[0])
          : cols;
        this.filas = rawFilas.map(row => {
          const out: Record<string, any> = {};
          for (const c of this.columnas) out[c] = row[c];
          return out;
        });
        this.resumen = this.buildResumen(res);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = err?.error?.detail || 'Error al cargar el reporte';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  exportar(formato: FormatoExport): void {
    if (!this.tipoActivo || this.exportLoading) return;
    this.exportLoading = true;

    const obs$: Observable<Blob> = this.tipoActivo === 'historial-servicios'
      ? this.svc.exportarDinamico(this.getDinamicoFiltros(), formato)
      : this.svc.exportar(this.tipoActivo, formato, this.getBaseFiltros());

    obs$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const ext = formato === 'excel' ? 'xlsx' : formato;
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `reporte_${this.tipoActivo}_${new Date().toISOString().slice(0, 10)}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exportLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.exportLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  limpiarFiltros(): void { this.filtroForm.reset(); }

  isStatusCol(col: string): boolean { return STATUS_COLS.has(col); }

  getIcon(tipo: TipoReporte): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(REPORT_ICONS[tipo] ?? '');
  }

  badgeClass(col: string, val: any): string {
    return col === 'prioridad' ? `badge--prio-${val}` : `badge--${val}`;
  }

  getLabel(col: string): string {
    return COL_LABELS[col] ?? col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatCell(col: string, val: any): string {
    if (val == null) return '—';
    if (col === 'calificacion') return val === 0 ? '—' : `⭐ ${Number(val).toFixed(1)}`;
    if (DATE_COLS.has(col) && typeof val === 'string') return val.slice(0, 10);
    if (MONEY_COLS.has(col)) return `Bs. ${Number(val).toFixed(2)}`;
    if (PCT_COLS.has(col))   return `${Number(val).toFixed(1)}%`;
    return String(val);
  }

  private buildQuery(): Observable<any> {
    const f = this.getBaseFiltros();
    switch (this.tipoActivo) {
      case 'emergencias':         return this.svc.getEmergencias(f);
      case 'historial-servicios': return this.svc.getDinamico(this.getDinamicoFiltros());
      case 'ingresos':            return this.svc.getIngresos(f);
      case 'calificaciones':      return this.svc.getCalificaciones(f);
      case 'kpis':                return this.svc.getKpis(f);
      case 'incidentes-tipo':     return this.svc.getIncidentesTipo(f);
      case 'sla':                 return this.svc.getSla(f);
      default:                    return this.svc.getDinamico(this.getDinamicoFiltros());
    }
  }

  private getBaseFiltros(): ReporteFiltrosBase {
    const v    = this.filtroForm.value;
    const user = this.auth.getAuthState().currentUser;
    return {
      fecha_desde: v.fecha_desde || undefined,
      fecha_hasta: v.fecha_hasta || undefined,
      taller_id: user?.rol === 'taller'      ? user.taller_id       : undefined,
      org_id:    user?.rol === 'tenant_admin' ? user.organizacion_id : undefined,
    };
  }

  private getDinamicoFiltros(): ReporteDinamicoFiltros {
    const v = this.filtroForm.value;
    return {
      ...this.getBaseFiltros(),
      tipo_incidente: v.tipo_incidente || undefined,
      estado:         v.estado         || undefined,
      zona:           v.zona           || undefined,
    };
  }

  private buildResumen(res: any): { label: string; valor: string; color?: string }[] {
    const r = res.resumen;
    if (!r) return [];
    return Object.entries(r)
      .filter(([, v]) => typeof v !== 'object')
      .map(([k, v]) => {
        const n      = Number(v);
        const isPct  = k.includes('pct');
        const isMoney = k.includes('ingreso') || k.includes('monto');
        return {
          label: COL_LABELS[k] ?? k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          valor: isPct    ? `${n.toFixed(1)}%`
               : isMoney  ? `Bs. ${n.toFixed(2)}`
               : typeof v === 'number' ? (Number.isInteger(n) ? String(n) : n.toFixed(2))
               : String(v),
          color: isMoney ? '#15803d' : isPct ? '#2563eb' : undefined,
        };
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
