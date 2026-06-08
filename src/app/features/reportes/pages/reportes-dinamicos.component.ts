import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { DinamicoReport, FormatoExport } from '../../../core/models/reportes.models';

const ESTADOS = ['pendiente', 'asignado', 'en_camino', 'en_servicio', 'completada'];
const TIPOS_INCIDENTE = ['batería', 'llanta', 'combustible', 'mecánico', 'accidente', 'otro'];

@Component({
  selector: 'app-reportes-dinamicos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Reporte Dinámico</h1>
        <p class="page-sub">Aplica filtros combinados y obtén datos en tiempo real</p>
      </div>

      <!-- Panel de filtros -->
      <div class="filter-panel">
        <h3 class="filter-heading">Filtros</h3>
        <form [formGroup]="filtroForm" (ngSubmit)="buscar()" class="filter-grid">
          <div class="field">
            <label>Fecha desde</label>
            <input formControlName="fecha_desde" type="date"/>
          </div>
          <div class="field">
            <label>Fecha hasta</label>
            <input formControlName="fecha_hasta" type="date"/>
          </div>
          <div class="field">
            <label>Tipo de incidente</label>
            <select formControlName="tipo_incidente">
              <option value="">Todos</option>
              <option *ngFor="let t of tipos" [value]="t">{{ t | titlecase }}</option>
            </select>
          </div>
          <div class="field">
            <label>Estado</label>
            <select formControlName="estado">
              <option value="">Todos</option>
              <option *ngFor="let e of estados" [value]="e">{{ e | titlecase }}</option>
            </select>
          </div>
          <div class="field">
            <label>Zona / Dirección</label>
            <input formControlName="zona" type="text" placeholder="Ciudad, barrio..."/>
          </div>
          <div class="field field--actions">
            <button type="submit" class="btn-primary" [disabled]="loading">
              {{ loading ? 'Buscando...' : 'Generar reporte' }}
            </button>
            <button type="button" class="btn-secondary" (click)="limpiar()">Limpiar</button>
          </div>
        </form>
      </div>

      <!-- Estado carga -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <span>Generando reporte con datos en tiempo real...</span>
      </div>

      <div class="alert-error" *ngIf="error && !loading">{{ error }}</div>

      <!-- Resultados -->
      <ng-container *ngIf="!loading && resultado">
        <!-- Resumen -->
        <div class="summary-bar">
          <div class="s-item">
            <span class="s-num">{{ resultado.resumen.total_registros }}</span>
            <span class="s-lbl">Registros</span>
          </div>
          <div class="s-item">
            <span class="s-num green">Bs. {{ resultado.resumen.ingresos_totales | number:'1.2-2' }}</span>
            <span class="s-lbl">Ingresos totales</span>
          </div>
          <div class="s-item">
            <span class="s-num">⭐ {{ resultado.resumen.calificacion_promedio | number:'1.2-2' }}</span>
            <span class="s-lbl">Cal. promedio</span>
          </div>
          <div class="export-group">
            <span class="export-label">Exportar:</span>
            <button class="btn-export" (click)="exportar('csv')">CSV</button>
            <button class="btn-export" (click)="exportar('excel')">Excel</button>
            <button class="btn-export btn-export--pdf" (click)="exportar('pdf')">PDF</button>
          </div>
        </div>

        <!-- Filtros activos -->
        <div class="chips-row" *ngIf="filtrosActivos.length">
          <span class="chip-label">Filtros activos:</span>
          <span class="chip" *ngFor="let chip of filtrosActivos">{{ chip }}</span>
        </div>

        <!-- Tabla -->
        <div class="table-wrap" *ngIf="resultado.datos.length">
          <table class="data-table">
            <thead>
              <tr>
                <th *ngFor="let col of columnas">{{ col | titlecase }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let fila of resultado.datos">
                <td *ngFor="let col of columnas">
                  <span *ngIf="col === 'estado'" class="badge" [class]="'badge--' + fila[col]">
                    {{ fila[col] ?? '—' }}
                  </span>
                  <span *ngIf="col !== 'estado'">{{ fila[col] ?? '—' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="resultado.datos.length === 0">
          No hay registros para los filtros seleccionados.
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .filter-panel {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1.25rem; margin-bottom: 1.5rem;
    }
    .filter-heading { font-size: 0.85rem; font-weight: 700; color: #475569; margin: 0 0 1rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .filter-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.85rem; }
    .field { display: flex; flex-direction: column; gap: 0.3rem; }
    .field--actions { display: flex; flex-direction: row; align-items: flex-end; gap: 0.5rem; }
    .field label { font-size: 0.78rem; font-weight: 600; color: #475569; }
    .field input, .field select {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white;
    }
    .field input:focus, .field select:focus { outline: none; border-color: #5cbdb9; }

    .btn-primary {
      padding: 0.55rem 1.1rem; background: #5cbdb9; color: white;
      border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
    }
    .btn-primary:hover:not(:disabled) { background: #3aa7a2; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }
    .btn-secondary {
      padding: 0.55rem 1rem; background: #f1f5f9; color: #475569;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    .loading-state {
      display: flex; align-items: center; gap: 0.75rem; padding: 2rem;
      color: #94a3b8; font-size: 0.875rem;
    }
    .spinner {
      width: 20px; height: 20px; border: 2.5px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .alert-error {
      padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; color: #dc2626; font-size: 0.875rem; margin-bottom: 1rem;
    }

    .summary-bar {
      display: flex; align-items: center; gap: 1.5rem; background: white;
      border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem 1.25rem;
      margin-bottom: 1rem; flex-wrap: wrap;
    }
    .s-item { display: flex; flex-direction: column; gap: 0.15rem; }
    .s-num { font-size: 1.2rem; font-weight: 800; color: #0f172a; }
    .s-num.green { color: #15803d; }
    .s-lbl { font-size: 0.75rem; color: #64748b; }
    .export-group { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; flex-wrap: wrap; }
    .export-label { font-size: 0.78rem; color: #64748b; font-weight: 600; }

    .btn-export {
      padding: 0.4rem 0.8rem; background: #f1f5f9; color: #334155;
      border: 1px solid #e2e8f0; border-radius: 7px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer; transition: background 0.18s;
    }
    .btn-export:hover { background: #e2e8f0; }
    .btn-export--pdf { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .btn-export--pdf:hover { background: #fecaca; }

    .chips-row {
      display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .chip-label { font-size: 0.78rem; color: #64748b; }
    .chip {
      padding: 0.2rem 0.6rem; background: #e0f2fe; color: #0369a1;
      border-radius: 20px; font-size: 0.78rem; font-weight: 600;
    }

    .table-wrap {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow-x: auto;
    }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th {
      background: #f8fafc; padding: 0.65rem 1rem; font-size: 0.75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.04em; color: #64748b;
      border-bottom: 1px solid #e2e8f0; white-space: nowrap;
    }
    .data-table td {
      padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9;
      font-size: 0.83rem; color: #334155; white-space: nowrap;
    }
    .data-table tr:last-child td { border-bottom: none; }
    .data-table tbody tr:hover { background: #f8fafc; }

    .badge {
      display: inline-block; padding: 0.2rem 0.6rem; border-radius: 20px;
      font-size: 0.75rem; font-weight: 600;
    }
    .badge--completada   { background: #dcfce7; color: #15803d; }
    .badge--pendiente    { background: #fef9c3; color: #854d0e; }
    .badge--en_servicio  { background: #dbeafe; color: #1d4ed8; }
    .badge--en_camino    { background: #ede9fe; color: #7c3aed; }
    .badge--asignado     { background: #e0f2fe; color: #0369a1; }

    .empty-state {
      display: flex; justify-content: center; padding: 3rem;
      color: #94a3b8; font-size: 0.9rem;
    }

    @media (max-width: 600px) {
      .filter-grid { grid-template-columns: 1fr; }
      .field--actions { flex-direction: column; }
    }
  `],
})
export class ReportesDinamicosComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private svc     = inject(ReportesService);
  private fb      = inject(FormBuilder);
  private cdr     = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  filtroForm!: FormGroup;
  estados = ESTADOS;
  tipos = TIPOS_INCIDENTE;

  loading = false;
  error: string | null = null;
  resultado: DinamicoReport | null = null;
  columnas: string[] = [];
  filtrosActivos: string[] = [];

  ngOnInit(): void {
    this.filtroForm = this.fb.group({
      fecha_desde:    [''],
      fecha_hasta:    [''],
      tipo_incidente: [''],
      estado:         [''],
      zona:           [''],
    });
  }

  buscar(): void {
    const v = this.filtroForm.value;
    const user = this.auth.getAuthState().currentUser;

    const filtros = {
      fecha_desde:    v.fecha_desde    || undefined,
      fecha_hasta:    v.fecha_hasta    || undefined,
      tipo_incidente: v.tipo_incidente || undefined,
      estado:         v.estado         || undefined,
      zona:           v.zona           || undefined,
      taller_id: user?.rol === 'taller'       ? user.taller_id       : undefined,
      org_id:    user?.rol === 'tenant_admin'  ? user.organizacion_id : undefined,
    };

    this.filtrosActivos = Object.entries(filtros)
      .filter(([k, val]) => val && !['taller_id', 'org_id'].includes(k))
      .map(([k, val]) => `${k.replace('_', ' ')}: ${val}`);

    this.loading = true;
    this.error = null;

    this.svc.getDinamico(filtros).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.resultado = res;
        this.columnas = res.datos.length ? Object.keys(res.datos[0]) : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.error = err?.error?.detail || 'Error al generar el reporte';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  exportar(formato: FormatoExport): void {
    const v = this.filtroForm.value;
    const user = this.auth.getAuthState().currentUser;
    const filtros = {
      fecha_desde:    v.fecha_desde    || undefined,
      fecha_hasta:    v.fecha_hasta    || undefined,
      tipo_incidente: v.tipo_incidente || undefined,
      estado:         v.estado         || undefined,
      zona:           v.zona           || undefined,
      taller_id: user?.rol === 'taller'       ? user.taller_id       : undefined,
      org_id:    user?.rol === 'tenant_admin'  ? user.organizacion_id : undefined,
    };

    this.svc.exportarDinamico(filtros, formato)
      .pipe(takeUntil(this.destroy$))
      .subscribe(blob => {
        const ext = formato === 'excel' ? 'xlsx' : formato;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_dinamico_${new Date().toISOString().slice(0,10)}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  limpiar(): void {
    this.filtroForm.reset();
    this.resultado = null;
    this.filtrosActivos = [];
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
