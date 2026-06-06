import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { AuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-org-suscripcion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="subs-page">

      <!-- ── HEADER ── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Gestión de Suscripción</h1>
          <p class="page-subtitle">Administra el plan SaaS de tu organización</p>
        </div>
        <div class="stripe-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Stripe Test Mode
        </div>
      </div>

      <!-- ── BANNERS ── -->
      <div class="banner banner-success" *ngIf="successMsg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        {{ successMsg }}
        <button class="banner-close" (click)="successMsg = ''">×</button>
      </div>
      <div class="banner banner-error" *ngIf="errorMsg">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        {{ errorMsg }}
        <button class="banner-close" (click)="errorMsg = ''">×</button>
      </div>

      <!-- ── LOADING ── -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <span>Cargando información...</span>
      </div>

      <ng-container *ngIf="!loading">

        <!-- ── MI SUSCRIPCIÓN ACTUAL ── -->
        <section class="current-section" *ngIf="suscripcion">
          <h2 class="section-title">Mi Suscripción</h2>

          <div class="current-card">

            <div class="current-left">
              <div class="plan-pill" [style.background]="suscripcion.plan_color">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
                {{ suscripcion.plan_nombre }}
              </div>

              <div class="status-row">
                <span class="status-dot"
                      [class.dot-active]="suscripcion.estado === 'activa'"
                      [class.dot-canceled]="suscripcion.estado === 'cancelada'"
                      [class.dot-expired]="suscripcion.estado === 'vencida'">
                </span>
                <span class="status-text">{{ estadoLabel(suscripcion.estado) }}</span>
              </div>

              <div class="price-display">
                <span class="price-big">\${{ suscripcion.monto_mensual | number:'1.2-2' }}</span>
                <span class="price-unit">USD/mes</span>
              </div>
            </div>

            <div class="current-details">
              <div class="detail-row" *ngIf="suscripcion.fecha_inicio">
                <span class="detail-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  Inicio
                </span>
                <span class="detail-val">{{ suscripcion.fecha_inicio | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-row" *ngIf="suscripcion.fecha_renovacion">
                <span class="detail-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="23 4 23 10 17 10"/>
                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
                  </svg>
                  Próxima renovación
                </span>
                <span class="detail-val">{{ suscripcion.fecha_renovacion | date:'dd/MM/yyyy' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                    <line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Método de pago
                </span>
                <span class="detail-val">{{ suscripcion.metodo_pago === 'demo' ? 'Demo' : 'Stripe' }}</span>
              </div>
            </div>

            <!-- USAGE BARS -->
            <div class="usage-block" *ngIf="uso">
              <div class="usage-title">Uso actual</div>
              <div class="usage-item">
                <div class="usage-label-row">
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    Talleres
                  </span>
                  <strong>{{ uso.talleres_usados }} / {{ uso.talleres_ilimitados ? '∞' : uso.talleres_max }}</strong>
                </div>
                <div class="usage-bar-track">
                  <div class="usage-bar-fill"
                       [style.width]="pct(uso.talleres_usados, uso.talleres_max, uso.talleres_ilimitados) + '%'"
                       [class.fill-warn]="pct(uso.talleres_usados, uso.talleres_max, uso.talleres_ilimitados) >= 80"
                       [class.fill-full]="pct(uso.talleres_usados, uso.talleres_max, uso.talleres_ilimitados) >= 100">
                  </div>
                </div>
              </div>
              <div class="usage-item">
                <div class="usage-label-row">
                  <span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    Técnicos
                  </span>
                  <strong>{{ uso.tecnicos_usados }} / {{ uso.tecnicos_ilimitados ? '∞' : uso.tecnicos_max }}</strong>
                </div>
                <div class="usage-bar-track">
                  <div class="usage-bar-fill"
                       [style.width]="pct(uso.tecnicos_usados, uso.tecnicos_max, uso.tecnicos_ilimitados) + '%'"
                       [class.fill-warn]="pct(uso.tecnicos_usados, uso.tecnicos_max, uso.tecnicos_ilimitados) >= 80"
                       [class.fill-full]="pct(uso.tecnicos_usados, uso.tecnicos_max, uso.tecnicos_ilimitados) >= 100">
                  </div>
                </div>
              </div>
            </div>

            <!-- ACTIONS -->
            <div class="current-actions">
              <button class="btn-billing"
                      (click)="abrirPortal()"
                      [disabled]="!suscripcion.tiene_stripe || actionLoading">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Gestionar Facturación
              </button>
              <button class="btn-cancel-sub"
                      (click)="showCancelModal = true"
                      [disabled]="suscripcion.estado !== 'activa' || actionLoading">
                Cancelar Suscripción
              </button>
            </div>

          </div>
        </section>

        <!-- ── PLANES DISPONIBLES ── -->
        <section class="plans-section">
          <div class="plans-header">
            <h2 class="section-title">Planes Disponibles</h2>
            <p class="plans-sub">Elige el plan que mejor se adapte a tu organización</p>
          </div>

          <div class="plans-grid" *ngIf="planes.length > 0">
            <div class="plan-card"
                 *ngFor="let plan of planes"
                 [class.plan-popular]="plan.popular"
                 [class.plan-current]="suscripcion?.plan_codigo === plan.codigo">

              <div class="tag-popular" *ngIf="plan.popular">Más Popular</div>
              <div class="tag-current" *ngIf="suscripcion?.plan_codigo === plan.codigo">Plan Actual</div>

              <div class="plan-top" [style.background]="plan.color">
                <h3 class="plan-name">{{ plan.nombre }}</h3>
                <div class="plan-price-wrap">
                  <span class="plan-price">\${{ plan.precio }}</span>
                  <span class="plan-period">/mes</span>
                </div>
              </div>

              <div class="plan-body">

                <div class="plan-limits">
                  <div class="limit-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                      <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                    <span>{{ plan.talleres_ilimitados ? 'Talleres ilimitados' :
                             plan.max_talleres + (plan.max_talleres === 1 ? ' taller' : ' talleres') }}</span>
                  </div>
                  <div class="limit-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    <span>{{ plan.tecnicos_ilimitados ? 'Técnicos ilimitados' :
                             'Hasta ' + plan.max_tecnicos + ' técnicos' }}</span>
                  </div>
                </div>

                <ul class="feature-list">
                  <li *ngFor="let f of plan.features">
                    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"
                         [attr.stroke]="plan.color">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {{ f }}
                  </li>
                </ul>

                <button class="btn-subscribe"
                        [disabled]="suscripcion?.plan_codigo === plan.codigo || checkoutLoading !== null"
                        (click)="subscribir(plan.codigo)"
                        [style.background]="suscripcion?.plan_codigo === plan.codigo ? '#cbd5e1' : plan.color"
                        [style.cursor]="suscripcion?.plan_codigo === plan.codigo ? 'default' : 'pointer'">
                  <svg *ngIf="checkoutLoading !== plan.codigo" viewBox="0 0 24 24"
                       fill="none" stroke="currentColor" stroke-width="2">
                    <polyline *ngIf="suscripcion?.plan_codigo !== plan.codigo"
                              points="23 7 13 17 7 11 1 17"/>
                    <polyline *ngIf="suscripcion?.plan_codigo === plan.codigo"
                              points="20 6 9 17 4 12"/>
                  </svg>
                  <span *ngIf="checkoutLoading !== plan.codigo">
                    {{ suscripcion?.plan_codigo === plan.codigo ? 'Plan Actual' :
                       (!suscripcion ? 'Suscribirse' :
                        (isUpgrade(plan.codigo) ? 'Actualizar a este plan' : 'Cambiar a este plan')) }}
                  </span>
                  <span *ngIf="checkoutLoading === plan.codigo" class="loading-dots">Procesando...</span>
                </button>

              </div>
            </div>
          </div>

          <div class="stripe-note">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            Pagos procesados con Stripe en modo Test. Usa la tarjeta <strong>4242 4242 4242 4242</strong>
            con cualquier fecha futura y CVC para pruebas.
          </div>
        </section>

      </ng-container>

      <!-- ── MODAL CANCELAR ── -->
      <div class="modal-backdrop" *ngIf="showCancelModal" (click)="showCancelModal = false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <div class="modal-icon modal-icon-warn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <h3>Cancelar Suscripción</h3>
          <p>¿Estás seguro? Mantendrás acceso hasta el fin del período actual. Podrás reactivar en cualquier momento.</p>
          <textarea class="modal-textarea"
                    [(ngModel)]="cancelMotivo"
                    placeholder="Motivo de cancelación (opcional)"
                    rows="3">
          </textarea>
          <div class="modal-actions">
            <button class="btn-keep" (click)="showCancelModal = false">Mantener Plan</button>
            <button class="btn-confirm-cancel"
                    (click)="cancelarSuscripcion()"
                    [disabled]="actionLoading">
              {{ actionLoading ? 'Cancelando...' : 'Confirmar Cancelación' }}
            </button>
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    * { box-sizing: border-box; }

    .subs-page {
      max-width: 1100px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }

    /* ── HEADER ── */
    .page-header {
      display: flex; align-items: flex-start; justify-content: space-between;
      margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
    }
    .page-title {
      font-size: 1.6rem; font-weight: 700; color: #0f172a; margin: 0 0 0.25rem;
    }
    .page-subtitle { margin: 0; color: #64748b; font-size: 0.9rem; }

    .stripe-badge {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #f0fdfa; border: 1px solid #5cbdb9; color: #0f766e;
      border-radius: 99px; padding: 0.35rem 0.9rem; font-size: 0.8rem; font-weight: 600;
      white-space: nowrap;
    }
    .stripe-badge svg { width: 14px; height: 14px; }

    /* ── BANNERS ── */
    .banner {
      display: flex; align-items: center; gap: 0.6rem;
      padding: 0.85rem 1rem; border-radius: 10px;
      font-size: 0.9rem; font-weight: 500; margin-bottom: 1rem;
    }
    .banner svg { width: 18px; height: 18px; flex-shrink: 0; }
    .banner-success { background: #f0fdf4; border: 1px solid #86efac; color: #166534; }
    .banner-error   { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }
    .banner-close {
      margin-left: auto; background: none; border: none; cursor: pointer;
      font-size: 1.2rem; color: inherit; line-height: 1; padding: 0 0.25rem;
    }

    /* ── LOADING ── */
    .loading-state {
      display: flex; align-items: center; gap: 0.75rem;
      padding: 3rem; justify-content: center; color: #64748b;
    }
    .spinner {
      width: 24px; height: 24px; border: 3px solid #e2e8f0;
      border-top-color: #5cbdb9; border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── SECTION TITLE ── */
    .section-title {
      font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 1rem;
    }

    /* ── CURRENT SUBSCRIPTION CARD ── */
    .current-section { margin-bottom: 2rem; }

    .current-card {
      background: white; border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04);
      padding: 1.5rem; display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 1.5rem; align-items: start;
    }

    .current-left { display: flex; flex-direction: column; gap: 0.6rem; min-width: 140px; }

    .plan-pill {
      display: inline-flex; align-items: center; gap: 0.4rem;
      color: white; border-radius: 99px; padding: 0.4rem 1rem;
      font-size: 0.9rem; font-weight: 700; width: fit-content;
    }
    .plan-pill svg { width: 14px; height: 14px; }

    .status-row { display: flex; align-items: center; gap: 0.4rem; }
    .status-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
    }
    .dot-active   { background: #22c55e; }
    .dot-canceled { background: #ef4444; }
    .dot-expired  { background: #f59e0b; }
    .status-text  { font-size: 0.85rem; color: #64748b; font-weight: 500; }

    .price-display { margin-top: 0.25rem; }
    .price-big { font-size: 1.8rem; font-weight: 800; color: #0f172a; }
    .price-unit { font-size: 0.85rem; color: #64748b; margin-left: 0.25rem; }

    /* details */
    .current-details { display: flex; flex-direction: column; gap: 0.6rem; }
    .detail-row { display: flex; align-items: center; gap: 0.5rem; }
    .detail-label {
      display: flex; align-items: center; gap: 0.35rem;
      font-size: 0.82rem; color: #94a3b8; width: 160px; flex-shrink: 0;
    }
    .detail-label svg { width: 13px; height: 13px; }
    .detail-val { font-size: 0.9rem; color: #1e293b; font-weight: 500; }

    /* usage */
    .usage-block { min-width: 200px; }
    .usage-title { font-size: 0.78rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }

    .usage-item { margin-bottom: 0.8rem; }
    .usage-label-row {
      display: flex; justify-content: space-between; align-items: center;
      font-size: 0.82rem; color: #64748b; margin-bottom: 0.3rem;
    }
    .usage-label-row span { display: flex; align-items: center; gap: 0.3rem; }
    .usage-label-row span svg { width: 12px; height: 12px; }
    .usage-label-row strong { color: #0f172a; font-size: 0.85rem; }

    .usage-bar-track {
      height: 6px; background: #f1f5f9; border-radius: 99px; overflow: hidden;
    }
    .usage-bar-fill {
      height: 100%; background: #5cbdb9; border-radius: 99px;
      transition: width 0.4s ease; min-width: 4px;
    }
    .fill-warn { background: #f59e0b; }
    .fill-full { background: #ef4444; }

    /* actions */
    .current-actions { display: flex; flex-direction: column; gap: 0.5rem; align-items: flex-end; }

    .btn-billing {
      display: inline-flex; align-items: center; gap: 0.4rem;
      background: #0f172a; color: white; border: none; border-radius: 8px;
      padding: 0.6rem 1rem; font-size: 0.85rem; font-weight: 600; cursor: pointer;
      transition: background 0.2s; white-space: nowrap;
    }
    .btn-billing svg { width: 14px; height: 14px; }
    .btn-billing:hover:not(:disabled) { background: #1e293b; }
    .btn-billing:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-cancel-sub {
      background: none; border: 1px solid #fca5a5; color: #ef4444;
      border-radius: 8px; padding: 0.55rem 1rem; font-size: 0.82rem;
      font-weight: 600; cursor: pointer; transition: all 0.18s; white-space: nowrap;
    }
    .btn-cancel-sub:hover:not(:disabled) { background: #fef2f2; }
    .btn-cancel-sub:disabled { opacity: 0.4; cursor: not-allowed; }

    /* ── PLANS SECTION ── */
    .plans-section { margin-bottom: 2rem; }
    .plans-header { margin-bottom: 1.5rem; }
    .plans-sub { margin: 0.25rem 0 0; color: #64748b; font-size: 0.9rem; }

    .plans-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      align-items: stretch;
    }

    .plan-card {
      background: white; border-radius: 16px; overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04);
      border: 2px solid transparent; transition: transform 0.2s, box-shadow 0.2s;
      position: relative; display: flex; flex-direction: column;
    }
    .plan-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.1); }
    .plan-popular {
      border-color: #7c3aed;
      box-shadow: 0 4px 20px rgba(124,58,237,0.18);
    }
    .plan-current { border-color: #5cbdb9; }

    .tag-popular {
      position: absolute; top: 12px; right: 12px;
      background: white; color: #7c3aed; border-radius: 99px;
      padding: 0.2rem 0.65rem; font-size: 0.72rem; font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }
    .tag-current {
      position: absolute; top: 12px; right: 12px;
      background: white; color: #5cbdb9; border-radius: 99px;
      padding: 0.2rem 0.65rem; font-size: 0.72rem; font-weight: 700;
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    }

    .plan-top {
      padding: 1.5rem 1.25rem 1.25rem;
      color: white;
    }
    .plan-name { font-size: 1.15rem; font-weight: 700; margin: 0 0 0.5rem; }
    .plan-price-wrap { display: flex; align-items: baseline; gap: 0.2rem; }
    .plan-price { font-size: 2.2rem; font-weight: 800; }
    .plan-period { font-size: 0.9rem; opacity: 0.85; }

    .plan-body { padding: 1.25rem; flex: 1; display: flex; flex-direction: column; gap: 1rem; }

    .plan-limits { display: flex; flex-direction: column; gap: 0.5rem; }
    .limit-row {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; color: #374151; font-weight: 500;
    }
    .limit-row svg { width: 15px; height: 15px; stroke: #5cbdb9; flex-shrink: 0; }

    .feature-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.45rem; flex: 1; }
    .feature-list li {
      display: flex; align-items: center; gap: 0.5rem;
      font-size: 0.85rem; color: #475569;
    }
    .feature-list li svg { width: 14px; height: 14px; flex-shrink: 0; }

    .btn-subscribe {
      width: 100%; padding: 0.75rem; border: none; border-radius: 10px;
      color: white; font-size: 0.9rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      transition: filter 0.18s; margin-top: auto;
    }
    .btn-subscribe:hover:not(:disabled) { filter: brightness(1.1); }
    .btn-subscribe:disabled { opacity: 0.7; }
    .btn-subscribe svg { width: 15px; height: 15px; }

    .stripe-note {
      display: flex; align-items: center; gap: 0.5rem;
      background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px;
      padding: 0.75rem 1rem; font-size: 0.82rem; color: #64748b; margin-top: 1rem;
    }
    .stripe-note svg { width: 15px; height: 15px; flex-shrink: 0; }
    .stripe-note strong { color: #1e293b; }

    /* ── MODAL ── */
    .modal-backdrop {
      position: fixed; inset: 0; background: rgba(15,23,42,0.5);
      display: flex; align-items: center; justify-content: center;
      z-index: 1000; padding: 1rem;
    }
    .modal-box {
      background: white; border-radius: 16px; padding: 2rem;
      max-width: 440px; width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    .modal-icon {
      width: 52px; height: 52px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
    }
    .modal-icon svg { width: 26px; height: 26px; }
    .modal-icon-warn { background: #fef3c7; }
    .modal-icon-warn svg { stroke: #d97706; }

    .modal-box h3 { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin: 0 0 0.5rem; }
    .modal-box p  { font-size: 0.9rem; color: #64748b; margin: 0 0 1rem; line-height: 1.5; }

    .modal-textarea {
      width: 100%; padding: 0.65rem; border: 1.5px solid #e2e8f0; border-radius: 8px;
      font-size: 0.875rem; resize: vertical; outline: none; font-family: inherit;
      transition: border-color 0.2s;
    }
    .modal-textarea:focus { border-color: #5cbdb9; }

    .modal-actions { display: flex; gap: 0.75rem; margin-top: 1.25rem; justify-content: flex-end; }

    .btn-keep {
      padding: 0.6rem 1.25rem; border: 1.5px solid #e2e8f0; background: white;
      border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer;
      color: #64748b; transition: border-color 0.18s;
    }
    .btn-keep:hover { border-color: #94a3b8; }

    .btn-confirm-cancel {
      padding: 0.6rem 1.25rem; background: #ef4444; color: white;
      border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600;
      cursor: pointer; transition: background 0.18s;
    }
    .btn-confirm-cancel:hover:not(:disabled) { background: #dc2626; }
    .btn-confirm-cancel:disabled { opacity: 0.6; cursor: not-allowed; }

    /* ── RESPONSIVE ── */
    @media (max-width: 900px) {
      .current-card {
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
      }
      .current-actions { flex-direction: row; align-items: center; grid-column: 1 / -1; }
    }
    @media (max-width: 720px) {
      .plans-grid { grid-template-columns: 1fr; }
      .current-card { grid-template-columns: 1fr; }
      .current-actions { flex-direction: column; }
    }
  `]
})
export class OrgSuscripcionComponent implements OnInit {
  private http  = inject(HttpClient);
  private auth  = inject(AuthService);
  private cdr   = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  private baseUrl = environment.api.baseUrl;

  loading       = true;
  actionLoading = false;
  checkoutLoading: string | null = null;

  planes:      any[]    = [];
  suscripcion: any      = null;
  uso:         any      = null;

  showCancelModal = false;
  cancelMotivo    = '';
  successMsg      = '';
  errorMsg        = '';

  private headers(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.auth.getToken()}` });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['success']) {
        this.successMsg = '¡Suscripción activada con éxito! Bienvenido al nuevo plan.';
      } else if (params['canceled']) {
        this.errorMsg = 'El proceso de pago fue cancelado. Puedes intentarlo de nuevo.';
      }
    });
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.http.get<any>(`${this.baseUrl}/api/suscripciones/planes`).subscribe({
      next: (res) => { this.planes = res.planes || []; this.cdr.markForCheck(); },
      error: () => {},
    });

    this.http.get<any>(`${this.baseUrl}/api/suscripciones/mi-suscripcion`,
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        this.suscripcion = res.suscripcion;
        this.uso         = res.uso;
        this.loading     = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  subscribir(planCodigo: string): void {
    this.checkoutLoading = planCodigo;
    this.errorMsg        = '';

    this.http.post<any>(`${this.baseUrl}/api/suscripciones/checkout`,
      { plan_codigo: planCodigo },
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        if (res.modo === 'demo') {
          this.successMsg     = res.message;
          this.checkoutLoading = null;
          this.loadData();
        } else if (res.checkout_url) {
          window.location.href = res.checkout_url;
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg        = err.error?.detail || 'Error al procesar la suscripción';
        this.checkoutLoading = null;
        this.cdr.markForCheck();
      },
    });
  }

  cancelarSuscripcion(): void {
    this.actionLoading = true;

    this.http.post<any>(`${this.baseUrl}/api/suscripciones/cancelar`,
      { motivo: this.cancelMotivo },
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.successMsg    = 'Suscripción cancelada. Seguirás con acceso hasta el fin del período.';
        this.showCancelModal = false;
        this.actionLoading   = false;
        this.cancelMotivo    = '';
        this.loadData();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg        = err.error?.detail || 'Error al cancelar la suscripción';
        this.actionLoading   = false;
        this.showCancelModal = false;
        this.cdr.markForCheck();
      },
    });
  }

  abrirPortal(): void {
    this.actionLoading = true;

    this.http.post<any>(`${this.baseUrl}/api/suscripciones/portal`, {},
      { headers: this.headers() }
    ).subscribe({
      next: (res) => {
        if (res.portal_url) window.location.href = res.portal_url;
        this.actionLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMsg      = err.error?.detail || 'Error al abrir el portal de facturación';
        this.actionLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      activa:    'Activa',
      cancelada: 'Cancelada',
      vencida:   'Vencida',
      pendiente: 'Pendiente de pago',
    };
    return map[estado] || estado;
  }

  pct(used: number, max: number | null, unlimited: boolean): number {
    if (unlimited || max === null) return Math.min(Math.round((used / 5) * 100), 60);
    if (max === 0) return 0;
    return Math.min(Math.round((used / max) * 100), 100);
  }

  isUpgrade(planCodigo: string): boolean {
    const order = ['basico', 'profesional', 'empresarial'];
    return order.indexOf(planCodigo) > order.indexOf(this.suscripcion?.plan_codigo || 'basico');
  }
}
