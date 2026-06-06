import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Bitácora</h1>
          <p class="page-sub">Registro de auditoría de todas las acciones administrativas</p>
        </div>
        <button class="btn-refresh" (click)="loadBitacora()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Actualizar
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <select [(ngModel)]="filtroAccion" (change)="loadBitacora()" class="select-field">
          <option value="">Todas las acciones</option>
          <optgroup label="Autenticación">
            <option value="LOGIN">LOGIN (todos)</option>
            <option value="REGISTRO">REGISTRO (todos)</option>
          </optgroup>
          <optgroup label="Superadmin">
            <option value="CREAR_ORGANIZACION">Crear organización</option>
            <option value="EDITAR_ORGANIZACION">Editar organización</option>
            <option value="CAMBIO_ESTADO_ORGANIZACION">Estado organización</option>
            <option value="ASIGNAR_TALLER_ORG">Asignar taller</option>
            <option value="CAMBIO_ESTADO_TALLER">Estado taller</option>
          </optgroup>
          <optgroup label="Operaciones">
            <option value="CREAR_INCIDENTE">Crear incidente</option>
            <option value="ACEPTAR_SOLICITUD">Aceptar solicitud</option>
            <option value="RECHAZAR_SOLICITUD">Rechazar solicitud</option>
            <option value="ASIGNAR_TECNICO">Asignar técnico</option>
            <option value="CAMBIO_ESTADO_ASIGNACION">Cambio estado</option>
            <option value="REGISTRAR_DIAGNOSTICO">Diagnóstico</option>
          </optgroup>
          <optgroup label="Recursos">
            <option value="CREAR_TECNICO">Crear técnico</option>
            <option value="ACTUALIZAR_TECNICO">Actualizar técnico</option>
            <option value="ELIMINAR_TECNICO">Eliminar técnico</option>
            <option value="REGISTRAR_VEHICULO">Registrar vehículo</option>
            <option value="ELIMINAR_VEHICULO">Eliminar vehículo</option>
            <option value="ACTUALIZAR_TALLER">Actualizar taller</option>
          </optgroup>
        </select>
        <select [(ngModel)]="filtroTabla" (change)="loadBitacora()" class="select-field">
          <option value="">Todas las tablas</option>
          <option value="organizacion">Organización</option>
          <option value="taller">Taller</option>
          <option value="usuario">Usuario</option>
          <option value="tecnico">Técnico</option>
          <option value="incidente">Incidente</option>
          <option value="asignacion">Asignación</option>
          <option value="vehiculo">Vehículo</option>
        </select>
        <input type="date" [(ngModel)]="filtroFecha" (change)="loadBitacora()" class="select-field" placeholder="Fecha"/>
        <span class="total-badge">{{ total }} registros</span>
      </div>

      <div class="alert-error" *ngIf="error">{{ error }}</div>
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando bitácora...</span>
      </div>

      <div class="table-card" *ngIf="!loading">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Tabla</th>
                <th>Ref. ID</th>
                <th>Usuario</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let entry of entries">
                <td class="date-cell">
                  <div>{{ entry.fecha | date:'dd/MM/yyyy' }}</div>
                  <div class="time">{{ entry.fecha | date:'HH:mm:ss' }}</div>
                </td>
                <td><span class="badge" [ngClass]="accionClass(entry.accion)">{{ entry.accion }}</span></td>
                <td class="muted">{{ entry.tabla_afectada }}</td>
                <td class="muted">{{ entry.id_referencia ?? '—' }}</td>
                <td>
                  <div class="user-name">{{ entry.usuario_nombre || 'Sistema' }}</div>
                  <div class="user-role muted">{{ entry.usuario_rol || '' }}</div>
                </td>
                <td class="desc-cell">{{ entry.descripcion }}</td>
              </tr>
              <tr *ngIf="entries.length === 0">
                <td colspan="6" class="empty-msg">Sin registros en la bitácora.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination" *ngIf="total > limit">
          <button class="page-btn" (click)="prevPage()" [disabled]="offset === 0">Anterior</button>
          <span class="page-info">{{ offset + 1 }}–{{ min(offset + limit, total) }} de {{ total }}</span>
          <button class="page-btn" (click)="nextPage()" [disabled]="offset + limit >= total">Siguiente</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sa-page { max-width: 1200px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;
    }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub   { font-size: 0.875rem; color: #64748b; margin: 0; }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 0.4rem; align-self: center;
      padding: 0.5rem 1rem; background: #f1f5f9; color: #475569; border: 1.5px solid #e2e8f0;
      border-radius: 10px; font-size: 0.83rem; font-weight: 600; cursor: pointer;
      transition: all 0.15s;
    }
    .btn-refresh svg { width: 13px; height: 13px; }
    .btn-refresh:hover { background: #e2e8f0; border-color: #cbd5e1; }

    .filters { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .select-field {
      padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white;
    }
    .total-badge {
      font-size: 0.8rem; color: #64748b; background: #f1f5f9;
      padding: 0.3rem 0.7rem; border-radius: 99px;
    }
    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 10px; padding: 0.75rem 1rem; margin-bottom: 1rem; font-size: 0.875rem;
    }
    .loading-wrap { display: flex; align-items: center; gap: 0.75rem; padding: 2rem; color: #64748b; }
    .spinner {
      width: 22px; height: 22px; border: 3px solid #e2e8f0;
      border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .table-card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.06); overflow: hidden;
    }
    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    th {
      padding: 0.65rem 1rem; text-align: left; font-size: 0.7rem; font-weight: 700;
      text-transform: uppercase; color: #94a3b8; letter-spacing: 0.04em;
      border-bottom: 1px solid #f1f5f9; background: #fafafa;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }

    .date-cell { white-space: nowrap; font-size: 0.8rem; font-weight: 600; color: #1e293b; }
    .time { font-size: 0.72rem; color: #94a3b8; font-weight: 400; }
    .muted { color: #94a3b8; font-size: 0.8rem; }
    .user-name { font-weight: 600; color: #1e293b; font-size: 0.83rem; }
    .user-role { font-size: 0.72rem; }
    .desc-cell { max-width: 280px; font-size: 0.8rem; color: #475569; }
    .empty-msg { text-align: center; color: #94a3b8; padding: 2rem !important; }

    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700;
    }
    .badge-create { background: #dcfce7; color: #15803d; }
    .badge-update { background: #dbeafe; color: #1d4ed8; }
    .badge-delete { background: #fee2e2; color: #b91c1c; }
    .badge-login  { background: #f3e8ff; color: #7e22ce; }
    .badge-assign { background: #fef3c7; color: #b45309; }
    .badge-toggle { background: #e0f2fe; color: #0369a1; }
    .badge-other  { background: #f1f5f9; color: #64748b; }

    .pagination {
      display: flex; align-items: center; gap: 0.75rem; justify-content: center;
      padding: 0.75rem; border-top: 1px solid #f1f5f9;
    }
    .page-btn {
      padding: 0.4rem 0.9rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      background: white; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: #334155;
    }
    .page-btn:hover:not(:disabled) { border-color: #7c3aed; color: #7c3aed; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-size: 0.82rem; color: #64748b; }
  `]
})
export class SaBitacoraComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  entries: any[] = [];
  total = 0; limit = 30; offset = 0;
  loading = false; error = '';
  filtroAccion = ''; filtroTabla = ''; filtroFecha = '';

  ngOnInit(): void { this.loadBitacora(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadBitacora(): void {
    this.loading = true; this.error = '';
    this.cdr.markForCheck();
    let url = `${environment.api.baseUrl}/api/superadmin/bitacora?limit=${this.limit}&offset=${this.offset}`;
    if (this.filtroAccion) url += `&accion=${this.filtroAccion}`;
    if (this.filtroTabla)  url += `&tabla=${this.filtroTabla}`;
    if (this.filtroFecha)  url += `&fecha=${this.filtroFecha}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => { this.entries = res.data; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => { this.error = err?.error?.detail || 'Error al cargar'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  accionClass(accion: string): string {
    const map: Record<string, string> = {
      'CREATE': 'badge-create', 'UPDATE': 'badge-update', 'DELETE': 'badge-delete',
      'LOGIN': 'badge-login', 'ASSIGN': 'badge-assign', 'TOGGLE': 'badge-toggle'
    };
    return map[accion] || 'badge-other';
  }

  prevPage(): void { if (this.offset > 0) { this.offset -= this.limit; this.loadBitacora(); } }
  nextPage(): void { if (this.offset + this.limit < this.total) { this.offset += this.limit; this.loadBitacora(); } }
  min(a: number, b: number): number { return Math.min(a, b); }
}
