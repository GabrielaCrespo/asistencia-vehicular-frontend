import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { VozResponse, FormatoExport, ReporteFiltrosBase, ReporteDinamicoFiltros } from '../../../core/models/reportes.models';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const COLUMNAS_VOZ: Record<string, string[]> = {
  'emergencias':         ['fecha_creacion', 'tipo_problema', 'estado_asignacion', 'prioridad', 'cliente', 'vehiculo', 'taller', 'tecnico', 'monto_total'],
  'historial-servicios': ['fecha_asignacion', 'tipo_problema', 'estado', 'cliente', 'vehiculo', 'taller', 'tecnico', 'monto_total', 'calificacion'],
  'ingresos':            ['fecha_pago', 'taller', 'cliente', 'tipo_problema', 'monto_total', 'monto_taller', 'comision_plataforma', 'metodo_pago'],
  'calificaciones':      ['fecha_calificacion', 'taller', 'cliente', 'tipo_problema', 'puntuacion', 'puntuacion_servicio', 'comentario'],
  'kpis':                ['taller', 'total_servicios', 'completados', 'pendientes', 'urgentes', 'ingresos_netos', 'calificacion_promedio', 'tiempo_respuesta_prom'],
  'incidentes-tipo':     ['tipo_problema', 'total', 'completados', 'urgentes', 'ticket_promedio'],
  'sla':                 ['taller', 'total_servicios', 'completados', 'tiempo_respuesta_prom_min', 'cumplimiento_sla_pct'],
  'dinamico':            ['fecha_asignacion', 'tipo_problema', 'estado', 'cliente', 'vehiculo', 'taller', 'tecnico', 'monto_total', 'calificacion'],
};

const COL_LABELS_VOZ: Record<string, string> = {
  fecha_creacion: 'Fecha', fecha_asignacion: 'Fecha', fecha_pago: 'Fecha Pago',
  fecha_calificacion: 'Fecha', tipo_problema: 'Tipo Incidente',
  estado_asignacion: 'Estado', estado: 'Estado', prioridad: 'Prioridad',
  cliente: 'Cliente', vehiculo: 'Vehículo', taller: 'Taller', tecnico: 'Técnico',
  monto_total: 'Monto Total', monto_taller: 'Monto Taller',
  comision_plataforma: 'Comisión', metodo_pago: 'Método Pago',
  puntuacion: 'Puntuación', puntuacion_servicio: 'Punt. Servicio',
  comentario: 'Comentario', total_servicios: 'Total', completados: 'Completados',
  pendientes: 'Pendientes', urgentes: 'Urgentes', ingresos_netos: 'Ingresos Netos',
  calificacion_promedio: 'Cal. Prom.', calificacion: 'Calificación',
  tiempo_respuesta_prom: 'T. Resp. (min)', tiempo_respuesta_prom_min: 'T. Resp. (min)',
  cumplimiento_sla_pct: 'SLA %', ticket_promedio: 'Ticket Prom.', total: 'Total',
};

const TIPO_TITULO: Record<string, string> = {
  'emergencias': 'Emergencias', 'historial-servicios': 'Historial de Servicios',
  'ingresos': 'Ingresos', 'calificaciones': 'Calificaciones',
  'kpis': 'KPIs Operacionales', 'incidentes-tipo': 'Incidentes por Tipo',
  'sla': 'Cumplimiento SLA', 'dinamico': 'Reporte Dinámico',
};

const EJEMPLOS = [
  'Muéstrame las emergencias del último mes',
  'Genera un reporte de ingresos de esta semana',
  'Exporta a PDF los incidentes de batería',
  'Muéstrame los KPIs de mi organización',
  'Genera un reporte de calificaciones de los últimos 30 días',
  'Muéstrame el cumplimiento de SLA del mes pasado',
];

