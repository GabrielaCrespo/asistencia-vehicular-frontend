import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
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

      <!-- Breadcrumb (solo visible para rol taller) -->
      <div class="breadcrumb" *ngIf="esTaller">
        <button class="btn-back" (click)="goBack()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Volver al dashboard
        </button>
        <span class="breadcrumb-sep">/</span>
        <span class="breadcrumb-current">Reportes</span>
      </div>

      <!-- Banner principal -->
      <div class="page-banner">
        <div class="banner-body">
          <div class="banner-icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6"  y1="20" x2="6"  y2="14"/>
            </svg>
          </div>
          <div>
            <p class="banner-eyebrow">Centro de análisis</p>
            <h1 class="banner-title">Reportes</h1>
            <p class="banner-sub">Genera, filtra y exporta datos operativos del taller</p>
          </div>
        </div>
        <div class="banner-deco" aria-hidden="true">
          <svg viewBox="0 0 120 80" fill="none">
            <rect x="6"  y="40" width="14" height="36" rx="4" fill="rgba(255,255,255,0.12)"/>
            <rect x="28" y="20" width="14" height="56" rx="4" fill="rgba(255,255,255,0.18)"/>
            <rect x="50" y="30" width="14" height="46" rx="4" fill="rgba(255,255,255,0.12)"/>
            <rect x="72" y="10" width="14" height="66" rx="4" fill="rgba(255,255,255,0.2)"/>
            <rect x="94" y="24" width="14" height="52" rx="4" fill="rgba(255,255,255,0.14)"/>
          </svg>
        </div>
      </div>

      <!-- Selector de tipo -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-header-left">
            <h2 class="panel-title">Tipo de reporte</h2>
            <span class="panel-badge">{{ reportes.length }} disponibles</span>
          </div>
        </div>
        <div class="type-grid">
          <button *ngFor="let r of reportes"
                  class="type-card"
                  [class.type-card--active]="tipoActivo === r.tipo"
                  [style.--cc]="r.color"
                  [style.--cb]="getBg(r.tipo)"
                  (click)="seleccionarTipo(r)">
            <div class="type-icon" [innerHTML]="getIcon(r.tipo)"></div>
            <div class="type-info">
              <span class="type-name">{{ r.titulo }}</span>
              <span class="type-desc">{{ r.descripcion }}</span>
            </div>
            <svg class="type-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Filtros + Resultados -->
      <ng-container *ngIf="tipoActivo">

        <!-- Panel filtros -->
        <div class="panel">
          <div class="panel-header">
            <div class="panel-header-left">
              <div class="panel-icon-sm" [style.background]="getBg(tipoActivo!)" [style.color]="reporteActivo?.color" [innerHTML]="getIcon(tipoActivo!)"></div>
              <h2 class="panel-title">{{ reporteActivo?.titulo }}</h2>
            </div>
            <button type="button" class="btn-ghost" (click)="limpiarFiltros()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
              </svg>
              Limpiar filtros
            </button>
          </div>
          <form [formGroup]="filtroForm" class="filter-row">
            <div class="field">
              <label>Desde</label>
              <input formControlName="fecha_desde" type="date"/>
            </div>
            <div class="field">
              <label>Hasta</label>
              <input formControlName="fecha_hasta" type="date"/>
            </div>
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
                <input formControlName="zona" type="text" placeholder="Ej: La Paz, Miraflores…"/>
              </div>
            </ng-container>
            <div class="filter-actions">
              <button type="button" class="btn-primary" (click)="cargar()" [disabled]="loading">
                <svg *ngIf="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <span class="spin-sm" *ngIf="loading"></span>
                {{ loading ? 'Generando…' : 'Generar reporte' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Panel resultados -->
        <div class="panel result-panel">

          <!-- Cabecera resultados -->
          <div class="result-header">
            <div class="result-header-left">
              <h2 class="panel-title">Resultados</h2>
              <span class="record-count" *ngIf="!loading && filas.length">
                {{ filas.length }} registro{{ filas.length !== 1 ? 's' : '' }}
              </span>
            </div>
            <div class="export-row" *ngIf="!loading && filas.length">
              <span class="export-label">Exportar como</span>
              <button class="btn-export" (click)="exportar('csv')"   [disabled]="exportLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                CSV
              </button>
              <button class="btn-export" (click)="exportar('excel')" [disabled]="exportLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12l4 4 4-4M12 8v8"/></svg>
                Excel
              </button>
              <button class="btn-export btn-export--pdf" (click)="exportar('pdf')" [disabled]="exportLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                PDF
              </button>
            </div>
          </div>

          <!-- Estado cargando -->
          <div class="state-loading" *ngIf="loading">
            <div class="spinner"></div>
            <span>Generando reporte…</span>
          </div>

          <!-- Estado error -->
          <div class="state-error" *ngIf="error && !loading">
            <div class="state-error-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <div>
              <p class="state-error-title">No se pudo generar el reporte</p>
              <p class="state-error-msg">{{ error }}</p>
            </div>
          </div>

          <!-- KPIs -->
          <div class="kpi-row" *ngIf="!loading && resumen.length">
            <div class="kpi-card" *ngFor="let s of resumen">
              <span class="kpi-val" [style.color]="s.color || '#0f172a'">{{ s.valor }}</span>
              <span class="kpi-label">{{ s.label }}</span>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-wrap" *ngIf="!loading && filas.length">
            <table class="data-table">
              <thead>
                <tr><th *ngFor="let col of columnas">{{ getLabel(col) }}</th></tr>
              </thead>
              <tbody>
                <tr *ngFor="let fila of filas">
                  <td *ngFor="let col of columnas">
                    <span *ngIf="isStatusCol(col)" class="status-badge" [class]="badgeClass(col, fila[col])">{{ fila[col] ?? '—' }}</span>
                    <span *ngIf="!isStatusCol(col)">{{ formatCell(col, fila[col]) }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Estado vacío -->
          <div class="state-empty" *ngIf="!loading && !filas.length && !error">
            <div class="state-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
              </svg>
            </div>
            <p class="state-empty-title">Sin datos aún</p>
            <p class="state-empty-sub">Ajusta los filtros y haz clic en <strong>Generar reporte</strong></p>
          </div>

        </div>
      </ng-container>

      <!-- Estado sin selección -->
      <div class="state-pick" *ngIf="!tipoActivo">
        <div class="state-pick-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <p class="state-pick-title">Selecciona un tipo de reporte</p>
        <p class="state-pick-sub">Elige una categoría de arriba para ver sus filtros y resultados</p>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }
    :host { display: block; overflow-x: hidden; }

    /* ── Layout base ─────────────────────────────────────── */
    .page {
      max-width: 1100px; margin: 0 auto;
      display: flex; flex-direction: column; gap: 1.25rem;
      padding-bottom: 2rem;
    }

    /* ── Breadcrumb / back ───────────────────────────────── */
    .breadcrumb {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.8rem; color: #94a3b8;
    }
    .breadcrumb-sep { color: #cbd5e1; }
    .breadcrumb-current { color: #475569; font-weight: 600; }
    .btn-back {
      display: inline-flex; align-items: center; gap: 0.3rem;
      background: none; border: none; padding: 0.25rem 0.5rem 0.25rem 0;
      color: #5cbdb9; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; border-radius: 6px;
      transition: color 0.18s, background 0.18s;
    }
    .btn-back svg { width: 14px; height: 14px; }
    .btn-back:hover { color: #3aa7a2; background: #f0fdfa; padding-left: 0.25rem; }

    /* ── Banner principal ────────────────────────────────── */
    .page-banner {
      background: linear-gradient(135deg, #5cbdb9 0%, #3aa7a2 100%);
      border-radius: 18px; padding: 1.6rem 2rem;
      display: flex; align-items: center; justify-content: space-between;
      overflow: hidden; position: relative;
      box-shadow: 0 4px 20px rgba(58,167,162,0.28);
    }
    .banner-body { display: flex; align-items: center; gap: 1.25rem; position: relative; z-index: 1; }
    .banner-icon-wrap {
      width: 56px; height: 56px; border-radius: 16px; flex-shrink: 0;
      background: rgba(255,255,255,0.18); border: 1.5px solid rgba(255,255,255,0.3);
      display: flex; align-items: center; justify-content: center; color: white;
    }
    .banner-icon-wrap svg { width: 26px; height: 26px; }
    .banner-eyebrow {
      font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.75);
      text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 0.2rem;
    }
    .banner-title {
      font-size: clamp(1.3rem, 2.5vw, 1.65rem); font-weight: 800;
      color: white; margin: 0 0 0.2rem; letter-spacing: -0.4px;
    }
    .banner-sub { font-size: 0.82rem; color: rgba(255,255,255,0.72); margin: 0; }
    .banner-deco {
      width: 130px; height: 80px; flex-shrink: 0; opacity: 0.9;
      position: relative; z-index: 1;
    }

    /* ── Panel genérico ──────────────────────────────────── */
    .panel {
      background: white; border: 1px solid #e2e8f0; border-radius: 20px;
      padding: 1.5rem 1.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .panel-header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;
    }
    .panel-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .panel-title { font-size: 1.05rem; font-weight: 700; color: #0f172a; margin: 0; }
    .panel-badge {
      background: #ebf6f5; color: #0e6b67; border: 1px solid rgba(92,189,185,0.35);
      border-radius: 100px; padding: 0.2rem 0.65rem;
      font-size: 0.72rem; font-weight: 700; letter-spacing: 0.03em;
    }
    .panel-icon-sm {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .panel-icon-sm ::ng-deep svg { width: 18px; height: 18px; }

    /* ── Tarjetas tipo reporte ───────────────────────────── */
    .type-grid {
      display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.75rem;
    }
    /* Centra la tarjeta sola en la última fila (7 ítems → 7 mod 3 = 1) */
    .type-card:last-child:nth-child(3n + 1) { grid-column: 2 / 3; }
    .type-card {
      display: flex; align-items: center; gap: 0.85rem;
      padding: 0.9rem 1rem; background: white;
      border: 1.5px solid #e2e8f0; border-radius: 14px;
      cursor: pointer; text-align: left; width: 100%;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s;
    }
    .type-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(0,0,0,0.07);
      border-color: color-mix(in srgb, var(--cc, #5cbdb9) 50%, transparent);
    }
    .type-card--active {
      border-color: var(--cc, #5cbdb9);
      background: var(--cb, #f0fdfa);
      box-shadow: 0 4px 14px rgba(92,189,185,0.15);
    }
    .type-icon {
      width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      background: var(--cb, #ebf6f5); color: var(--cc, #5cbdb9);
      transition: transform 0.2s;
    }
    .type-card:hover .type-icon, .type-card--active .type-icon { transform: scale(1.08); }
    .type-icon ::ng-deep svg { width: 19px; height: 19px; }
    .type-info { flex: 1; min-width: 0; }
    .type-name {
      display: block; font-size: 0.8rem; font-weight: 700; color: #0f172a;
      margin-bottom: 0.1rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .type-desc {
      display: block; font-size: 0.68rem; color: #94a3b8; line-height: 1.35;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .type-chevron {
      width: 15px; height: 15px; flex-shrink: 0;
      color: #cbd5e1; transition: color 0.2s, transform 0.2s;
    }
    .type-card:hover .type-chevron { color: var(--cc, #5cbdb9); transform: translateX(2px); }
    .type-card--active .type-chevron { color: var(--cc, #5cbdb9); }

    /* ── Botones ─────────────────────────────────────────── */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.45rem;
      padding: 0.6rem 1.25rem;
      background: linear-gradient(135deg, #5cbdb9, #3aa7a2);
      color: white; border: none; border-radius: 10px;
      font-size: 0.875rem; font-weight: 700; cursor: pointer; white-space: nowrap;
      box-shadow: 0 2px 8px rgba(58,167,162,0.3);
      transition: all 0.18s ease;
    }
    .btn-primary svg { width: 15px; height: 15px; }
    .btn-primary:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(58,167,162,0.4); }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

    .btn-ghost {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem; border: 1.5px solid #e2e8f0;
      background: white; color: #64748b; border-radius: 10px;
      font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: all 0.18s ease;
    }
    .btn-ghost svg { width: 13px; height: 13px; }
    .btn-ghost:hover { background: #f8fafc; color: #0f172a; border-color: #cbd5e1; }

    .spin-sm {
      width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.35);
      border-top-color: white; border-radius: 50%;
      animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Filtros ─────────────────────────────────────────── */
    .filter-row { display: flex; align-items: flex-end; gap: 0.85rem; flex-wrap: wrap; }
    .field { display: flex; flex-direction: column; gap: 0.35rem; }
    .field--wide { flex: 1; min-width: 180px; }
    .field label { font-size: 0.72rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; }
    .field input, .field select {
      padding: 0.6rem 0.85rem; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.875rem; color: #334155; background: white; width: 100%; min-width: 0;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .field input:focus, .field select:focus {
      outline: none; border-color: #5cbdb9;
      box-shadow: 0 0 0 3px rgba(92,189,185,0.12);
    }
    .filter-actions { display: flex; align-items: flex-end; flex-shrink: 0; }

    /* ── Panel resultados ────────────────────────────────── */
    .result-panel { padding: 0; overflow: hidden; }
    .result-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.75rem; border-bottom: 1px solid #f1f5f9;
      flex-wrap: wrap; gap: 0.75rem;
    }
    .result-header-left { display: flex; align-items: center; gap: 0.75rem; }
    .record-count {
      background: #ebf6f5; color: #0e6b67; border: 1px solid rgba(92,189,185,0.3);
      border-radius: 100px; padding: 0.2rem 0.65rem;
      font-size: 0.72rem; font-weight: 700;
    }
    .export-row { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .export-label { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .btn-export {
      display: inline-flex; align-items: center; gap: 0.35rem;
      padding: 0.4rem 0.8rem; border: 1.5px solid #e2e8f0;
      background: white; color: #475569; border-radius: 8px;
      font-size: 0.78rem; font-weight: 600; cursor: pointer;
      transition: all 0.18s ease; white-space: nowrap;
    }
    .btn-export svg { width: 13px; height: 13px; }
    .btn-export:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; color: #0f172a; }
    .btn-export--pdf { color: #dc2626; border-color: #fecaca; background: #fef2f2; }
    .btn-export--pdf:hover:not(:disabled) { background: #fee2e2; border-color: #fca5a5; }
    .btn-export:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── KPIs ────────────────────────────────────────────── */
    .kpi-row {
      display: flex; flex-wrap: wrap; gap: 0;
      border-bottom: 1px solid #f1f5f9;
    }
    .kpi-card {
      display: flex; flex-direction: column; gap: 0.2rem;
      padding: 1.1rem 1.75rem; flex: 1; min-width: 130px;
      border-right: 1px solid #f1f5f9;
    }
    .kpi-card:last-child { border-right: none; }
    .kpi-val { font-size: 1.45rem; font-weight: 800; letter-spacing: -0.4px; line-height: 1; }
    .kpi-label { font-size: 0.7rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

    /* ── Tabla ───────────────────────────────────────────── */
    .table-wrap { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      background: #f8fafc; padding: 0.7rem 1.25rem;
      font-size: 0.68rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #64748b;
      border-bottom: 1px solid #e2e8f0; white-space: nowrap; text-align: left;
    }
    .data-table td {
      padding: 0.85rem 1.25rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.84rem; color: #334155; white-space: nowrap;
      max-width: 220px; overflow: hidden; text-overflow: ellipsis;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }

    /* ── Status badges ───────────────────────────────────── */
    .status-badge {
      display: inline-block; padding: 0.22rem 0.65rem;
      border-radius: 100px; font-size: 0.72rem; font-weight: 700;
    }
    .status-badge.badge--completada   { background: #dcfce7; color: #15803d; }
    .status-badge.badge--pendiente    { background: #fef9c3; color: #854d0e; }
    .status-badge.badge--en_servicio  { background: #dbeafe; color: #1d4ed8; }
    .status-badge.badge--en_camino    { background: #ede9fe; color: #7c3aed; }
    .status-badge.badge--asignado     { background: #e0f2fe; color: #0369a1; }
    .status-badge.badge--prio-urgente { background: #fee2e2; color: #dc2626; }
    .status-badge.badge--prio-alta    { background: #ffedd5; color: #c2410c; }
    .status-badge.badge--prio-media   { background: #fef9c3; color: #854d0e; }
    .status-badge.badge--prio-baja    { background: #dcfce7; color: #15803d; }

    /* ── Estados ─────────────────────────────────────────── */
    .state-loading {
      display: flex; align-items: center; gap: 1rem;
      padding: 3rem 1.75rem; color: #94a3b8; font-size: 0.9rem;
    }
    .spinner {
      width: 26px; height: 26px; border: 2.5px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.75s linear infinite; flex-shrink: 0;
    }
    .state-error {
      display: flex; align-items: flex-start; gap: 0.85rem;
      margin: 1.25rem 1.75rem; padding: 1rem 1.25rem;
      background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px;
    }
    .state-error-icon {
      width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
      background: #fee2e2; color: #dc2626;
      display: flex; align-items: center; justify-content: center;
    }
    .state-error-icon svg { width: 18px; height: 18px; }
    .state-error-title { font-size: 0.875rem; font-weight: 700; color: #dc2626; margin: 0 0 0.2rem; }
    .state-error-msg   { font-size: 0.8rem; color: #ef4444; margin: 0; }
    .state-empty, .state-pick {
      display: flex; flex-direction: column; align-items: center;
      padding: 3.5rem 1rem; gap: 0.6rem; text-align: center;
    }
    .state-empty-icon, .state-pick-icon {
      width: 60px; height: 60px; border-radius: 18px;
      background: #f1f5f9; color: #cbd5e1;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 0.25rem;
    }
    .state-empty-icon svg, .state-pick-icon svg { width: 28px; height: 28px; }
    .state-empty-title, .state-pick-title { font-size: 0.95rem; font-weight: 700; color: #475569; margin: 0; }
    .state-empty-sub, .state-pick-sub { font-size: 0.8rem; color: #94a3b8; margin: 0; }
    .state-empty-sub strong, .state-pick-sub strong { color: #5cbdb9; }

    /* ── Responsive ──────────────────────────────────────── */
    @media (max-width: 900px) {
      .type-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .type-card:last-child:nth-child(3n + 1) { grid-column: auto; }
      .banner-deco { display: none; }
    }
    @media (max-width: 580px) {
      .page { gap: 1rem; }
      .page-banner { padding: 1.25rem; }
      .panel { padding: 1.1rem 1.25rem; }
      .type-grid { grid-template-columns: minmax(0, 1fr); }
      .filter-row { flex-direction: column; align-items: stretch; }
      .field { min-width: 0; }
      .filter-actions { flex-direction: row; }
      .result-header { flex-direction: column; align-items: flex-start; }
      .kpi-card { min-width: 50%; }
      .export-row { flex-wrap: wrap; }
    }
  `],
})
export class ReportesEstaticosComponent implements OnInit, OnDestroy {
  private readonly auth      = inject(AuthService);
  private readonly svc       = inject(ReportesService);
  private readonly fb        = inject(FormBuilder);
  private readonly cdr       = inject(ChangeDetectorRef);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly router    = inject(Router);
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

  get esTaller(): boolean {
    return this.auth.getAuthState().currentUser?.rol === 'taller';
  }

  goBack(): void { this.router.navigate(['/dashboard']); }

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
