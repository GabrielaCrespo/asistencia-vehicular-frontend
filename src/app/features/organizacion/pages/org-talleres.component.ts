import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { TallerResumen, TallerEnOrgCreate } from '../../../core/models/organizacion.models';

@Component({
  selector: 'app-org-talleres',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <!-- Overlay del drawer -->
    <div class="drawer-overlay" [class.visible]="showForm" (click)="cerrarDrawer()"></div>

    <!-- Drawer lateral -->
    <div class="drawer" [class.open]="showForm">
      <div class="drawer-header">
        <div class="drawer-title">
          <div class="drawer-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <div>
            <h2>Nuevo taller</h2>
            <p>Completa los datos para registrar el taller en tu organización</p>
          </div>
        </div>
        <button class="btn-close" (click)="cerrarDrawer()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <div class="drawer-body" *ngIf="showForm">
        <form [formGroup]="form" (ngSubmit)="crearTaller()">

          <!-- Sección 1: Responsable -->
          <div class="form-section">
            <div class="section-label">
              <div class="section-num">1</div>
              <span>Datos del responsable</span>
            </div>
            <div class="fields-grid">
              <div class="field">
                <label>Nombre completo *</label>
                <input formControlName="nombre_contacto" type="text" placeholder="Juan Pérez"/>
                <span class="err" *ngIf="isInvalid('nombre_contacto')">Requerido</span>
              </div>
              <div class="field">
                <label>CI / NIT *</label>
                <input formControlName="documento_identidad" type="text" placeholder="12345678"/>
                <span class="err" *ngIf="isInvalid('documento_identidad')">Requerido</span>
              </div>
              <div class="field">
                <label>Teléfono personal *</label>
                <input formControlName="telefono" type="text" placeholder="591 7xxxxxxx"/>
                <span class="err" *ngIf="isInvalid('telefono')">Requerido</span>
              </div>
              <div class="field">
                <label>Email de acceso *</label>
                <input formControlName="email" type="email" placeholder="taller@empresa.com"/>
                <span class="err" *ngIf="isInvalid('email')">Email inválido</span>
              </div>
              <div class="field field-full">
                <label>Contraseña de acceso *</label>
                <div class="pass-wrap">
                  <input formControlName="password" [type]="showPass ? 'text' : 'password'" placeholder="Mínimo 6 caracteres"/>
                  <button type="button" class="btn-eye" (click)="showPass = !showPass">
                    <svg *ngIf="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                    <svg *ngIf="showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  </button>
                </div>
                <span class="err" *ngIf="isInvalid('password')">Mínimo 6 caracteres</span>
              </div>
            </div>
          </div>

          <!-- Sección 2: Datos del taller -->
          <div class="form-section">
            <div class="section-label">
              <div class="section-num">2</div>
              <span>Datos del taller</span>
            </div>
            <div class="fields-grid">
              <div class="field field-full">
                <label>Razón social *</label>
                <input formControlName="razon_social" type="text" placeholder="Taller Express S.R.L."/>
                <span class="err" *ngIf="isInvalid('razon_social')">Requerido</span>
              </div>
              <div class="field field-full">
                <label>Dirección *</label>
                <input formControlName="direccion" type="text" placeholder="Av. Principal 123, La Paz"/>
                <span class="err" *ngIf="isInvalid('direccion')">Requerido</span>
              </div>
              <div class="field">
                <label>Teléfono operativo *</label>
                <input formControlName="telefono_operativo" type="text" placeholder="591 2xxxxxxx"/>
                <span class="err" *ngIf="isInvalid('telefono_operativo')">Requerido</span>
              </div>
            </div>
          </div>

          <!-- Sección 3: Ubicación y horario -->
          <div class="form-section">
            <div class="section-label">
              <div class="section-num">3</div>
              <span>Ubicación y horario</span>
            </div>

            <!-- Mapa interactivo -->
            <div class="map-wrap">
              <p class="map-instruction">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                Haz clic en el mapa para marcar la ubicación del taller
              </p>
              <div id="taller-map-picker" class="map-canvas"></div>
              <p class="map-msg" *ngIf="mapLoading">Cargando mapa…</p>
              <p class="map-msg map-msg-err" *ngIf="mapErr">{{ mapErr }}</p>
            </div>

            <div class="fields-grid">
              <div class="field">
                <label>Latitud *</label>
                <input formControlName="latitud" type="number" step="any" placeholder="-17.7863" (change)="syncMapFromFields()"/>
                <span class="err" *ngIf="isInvalid('latitud')">Requerido</span>
              </div>
              <div class="field">
                <label>Longitud *</label>
                <div class="geo-wrap">
                  <input formControlName="longitud" type="number" step="any" placeholder="-63.1812" (change)="syncMapFromFields()"/>
                  <button type="button" class="btn-geo" (click)="usarGeolocalizacion()"
                          [disabled]="geoLoading" title="Usar mi ubicación actual">
                    <svg *ngIf="!geoLoading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="3"/>
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
                      <path d="M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
                    </svg>
                    <span class="spinner-sm" *ngIf="geoLoading"></span>
                  </button>
                </div>
                <span class="err" *ngIf="isInvalid('longitud')">Requerido</span>
              </div>
              <div class="field">
                <label>Apertura *</label>
                <input formControlName="horario_inicio" type="time"/>
              </div>
              <div class="field">
                <label>Cierre *</label>
                <input formControlName="horario_fin" type="time"/>
              </div>
              <p class="geo-hint field-full" *ngIf="geoMsg">{{ geoMsg }}</p>
            </div>
          </div>

          <div class="alert-error" *ngIf="errorMsg">{{ errorMsg }}</div>
          <div class="alert-success" *ngIf="successMsg">{{ successMsg }}</div>

        </form>
      </div>

      <div class="drawer-footer">
        <button type="button" class="btn-secondary" (click)="cerrarDrawer()">Cancelar</button>
        <button type="button" class="btn-primary" [disabled]="form.invalid || saving" (click)="crearTaller()">
          <span class="spinner" *ngIf="saving"></span>
          {{ saving ? 'Registrando...' : 'Registrar taller' }}
        </button>
      </div>
    </div>

    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Talleres</h1>
          <p class="page-sub">{{ talleres.length }} taller{{ talleres.length !== 1 ? 'es' : '' }} registrado{{ talleres.length !== 1 ? 's' : '' }}</p>
        </div>
        <button class="btn-primary" (click)="showForm = true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo taller
        </button>
      </div>

      <!-- Estado de carga -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner-lg"></div>
        <p>Cargando talleres...</p>
        <p class="loading-hint" *ngIf="showRetry">El servidor está despertando, puede tardar hasta 1 minuto</p>
        <button class="btn-retry" *ngIf="showRetry" (click)="reintentar()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          Reintentar
        </button>
      </div>

      <!-- Resumen de stats -->
      <div class="summary-bar" *ngIf="!loading && talleres.length > 0">
        <div class="stat-chip">
          <span class="sc-val sc-green">Bs. {{ totalIngresos | number:'1.0-0' }}</span>
          <span class="sc-lbl">Ingresos netos totales</span>
        </div>
        <div class="stat-chip">
          <span class="sc-val">{{ avgRating | number:'1.1-1' }} ⭐</span>
          <span class="sc-lbl">Calificación promedio</span>
        </div>
        <div class="stat-chip">
          <span class="sc-val">{{ totalTecnicos }}</span>
          <span class="sc-lbl">Técnicos en total</span>
        </div>
        <div class="stat-chip">
          <span class="sc-val sc-teal">{{ talleresDisponiblesCount }}</span>
          <span class="sc-lbl">Talleres disponibles</span>
        </div>
      </div>

      <!-- Búsqueda y ordenamiento -->
      <div class="controls-bar" *ngIf="!loading && talleres.length > 0">
        <div class="search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
          </svg>
          <input type="text" class="search-input" placeholder="Buscar por nombre..."
                 [value]="busqueda" (input)="busqueda = $any($event.target).value"/>
          <button class="clear-btn" *ngIf="busqueda" (click)="busqueda = ''" type="button">×</button>
        </div>
        <div class="sort-wrap">
          <span class="sort-lbl">Ordenar:</span>
          <button class="sort-btn" [class.active]="ordenar==='ingresos'"  (click)="setOrden('ingresos')">Ingresos</button>
          <button class="sort-btn" [class.active]="ordenar==='rating'"    (click)="setOrden('rating')">Rating</button>
          <button class="sort-btn" [class.active]="ordenar==='servicios'" (click)="setOrden('servicios')">Servicios</button>
          <button class="sort-btn" [class.active]="ordenar==='nombre'"    (click)="setOrden('nombre')">A–Z</button>
        </div>
      </div>

      <!-- Sin talleres -->
      <div class="empty-state" *ngIf="!loading && talleres.length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        </svg>
        <p>No hay talleres registrados aún</p>
        <button class="btn-primary" (click)="showForm = true">Agregar primer taller</button>
      </div>

      <!-- Sin resultados de búsqueda -->
      <div class="empty-state" *ngIf="!loading && talleres.length > 0 && talleresFiltrados.length === 0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
        </svg>
        <p>Sin resultados para "{{ busqueda }}"</p>
        <button class="btn-secondary" (click)="busqueda = ''">Limpiar búsqueda</button>
      </div>

      <!-- Grid de talleres -->
      <div class="talleres-list" *ngIf="!loading && talleresFiltrados.length > 0">
        <div class="taller-card" *ngFor="let t of talleresFiltrados"
             [class.expanded]="selectedTaller?.taller_id === t.taller_id"
             (click)="toggleDetalle(t)">

          <!-- Fila principal (siempre visible) -->
          <div class="card-main">
            <div class="taller-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </div>

            <div class="card-info">
              <div class="card-top">
                <h3 class="taller-name">{{ t.razon_social }}</h3>
                <button class="badge-toggle"
                        [class.badge-green]="t.disponible"
                        [class.badge-red]="!t.disponible"
                        [disabled]="togglingId === t.taller_id"
                        (click)="toggleDisponible(t, $event)"
                        [title]="t.disponible ? 'Clic para marcar como no disponible' : 'Clic para marcar como disponible'">
                  <span class="spinner-xs" *ngIf="togglingId === t.taller_id"></span>
                  <ng-container *ngIf="togglingId !== t.taller_id">
                    {{ t.disponible ? 'Disponible' : 'No disponible' }}
                  </ng-container>
                </button>
              </div>
              <p class="taller-dir" *ngIf="t.direccion">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {{ t.direccion }}
              </p>
            </div>

            <div class="card-kpis">
              <div class="kpi-mini">
                <span class="kpi-v">{{ t.total_tecnicos }}</span>
                <span class="kpi-l">Técnicos</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-v">{{ t.servicios_completados }}</span>
                <span class="kpi-l">Servicios</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-v green">Bs. {{ t.ingresos_totales | number:'1.0-0' }}</span>
                <span class="kpi-l">Ing. netos</span>
              </div>
              <div class="kpi-mini">
                <span class="kpi-v">{{ t.calificacion_promedio | number:'1.1-1' }} ⭐</span>
                <span class="kpi-l">Rating</span>
              </div>
            </div>

            <div class="chevron" [class.up]="selectedTaller?.taller_id === t.taller_id">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <!-- Panel de detalle (expandible) -->
          <div class="card-detalle" *ngIf="selectedTaller?.taller_id === t.taller_id"
               (click)="$event.stopPropagation()">
            <div class="detalle-grid">

              <div class="det-section">
                <p class="det-title">Información de contacto</p>
                <div class="det-row" *ngIf="t.telefono_operativo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.37 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6 6l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  <span>{{ t.telefono_operativo }}</span>
                </div>
                <div class="det-row" *ngIf="t.horario_inicio && t.horario_fin">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <span>{{ t.horario_inicio }} – {{ t.horario_fin }}</span>
                </div>
                <div class="det-row" *ngIf="t.direccion">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>{{ t.direccion }}</span>
                </div>
                <div class="det-row" *ngIf="t.latitud && t.longitud">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <a [href]="osmLink(t.latitud, t.longitud)" target="_blank" rel="noopener" class="det-map-link">
                    Ver en mapa ({{ t.latitud | number:'1.4-4' }}, {{ t.longitud | number:'1.4-4' }})
                  </a>
                </div>
                <p class="det-empty" *ngIf="!t.telefono_operativo && !t.horario_inicio && !t.direccion && !t.latitud">
                  Sin información de contacto registrada
                </p>
              </div>

              <div class="det-section">
                <p class="det-title">Equipo técnico</p>
                <div class="bar-wrap">
                  <div class="bar-label">
                    <span>Disponibles</span>
                    <span class="bar-num green">{{ t.tecnicos_disponibles }} / {{ t.total_tecnicos }}</span>
                  </div>
                  <div class="bar-track">
                    <div class="bar-fill"
                         [style.width.%]="t.total_tecnicos > 0 ? (t.tecnicos_disponibles / t.total_tecnicos * 100) : 0">
                    </div>
                  </div>
                </div>
              </div>

              <div class="det-section">
                <p class="det-title">Desempeño</p>
                <div class="perf-row">
                  <div class="perf-item">
                    <span class="perf-val">{{ t.servicios_completados }}</span>
                    <span class="perf-lbl">Servicios completados</span>
                  </div>
                  <div class="perf-item">
                    <span class="perf-val green">Bs. {{ t.ingresos_totales | number:'1.2-2' }}</span>
                    <span class="perf-lbl">Ingresos netos (90%)</span>
                  </div>
                  <div class="perf-item">
                    <span class="perf-val">{{ t.calificacion_promedio | number:'1.2-2' }} ★</span>
                    <span class="perf-lbl">Calificación promedio</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1100px; position: relative; }

    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
    }

    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .page-sub { font-size: 0.875rem; color: #64748b; margin: 0; }

    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.6rem 1.1rem; background: #5cbdb9; color: white;
      border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.2s; white-space: nowrap;
    }
    .btn-primary svg { width: 15px; height: 15px; }
    .btn-primary:hover:not(:disabled) { background: #3aa7a2; }
    .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-secondary {
      padding: 0.6rem 1.1rem; background: #f1f5f9; color: #475569;
      border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.875rem;
      font-weight: 600; cursor: pointer;
    }
    .btn-secondary:hover { background: #e2e8f0; }

    /* ══ DRAWER ══ */
    .drawer-overlay {
      position: fixed; inset: 0; background: rgba(15,23,42,0.45);
      z-index: 300; opacity: 0; pointer-events: none; transition: opacity 0.25s;
    }
    .drawer-overlay.visible { opacity: 1; pointer-events: all; }

    .drawer {
      position: fixed; top: 0; right: 0; bottom: 0;
      width: 480px; max-width: 100vw;
      background: white; z-index: 310;
      display: flex; flex-direction: column;
      transform: translateX(100%);
      transition: transform 0.28s cubic-bezier(0.32, 0.72, 0, 1);
      box-shadow: -8px 0 40px rgba(0,0,0,0.12);
    }
    .drawer.open { transform: translateX(0); }

    .drawer-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f1f5f9; gap: 1rem;
      background: #f8fafc;
    }

    .drawer-title { display: flex; align-items: flex-start; gap: 0.75rem; }

    .drawer-icon {
      width: 40px; height: 40px; background: #5cbdb9; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .drawer-icon svg { width: 20px; height: 20px; stroke: white; }

    .drawer-title h2 { font-size: 1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.2rem; }
    .drawer-title p { font-size: 0.78rem; color: #64748b; margin: 0; line-height: 1.4; }

    .btn-close {
      background: none; border: none; cursor: pointer; padding: 0.25rem;
      color: #94a3b8; border-radius: 6px; flex-shrink: 0;
      transition: color 0.18s, background 0.18s;
    }
    .btn-close svg { width: 18px; height: 18px; }
    .btn-close:hover { color: #334155; background: #e2e8f0; }

    .drawer-body {
      flex: 1; overflow-y: auto; padding: 1.25rem 1.5rem;
      display: flex; flex-direction: column; gap: 1.25rem;
    }

    .form-section {
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
      padding: 1rem 1.25rem;
    }

    .section-label {
      display: flex; align-items: center; gap: 0.6rem;
      font-size: 0.82rem; font-weight: 700; color: #475569;
      margin-bottom: 0.9rem;
    }
    .section-num {
      width: 22px; height: 22px; border-radius: 50%;
      background: #5cbdb9; color: white;
      font-size: 0.72rem; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
    }

    .fields-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

    .field { display: flex; flex-direction: column; gap: 0.3rem; }
    .field-full { grid-column: 1 / -1; }

    .field label { font-size: 0.75rem; font-weight: 600; color: #475569; }

    .field input, .field select {
      padding: 0.6rem 0.8rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #0f172a; background: white; transition: border-color 0.2s;
    }
    .field input:focus { outline: none; border-color: #5cbdb9; box-shadow: 0 0 0 3px rgba(92,189,185,0.1); }

    .err { font-size: 0.72rem; color: #ef4444; }

    .pass-wrap { position: relative; display: flex; }
    .pass-wrap input { flex: 1; padding-right: 2.5rem; }
    .btn-eye {
      position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0.2rem;
    }
    .btn-eye svg { width: 16px; height: 16px; }

    .geo-wrap { position: relative; display: flex; }
    .geo-wrap input { flex: 1; padding-right: 2.75rem; }
    .btn-geo {
      position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: #5cbdb9; padding: 0.2rem;
      border-radius: 4px; transition: background 0.18s;
    }
    .btn-geo:hover:not(:disabled) { background: #f0fdfa; }
    .btn-geo:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-geo svg { width: 16px; height: 16px; }

    .geo-hint { font-size: 0.75rem; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 0.4rem 0.7rem; margin: 0; }

    /* ══ MAP PICKER ══ */
    .map-wrap {
      border: 1.5px solid #e2e8f0; border-radius: 10px; overflow: hidden;
      margin-bottom: 0.85rem; background: #f8fafc;
    }
    .map-instruction {
      display: flex; align-items: center; gap: 0.4rem;
      font-size: 0.75rem; color: #475569; font-weight: 600;
      padding: 0.5rem 0.75rem; margin: 0;
      background: #f0fdfa; border-bottom: 1px solid #ccfbf1;
    }
    .map-instruction svg { width: 13px; height: 13px; stroke: #5cbdb9; flex-shrink: 0; }
    .map-canvas { width: 100%; height: 240px; display: block; }
    .map-msg {
      font-size: 0.75rem; color: #64748b; text-align: center;
      padding: 0.5rem 0.75rem; margin: 0; background: #f8fafc;
    }
    .map-msg-err { color: #b91c1c; background: #fef2f2; }

    .spinner-sm {
      width: 14px; height: 14px; border: 2px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.7s linear infinite; display: block;
    }

    .drawer-footer {
      padding: 1rem 1.5rem; border-top: 1px solid #f1f5f9;
      display: flex; justify-content: flex-end; gap: 0.75rem;
      background: #f8fafc;
    }

    .alert-error {
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 0.85rem;
    }
    .alert-success {
      background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
      border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 0.85rem;
    }

    /* Loading */
    .loading-state, .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 4rem 1rem; gap: 1rem;
      color: #94a3b8;
    }
    .empty-state svg { width: 48px; height: 48px; }
    .empty-state p { font-size: 0.95rem; margin: 0; }

    .spinner-lg {
      width: 36px; height: 36px;
      border: 3px solid #e2e8f0; border-top-color: #5cbdb9;
      border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    .spinner {
      width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.4);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .loading-hint {
      font-size: 0.78rem; color: #94a3b8; text-align: center; margin: 0;
    }

    .btn-retry {
      display: inline-flex; align-items: center; gap: 0.4rem;
      padding: 0.5rem 1rem; background: white; border: 1.5px solid #5cbdb9;
      border-radius: 8px; color: #5cbdb9; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: all 0.18s; margin-top: 0.25rem;
    }
    .btn-retry svg { width: 14px; height: 14px; }
    .btn-retry:hover { background: #5cbdb9; color: white; }

    /* Lista talleres */
    .talleres-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .taller-card {
      background: white; border: 1.5px solid #e2e8f0; border-radius: 12px;
      overflow: hidden; cursor: pointer; transition: border-color 0.2s, box-shadow 0.2s;
    }
    .taller-card:hover { border-color: #5cbdb9; box-shadow: 0 4px 16px rgba(92,189,185,0.12); }
    .taller-card.expanded { border-color: #5cbdb9; }

    .card-main {
      display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem;
    }

    .taller-icon {
      width: 42px; height: 42px; background: #f0fdfa; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      color: #5cbdb9;
    }
    .taller-icon svg { width: 20px; height: 20px; }

    .card-info { flex: 1; min-width: 0; }
    .card-top { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem; flex-wrap: wrap; }
    .taller-name { font-size: 0.92rem; font-weight: 700; color: #0f172a; margin: 0; }
    .taller-dir {
      display: flex; align-items: center; gap: 0.3rem;
      font-size: 0.78rem; color: #94a3b8; margin: 0;
    }
    .taller-dir svg { width: 12px; height: 12px; flex-shrink: 0; }

    .badge { padding: 0.15rem 0.55rem; border-radius: 99px; font-size: 0.72rem; font-weight: 600; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-red   { background: #fee2e2; color: #b91c1c; }

    .card-kpis {
      display: flex; gap: 1.25rem; flex-shrink: 0;
    }
    .kpi-mini { display: flex; flex-direction: column; align-items: center; text-align: center; }
    .kpi-v { font-size: 0.9rem; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .kpi-v.green { color: #15803d; }
    .kpi-l { font-size: 0.65rem; color: #94a3b8; white-space: nowrap; }

    .chevron { color: #94a3b8; transition: transform 0.2s; flex-shrink: 0; }
    .chevron svg { width: 18px; height: 18px; }
    .chevron.up { transform: rotate(180deg); color: #5cbdb9; }

    /* Panel detalle */
    .card-detalle {
      border-top: 1px solid #f1f5f9; padding: 1.25rem 1.25rem 1.25rem 1.25rem;
      background: #fafafa; cursor: default;
      animation: slideDown 0.18s ease-out;
    }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }

    .detalle-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem;
    }

    .det-section { display: flex; flex-direction: column; gap: 0.5rem; }
    .det-title { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #5cbdb9; margin: 0 0 0.25rem; }

    .det-row { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.82rem; color: #334155; }
    .det-row svg { width: 14px; height: 14px; flex-shrink: 0; margin-top: 1px; color: #94a3b8; }
    .det-empty { font-size: 0.82rem; color: #94a3b8; font-style: italic; margin: 0; }

    .bar-wrap { display: flex; flex-direction: column; gap: 0.4rem; }
    .bar-label { display: flex; justify-content: space-between; font-size: 0.8rem; color: #475569; }
    .bar-num.green { color: #15803d; font-weight: 700; }
    .bar-track { height: 8px; background: #e2e8f0; border-radius: 99px; overflow: hidden; }
    .bar-fill { height: 100%; background: linear-gradient(90deg, #5cbdb9, #3aa7a2); border-radius: 99px; transition: width 0.4s ease; }

    .perf-row { display: flex; flex-direction: column; gap: 0.6rem; }
    .perf-item { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #f1f5f9; }
    .perf-item:last-child { border-bottom: none; }
    .perf-val { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .perf-val.green { color: #15803d; }
    .perf-lbl { font-size: 0.75rem; color: #94a3b8; }

    /* ══ SUMMARY BAR ══ */
    .summary-bar {
      display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;
    }
    .stat-chip {
      background: white; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 0.6rem 1rem; display: flex; flex-direction: column; gap: 0.15rem;
      flex: 1; min-width: 130px;
    }
    .sc-val { font-size: 1rem; font-weight: 800; color: #0f172a; }
    .sc-val.sc-green { color: #15803d; }
    .sc-val.sc-teal  { color: #0d9488; }
    .sc-lbl { font-size: 0.7rem; color: #94a3b8; font-weight: 500; }

    /* ══ CONTROLS BAR ══ */
    .controls-bar {
      display: flex; align-items: center; gap: 0.75rem;
      margin-bottom: 1rem; flex-wrap: wrap;
    }
    .search-wrap {
      position: relative; display: flex; align-items: center;
      flex: 1; min-width: 200px;
    }
    .search-wrap svg { position: absolute; left: 0.7rem; width: 15px; height: 15px; color: #94a3b8; pointer-events: none; }
    .search-input {
      width: 100%; padding: 0.55rem 2.2rem 0.55rem 2.2rem;
      border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; color: #334155; background: white;
    }
    .search-input:focus { outline: none; border-color: #5cbdb9; }
    .clear-btn {
      position: absolute; right: 0.5rem; background: none; border: none;
      cursor: pointer; font-size: 1.1rem; color: #94a3b8; padding: 0.1rem 0.3rem;
      line-height: 1; border-radius: 4px;
    }
    .clear-btn:hover { color: #334155; background: #f1f5f9; }
    .sort-wrap { display: flex; align-items: center; gap: 0.4rem; flex-wrap: wrap; }
    .sort-lbl { font-size: 0.78rem; color: #64748b; font-weight: 600; white-space: nowrap; }
    .sort-btn {
      padding: 0.4rem 0.75rem; border: 1.5px solid #e2e8f0; border-radius: 6px;
      background: white; font-size: 0.78rem; font-weight: 600; color: #475569;
      cursor: pointer; transition: all 0.15s; white-space: nowrap;
    }
    .sort-btn:hover { border-color: #5cbdb9; color: #5cbdb9; }
    .sort-btn.active { background: #5cbdb9; border-color: #5cbdb9; color: white; }

    /* ══ BADGE TOGGLE ══ */
    .badge-toggle {
      padding: 0.2rem 0.65rem; border-radius: 99px; font-size: 0.72rem; font-weight: 600;
      border: none; cursor: pointer; transition: opacity 0.15s, filter 0.15s;
      display: inline-flex; align-items: center; gap: 0.3rem; min-width: 90px; justify-content: center;
    }
    .badge-toggle:hover:not(:disabled) { filter: brightness(0.9); }
    .badge-toggle:disabled { cursor: wait; opacity: 0.7; }
    .badge-toggle.badge-green { background: #dcfce7; color: #15803d; }
    .badge-toggle.badge-red   { background: #fee2e2; color: #b91c1c; }
    .spinner-xs {
      width: 10px; height: 10px; border: 2px solid currentColor;
      border-top-color: transparent; border-radius: 50%;
      animation: spin 0.7s linear infinite; opacity: 0.7;
    }

    /* ══ DETAIL MAP LINK ══ */
    .det-map-link {
      color: #0d9488; font-size: 0.82rem; text-decoration: none;
    }
    .det-map-link:hover { text-decoration: underline; }

    @media (max-width: 900px) {
      .card-kpis { display: none; }
      .detalle-grid { grid-template-columns: 1fr; }
      .summary-bar .stat-chip { min-width: 100px; }
    }
    @media (max-width: 640px) {
      .grid-form { grid-template-columns: 1fr; }
      .controls-bar { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class OrgTalleresComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);
  private destroy$ = new Subject<void>();

  talleres: TallerResumen[] = [];
  selectedTaller: TallerResumen | null = null;
  loading = true;
  showRetry = false;
  saving = false;
  showPass = false;
  geoLoading = false;
  geoMsg = '';
  errorMsg = '';
  successMsg = '';
  mapLoading = false;
  mapErr = '';
  busqueda = '';
  ordenar: 'nombre' | 'ingresos' | 'rating' | 'servicios' = 'ingresos';
  togglingId: number | null = null;

  get talleresFiltrados(): TallerResumen[] {
    const q = this.busqueda.trim().toLowerCase();
    const lista = q
      ? this.talleres.filter(t => t.razon_social.toLowerCase().includes(q))
      : [...this.talleres];
    return lista.sort((a, b) => {
      switch (this.ordenar) {
        case 'ingresos':  return b.ingresos_totales - a.ingresos_totales;
        case 'rating':    return b.calificacion_promedio - a.calificacion_promedio;
        case 'servicios': return b.servicios_completados - a.servicios_completados;
        default:          return a.razon_social.localeCompare(b.razon_social);
      }
    });
  }

  get totalIngresos(): number {
    return this.talleres.reduce((s, t) => s + t.ingresos_totales, 0);
  }

  get avgRating(): number {
    const con = this.talleres.filter(t => t.calificacion_promedio > 0);
    return con.length ? con.reduce((s, t) => s + t.calificacion_promedio, 0) / con.length : 0;
  }

  get totalTecnicos(): number {
    return this.talleres.reduce((s, t) => s + t.total_tecnicos, 0);
  }

  get talleresDisponiblesCount(): number {
    return this.talleres.filter(t => t.disponible).length;
  }

  private _showForm = false;
  private _map: any = null;
  private _marker: any = null;

  get showForm(): boolean { return this._showForm; }
  set showForm(val: boolean) {
    this._showForm = val;
    this.cdr.markForCheck();
    if (!val) {
      this.destroyMap();
    } else {
      setTimeout(() => this.initMap(), 300);
    }
  }

  form!: FormGroup;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre_contacto:  ['', Validators.required],
      email:            ['', [Validators.required, Validators.email]],
      telefono:         ['', Validators.required],
      password:         ['', [Validators.required, Validators.minLength(6)]],
      documento_identidad: ['', Validators.required],
      razon_social:     ['', Validators.required],
      direccion:        ['', Validators.required],
      latitud:          [null, Validators.required],
      longitud:         [null, Validators.required],
      telefono_operativo: ['', Validators.required],
      horario_inicio:   ['08:00', Validators.required],
      horario_fin:      ['18:00', Validators.required],
    });

    this.cargar();
  }

  reintentar(): void {
    this.showRetry = false;
    this.cargar();
  }

  setOrden(orden: 'nombre' | 'ingresos' | 'rating' | 'servicios'): void {
    this.ordenar = orden;
  }

  toggleDisponible(taller: TallerResumen, event: Event): void {
    event.stopPropagation();
    const orgId = this.authService.getAuthState().currentUser?.organizacion_id;
    if (!orgId || this.togglingId === taller.taller_id) return;
    this.togglingId = taller.taller_id;
    this.orgService.toggleDisponibilidad(orgId, taller.taller_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          taller.disponible = res.disponible;
          this.togglingId = null;
          this.cdr.markForCheck();
        },
        error: () => {
          this.togglingId = null;
          this.cdr.markForCheck();
        }
      });
  }

  osmLink(lat: number, lng: number): string {
    return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`;
  }

  toggleDetalle(t: TallerResumen): void {
    this.selectedTaller = this.selectedTaller?.taller_id === t.taller_id ? null : t;
  }

  cerrarDrawer(): void {
    this.showForm = false;
    this.resetForm();
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  usarGeolocalizacion(): void {
    if (!navigator.geolocation) {
      this.geoMsg = 'Geolocalización no disponible en este navegador';
      return;
    }
    this.geoLoading = true;
    this.geoMsg = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = Number.parseFloat(pos.coords.latitude.toFixed(6));
        const lng = Number.parseFloat(pos.coords.longitude.toFixed(6));
        this.form.patchValue({ latitud: lat, longitud: lng });
        this.geoMsg = `Ubicación obtenida: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        this.geoLoading = false;
        this.moveMapTo(lat, lng);
        this.cdr.markForCheck();
      },
      () => {
        this.geoMsg = 'No se pudo obtener la ubicación. Ingresa las coordenadas manualmente.';
        this.geoLoading = false;
        this.cdr.markForCheck();
      },
      { timeout: 10000 }
    );
  }

  syncMapFromFields(): void {
    const lat = this.form.get('latitud')?.value;
    const lng = this.form.get('longitud')?.value;
    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      this.moveMapTo(lat, lng);
    }
  }

  private moveMapTo(lat: number, lng: number): void {
    if (!this._map) return;
    const L = (window as any).L;
    this._map.setView([lat, lng], 15);
    if (this._marker) {
      this._marker.setLatLng([lat, lng]);
    } else {
      this._marker = L.marker([lat, lng], { draggable: true }).addTo(this._map);
      this.setupMarkerDragend();
    }
  }

  private loadLeafletCss(): void {
    if (!document.querySelector('link[data-leaflet-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet-css', '1');
      document.head.appendChild(link);
    }
  }

  private loadLeaflet(): Promise<any> {
    this.loadLeafletCss();
    if ((window as any).L) return Promise.resolve((window as any).L);
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.setAttribute('data-leaflet-js', '1');
      script.onload = () => resolve((window as any).L);
      script.onerror = () => reject(new Error('No se pudo cargar el mapa'));
      document.body.appendChild(script);
    });
  }

  private async initMap(): Promise<void> {
    if (this._map) return;
    const el = document.getElementById('taller-map-picker');
    if (!el) return;

    this.mapLoading = true;
    this.mapErr = '';
    this.cdr.markForCheck();

    try {
      const L = await this.loadLeaflet();

      // Fix default marker icons (CDN path)
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const lat = this.form.get('latitud')?.value ?? -17.7863;
      const lng = this.form.get('longitud')?.value ?? -63.1812;

      this._map = L.map('taller-map-picker').setView([lat, lng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(this._map);

      if (this.form.get('latitud')?.value != null) {
        this._marker = L.marker([lat, lng], { draggable: true }).addTo(this._map);
        this.setupMarkerDragend();
      }

      this._map.on('click', (e: any) => {
        const clickLat = Number.parseFloat(e.latlng.lat.toFixed(6));
        const clickLng = Number.parseFloat(e.latlng.lng.toFixed(6));
        this.form.patchValue({ latitud: clickLat, longitud: clickLng });
        if (this._marker) {
          this._marker.setLatLng([clickLat, clickLng]);
        } else {
          this._marker = L.marker([clickLat, clickLng], { draggable: true }).addTo(this._map);
          this.setupMarkerDragend();
        }
        this.reverseGeocode(clickLat, clickLng);
        this.cdr.markForCheck();
      });

      this.mapLoading = false;
      this.cdr.markForCheck();
      // Invalidate size after drawer slide-in animation
      setTimeout(() => this._map?.invalidateSize(), 50);
    } catch {
      this.mapLoading = false;
      this.mapErr = 'No se pudo cargar el mapa. Ingresa las coordenadas manualmente.';
      this.cdr.markForCheck();
    }
  }

  private destroyMap(): void {
    if (this._map) {
      this._map.remove();
      this._map = null;
      this._marker = null;
    }
  }

  private setupMarkerDragend(): void {
    this._marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      const dragLat = Number.parseFloat(pos.lat.toFixed(6));
      const dragLng = Number.parseFloat(pos.lng.toFixed(6));
      this.form.patchValue({ latitud: dragLat, longitud: dragLng });
      this.reverseGeocode(dragLat, dragLng);
      this.cdr.markForCheck();
    });
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    this.http.get<{ display_name?: string }>(url, { headers: { 'Accept-Language': 'es' } })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res?.display_name) {
            this.form.patchValue({ direccion: res.display_name });
            this.cdr.markForCheck();
          }
        },
        error: () => {}
      });
  }

  private cargar(): void {
    const orgId = this.authService.getAuthState().currentUser?.organizacion_id;
    if (!orgId) { this.loading = false; return; }

    this.loading = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => { this.showRetry = true; this.cdr.markForCheck(); }, 8000);

    this.orgService.getTalleres(orgId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = false;
          this.talleres = data ?? [];
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          if (this.retryTimer) clearTimeout(this.retryTimer);
          this.showRetry = true;
          this.talleres = [];
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
  }

  crearTaller(): void {
    if (this.form.invalid) return;
    const orgId = this.authService.getAuthState().currentUser?.organizacion_id;
    if (!orgId) return;

    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const data: TallerEnOrgCreate = this.form.value;
    this.orgService.crearTaller(orgId, data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.saving = false;
          this.successMsg = res.message;
          this.showForm = false;
          this.resetForm();
          this.cdr.markForCheck();
          this.cargar();
        },
        error: (err) => {
          this.saving = false;
          this.errorMsg = err?.error?.detail || 'Error al crear el taller';
          this.cdr.markForCheck();
        }
      });
  }

  resetForm(): void {
    this.form.reset({ horario_inicio: '08:00', horario_fin: '18:00' });
    this.errorMsg = '';
    this.successMsg = '';
  }

  ngOnDestroy(): void {
    this.destroyMap();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
