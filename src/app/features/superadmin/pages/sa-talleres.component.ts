import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-talleres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Talleres</h1>
          <p class="page-sub">Asignación y gestión de talleres en la plataforma</p>
        </div>
        <div class="header-actions">
          <span class="pending-badge" *ngIf="pendingCount > 0">
            {{ pendingCount }} pendiente{{ pendingCount > 1 ? 's' : '' }} de asignación
          </span>
        </div>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <select [(ngModel)]="filtroEstado" (change)="loadTalleres()" class="select-field">
          <option value="">Todos los estados</option>
          <option value="pendiente_asignacion">Pendiente asignación</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <select [(ngModel)]="filtroOrg" (change)="loadTalleres()" class="select-field">
          <option value="">Todas las organizaciones</option>
          <option *ngFor="let org of orgs" [value]="org.organizacion_id">{{ org.nombre }}</option>
        </select>
        <span class="total-badge">{{ total }} talleres</span>
      </div>

      <div class="alert-error" *ngIf="error">{{ error }}</div>
      <div class="alert-success" *ngIf="successMsg">{{ successMsg }}</div>

      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando talleres...</span>
      </div>

      <div class="table-card" *ngIf="!loading">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Taller</th>
                <th>Organización</th>
                <th>Dirección</th>
                <th>Estado</th>
                <th>Disponible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of talleres" [class.row-pending]="t.estado === 'pendiente_asignacion'">
                <td>
                  <div class="taller-name">{{ t.razon_social }}</div>
                  <div class="taller-email">{{ t.email }}</div>
                </td>
                <td>
                  <span *ngIf="t.organizacion_nombre" class="org-chip">{{ t.organizacion_nombre }}</span>
                  <span *ngIf="!t.organizacion_nombre" class="muted">Sin org.</span>
                </td>
                <td class="muted small">{{ t.direccion || '—' }}</td>
                <td>
                  <span class="badge"
                    [class.badge-pending]="t.estado === 'pendiente_asignacion'"
                    [class.badge-active]="t.estado === 'activo'"
                    [class.badge-inactive]="t.estado === 'inactivo'">
                    {{ estadoLabel(t.estado) }}
                  </span>
                </td>
                <td>
                  <span class="avail" [class.avail-yes]="t.disponible" [class.avail-no]="!t.disponible">
                    {{ t.disponible ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td>
                  <div class="action-btns">
                    <button class="btn-sm btn-assign" *ngIf="t.estado === 'pendiente_asignacion'"
                            (click)="openAssignModal(t)">
                      Asignar org.
                    </button>
                    <button class="btn-icon" title="Cambiar estado" (click)="openStatusModal(t)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="talleres.length === 0">
                <td colspan="6" class="empty-msg">No hay talleres con ese filtro.</td>
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

    <!-- Modal: Asignar Organización -->
    <div class="modal-overlay" *ngIf="showAssignModal" (click)="closeAssignModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Asignar Organización — {{ selectedTaller?.razon_social }}</h3>
          <button class="modal-close" (click)="closeAssignModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Seleccionar organización *</label>
            <select [(ngModel)]="assignOrgId" class="inp">
              <option value="">— Seleccionar —</option>
              <option *ngFor="let org of orgs" [value]="org.organizacion_id">{{ org.nombre }}</option>
            </select>
          </div>
          <div class="alert-error" *ngIf="assignError">{{ assignError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" (click)="closeAssignModal()">Cancelar</button>
          <button class="btn-primary" (click)="confirmAssign()" [disabled]="assigning">
            {{ assigning ? 'Asignando...' : 'Asignar' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Cambiar Estado -->
    <div class="modal-overlay" *ngIf="showStatusModal" (click)="closeStatusModal()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Cambiar Estado — {{ selectedTaller?.razon_social }}</h3>
          <button class="modal-close" (click)="closeStatusModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Nuevo estado</label>
            <select [(ngModel)]="newStatus" class="inp">
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pendiente_asignacion">Pendiente asignación</option>
            </select>
          </div>
          <div class="alert-error" *ngIf="statusError">{{ statusError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" (click)="closeStatusModal()">Cancelar</button>
          <button class="btn-primary" (click)="confirmStatus()" [disabled]="changingStatus">
            {{ changingStatus ? 'Actualizando...' : 'Actualizar' }}
          </button>
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

    .pending-badge {
      background: #fef3c7; color: #b45309; border: 1px solid #fde68a;
      padding: 0.4rem 0.85rem; border-radius: 99px; font-size: 0.8rem; font-weight: 700;
    }
    .filters { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
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
    .alert-success {
      background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
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
    tr.row-pending td { background: #fffbeb; }
    tr.row-pending:hover td { background: #fef9c3; }

    .taller-name  { font-weight: 700; color: #1e293b; }
    .taller-email { font-size: 0.75rem; color: #94a3b8; }
    .org-chip {
      background: #f5f3ff; color: #7c3aed; padding: 0.15rem 0.5rem;
      border-radius: 99px; font-size: 0.75rem; font-weight: 600;
    }
    .muted { color: #94a3b8; }
    .small { font-size: 0.78rem; }

    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-active   { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }
    .badge-pending  { background: #fef3c7; color: #b45309; }

    .avail { font-size: 0.78rem; font-weight: 600; }
    .avail-yes { color: #16a34a; }
    .avail-no  { color: #dc2626; }

    .action-btns { display: flex; gap: 0.35rem; align-items: center; }
    .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 600; border-radius: 7px; cursor: pointer; border: none; }
    .btn-assign { background: #7c3aed; color: white; transition: background 0.15s; }
    .btn-assign:hover { background: #6d28d9; }
    .btn-icon {
      width: 30px; height: 30px; border-radius: 7px; border: 1px solid #e2e8f0;
      background: white; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: #64748b; transition: all 0.15s;
    }
    .btn-icon svg { width: 13px; height: 13px; }
    .btn-icon:hover { background: #f8fafc; color: #7c3aed; border-color: #c4b5fd; }

    .empty-msg { text-align: center; color: #94a3b8; padding: 2rem !important; }
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

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      display: flex; align-items: center; justify-content: center; z-index: 400; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 16px; width: 100%; max-width: 500px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
    }
    .modal-sm { max-width: 380px; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .modal-header h3 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .modal-close {
      background: none; border: none; cursor: pointer; color: #94a3b8;
      font-size: 1.1rem; width: 28px; height: 28px; border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-close:hover { background: #f1f5f9; color: #334155; }
    .modal-body { padding: 1.25rem 1.5rem; display: flex; flex-direction: column; gap: 0.85rem; }
    .modal-footer {
      padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 0.5rem;
    }
    .form-row { display: flex; flex-direction: column; gap: 0.3rem; }
    .form-row label { font-size: 0.75rem; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.04em; }
    .inp {
      padding: 0.6rem 0.85rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #1e293b; background: #f8fafc; transition: border-color 0.2s;
    }
    .inp:focus { outline: none; border-color: #7c3aed; background: white; }
    .btn-primary {
      padding: 0.55rem 1.1rem; background: #7c3aed; color: white;
      border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-primary:hover:not(:disabled) { background: #6d28d9; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-ghost {
      padding: 0.55rem 1rem; background: #f1f5f9; color: #475569; border: none;
      border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
    }
    .btn-ghost:hover { background: #e2e8f0; }
    .header-actions { display: flex; align-items: center; gap: 0.75rem; }
  `]
})
export class SaTalleresComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  talleres: any[] = [];
  orgs: any[] = [];
  total = 0; limit = 20; offset = 0;
  loading = false; error = ''; successMsg = '';
  filtroEstado = ''; filtroOrg = '';
  pendingCount = 0;

  showAssignModal = false; selectedTaller: any = null; assignOrgId = ''; assigning = false; assignError = '';
  showStatusModal = false; newStatus = 'activo'; changingStatus = false; statusError = '';

  ngOnInit(): void { this.loadOrgs(); this.loadTalleres(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadOrgs(): void {
    this.http.get<any>(`${environment.api.baseUrl}/api/superadmin/organizaciones?limit=200&offset=0`,
      { headers: this.headers() }).subscribe({
      next: (res) => { this.orgs = res.data; },
      error: () => {}
    });
  }

  loadTalleres(): void {
    this.loading = true; this.error = '';
    let url = `${environment.api.baseUrl}/api/superadmin/talleres?limit=${this.limit}&offset=${this.offset}`;
    if (this.filtroEstado) url += `&estado=${this.filtroEstado}`;
    if (this.filtroOrg)    url += `&organizacion_id=${this.filtroOrg}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => {
        this.talleres = res.data; this.total = res.total; this.loading = false;
        this.pendingCount = res.data.filter((t: any) => t.estado === 'pendiente_asignacion').length;
        this.cdr.markForCheck();
      },
      error: (err) => { this.error = err?.error?.detail || 'Error al cargar'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  estadoLabel(e: string): string {
    return e === 'pendiente_asignacion' ? 'Pendiente' : (e || 'activo');
  }

  openAssignModal(t: any): void { this.selectedTaller = t; this.assignOrgId = ''; this.assignError = ''; this.showAssignModal = true; }
  closeAssignModal(): void { this.showAssignModal = false; }

  confirmAssign(): void {
    if (!this.assignOrgId) { this.assignError = 'Selecciona una organización'; return; }
    this.assigning = true; this.assignError = '';

    this.http.patch(`${environment.api.baseUrl}/api/superadmin/talleres/${this.selectedTaller.taller_id}/asignar-org`,
      { organizacion_id: +this.assignOrgId }, { headers: this.headers() }).subscribe({
      next: () => {
        this.assigning = false; this.closeAssignModal();
        this.successMsg = `Taller asignado correctamente.`;
        setTimeout(() => this.successMsg = '', 3000);
        this.loadTalleres();
      },
      error: (err) => { this.assignError = err?.error?.detail || 'Error al asignar'; this.assigning = false; }
    });
  }

  openStatusModal(t: any): void {
    this.selectedTaller = t; this.newStatus = t.estado || 'activo';
    this.statusError = ''; this.showStatusModal = true;
  }
  closeStatusModal(): void { this.showStatusModal = false; }

  confirmStatus(): void {
    this.changingStatus = true; this.statusError = '';
    this.http.patch(`${environment.api.baseUrl}/api/superadmin/talleres/${this.selectedTaller.taller_id}/estado`,
      { estado: this.newStatus }, { headers: this.headers() }).subscribe({
      next: () => {
        this.changingStatus = false; this.closeStatusModal();
        this.successMsg = 'Estado actualizado.';
        setTimeout(() => this.successMsg = '', 3000);
        this.loadTalleres();
      },
      error: (err) => { this.statusError = err?.error?.detail || 'Error'; this.changingStatus = false; }
    });
  }

  prevPage(): void { if (this.offset > 0) { this.offset -= this.limit; this.loadTalleres(); } }
  nextPage(): void { if (this.offset + this.limit < this.total) { this.offset += this.limit; this.loadTalleres(); } }
  min(a: number, b: number): number { return Math.min(a, b); }
}
