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
      <div class="page-header">
        <div>
          <h1 class="page-title">Usuarios</h1>
          <p class="page-sub">Listado global de usuarios registrados en la plataforma</p>
        </div>
        <span class="total-badge">{{ total }} usuarios</span>
      </div>

      <!-- Filtros -->
      <div class="filters">
        <select [(ngModel)]="filtroRol" (change)="loadUsuarios()" class="select-field">
          <option value="">Todos los roles</option>
          <option value="cliente">Cliente</option>
          <option value="taller">Taller</option>
          <option value="tecnico">Técnico</option>
          <option value="tenant_admin">Tenant Admin</option>
        </select>
        <select [(ngModel)]="filtroEstado" (change)="loadUsuarios()" class="select-field">
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>

      <div class="alert-error" *ngIf="error">{{ error }}</div>

      <div class="loading-wrap" *ngIf="loading">
        <div class="spinner"></div><span>Cargando usuarios...</span>
      </div>

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
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of usuarios">
                <td class="muted">{{ u.usuario_id }}</td>
                <td class="name-cell">{{ u.nombre }}</td>
                <td class="muted small">{{ u.email }}</td>
                <td><span class="badge" [ngClass]="rolClass(u.rol_nombre)">{{ u.rol_nombre }}</span></td>
                <td>
                  <span class="muted" *ngIf="!u.organizacion_nombre">—</span>
                  <span class="org-chip" *ngIf="u.organizacion_nombre">{{ u.organizacion_nombre }}</span>
                </td>
                <td class="muted small">{{ u.info_extra || '—' }}</td>
                <td>
                  <span class="badge"
                    [class.badge-active]="u.estado === 'activo'"
                    [class.badge-inactive]="u.estado !== 'activo'">
                    {{ u.estado }}
                  </span>
                </td>
                <td class="muted small">{{ u.creado_en | date:'dd/MM/yyyy' }}</td>
              </tr>
              <tr *ngIf="usuarios.length === 0">
                <td colspan="8" class="empty-msg">No hay usuarios con ese filtro.</td>
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
    .total-badge {
      align-self: center; font-size: 0.85rem; color: #64748b;
      background: #f1f5f9; padding: 0.35rem 0.85rem; border-radius: 99px;
    }
    .filters { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
    .select-field {
      padding: 0.5rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white;
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
  `]
})
export class SaUsuariosComponent implements OnInit {
  private http        = inject(HttpClient);
  private authService = inject(AuthService);
  private cdr         = inject(ChangeDetectorRef);

  usuarios: any[] = [];
  total = 0; limit = 25; offset = 0;
  loading = false; error = '';
  filtroRol = ''; filtroEstado = '';

  ngOnInit(): void { this.loadUsuarios(); }

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  loadUsuarios(): void {
    this.loading = true; this.error = '';
    this.cdr.markForCheck();
    let url = `${environment.api.baseUrl}/api/superadmin/usuarios?limit=${this.limit}&offset=${this.offset}`;
    if (this.filtroRol)    url += `&rol=${this.filtroRol}`;
    if (this.filtroEstado) url += `&estado=${this.filtroEstado}`;

    this.http.get<any>(url, { headers: this.headers() }).subscribe({
      next: (res) => { this.usuarios = res.data; this.total = res.total; this.loading = false; this.cdr.markForCheck(); },
      error: (err) => { this.error = err?.error?.detail || 'Error al cargar'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  rolClass(rol: string): string {
    if (rol === 'cliente')     return 'badge-cliente';
    if (rol === 'taller')      return 'badge-taller';
    if (rol === 'tecnico')     return 'badge-tecnico';
    if (rol === 'tenant_admin') return 'badge-tenant';
    return '';
  }

  prevPage(): void { if (this.offset > 0) { this.offset -= this.limit; this.loadUsuarios(); } }
  nextPage(): void { if (this.offset + this.limit < this.total) { this.offset += this.limit; this.loadUsuarios(); } }
  min(a: number, b: number): number { return Math.min(a, b); }
}
