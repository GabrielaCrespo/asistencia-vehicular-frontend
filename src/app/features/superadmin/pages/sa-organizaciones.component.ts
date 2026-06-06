import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-organizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Organizaciones</h1>
          <p class="page-sub">Gestión de todos los tenants de la plataforma</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Organización
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <select [(ngModel)]="filtroEstado" (change)="loadOrgs()" class="select-field">
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>
        <span class="total-badge">{{ total }} organizaciones</span>
      </div>

      <!-- Error -->
      <div class="alert-error" *ngIf="error">{{ error }}</div>

      <!-- Loading -->
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando organizaciones...</span>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!loading">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Organización</th>
                <th>Plan</th>
                <th>Admin</th>
                <th>Talleres</th>
                <th>Técnicos</th>
                <th>Estado</th>
                <th>Creada</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let org of orgs">
                <td>
                  <div class="org-name">{{ org.nombre }}</div>
                  <div class="org-desc" *ngIf="org.descripcion">{{ org.descripcion }}</div>
                </td>
                <td><span class="badge badge-plan">{{ org.plan || 'basico' }}</span></td>
                <td>
                  <div *ngIf="org.admin_nombre; else noAdmin">
                    <div class="admin-name">{{ org.admin_nombre }}</div>
                    <div class="admin-email">{{ org.admin_email }}</div>
                  </div>
                  <ng-template #noAdmin>
                    <button class="btn-sm btn-outline" (click)="openAdminModal(org)">Asignar admin</button>
                  </ng-template>
                </td>
                <td>{{ org.total_talleres }}</td>
                <td>{{ org.total_tecnicos }}</td>
                <td>
                  <span class="badge" [class.badge-active]="org.estado === 'activo'"
                        [class.badge-inactive]="org.estado !== 'activo'">
                    {{ org.estado }}
                  </span>
                </td>
                <td class="muted">{{ org.creado_en | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="action-btns">
                    <button class="btn-icon" title="Editar" (click)="openEditModal(org)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="btn-icon" [title]="org.estado === 'activo' ? 'Desactivar' : 'Activar'"
                            (click)="toggleEstado(org)">
                      <svg *ngIf="org.estado === 'activo'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                      </svg>
                      <svg *ngIf="org.estado !== 'activo'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                      </svg>
                    </button>
                    <button class="btn-icon btn-icon--purple" title="Asignar admin" (click)="openAdminModal(org)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="8.5" cy="7" r="4"/>
                        <line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="orgs.length === 0">
                <td colspan="8" class="empty-msg">No hay organizaciones registradas.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="total > limit">
          <button class="page-btn" (click)="prevPage()" [disabled]="offset === 0">Anterior</button>
          <span class="page-info">{{ offset + 1 }}–{{ min(offset + limit, total) }} de {{ total }}</span>
          <button class="page-btn" (click)="nextPage()" [disabled]="offset + limit >= total">Siguiente</button>
        </div>
      </div>
    </div>

    <!-- Modal: Crear / Editar Organización -->
    <div class="modal-overlay" *ngIf="showOrgModal" (click)="closeOrgModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>{{ editMode ? 'Editar Organización' : 'Nueva Organización' }}</h3>
          <button class="modal-close" (click)="closeOrgModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Nombre *</label>
            <input type="text" [(ngModel)]="form.nombre_organizacion" placeholder="Nombre de la organización" class="inp"/>
          </div>
          <div class="form-row">
            <label>Descripción</label>
            <textarea [(ngModel)]="form.descripcion" placeholder="Descripción opcional" class="inp" rows="2"></textarea>
          </div>
          <div class="form-row-2">
            <div class="form-row">
              <label>NIT</label>
              <input type="text" [(ngModel)]="form.nit" placeholder="NIT" class="inp"/>
            </div>
            <div class="form-row">
              <label>Plan</label>
              <select [(ngModel)]="form.plan" class="inp">
                <option value="basico">Básico</option>
                <option value="profesional">Profesional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div class="form-row-2">
            <div class="form-row">
              <label>Email de contacto</label>
              <input type="email" [(ngModel)]="form.email_contacto" placeholder="contacto@org.com" class="inp"/>
            </div>
            <div class="form-row">
              <label>Teléfono</label>
              <input type="text" [(ngModel)]="form.telefono" placeholder="Teléfono" class="inp"/>
            </div>
          </div>
          <div class="alert-error" *ngIf="modalError">{{ modalError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" (click)="closeOrgModal()">Cancelar</button>
          <button class="btn-primary" (click)="saveOrg()" [disabled]="saving">
            {{ saving ? 'Guardando...' : (editMode ? 'Actualizar' : 'Crear') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Asignar Admin -->
    <div class="modal-overlay" *ngIf="showAdminModal" (click)="closeAdminModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Asignar Administrador — {{ selectedOrg?.nombre }}</h3>
          <button class="modal-close" (click)="closeAdminModal()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <label>Nombre completo *</label>
            <input type="text" [(ngModel)]="adminForm.nombre_admin" placeholder="Nombre del administrador" class="inp"/>
          </div>
          <div class="form-row-2">
            <div class="form-row">
              <label>Email *</label>
              <input type="email" [(ngModel)]="adminForm.email_admin" placeholder="admin@org.com" class="inp"/>
            </div>
            <div class="form-row">
              <label>Teléfono</label>
              <input type="text" [(ngModel)]="adminForm.telefono_admin" placeholder="Teléfono" class="inp"/>
            </div>
          </div>
          <div class="form-row">
            <label>Contraseña *</label>
            <input type="password" [(ngModel)]="adminForm.password_admin" placeholder="Contraseña" class="inp"/>
          </div>
          <div class="alert-error" *ngIf="adminModalError">{{ adminModalError }}</div>
        </div>
        <div class="modal-footer">
          <button class="btn-ghost" (click)="closeAdminModal()">Cancelar</button>
          <button class="btn-primary" (click)="saveAdmin()" [disabled]="savingAdmin">
            {{ savingAdmin ? 'Creando...' : 'Crear Administrador' }}
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

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.55rem 1.1rem; background: #7c3aed; color: white;
      border: none; border-radius: 10px; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s;
    }
    .btn-primary svg { width: 15px; height: 15px; }
    .btn-primary:hover:not(:disabled) { background: #6d28d9; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .filters {
      display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;
    }
    .select-field {
      padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white; cursor: pointer;
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
      padding: 0.65rem 1rem; text-align: left;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
      color: #94a3b8; letter-spacing: 0.04em; border-bottom: 1px solid #f1f5f9;
      background: #fafafa;
    }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }

    .org-name { font-weight: 700; color: #1e293b; }
    .org-desc  { font-size: 0.75rem; color: #94a3b8; margin-top: 0.1rem; }
    .admin-name { font-weight: 600; color: #1e293b; }
    .admin-email { font-size: 0.75rem; color: #94a3b8; }
    .muted { color: #94a3b8; font-size: 0.8rem; }

    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-plan     { background: #f5f3ff; color: #7c3aed; }
    .badge-active   { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }

    .action-btns { display: flex; gap: 0.35rem; }
    .btn-icon {
      width: 30px; height: 30px; border-radius: 7px; border: 1px solid #e2e8f0;
      background: white; cursor: pointer; display: flex; align-items: center;
      justify-content: center; color: #64748b; transition: all 0.15s;
    }
    .btn-icon svg { width: 13px; height: 13px; }
    .btn-icon:hover { background: #f8fafc; color: #7c3aed; border-color: #c4b5fd; }
    .btn-icon--purple:hover { background: #f5f3ff; color: #7c3aed; border-color: #c4b5fd; }

    .btn-sm { padding: 0.3rem 0.65rem; font-size: 0.75rem; font-weight: 600; border-radius: 7px; cursor: pointer; }
    .btn-outline {
      background: white; border: 1.5px solid #7c3aed; color: #7c3aed;
      transition: all 0.15s;
    }
    .btn-outline:hover { background: #f5f3ff; }

    .empty-msg { text-align: center; color: #94a3b8; padding: 2rem !important; }

    .pagination {
      display: flex; align-items: center; gap: 0.75rem; justify-content: center;
      padding: 0.75rem; border-top: 1px solid #f1f5f9;
    }
    .page-btn {
      padding: 0.4rem 0.9rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      background: white; font-size: 0.82rem; font-weight: 600; cursor: pointer;
      color: #334155; transition: all 0.15s;
    }
    .page-btn:hover:not(:disabled) { border-color: #7c3aed; color: #7c3aed; }
    .page-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .page-info { font-size: 0.82rem; color: #64748b; }

    /* Modal */
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 400; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 16px; width: 100%; max-width: 560px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); overflow: hidden;
    }
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
    .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; }

    .inp {
      padding: 0.6rem 0.85rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #1e293b; background: #f8fafc;
      transition: border-color 0.2s, background 0.2s;
      resize: none;
    }
    .inp:focus { outline: none; border-color: #7c3aed; background: white; }

    .btn-ghost {
      padding: 0.55rem 1rem; background: #f1f5f9; color: #475569; border: none;
      border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s;
    }
    .btn-ghost:hover { background: #e2e8f0; }

    @media (max-width: 600px) {
      .form-row-2 { grid-template-columns: 1fr; }
    }
  `]
})
export class SaOrganizacionesComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  orgs: any[] = [];
  total = 0;
  limit = 20;
  offset = 0;
  loading = false;
  error = '';
  filtroEstado = '';

  // Modal Org
  showOrgModal = false;
  editMode = false;
  selectedOrg: any = null;
  form: any = { nombre_organizacion: '', descripcion: '', nit: '', email_contacto: '', telefono: '', plan: 'basico' };
  modalError = '';
  saving = false;

  // Modal Admin
  showAdminModal = false;
  adminForm: any = { nombre_admin: '', email_admin: '', telefono_admin: '', password_admin: '' };
  adminModalError = '';
  savingAdmin = false;

  ngOnInit(): void { this.loadOrgs(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadOrgs(): void {
    this.loading = true;
    this.error = '';
    let url = `${environment.api.baseUrl}/api/superadmin/organizaciones?limit=${this.limit}&offset=${this.offset}`;
    if (this.filtroEstado) url += `&estado=${this.filtroEstado}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => { this.orgs = res.data; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => { this.error = err?.error?.detail || 'Error al cargar'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openCreateModal(): void {
    this.editMode = false;
    this.form = { nombre_organizacion: '', descripcion: '', nit: '', email_contacto: '', telefono: '', plan: 'basico' };
    this.modalError = '';
    this.showOrgModal = true;
  }

  openEditModal(org: any): void {
    this.editMode = true;
    this.selectedOrg = org;
    this.form = {
      nombre_organizacion: org.nombre,
      descripcion: org.descripcion || '',
      nit: org.nit || '',
      email_contacto: org.email_contacto || '',
      telefono: org.telefono || '',
      plan: org.plan || 'basico'
    };
    this.modalError = '';
    this.showOrgModal = true;
  }

  closeOrgModal(): void { this.showOrgModal = false; }

  saveOrg(): void {
    if (!this.form.nombre_organizacion.trim()) { this.modalError = 'El nombre es requerido'; return; }
    this.saving = true;
    this.modalError = '';

    if (this.editMode && this.selectedOrg) {
      const body = { nombre: this.form.nombre_organizacion, descripcion: this.form.descripcion,
                     nit: this.form.nit, email_contacto: this.form.email_contacto,
                     telefono: this.form.telefono, plan: this.form.plan };
      this.http.put(`${environment.api.baseUrl}/api/superadmin/organizaciones/${this.selectedOrg.organizacion_id}`,
        body, { headers: this.headers() }).subscribe({
        next: () => { this.saving = false; this.closeOrgModal(); this.loadOrgs(); },
        error: (err) => { this.modalError = err?.error?.detail || 'Error al actualizar'; this.saving = false; }
      });
    } else {
      this.http.post(`${environment.api.baseUrl}/api/superadmin/organizaciones`,
        this.form, { headers: this.headers() }).subscribe({
        next: () => { this.saving = false; this.closeOrgModal(); this.loadOrgs(); },
        error: (err) => { this.modalError = err?.error?.detail || 'Error al crear'; this.saving = false; }
      });
    }
  }

  toggleEstado(org: any): void {
    this.http.patch(`${environment.api.baseUrl}/api/superadmin/organizaciones/${org.organizacion_id}/estado`,
      {}, { headers: this.headers() }).subscribe({
      next: (res: any) => { org.estado = res.estado; },
      error: (err) => { this.error = err?.error?.detail || 'Error al cambiar estado'; }
    });
  }

  openAdminModal(org: any): void {
    this.selectedOrg = org;
    this.adminForm = { nombre_admin: '', email_admin: '', telefono_admin: '', password_admin: '' };
    this.adminModalError = '';
    this.showAdminModal = true;
  }

  closeAdminModal(): void { this.showAdminModal = false; }

  saveAdmin(): void {
    if (!this.adminForm.nombre_admin || !this.adminForm.email_admin || !this.adminForm.password_admin) {
      this.adminModalError = 'Nombre, email y contraseña son requeridos'; return;
    }
    this.savingAdmin = true;
    this.adminModalError = '';

    this.http.post(`${environment.api.baseUrl}/api/superadmin/organizaciones/${this.selectedOrg.organizacion_id}/asignar-admin`,
      this.adminForm, { headers: this.headers() }).subscribe({
      next: () => { this.savingAdmin = false; this.closeAdminModal(); this.loadOrgs(); },
      error: (err) => { this.adminModalError = err?.error?.detail || 'Error al crear admin'; this.savingAdmin = false; }
    });
  }

  prevPage(): void { if (this.offset > 0) { this.offset -= this.limit; this.loadOrgs(); } }
  nextPage(): void { if (this.offset + this.limit < this.total) { this.offset += this.limit; this.loadOrgs(); } }
  min(a: number, b: number): number { return Math.min(a, b); }
}
