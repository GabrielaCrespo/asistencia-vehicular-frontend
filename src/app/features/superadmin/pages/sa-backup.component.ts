import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-backup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-page">

      <!-- Cabecera -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Copias de Seguridad</h1>
          <p class="page-sub">Gestión de respaldos manuales y configuración de respaldos automáticos</p>
        </div>
      </div>

      <!-- ─────────────────── SECCIÓN 1: RESPALDO MANUAL ─────────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-icon section-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Respaldo Manual</h2>
            <p class="section-sub">Descarga un archivo CSV con todos los datos principales del sistema en este momento.</p>
          </div>
        </div>

        <div class="manual-body">
          <div class="info-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>El archivo incluye: organizaciones, talleres, usuarios, técnicos, incidentes, asignaciones, cotizaciones y pagos.</span>
          </div>

          <div class="alert alert--success" *ngIf="manualSuccess">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ manualSuccess }}
          </div>
          <div class="alert alert--error" *ngIf="manualError">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ manualError }}
          </div>

          <button class="btn-download" (click)="descargarBackup()" [disabled]="downloading">
            <span class="btn-spinner" *ngIf="downloading"></span>
            <svg *ngIf="!downloading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ downloading ? 'Generando respaldo...' : 'Descargar Ahora' }}
          </button>
          <span class="filename-hint">Nombre del archivo: backup_YYYYMMDD_HHMMSS.csv</span>
        </div>
      </div>

      <!-- ─────────────────── SECCIÓN 2: RESPALDO AUTOMÁTICO ─────────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-icon section-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Programación de Respaldo Automático</h2>
            <p class="section-sub">Configure la frecuencia y política de retención para los respaldos automáticos.</p>
          </div>
          <div class="toggle-wrap">
            <label class="toggle-label">
              <input type="checkbox" [(ngModel)]="config.activo" class="toggle-input"/>
              <span class="toggle-track" [class.active]="config.activo"></span>
            </label>
            <span class="toggle-text" [class.active]="config.activo">
              {{ config.activo ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>

        <div class="config-body" [class.disabled]="!config.activo">
          <div class="config-grid">

            <div class="field-group">
              <label class="field-label">Frecuencia</label>
              <select [(ngModel)]="config.frecuencia" class="field-select" [disabled]="!config.activo">
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            <div class="field-group">
              <label class="field-label">Hora de ejecución</label>
              <input type="time" [(ngModel)]="config.hora" class="field-input" [disabled]="!config.activo"/>
            </div>

            <div class="field-group">
              <label class="field-label">Política de retención</label>
              <select [(ngModel)]="config.retencion_dias" class="field-select" [disabled]="!config.activo">
                <option [value]="7">7 días</option>
                <option [value]="15">15 días</option>
                <option [value]="30">30 días</option>
              </select>
            </div>

          </div>

          <div class="config-preview" *ngIf="config.activo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <span>
              Se generará un respaldo <strong>{{ config.frecuencia }}</strong>
              a las <strong>{{ config.hora }}</strong>,
              conservando los últimos <strong>{{ config.retencion_dias }} días</strong>.
            </span>
          </div>
        </div>

        <div class="alert alert--success" *ngIf="configSuccess">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {{ configSuccess }}
        </div>
        <div class="alert alert--error" *ngIf="configError">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ configError }}
        </div>

        <div class="section-footer">
          <button class="btn-save" (click)="guardarConfig()" [disabled]="savingConfig">
            <span class="btn-spinner" *ngIf="savingConfig"></span>
            <svg *ngIf="!savingConfig" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {{ savingConfig ? 'Guardando...' : 'Guardar Configuración' }}
          </button>
        </div>
      </div>

      <!-- ─────────────────── SECCIÓN 3: HISTORIAL ─────────────────── -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-icon section-icon--slate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 class="section-title">Historial de Respaldos</h2>
            <p class="section-sub">Registro de todos los respaldos generados y programados.</p>
          </div>
          <button class="btn-refresh" (click)="loadHistorial()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            Actualizar
          </button>
        </div>

        <div class="loading-wrap" *ngIf="loadingHistorial">
          <div class="spinner"></div>
          <span>Cargando historial...</span>
        </div>

        <div class="table-wrap" *ngIf="!loadingHistorial">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Archivo / Notas</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let h of historial">
                <td class="date-cell">
                  <div>{{ h.fecha | date:'dd/MM/yyyy' }}</div>
                  <div class="time">{{ h.fecha | date:'HH:mm:ss' }}</div>
                </td>
                <td>
                  <span class="badge" [ngClass]="h.tipo === 'manual' ? 'badge--manual' : 'badge--auto'">
                    {{ h.tipo === 'manual' ? 'Manual' : 'Automático' }}
                  </span>
                </td>
                <td>
                  <span class="badge" [ngClass]="estadoClass(h.estado)">{{ estadoLabel(h.estado) }}</span>
                </td>
                <td class="notes-cell">{{ h.nombre_archivo || h.notas || '—' }}</td>
                <td class="user-cell">{{ h.usuario_nombre }}</td>
              </tr>
              <tr *ngIf="historial.length === 0">
                <td colspan="5" class="empty-msg">Sin registros de respaldos aún.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .sa-page { max-width: 960px; display: flex; flex-direction: column; gap: 1.5rem; }

    /* HEADER */
    .page-header { margin-bottom: 0; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub   { font-size: 0.875rem; color: #64748b; margin: 0; }

    /* SECTION CARD */
    .section-card {
      background: white; border-radius: 16px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 4px rgba(0,0,0,.06); padding: 1.5rem;
    }

    .section-header {
      display: flex; align-items: flex-start; gap: 1rem;
      margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .section-icon {
      width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .section-icon svg { width: 20px; height: 20px; }
    .section-icon--blue   { background: #eff6ff; color: #2563eb; }
    .section-icon--purple { background: #f5f3ff; color: #7c3aed; }
    .section-icon--slate  { background: #f8fafc; color: #475569; }

    .section-title { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0 0 0.2rem; }
    .section-sub   { font-size: 0.82rem; color: #64748b; margin: 0; }

    /* TOGGLE */
    .toggle-wrap { display: flex; align-items: center; gap: 0.5rem; margin-left: auto; align-self: center; }
    .toggle-label { position: relative; display: inline-block; cursor: pointer; }
    .toggle-input { position: absolute; opacity: 0; width: 0; height: 0; }
    .toggle-track {
      display: block; width: 42px; height: 24px; border-radius: 99px;
      background: #cbd5e1; transition: background 0.2s;
      position: relative;
    }
    .toggle-track::after {
      content: ''; position: absolute; top: 3px; left: 3px;
      width: 18px; height: 18px; border-radius: 50%; background: white;
      transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
    }
    .toggle-track.active { background: #7c3aed; }
    .toggle-track.active::after { transform: translateX(18px); }
    .toggle-text { font-size: 0.83rem; font-weight: 600; color: #94a3b8; }
    .toggle-text.active { color: #7c3aed; }

    /* MANUAL BACKUP */
    .manual-body { display: flex; flex-direction: column; gap: 1rem; }
    .info-box {
      display: flex; align-items: flex-start; gap: 0.6rem;
      background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 10px;
      padding: 0.75rem 1rem; font-size: 0.83rem; color: #0369a1;
    }
    .info-box svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    .btn-download {
      display: inline-flex; align-items: center; gap: 0.5rem; align-self: flex-start;
      background: #2563eb; color: white; border: none; border-radius: 10px;
      padding: 0.65rem 1.4rem; font-size: 0.9rem; font-weight: 600;
      cursor: pointer; transition: background 0.18s;
    }
    .btn-download svg { width: 18px; height: 18px; }
    .btn-download:hover:not(:disabled) { background: #1d4ed8; }
    .btn-download:disabled { opacity: 0.6; cursor: not-allowed; }

    .filename-hint { font-size: 0.75rem; color: #94a3b8; font-family: monospace; }

    /* AUTO CONFIG */
    .config-body { transition: opacity 0.2s; }
    .config-body.disabled { opacity: 0.45; pointer-events: none; }

    .config-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem; margin-bottom: 1rem;
    }
    .field-group { display: flex; flex-direction: column; gap: 0.35rem; }
    .field-label { font-size: 0.8rem; font-weight: 600; color: #475569; }
    .field-select, .field-input {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #1e293b; background: white;
      transition: border-color 0.15s;
    }
    .field-select:focus, .field-input:focus {
      outline: none; border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.1);
    }
    .field-select:disabled, .field-input:disabled { background: #f8fafc; color: #94a3b8; }

    .config-preview {
      display: flex; align-items: flex-start; gap: 0.6rem;
      background: #f5f3ff; border: 1px solid #ddd6fe; border-radius: 10px;
      padding: 0.75rem 1rem; font-size: 0.83rem; color: #6d28d9;
    }
    .config-preview svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }

    .section-footer { margin-top: 1.25rem; padding-top: 1rem; border-top: 1px solid #f1f5f9; }

    .btn-save {
      display: inline-flex; align-items: center; gap: 0.5rem;
      background: #7c3aed; color: white; border: none; border-radius: 10px;
      padding: 0.6rem 1.25rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.18s;
    }
    .btn-save svg { width: 16px; height: 16px; }
    .btn-save:hover:not(:disabled) { background: #6d28d9; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 0.4rem; margin-left: auto; align-self: center;
      padding: 0.45rem 0.9rem; background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0;
      border-radius: 8px; font-size: 0.82rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
    }
    .btn-refresh svg { width: 13px; height: 13px; }
    .btn-refresh:hover { background: #e2e8f0; }

    /* ALERTS */
    .alert {
      display: flex; align-items: flex-start; gap: 0.6rem;
      border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.83rem; font-weight: 500;
    }
    .alert svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
    .alert--success { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; }
    .alert--error   { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; }

    /* LOADING */
    .loading-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 2rem; color: #64748b; }
    .spinner {
      width: 20px; height: 20px; border: 3px solid #e2e8f0;
      border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }
    .btn-spinner {
      width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
      display: inline-block; flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* TABLE */
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    th {
      padding: 0.6rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em;
      border-bottom: 1px solid #f1f5f9; background: #fafafa;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }

    .date-cell { white-space: nowrap; font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .time { font-size: 0.72rem; color: #94a3b8; font-weight: 400; }
    .notes-cell { max-width: 280px; font-size: 0.78rem; color: #475569; word-break: break-all; }
    .user-cell { font-size: 0.8rem; color: #334155; }
    .empty-msg { text-align: center; color: #94a3b8; padding: 2.5rem !important; }

    .badge {
      display: inline-block; padding: 0.2rem 0.6rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700;
    }
    .badge--manual     { background: #dbeafe; color: #1d4ed8; }
    .badge--auto       { background: #f3e8ff; color: #7e22ce; }
    .badge--completado { background: #dcfce7; color: #15803d; }
    .badge--programado { background: #fef3c7; color: #b45309; }
    .badge--error      { background: #fee2e2; color: #b91c1c; }

    @media (max-width: 600px) {
      .section-header { flex-direction: column; }
      .toggle-wrap { margin-left: 0; }
      .btn-refresh { margin-left: 0; }
      .config-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SaBackupComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  downloading    = false;
  savingConfig   = false;
  loadingHistorial = false;

  manualSuccess = '';
  manualError   = '';
  configSuccess = '';
  configError   = '';

  config = { activo: true, frecuencia: 'diario', hora: '02:00', retencion_dias: 30 };
  historial: any[] = [];

  ngOnInit(): void {
    this.loadConfig();
    this.loadHistorial();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadConfig(): void {
    this.http.get<any>(`${environment.api.baseUrl}/api/superadmin/backup/config`, { headers: this.headers() })
      .subscribe({
        next: (res) => {
          if (res.config) {
            this.config = {
              activo:         res.config.activo,
              frecuencia:     res.config.frecuencia,
              hora:           res.config.hora,
              retencion_dias: Number(res.config.retencion_dias),
            };
          }
          this.cdr.markForCheck();
        },
        error: () => { this.cdr.markForCheck(); }
      });
  }

  loadHistorial(): void {
    this.loadingHistorial = true;
    this.cdr.markForCheck();
    this.http.get<any>(`${environment.api.baseUrl}/api/superadmin/backup/historial?limit=50`, { headers: this.headers() })
      .subscribe({
        next: (res) => {
          this.historial = res.data || [];
          this.loadingHistorial = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingHistorial = false;
          this.cdr.markForCheck();
        }
      });
  }

  descargarBackup(): void {
    this.downloading = true;
    this.manualSuccess = '';
    this.manualError   = '';
    this.cdr.markForCheck();

    this.http.get(`${environment.api.baseUrl}/api/superadmin/backup/csv`, {
      headers: this.headers(),
      responseType: 'blob',
    }).subscribe({
      next: (blob) => {
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const ts = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
        const filename = `backup_${ts}.csv`;
        const url = window.URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloading  = false;
        this.manualSuccess = 'Respaldo generado correctamente.';
        this.loadHistorial();
        this.cdr.markForCheck();
      },
      error: () => {
        this.manualError = 'Error al generar el respaldo. Intente nuevamente.';
        this.downloading = false;
        this.cdr.markForCheck();
      }
    });
  }

  guardarConfig(): void {
    this.savingConfig = true;
    this.configSuccess = '';
    this.configError   = '';
    this.cdr.markForCheck();

    this.http.post<any>(`${environment.api.baseUrl}/api/superadmin/backup/config`, this.config, { headers: this.headers() })
      .subscribe({
        next: (res) => {
          this.configSuccess = res.message || 'Configuración de respaldo automático guardada correctamente.';
          this.savingConfig  = false;
          this.loadHistorial();
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.configError  = err?.error?.detail || 'Error al guardar la configuración.';
          this.savingConfig = false;
          this.cdr.markForCheck();
        }
      });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      completado: 'badge--completado',
      programado: 'badge--programado',
      error:      'badge--error',
    };
    return map[estado] ?? 'badge--programado';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      completado: 'Completado',
      programado: 'Programado',
      error:      'Error',
    };
    return map[estado] ?? estado;
  }
}
