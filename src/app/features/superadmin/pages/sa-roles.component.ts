import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-sa-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sa-page">

      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Roles y Permisos</h1>
          <p class="page-sub">Gestiona los roles del sistema y sus permisos asociados</p>
        </div>
        <button class="btn-primary" (click)="openCreateModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Rol
        </button>
      </div>

      <div class="alert-error" *ngIf="error">{{ error }}</div>

      <!-- Loading -->
      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando roles...</span>
      </div>

      <!-- Roles grid -->
      <div class="roles-grid" *ngIf="!loading">
        <div class="rol-card" *ngFor="let r of roles"
             [class.rol-card-inactive]="r.activo === false">

          <div class="rol-card-header">
            <div class="rol-info">
              <div class="rol-name">{{ r.nombre }}</div>
              <span class="tag-base" *ngIf="!r.es_personalizado">Base</span>
              <span class="tag-custom" *ngIf="r.es_personalizado">Personalizado</span>
            </div>
            <span class="badge" [class.badge-active]="r.activo !== false" [class.badge-inactive]="r.activo === false">
              {{ r.activo !== false ? 'Activo' : 'Inactivo' }}
            </span>
          </div>

          <div class="rol-desc" *ngIf="r.descripcion">{{ r.descripcion }}</div>
          <div class="rol-desc muted" *ngIf="!r.descripcion">Sin descripción</div>

          <div class="rol-meta">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            {{ r.total_usuarios }} usuario{{ r.total_usuarios !== 1 ? 's' : '' }}
          </div>

          <div class="rol-actions">
            <button class="btn-sm btn-permisos" (click)="openPermisosModal(r)" title="Ver y asignar permisos">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Permisos
            </button>
            <button class="btn-sm btn-edit" *ngIf="r.es_personalizado"
                    (click)="openEditModal(r)" title="Editar rol">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar
            </button>
            <button class="btn-sm"
                    *ngIf="r.es_personalizado"
                    [class.btn-deactivate]="r.activo !== false"
                    [class.btn-activate]="r.activo === false"
                    [disabled]="!!toggleLoading[r.rol_id]"
                    (click)="toggleEstado(r)"
                    [title]="r.activo !== false ? 'Desactivar rol' : 'Activar rol'">
              <div class="mini-spinner" *ngIf="toggleLoading[r.rol_id]"></div>
              <svg *ngIf="!toggleLoading[r.rol_id]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line *ngIf="r.activo !== false" x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                <polyline *ngIf="r.activo === false" points="20 6 9 17 4 12"/>
              </svg>
              {{ r.activo !== false ? 'Desactivar' : 'Activar' }}
            </button>
          </div>
        </div>

        <div class="empty-card" *ngIf="roles.length === 0">
          No hay roles registrados.
        </div>
      </div>
    </div>

    <!-- ===== CREATE MODAL ===== -->
    <div class="modal-backdrop" *ngIf="showCreateModal" (click)="closeCreate()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Nuevo Rol Personalizado</h2>
          <button class="modal-close" (click)="closeCreate()">✕</button>
        </div>
        <div class="modal-body">
          <div class="alert-error" *ngIf="saveError">{{ saveError }}</div>
          <div class="form-stack">
            <div class="form-field">
              <label>Nombre del rol *</label>
              <input [(ngModel)]="createForm.nombre" placeholder="Ej. supervisor_ventas" class="input-field"/>
              <span class="hint">Se guardará en minúsculas con guiones bajos</span>
            </div>
            <div class="form-field">
              <label>Descripción</label>
              <textarea [(ngModel)]="createForm.descripcion" rows="3"
                        placeholder="Descripción de responsabilidades del rol..." class="input-field"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCreate()">Cancelar</button>
          <button class="btn-primary" (click)="saveCreate()" [disabled]="saving">
            {{ saving ? 'Creando...' : 'Crear Rol' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ===== EDIT MODAL ===== -->
    <div class="modal-backdrop" *ngIf="showEditModal" (click)="closeEdit()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2 class="modal-title">Editar Rol</h2>
          <button class="modal-close" (click)="closeEdit()">✕</button>
        </div>
        <div class="modal-body">
          <div class="alert-error" *ngIf="saveError">{{ saveError }}</div>
          <div class="form-stack">
            <div class="form-field">
              <label>Nombre del rol</label>
              <input [(ngModel)]="editForm.nombre" class="input-field"/>
            </div>
            <div class="form-field">
              <label>Descripción</label>
              <textarea [(ngModel)]="editForm.descripcion" rows="3" class="input-field"></textarea>
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

    <!-- ===== PERMISOS MODAL ===== -->
    <div class="modal-backdrop" *ngIf="showPermisosModal" (click)="closePermisos()">
      <div class="modal modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <div>
            <h2 class="modal-title">Permisos del Rol</h2>
            <p class="modal-sub" *ngIf="selectedRol">{{ selectedRol.nombre }}</p>
          </div>
          <button class="modal-close" (click)="closePermisos()">✕</button>
        </div>
        <div class="modal-body">
          <div class="loading-wrap" *ngIf="loadingPermisos">
            <div class="spinner"></div><span>Cargando permisos...</span>
          </div>

          <div *ngIf="!loadingPermisos">
            <div class="permisos-info">
              <span class="permisos-count">{{ selectedPermisos.size }} permisos seleccionados</span>
              <div class="permisos-btns">
                <button class="btn-link" (click)="selectAll()">Seleccionar todos</button>
                <span class="sep">·</span>
                <button class="btn-link" (click)="clearAll()">Deseleccionar todos</button>
              </div>
            </div>

            <div *ngFor="let modulo of moduloKeys()" class="permiso-group">
              <div class="permiso-group-header">
                <div class="permiso-group-dot"></div>
                {{ modulo }}
              </div>
              <div class="permiso-list">
                <label *ngFor="let p of permisosPorModulo[modulo]" class="permiso-item">
                  <input type="checkbox"
                         [checked]="selectedPermisos.has(p.permiso_id)"
                         (change)="togglePermiso(p.permiso_id)"
                         class="permiso-check"/>
                  <div class="permiso-text">
                    <span class="permiso-nombre">{{ p.nombre }}</span>
                    <span class="permiso-codigo">{{ p.codigo }}</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closePermisos()">Cancelar</button>
          <button class="btn-primary" (click)="savePermisos()" [disabled]="savingPermisos || loadingPermisos">
            {{ savingPermisos ? 'Guardando...' : 'Guardar Permisos' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sa-page { max-width: 1200px; }
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap;
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
    /* Roles grid */
    .roles-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;
    }
    .rol-card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.06); padding: 1.25rem;
      display: flex; flex-direction: column; gap: 0.75rem; transition: box-shadow 0.2s;
    }
    .rol-card:hover { box-shadow: 0 4px 12px rgba(124,58,237,.1); }
    .rol-card-inactive { opacity: 0.65; border-color: #fecaca; }
    .rol-card-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 0.5rem; }
    .rol-info { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
    .rol-name { font-size: 0.95rem; font-weight: 700; color: #1e293b; }
    .tag-base {
      background: #f1f5f9; color: #64748b; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 99px;
    }
    .tag-custom {
      background: #f5f3ff; color: #7c3aed; font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; padding: 0.15rem 0.45rem; border-radius: 99px;
    }
    .badge {
      display: inline-block; padding: 0.2rem 0.55rem; border-radius: 99px;
      font-size: 0.7rem; font-weight: 700; text-transform: uppercase; white-space: nowrap;
    }
    .badge-active   { background: #dcfce7; color: #16a34a; }
    .badge-inactive { background: #fee2e2; color: #dc2626; }
    .rol-desc { font-size: 0.8rem; color: #64748b; line-height: 1.45; }
    .muted { color: #94a3b8 !important; font-style: italic; }
    .rol-meta {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.78rem; color: #94a3b8;
    }
    .rol-meta svg { width: 13px; height: 13px; }
    .rol-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.25rem; }
    .btn-sm {
      display: inline-flex; align-items: center; gap: 0.3rem;
      padding: 0.35rem 0.75rem; border-radius: 8px; font-size: 0.78rem; font-weight: 600;
      cursor: pointer; border: 1.5px solid; transition: all 0.15s;
    }
    .btn-sm svg { width: 12px; height: 12px; }
    .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-permisos  { border-color: #7c3aed; color: #7c3aed; background: #f5f3ff; }
    .btn-permisos:hover { background: #ede9fe; }
    .btn-edit      { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .btn-edit:hover { background: #dbeafe; }
    .btn-deactivate { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
    .btn-deactivate:hover:not(:disabled) { background: #fee2e2; }
    .btn-activate   { border-color: #16a34a; color: #16a34a; background: #f0fdf4; }
    .btn-activate:hover:not(:disabled)   { background: #dcfce7; }
    .mini-spinner {
      width: 11px; height: 11px; border: 2px solid #e2e8f0;
      border-top-color: currentColor; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    .empty-card {
      grid-column: 1 / -1; text-align: center; color: #94a3b8;
      padding: 3rem; background: white; border-radius: 14px; border: 1px solid #e2e8f0;
    }
    /* Modal */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.55);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal {
      background: white; border-radius: 16px; width: 100%; max-width: 500px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2); max-height: 90vh; overflow-y: auto;
    }
    .modal-lg { max-width: 680px; }
    .modal-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9;
    }
    .modal-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0; }
    .modal-sub   { font-size: 0.8rem; color: #7c3aed; font-weight: 600; margin: 0.2rem 0 0; }
    .modal-close {
      background: none; border: none; font-size: 1.1rem; cursor: pointer;
      color: #94a3b8; padding: 0.25rem; line-height: 1; flex-shrink: 0;
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
    .form-stack { display: flex; flex-direction: column; gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.35rem; }
    .form-field label { font-size: 0.78rem; font-weight: 600; color: #475569; }
    .hint { font-size: 0.72rem; color: #94a3b8; }
    .input-field {
      padding: 0.55rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white; width: 100%;
      box-sizing: border-box; font-family: inherit; resize: vertical;
    }
    .input-field:focus { outline: none; border-color: #7c3aed; }
    /* Permisos */
    .permisos-info {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 1rem; gap: 0.5rem; flex-wrap: wrap;
    }
    .permisos-count { font-size: 0.82rem; color: #7c3aed; font-weight: 600; }
    .permisos-btns  { display: flex; align-items: center; gap: 0.4rem; }
    .btn-link { background: none; border: none; color: #7c3aed; font-size: 0.78rem; cursor: pointer; padding: 0; font-weight: 600; }
    .btn-link:hover { text-decoration: underline; }
    .sep { color: #cbd5e1; font-size: 0.78rem; }
    .permiso-group { margin-bottom: 1.25rem; }
    .permiso-group-header {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.05em; color: #94a3b8; margin-bottom: 0.5rem;
    }
    .permiso-group-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #7c3aed; flex-shrink: 0;
    }
    .permiso-list { display: flex; flex-direction: column; gap: 0.1rem; }
    .permiso-item {
      display: flex; align-items: flex-start; gap: 0.65rem; padding: 0.5rem 0.65rem;
      border-radius: 8px; cursor: pointer; transition: background 0.12s;
    }
    .permiso-item:hover { background: #f8fafc; }
    .permiso-check {
      margin-top: 0.15rem; width: 15px; height: 15px; flex-shrink: 0; cursor: pointer;
      accent-color: #7c3aed;
    }
    .permiso-text  { display: flex; flex-direction: column; gap: 0.1rem; }
    .permiso-nombre { font-size: 0.83rem; color: #334155; font-weight: 500; }
    .permiso-codigo { font-size: 0.7rem; color: #94a3b8; font-family: monospace; }
  `]
})
export class SaRolesComponent implements OnInit {
  private readonly cdr         = inject(ChangeDetectorRef);
  private readonly http        = inject(HttpClient);
  private readonly authService = inject(AuthService);

  roles: any[] = [];
  loading = false;
  error = '';

  showCreateModal  = false;
  showEditModal    = false;
  showPermisosModal = false;
  saving = false;
  savingPermisos = false;
  loadingPermisos = false;
  saveError = '';
  selectedRol: any = null;
  toggleLoading: Record<number, boolean> = {};

  createForm = { nombre: '', descripcion: '' };
  editForm   = { nombre: '', descripcion: '' };

  permisosPorModulo: Record<string, any[]> = {};
  selectedPermisos = new Set<number>();

  private baseUrl = `${environment.api.baseUrl}/api/superadmin`;

  ngOnInit(): void { this.loadRoles(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadRoles(): void {
    this.loading = true; this.error = '';
    this.cdr.markForCheck();
    this.http.get<any>(`${this.baseUrl}/roles`, { headers: this.headers() }).subscribe({
      next: (res) => { this.roles = res.data; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => { this.error = err?.error?.detail || 'Error al cargar roles'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  openCreateModal(): void {
    this.createForm = { nombre: '', descripcion: '' };
    this.saveError = ''; this.showCreateModal = true;
    this.cdr.markForCheck();
  }

  closeCreate(): void { this.showCreateModal = false; this.cdr.markForCheck(); }

  saveCreate(): void {
    if (!this.createForm.nombre.trim()) {
      this.saveError = 'El nombre del rol es requerido.';
      this.cdr.markForCheck(); return;
    }
    this.saving = true; this.saveError = ''; this.cdr.markForCheck();
    this.http.post<any>(`${this.baseUrl}/roles`, this.createForm, { headers: this.headers() }).subscribe({
      next: () => { this.saving = false; this.showCreateModal = false; this.loadRoles(); this.cdr.markForCheck(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.detail || 'Error al crear rol'; this.cdr.markForCheck(); }
    });
  }

  openEditModal(r: any): void {
    this.selectedRol = r;
    this.editForm = { nombre: r.nombre, descripcion: r.descripcion || '' };
    this.saveError = ''; this.showEditModal = true;
    this.cdr.markForCheck();
  }

  closeEdit(): void { this.showEditModal = false; this.cdr.markForCheck(); }

  saveEdit(): void {
    if (!this.selectedRol) return;
    this.saving = true; this.saveError = ''; this.cdr.markForCheck();
    this.http.put<any>(`${this.baseUrl}/roles/${this.selectedRol.rol_id}`, this.editForm, { headers: this.headers() }).subscribe({
      next: () => { this.saving = false; this.showEditModal = false; this.loadRoles(); this.cdr.markForCheck(); },
      error: (err) => { this.saving = false; this.saveError = err?.error?.detail || 'Error al editar rol'; this.cdr.markForCheck(); }
    });
  }

  openPermisosModal(r: any): void {
    this.selectedRol = r;
    this.permisosPorModulo = {};
    this.selectedPermisos = new Set();
    this.loadingPermisos = true;
    this.showPermisosModal = true;
    this.cdr.markForCheck();

    this.http.get<any>(`${this.baseUrl}/roles/${r.rol_id}/permisos`, { headers: this.headers() }).subscribe({
      next: (res) => {
        const grouped: Record<string, any[]> = {};
        for (const p of res.permisos) {
          if (!grouped[p.modulo]) grouped[p.modulo] = [];
          grouped[p.modulo].push(p);
          if (p.asignado) this.selectedPermisos.add(p.permiso_id);
        }
        this.permisosPorModulo = grouped;
        this.loadingPermisos = false;
        this.cdr.markForCheck();
      },
      error: () => { this.loadingPermisos = false; this.cdr.markForCheck(); }
    });
  }

  closePermisos(): void { this.showPermisosModal = false; this.cdr.markForCheck(); }

  togglePermiso(id: number): void {
    if (this.selectedPermisos.has(id)) {
      this.selectedPermisos.delete(id);
    } else {
      this.selectedPermisos.add(id);
    }
    this.cdr.markForCheck();
  }

  selectAll(): void {
    for (const permisos of Object.values(this.permisosPorModulo)) {
      for (const p of permisos) this.selectedPermisos.add(p.permiso_id);
    }
    this.cdr.markForCheck();
  }

  clearAll(): void {
    this.selectedPermisos = new Set();
    this.cdr.markForCheck();
  }

  savePermisos(): void {
    if (!this.selectedRol) return;
    this.savingPermisos = true; this.cdr.markForCheck();
    const body = { permiso_ids: Array.from(this.selectedPermisos) };
    this.http.put<any>(`${this.baseUrl}/roles/${this.selectedRol.rol_id}/permisos`, body, { headers: this.headers() }).subscribe({
      next: () => { this.savingPermisos = false; this.showPermisosModal = false; this.cdr.markForCheck(); },
      error: (err) => {
        this.savingPermisos = false;
        this.error = err?.error?.detail || 'Error al guardar permisos';
        this.cdr.markForCheck();
      }
    });
  }

  toggleEstado(r: any): void {
    this.toggleLoading[r.rol_id] = true;
    this.cdr.markForCheck();
    this.http.patch<any>(`${this.baseUrl}/roles/${r.rol_id}/estado`, {}, { headers: this.headers() }).subscribe({
      next: (res) => {
        const idx = this.roles.findIndex(x => x.rol_id === r.rol_id);
        if (idx >= 0) this.roles[idx].activo = res.activo;
        this.toggleLoading[r.rol_id] = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Error al cambiar estado del rol';
        this.toggleLoading[r.rol_id] = false;
        this.cdr.markForCheck();
      }
    });
  }

  moduloKeys(): string[] { return Object.keys(this.permisosPorModulo); }
}
