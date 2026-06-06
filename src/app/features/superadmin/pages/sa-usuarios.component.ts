import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Usuarios</h1>
          <p class="page-sub">Administra todos los usuarios de la plataforma</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Usuario
        </button>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <select [(ngModel)]="filtroRol" (change)="onFilter()" class="select-field">
          <option value="">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="taller">Taller</option>
          <option value="tecnico">Técnico</option>
          <option value="tenant_admin">Tenant Admin</option>
        </select>
        <select [(ngModel)]="filtroEstado" (change)="onFilter()" class="select-field">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <span class="total-badge">{{ total }} usuarios</span>
      </div>

      <div class="alert-error" *ngIf="error">{{ error }}</div>

      <!-- Loading -->
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando usuarios...</span>
      </div>

      <!-- Table -->
      <div class="table-card" *ngIf="!loading">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Organización</th>
                <th>Info adicional</th>
                <th>Estado</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td class="muted">{{ u.usuario_id }}</td>
                <td class="name-cell">{{ u.nombre }}</td>
                <td class="muted small">{{ u.email }}</td>
                <td><span class="badge" [ngClass]="rolClass(u.rol)">{{ u.rol }}</span></td>
                <td>
                  <span class="muted" *ngIf="!u.organizacion_nombre || u.organizacion_nombre === 'Sin organización'">—</span>
                  <span class="org-chip" *ngIf="u.organizacion_nombre && u.organizacion_nombre !== 'Sin organización'">{{ u.organizacion_nombre }}</span>
                </td>
                <td class="muted small">{{ u.info_extra || '—' }}</td>
                <td>
                  <span class="badge"
                    [class.badge-active]="u.estado === 'activo'"
                    [class.badge-inactive]="u.estado !== 'activo'">
                    {{ u.estado }}
                  </span>
                </td>
                <td class="muted small">{{ u.fecha_registro | date:'dd/MM/yyyy' }}</td>
                <td>
                  <div class="row-actions">
                    <button class="btn-icon" title="Ver detalle" (click)="viewDetail(u)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </button>
                    <button class="btn-icon btn-edit" title="Editar" (click)="openEditModal(u)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                    <button class="btn-icon"
                            [class.btn-deactivate]="u.estado === 'activo'"
                            [class.btn-activate]="u.estado !== 'activo'"
                            [disabled]="!!toggleLoading[u.usuario_id]"
                            [title]="u.estado === 'activo' ? 'Desactivar' : 'Activar'"
                            (click)="toggleEstado(u)">
                      <div class="mini-spinner" *ngIf="toggleLoading[u.usuario_id]"></div>
                      <svg *ngIf="!toggleLoading[u.usuario_id] && u.estado === 'activo'"
                           viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                      </svg>
                      <svg *ngIf="!toggleLoading[u.usuario_id] && u.estado !== 'activo'"
                           viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="usuarios.length === 0">
                <td colspan="9" class="empty-msg">No hay usuarios con ese filtro.</td>
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

    <!-- ===== CREATE MODAL ===== -->
    <div class="modal-backdrop" *ngIf="showCreateModal" (click)="closeCreate()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Nuevo Usuario</h2>
          <button class="modal-close" (click)="closeCreate()">✕</button>
        </div>
        <div class="modal-body">
          <div class="alert-error" *ngIf="saveError">{{ saveError }}</div>
          <div class="form-grid">
            <div class="form-field">
              <label>Nombre completo *</label>
              <input [(ngModel)]="createForm.nombre" placeholder="Ej. JUAN PÉREZ" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Email *</label>
              <input [(ngModel)]="createForm.email" type="email" placeholder="email@ejemplo.com" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Contraseña *</label>
              <input [(ngModel)]="createForm.password" type="password" placeholder="Mínimo 6 caracteres" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Teléfono</label>
              <input [(ngModel)]="createForm.telefono" placeholder="Ej. 591 7XXXXXXX" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Rol *</label>
              <select [(ngModel)]="createForm.rol_nombre" class="input-field">
                <option value="cliente">Cliente</option>
                <option value="taller">Taller</option>
                <option value="tecnico">Técnico</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            </div>
            <div class="form-field">
              <label>Organización</label>
              <select [(ngModel)]="createForm.organizacion_id" class="input-field">
                <option [ngValue]="null">Sin organización</option>
                <option *ngFor="let o of organizaciones" [ngValue]="o.organizacion_id">{{ o.nombre }}</option>
              </select>
            </div>
            <div class="form-field form-field-full">
              <label>Documento de identidad</label>
              <input [(ngModel)]="createForm.documento_identidad" placeholder="CI / Pasaporte" class="input-field"/>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCreate()">Cancelar</button>
          <button class="btn-primary" (click)="saveCreate()" [disabled]="saving">
            {{ saving ? 'Guardando...' : 'Crear Usuario' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== EDIT MODAL ===== -->
    <div class="modal-backdrop" *ngIf="showEditModal" (click)="closeEdit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Editar Usuario</h2>
          <button class="modal-close" (click)="closeEdit()">✕</button>
        </div>
        <div class="modal-body">
          <div class="alert-error" *ngIf="saveError">{{ saveError }}</div>
          <div class="form-grid">
            <div class="form-field">
              <label>Nombre completo</label>
              <input [(ngModel)]="editForm.nombre" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Email</label>
              <input [(ngModel)]="editForm.email" type="email" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Teléfono</label>
              <input [(ngModel)]="editForm.telefono" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Rol</label>
              <select [(ngModel)]="editForm.rol_nombre" class="input-field">
                <option value="cliente">Cliente</option>
                <option value="taller">Taller</option>
                <option value="tecnico">Técnico</option>
                <option value="tenant_admin">Tenant Admin</option>
              </select>
            </div>
            <div class="form-field">
              <label>Organización</label>
              <select [(ngModel)]="editForm.organizacion_id" class="input-field">
                <option [ngValue]="null">Sin organización</option>
                <option *ngFor="let o of organizaciones" [ngValue]="o.organizacion_id">{{ o.nombre }}</option>
              </select>
            </div>
            <div class="form-field">
              <label>Documento de identidad</label>
              <input [(ngModel)]="editForm.documento_identidad" class="input-field"/>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeEdit()">Cancelar</button>
          <button class="btn-primary" (click)="saveEdit()" [disabled]="saving">
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== DETAIL MODAL ===== -->
    <div class="modal-backdrop" *ngIf="showDetailModal" (click)="showDetailModal = false; cdr.markForCheck()">
      <div class="modal modal-sm" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Detalle de Usuario</h2>
          <button class="modal-close" (click)="showDetailModal = false; cdr.markForCheck()">✕</button>
        </div>
        <div class="modal-body" *ngIf="selectedUser">
          <div class="detail-grid">
            <div class="detail-row"><span class="dl">ID</span><span class="dv">{{ selectedUser.usuario_id }}</span></div>
            <div class="detail-row"><span class="dl">Nombre</span><span class="dv fw">{{ selectedUser.nombre }}</span></div>
            <div class="detail-row"><span class="dl">Email</span><span class="dv">{{ selectedUser.email }}</span></div>
            <div class="detail-row"><span class="dl">Teléfono</span><span class="dv">{{ selectedUser.telefono || '—' }}</span></div>
            <div class="detail-row">
              <span class="dl">Rol</span>
              <span class="badge" [ngClass]="rolClass(selectedUser.rol)">{{ selectedUser.rol }}</span>
            </div>
            <div class="detail-row">
              <span class="dl">Estado</span>
              <span class="badge" [class.badge-active]="selectedUser.estado==='activo'" [class.badge-inactive]="selectedUser.estado!=='activo'">
                {{ selectedUser.estado }}
              </span>
            </div>
            <div class="detail-row"><span class="dl">Organización</span><span class="dv">{{ selectedUser.organizacion_nombre || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Documento</span><span class="dv">{{ selectedUser.documento_identidad || '—' }}</span></div>
            <div class="detail-row"><span class="dl">Registrado</span><span class="dv">{{ selectedUser.fecha_registro | date:'dd/MM/yyyy HH:mm' }}</span></div>
            <div class="detail-row"><span class="dl">Último acceso</span><span class="dv">{{ (selectedUser.ultimo_acceso | date:'dd/MM/yyyy HH:mm') || '—' }}</span></div>
            <div class="detail-row" *ngIf="selectedUser.info_extra"><span class="dl">Info adicional</span><span class="dv">{{ selectedUser.info_extra }}</span></div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-primary" (click)="showDetailModal = false; cdr.markForCheck()">Cerrar</button>
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
      background: #7c3aed; color: white; border: none; border-radius: 10px;
      padding: 0.55rem 1.1rem; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s; white-space: nowrap;
    }
    .btn-primary:hover:not(:disabled) { background: #6d28d9; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary svg { width: 15px; height: 15px; }
    .filters { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; align-items: center; }
    .select-field {
      padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white; cursor: pointer;
    }
    .total-badge {
      font-size: 0.85rem; color: #64748b;
      background: #f1f5f9; padding: 0.35rem 0.85rem; border-radius: 99px;
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
    td { padding: 0.7rem 1rem; border-bottom: 1px solid #f8fafc; color: #334155; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #fafafa; }
    .name-cell { font-weight: 600; color: #1e293b; }
    .muted { color: #94a3b8; }
    .small { font-size: 0.78rem; }
    .org-chip {
      background: #f5f3ff; color: #7c3aed; padding: 0.15rem 0.5rem;
      border-radius: 99px; font-size: 0.75rem; font-weight: 600;
    }
    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    }
    .badge-active   { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }
    .badge-cliente  { background: #e0f2fe; color: #0369a1; }
    .badge-taller   { background: #ccfbf1; color: #0f766e; }
    .badge-tecnico  { background: #fef3c7; color: #b45309; }
    .badge-tenant   { background: #ede9fe; color: #7c3aed; }
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
    /* Action buttons */
    .row-actions { display: flex; gap: 0.3rem; align-items: center; }
    .btn-icon {
      width: 30px; height: 30px; border-radius: 7px; border: 1.5px solid #e2e8f0;
      background: white; cursor: pointer; display: flex; align-items: center;
      justify-content: center; transition: all 0.15s; color: #64748b;
    }
    .btn-icon svg { width: 14px; height: 14px; }
    .btn-icon:hover { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
    .btn-edit:hover  { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .btn-deactivate:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
    .btn-activate:hover   { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
    .btn-icon:disabled { opacity: 0.5; cursor: not-allowed; }
    .mini-spinner {
      width: 12px; height: 12px; border: 2px solid #e2e8f0;
      border-top-color: #7c3aed; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 16px; width: 100%; max-width: 560px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;
    }
    .modal-sm { max-width: 480px; }
    .modal-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .modal-close {
      background: none; border: none; font-size: 1.1rem; cursor: pointer;
      color: #94a3b8; padding: 0.25rem; line-height: 1;
    }
    .modal-close:hover { color: #334155; }
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      display: flex; gap: 0.75rem; justify-content: flex-end;
      padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9;
    }
    .btn-cancel {
      padding: 0.55rem 1.1rem; border: 1.5px solid #e2e8f0; border-radius: 10px;
      background: white; font-size: 0.875rem; font-weight: 600; cursor: pointer; color: #334155;
    }
    .btn-cancel:hover { border-color: #94a3b8; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-field-full { grid-column: 1 / -1; }
    .form-field label { font-size: 0.78rem; font-weight: 600; color: #475569; }
    .input-field {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white; width: 100%;
      box-sizing: border-box;
    }
    .input-field:focus { outline: none; border-color: #7c3aed; }
    /* Detail */
    .detail-grid { display: flex; flex-direction: column; gap: 0.75rem; }
    .detail-row { display: flex; gap: 1rem; align-items: baseline; }
    .dl { font-size: 0.75rem; font-weight: 600; color: #94a3b8; min-width: 110px; text-transform: uppercase; letter-spacing: 0.03em; }
    .dv { font-size: 0.875rem; color: #334155; }
    .fw { font-weight: 600; color: #1e293b; }
    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
      .form-field-full { grid-column: 1; }
    }
  `]
})
export class SaUsuariosComponent implements OnInit {
  cdr         = inject(ChangeDetectorRef);
  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  usuarios: any[] = [];
  total = 0; limit = 25; offset = 0;
  loading = false; error = '';
  filtroRol = ''; filtroEstado = '';

  showCreateModal = false;
  showEditModal   = false;
  showDetailModal = false;
  saving = false;
  saveError = '';
  selectedUser: any = null;
  toggleLoading: Record<number, boolean> = {};

  createForm = { nombre: '', email: '', password: '', telefono: '', rol_nombre: 'cliente', organizacion_id: null as number | null, documento_identidad: '' };
  editForm   = { nombre: '', email: '', telefono: '', rol_nombre: '', organizacion_id: null as number | null, documento_identidad: '' };

  organizaciones: any[] = [];

  ngOnInit(): void {
    this.loadUsuarios();
    this.loadOrganizaciones();
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  private baseUrl = `${environment.api.baseUrl}/api/superadmin`;

  loadUsuarios(): void {
    this.loading = true; this.error = '';
    this.cdr.markForCheck();
    let url = `${this.baseUrl}/usuarios?limit=${this.limit}&offset=${this.offset}`;
    if (this.filtroRol)    url += `&rol=${this.filtroRol}`;
    if (this.filtroEstado) url += `&estado=${this.filtroEstado}`;
    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => { this.usuarios = res.data; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => { this.error = err?.error?.detail || 'Error al cargar usuarios'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private loadOrganizaciones(): void {
    this.http.get<any>(`${this.baseUrl}/organizaciones?limit=200`, { headers: this.headers() }).subscribe({
      next: (res) => { this.organizaciones = res.data || []; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  onFilter(): void { this.offset = 0; this.loadUsuarios(); }

  openCreateModal(): void {
    this.createForm = { nombre: '', email: '', password: '', telefono: '', rol_nombre: 'cliente', organizacion_id: null, documento_identidad: '' };
    this.saveError = ''; this.showCreateModal = true;
    this.cdr.markForCheck();
  }

  closeCreate(): void { this.showCreateModal = false; this.cdr.markForCheck(); }

  saveCreate(): void {
    if (!this.createForm.nombre.trim() || !this.createForm.email.trim() || !this.createForm.password.trim()) {
      this.saveError = 'Nombre, email y contraseña son requeridos.';
      this.cdr.markForCheck(); return;
    }
    this.saving = true; this.saveError = ''; this.cdr.markForCheck();
    this.http.post<any>(`${this.baseUrl}/usuarios`, this.createForm, { headers: this.headers() }).subscribe({
      next: () => { this.saving = false; this.showCreateModal = false; this.loadUsuarios(); this.cdr.markForCheck(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.detail || 'Error al crear usuario'; this.cdr.markForCheck(); }
    });
  }

  openEditModal(u: any): void {
    this.selectedUser = u;
    this.editForm = {
      nombre: u.nombre, email: u.email, telefono: u.telefono || '',
      rol_nombre: u.rol, organizacion_id: u.organizacion_id || null,
      documento_identidad: u.documento_identidad || ''
    };
    this.saveError = ''; this.showEditModal = true;
    this.cdr.markForCheck();
  }

  closeEdit(): void { this.showEditModal = false; this.cdr.markForCheck(); }

  saveEdit(): void {
    if (!this.selectedUser) return;
    this.saving = true; this.saveError = ''; this.cdr.markForCheck();
    this.http.put<any>(`${this.baseUrl}/usuarios/${this.selectedUser.usuario_id}`, this.editForm, { headers: this.headers() }).subscribe({
      next: () => { this.saving = false; this.showEditModal = false; this.loadUsuarios(); this.cdr.markForCheck(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.detail || 'Error al editar usuario'; this.cdr.markForCheck(); }
    });
  }

  viewDetail(u: any): void {
    this.selectedUser = u; this.showDetailModal = true;
    this.cdr.markForCheck();
  }

  toggleEstado(u: any): void {
    this.toggleLoading[u.usuario_id] = true;
    this.cdr.markForCheck();
    this.http.patch<any>(`${this.baseUrl}/usuarios/${u.usuario_id}/estado`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        const idx = this.usuarios.findIndex(x => x.usuario_id === u.usuario_id);
        if (idx >= 0) this.usuarios[idx].estado = res.estado;
        this.toggleLoading[u.usuario_id] = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al cambiar estado';
        this.toggleLoading[u.usuario_id] = false;
        this.cdr.markForCheck();
      }
    });
  }

  rolClass(rol: string): string {
    if (rol === 'cliente')      return 'badge-cliente';
    if (rol === 'taller')       return 'badge-taller';
    if (rol === 'tecnico')      return 'badge-tecnico';
    if (rol === 'tenant_admin') return 'badge-tenant';
    return '';
  }

  prevPage(): void { if (this.offset > 0) { this.offset -= this.limit; this.loadUsuarios(); } }
  nextPage(): void { if (this.offset + this.limit < this.total) { this.offset += this.limit; this.loadUsuarios(); } }
  min(a: number, b: number): number { return Math.min(a, b); }
}