@Component({
  selector: 'app-reportes-voz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Reporte por Voz</h1>
        <p class="page-sub">Describe qué reporte necesitas y el asistente lo genera automáticamente</p>
      </div>

      <!-- Aviso sin soporte -->
      <div class="alert-warn" *ngIf="!speechSupported">
        Tu navegador no soporta la Web Speech API. Puedes escribir la consulta directamente.
      </div>

      <!-- Panel principal de voz -->
      <div class="voice-panel">
        <div class="mic-area">
          <button class="mic-btn" [class.recording]="grabando" [class.loading]="procesando"
                  (click)="toggleGrabacion()" [disabled]="procesando"
                  [title]="grabando ? 'Detener grabación' : 'Iniciar grabación'">
            <svg *ngIf="!grabando && !procesando" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="23"/>
              <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            <div *ngIf="grabando" class="pulse-ring"></div>
            <div *ngIf="procesando" class="spinner-white"></div>
          </button>
          <p class="mic-status">
            {{ grabando ? 'Escuchando... habla ahora' : (procesando ? 'Procesando consulta...' : 'Presiona para hablar') }}
          </p>
        </div>

        <!-- Texto editable -->
        <div class="query-area">
          <label class="query-label">Consulta (editable)</label>
          <div class="query-row">
            <textarea
              class="query-input"
              [(ngModel)]="textoConsulta"
              placeholder="Ej: Muéstrame las emergencias del último mes"
              rows="2">
            </textarea>
            <button class="btn-enviar" (click)="enviarConsulta()" [disabled]="!textoConsulta.trim() || procesando">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              Generar
            </button>
          </div>
        </div>

        <!-- Ejemplos -->
        <div class="ejemplos-section">
          <p class="ejemplos-label">Prueba con estos ejemplos:</p>
          <div class="ejemplos-grid">
            <button class="ejemplo-chip" *ngFor="let e of ejemplos" (click)="usarEjemplo(e)">
              {{ e }}
            </button>
          </div>
        </div>
      </div>

      <!-- Resultado -->
      <ng-container *ngIf="resultado">
        <div class="result-card">
          <div class="result-meta">
            <div class="meta-tipo">
              <span class="tipo-badge">{{ getTitulo(resultado.tipo_reporte) }}</span>
              <span class="meta-msg">{{ resultado.mensaje_confirmacion }}</span>
            </div>
            <div class="export-btns" *ngIf="filas.length">
              <button class="btn-export" (click)="exportar('csv')">CSV</button>
              <button class="btn-export" (click)="exportar('excel')">Excel</button>
              <button class="btn-export btn-export--pdf" (click)="exportar('pdf')">PDF</button>
            </div>
          </div>

          <!-- Resumen -->
          <div class="summary-row" *ngIf="resumen.length">
            <div class="s-card" *ngFor="let s of resumen">
              <span class="s-label">{{ s.label }}</span>
              <span class="s-value">{{ s.valor }}</span>
            </div>
          </div>

          <!-- Tabla -->
          <div class="table-wrap" *ngIf="filas.length">
            <table class="data-table">
              <thead>
                <tr>
                  <th *ngFor="let col of columnas">{{ getColLabel(col) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let fila of filas">
                  <td *ngFor="let col of columnas">{{ fila[col] ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="empty-state" *ngIf="!filas.length">
            No hay datos para esta consulta en el período detectado.
          </div>
        </div>
      </ng-container>

      <div class="alert-error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    .page { max-width: 1000px; }
    .page-header { margin-bottom: 1.25rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .alert-warn {
      padding: 0.75rem 1rem; background: #fffbeb; border: 1px solid #fde68a;
      border-radius: 8px; color: #92400e; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .alert-error {
      padding: 0.75rem 1rem; background: #fef2f2; border: 1px solid #fecaca;
      border-radius: 8px; color: #dc2626; font-size: 0.875rem; margin-top: 1rem;
    }

    .voice-panel {
      background: white; border: 1px solid #e2e8f0; border-radius: 16px;
      padding: 2rem; margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 1.75rem;
    }

    .mic-area {
      display: flex; flex-direction: column; align-items: center; gap: 0.75rem;
    }

    .mic-btn {
      width: 80px; height: 80px; border-radius: 50%; border: none;
      background: #5cbdb9; color: white; cursor: pointer; position: relative;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.18s, background 0.18s; box-shadow: 0 4px 12px rgba(92,189,185,.4);
    }
    .mic-btn svg { width: 32px; height: 32px; }
    .mic-btn:hover:not(:disabled) { transform: scale(1.07); background: #3aa7a2; }
    .mic-btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .mic-btn.recording { background: #dc2626; box-shadow: 0 4px 16px rgba(220,38,38,.5); animation: pulse-btn 1.2s ease-in-out infinite; }
    .mic-btn.loading { background: #94a3b8; box-shadow: none; }

    @keyframes pulse-btn {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.08); }
    }

    .pulse-ring {
      width: 28px; height: 28px; border: 4px solid rgba(255,255,255,0.7);
      border-radius: 50%; animation: ring 1s ease-out infinite;
    }
    @keyframes ring {
      0% { transform: scale(0.8); opacity: 1; }
      100% { transform: scale(2); opacity: 0; }
    }

    .spinner-white {
      width: 28px; height: 28px; border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .mic-status { font-size: 0.875rem; color: #64748b; font-weight: 500; margin: 0; }

    .query-label { font-size: 0.78rem; font-weight: 600; color: #475569; margin-bottom: 0.4rem; display: block; }
    .query-row { display: flex; gap: 0.75rem; align-items: flex-end; }
    .query-input {
      flex: 1; padding: 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.9rem; color: #334155; resize: vertical; font-family: inherit;
    }
    .query-input:focus { outline: none; border-color: #5cbdb9; }

    .btn-enviar {
      display: flex; align-items: center; gap: 0.4rem; padding: 0.7rem 1.1rem;
      background: #5cbdb9; color: white; border: none; border-radius: 10px;
      font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    .btn-enviar svg { width: 15px; height: 15px; }
    .btn-enviar:hover:not(:disabled) { background: #3aa7a2; }
    .btn-enviar:disabled { opacity: 0.55; cursor: not-allowed; }

    .ejemplos-label { font-size: 0.78rem; font-weight: 600; color: #475569; margin: 0 0 0.5rem; }
    .ejemplos-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .ejemplo-chip {
      padding: 0.35rem 0.75rem; background: #f0fdfc; color: #0f766e;
      border: 1px solid #99f6e4; border-radius: 20px; font-size: 0.8rem;
      cursor: pointer; transition: background 0.18s;
    }
    .ejemplo-chip:hover { background: #ccfbf1; }

    .result-card {
      background: white; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;
    }

    .result-meta {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1rem 1.25rem; border-bottom: 1px solid #e2e8f0; flex-wrap: wrap; gap: 0.75rem;
    }
    .meta-tipo { display: flex; align-items: center; gap: 0.75rem; }
    .tipo-badge {
      padding: 0.25rem 0.7rem; background: #e0f2fe; color: #0369a1;
      border-radius: 20px; font-size: 0.8rem; font-weight: 700;
    }
    .meta-msg { font-size: 0.875rem; color: #475569; }

    .export-btns { display: flex; gap: 0.5rem; }
    .btn-export {
      padding: 0.4rem 0.8rem; background: #f1f5f9; color: #334155;
      border: 1px solid #e2e8f0; border-radius: 7px; font-size: 0.8rem; font-weight: 600;
      cursor: pointer;
    }
    .btn-export:hover { background: #e2e8f0; }
    .btn-export--pdf { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .btn-export--pdf:hover { background: #fecaca; }

    .summary-row {
      display: flex; gap: 1rem; flex-wrap: wrap; padding: 1rem 1.25rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .s-card { display: flex; flex-direction: column; gap: 0.15rem; background: #f8fafc; border-radius: 10px; padding: 0.75rem 1rem; }
    .s-label { font-size: 0.75rem; color: #64748b; font-weight: 600; }
    .s-value { font-size: 1.1rem; font-weight: 800; color: #0f172a; }

    .table-wrap { overflow-x: auto; }
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

    .empty-state {
      display: flex; justify-content: center; padding: 2.5rem; color: #94a3b8; font-size: 0.9rem;
    }

    @media (max-width: 600px) {
      .query-row { flex-direction: column; align-items: stretch; }
    }
  `],
})
export class ReportesVozComponent implements OnInit, OnDestroy {
  private auth    = inject(AuthService);
  private svc     = inject(ReportesService);
  private cdr     = inject(ChangeDetectorRef);
  private zone    = inject(NgZone);
  private destroy$ = new Subject<void>();

  speechSupported = false;
  grabando = false;
  procesando = false;
  textoConsulta = '';
  error: string | null = null;
  ejemplos = EJEMPLOS;

  resultado: VozResponse | null = null;
  filas: Record<string, any>[] = [];
  columnas: string[] = [];
  resumen: { label: string; valor: string }[] = [];

  private recognition: any = null;

  ngOnInit(): void {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.speechSupported = !!SpeechRec;

    if (this.speechSupported) {
      this.recognition = new SpeechRec();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        this.zone.run(() => {
          this.textoConsulta = transcript;
          this.grabando = false;
          this.cdr.markForCheck();
          this.enviarConsulta();
        });
      };

      this.recognition.onerror = (event: any) => {
        this.zone.run(() => {
          this.grabando = false;
          if (event.error !== 'no-speech') {
            this.error = `Error de reconocimiento de voz: ${event.error}`;
          }
          this.cdr.markForCheck();
        });
      };

      this.recognition.onend = () => {
        this.zone.run(() => {
          this.grabando = false;
          this.cdr.markForCheck();
        });
      };
    }
  }

  toggleGrabacion(): void {
    if (!this.speechSupported) return;
    if (this.grabando) {
      this.recognition.stop();
      this.grabando = false;
    } else {
      this.error = null;
      this.recognition.start();
      this.grabando = true;
    }
    this.cdr.markForCheck();
  }

  usarEjemplo(texto: string): void {
    this.textoConsulta = texto;
    this.enviarConsulta();
  }

  enviarConsulta(): void {
    const texto = this.textoConsulta.trim();
    if (!texto) return;

    const user = this.auth.getAuthState().currentUser;
    this.procesando = true;
    this.error = null;
    this.resultado = null;

    const body = {
      texto,
      taller_id: user?.rol === 'taller'       ? user.taller_id       : undefined,
      org_id:    user?.rol === 'tenant_admin'  ? user.organizacion_id : undefined,
    };

    this.svc.consultarVoz(body).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.resultado = res;
        const r = res.resultado;
        const rawFilas: Record<string, any>[] = r?.datos ?? r?.por_taller ?? [];
        const tipo = res.tipo_reporte;
        const curated = COLUMNAS_VOZ[tipo] ?? Object.keys(rawFilas[0] ?? {});
        const available = rawFilas.length ? new Set(Object.keys(rawFilas[0])) : new Set<string>();
        this.columnas = curated.filter(c => available.has(c));
        this.filas = rawFilas.map(row => {
          const out: Record<string, any> = {};
          for (const c of this.columnas) out[c] = row[c];
          return out;
        });
        this.resumen = this.buildResumen(r);
        this.procesando = false;
        this.cdr.markForCheck();

        if (res.formato_exportar) {
          this.exportar(res.formato_exportar as FormatoExport);
        }
      },
      error: (err: any) => {
        this.error = err?.error?.detail || 'No se pudo interpretar la consulta. Intenta ser más específico.';
        this.procesando = false;
        this.cdr.markForCheck();
      },
    });
  }

  exportar(formato: FormatoExport): void {
    if (!this.resultado) return;
    const tipo: string = this.resultado.tipo_reporte;
    const user = this.auth.getAuthState().currentUser;
    const aplicados = this.resultado.filtros_aplicados ?? {};

    const base: ReporteFiltrosBase = {
      fecha_desde: aplicados.fecha_desde || undefined,
      fecha_hasta: aplicados.fecha_hasta || undefined,
      taller_id: user?.rol === 'taller'       ? user.taller_id       : undefined,
      org_id:    user?.rol === 'tenant_admin'  ? user.organizacion_id : undefined,
    };

    const obs$ = tipo === 'dinamico'
      ? this.svc.exportarDinamico({ ...base, tipo_incidente: aplicados.tipo_incidente || undefined, estado: aplicados.estado || undefined } as ReporteDinamicoFiltros, formato)
      : this.svc.exportar(tipo, formato, base);

    obs$.pipe(takeUntil(this.destroy$)).subscribe(blob => {
      const ext = formato === 'excel' ? 'xlsx' : formato;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_voz_${new Date().toISOString().slice(0, 10)}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  getColLabel(col: string): string {
    return COL_LABELS_VOZ[col] ?? col.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  getTitulo(tipo: string): string {
    return TIPO_TITULO[tipo] ?? tipo;
  }

  private buildResumen(r: any): { label: string; valor: string }[] {
    const res = r?.resumen;
    if (!res || typeof res !== 'object') return [];
    return Object.entries(res)
      .filter(([, v]) => typeof v !== 'object')
      .map(([k, v]) => {
        const n = Number(v);
        const isPct   = k.includes('pct');
        const isMoney = k.includes('ingreso') || k.includes('monto');
        let valor: string;
        if (isPct)            valor = `${n.toFixed(1)}%`;
        else if (isMoney)     valor = `Bs. ${n.toFixed(2)}`;
        else if (typeof v === 'number') valor = Number.isInteger(n) ? String(n) : n.toFixed(2);
        else                  valor = String(v);
        return { label: k.replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase()), valor };
      });
  }

  ngOnDestroy(): void {
    if (this.grabando && this.recognition) this.recognition.stop();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
