import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { OrgRegisterRequest } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-org-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">

      <!-- Panel izquierdo -->
      <aside class="brand-panel">
        <div class="brand-inner">
          <a class="brand-logo" routerLink="/">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
              </svg>
            </div>
            <span>Asistencia Vehicular</span>
          </a>

          <h1 class="brand-h1">Crea tu<br><strong>Organización</strong></h1>
          <p class="brand-desc">Gestiona múltiples talleres desde un solo panel centralizado con KPIs en tiempo real.</p>

          <ul class="brand-feats">
            <li><span class="feat-dot"></span><span>Panel consolidado multi-taller</span></li>
            <li><span class="feat-dot"></span><span>Gestión de técnicos por taller</span></li>
            <li><span class="feat-dot"></span><span>Reportes financieros detallados</span></li>
            <li><span class="feat-dot"></span><span>Seguimiento de incidentes global</span></li>
          </ul>
        </div>
      </aside>

      <!-- Panel derecho -->
      <main class="form-panel">
        <a class="back-link" routerLink="/auth/login">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver al login
        </a>

        <div class="form-card">
          <div class="card-header">
            <h2>Nueva organización</h2>
            <p>Completa los datos para crear tu cuenta</p>
          </div>

          <div class="success-box" *ngIf="successMsg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {{ successMsg }}
            <a routerLink="/auth/login" class="login-link">Ir al login →</a>
          </div>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" *ngIf="!successMsg">

            <div class="section-title">Datos de la organización</div>

            <div class="field-group">
              <label>Nombre de la organización *</label>
              <input formControlName="nombre_organizacion" type="text" placeholder="Red de Talleres Bolivia S.A."/>
              <span class="field-error" *ngIf="isInvalid('nombre_organizacion')">Campo requerido</span>
            </div>

            <div class="field-row">
              <div class="field-group">
                <label>NIT / RUC</label>
                <input formControlName="nit" type="text" placeholder="1234567890"/>
              </div>
              <div class="field-group">
                <label>Plan</label>
                <select formControlName="plan">
                  <option value="basico">Básico</option>
                  <option value="profesional">Profesional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div class="field-row">
              <div class="field-group">
                <label>Email de contacto *</label>
                <input formControlName="email_contacto" type="email" placeholder="contacto@org.com"/>
                <span class="field-error" *ngIf="isInvalid('email_contacto')">Email inválido</span>
              </div>
              <div class="field-group">
                <label>Teléfono</label>
                <input formControlName="telefono_organizacion" type="text" placeholder="591 2xxxxxxx"/>
              </div>
            </div>

            <div class="section-title" style="margin-top: 1.25rem">Administrador</div>

            <div class="field-group">
              <label>Nombre completo *</label>
              <input formControlName="nombre_admin" type="text" placeholder="Juan Pérez"/>
              <span class="field-error" *ngIf="isInvalid('nombre_admin')">Campo requerido</span>
            </div>

            <div class="field-row">
              <div class="field-group">
                <label>Email del administrador *</label>
                <input formControlName="email_admin" type="email" placeholder="admin@org.com"/>
                <span class="field-error" *ngIf="isInvalid('email_admin')">Email inválido</span>
              </div>
              <div class="field-group">
                <label>Teléfono</label>
                <input formControlName="telefono_admin" type="text" placeholder="591 7xxxxxxx"/>
              </div>
            </div>

            <div class="field-group">
              <label>Contraseña *</label>
              <input formControlName="password_admin" [type]="showPass ? 'text' : 'password'" placeholder="Mínimo 6 caracteres"/>
              <span class="field-error" *ngIf="isInvalid('password_admin')">Mínimo 6 caracteres</span>
            </div>

            <div class="alert-error" *ngIf="errorMsg" role="alert">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMsg }}
            </div>

            <button type="submit" class="btn-submit" [disabled]="loading || form.invalid">
              <span class="spinner" *ngIf="loading"></span>
              <span>{{ loading ? 'Creando organización...' : 'Crear organización' }}</span>
            </button>

          </form>

          <div class="card-footer">
            <p>¿Ya tienes cuenta? <a routerLink="/auth/login">Iniciar sesión</a></p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .auth-page {
      display: grid; grid-template-columns: 400px 1fr; min-height: 100vh;
    }

    /* Brand panel */
    .brand-panel {
      background: linear-gradient(160deg, #1a6b68 0%, #2d9895 50%, #5cbdb9 100%);
      display: flex; align-items: center; justify-content: center;
      padding: 3rem 2.5rem; position: sticky; top: 0; height: 100vh;
    }

    .brand-inner { color: white; }

    .brand-logo {
      display: inline-flex; align-items: center; gap: 0.65rem;
      text-decoration: none; color: white; margin-bottom: 2.5rem;
    }

    .logo-icon {
      width: 40px; height: 40px; background: rgba(255,255,255,0.2);
      border-radius: 10px; display: flex; align-items: center; justify-content: center;
    }
    .logo-icon svg { width: 20px; height: 20px; }

    .brand-logo span { font-size: 1rem; font-weight: 700; opacity: 0.92; }

    .brand-h1 {
      font-size: 2rem; font-weight: 400; line-height: 1.2; margin: 0 0 1rem;
      color: rgba(255,255,255,0.88);
    }
    .brand-h1 strong { font-weight: 800; color: white; display: block; }

    .brand-desc { font-size: 0.9rem; color: rgba(255,255,255,0.7); line-height: 1.7; margin: 0 0 2rem; }

    .brand-feats { list-style: none; display: flex; flex-direction: column; gap: 0.7rem; }
    .brand-feats li { display: flex; align-items: center; gap: 0.75rem; font-size: 0.86rem; color: rgba(255,255,255,0.82); }

    .feat-dot {
      width: 20px; height: 20px; min-width: 20px; border-radius: 50%;
      background: rgba(255,255,255,0.15); border: 1.5px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
    }
    .feat-dot::after { content: '✓'; font-size: 11px; font-weight: 700; color: white; }

    /* Form panel */
    .form-panel {
      display: flex; flex-direction: column; align-items: center;
      padding: 2rem 2rem 4rem; background: #f8fafc; overflow-y: auto;
    }

    .back-link {
      align-self: flex-start; display: inline-flex; align-items: center; gap: 0.4rem;
      color: #94a3b8; text-decoration: none; font-size: 0.875rem; font-weight: 500;
      margin-bottom: 1.5rem; transition: color 0.2s;
    }
    .back-link:hover { color: #5cbdb9; }

    .form-card {
      width: 100%; max-width: 520px; background: white;
      border: 1px solid #e2e8f0; border-radius: 20px; padding: 2rem 2.5rem 1.75rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,.06), 0 20px 60px -10px rgba(0,0,0,.08);
    }

    .card-header { margin-bottom: 1.5rem; }
    .card-header h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.2rem; }
    .card-header p { font-size: 0.875rem; color: #475569; margin: 0; }

    .section-title {
      font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.06em; color: #5cbdb9; margin: 0 0 0.75rem;
    }

    .field-group { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.9rem; }

    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 0; }
    .field-row .field-group { margin-bottom: 0.9rem; }

    .field-group label { font-size: 0.78rem; font-weight: 600; color: #475569; }

    .field-group input,
    .field-group select {
      padding: 0.65rem 0.85rem; border: 1.5px solid #e2e8f0; border-radius: 10px;
      font-size: 0.875rem; color: #0f172a; background: #f8fafc; transition: border-color 0.2s;
    }
    .field-group input:focus,
    .field-group select:focus { outline: none; border-color: #5cbdb9; background: white; }

    .field-error { font-size: 0.75rem; color: #ef4444; }

    .success-box {
      display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
      background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d;
      border-radius: 10px; padding: 1rem; font-size: 0.875rem; margin-bottom: 1rem;
    }
    .login-link { margin-left: auto; font-weight: 700; color: #15803d; text-decoration: none; }
    .login-link:hover { text-decoration: underline; }

    .alert-error {
      display: flex; align-items: flex-start; gap: 0.5rem;
      background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c;
      border-radius: 10px; padding: 0.75rem; font-size: 0.85rem;
      margin-bottom: 1rem;
    }
    .alert-error svg { flex-shrink: 0; margin-top: 1px; }

    .btn-submit {
      width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
      padding: 0.875rem; background: linear-gradient(135deg, #5cbdb9 0%, #3aa7a2 100%);
      color: white; border: none; border-radius: 12px; font-size: 0.95rem;
      font-weight: 700; cursor: pointer; transition: all 0.22s;
      box-shadow: 0 4px 16px rgba(92,189,185,0.35); margin-top: 0.25rem;
    }
    .btn-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(92,189,185,0.45); }
    .btn-submit:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

    .spinner {
      width: 15px; height: 15px; border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .card-footer {
      text-align: center; margin-top: 1.25rem; padding-top: 1.25rem;
      border-top: 1px solid #e2e8f0; font-size: 0.85rem; color: #475569;
    }
    .card-footer a { color: #5cbdb9; font-weight: 600; text-decoration: none; }
    .card-footer a:hover { text-decoration: underline; }

    @media (max-width: 900px) {
      .auth-page { grid-template-columns: 1fr; }
      .brand-panel { position: static; height: auto; padding: 2rem 1.5rem 2.5rem; }
      .brand-inner { display: flex; flex-direction: column; align-items: center; text-align: center; }
      .brand-feats li { justify-content: center; }
      .form-panel { padding: 1.5rem 1rem 3rem; }
      .form-card { padding: 1.75rem 1.5rem; }
    }

    @media (max-width: 500px) {
      .field-row { grid-template-columns: 1fr; }
    }
  `]
})
export class OrgRegisterComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  form!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  showPass = false;

  ngOnInit(): void {
    this.form = this.fb.group({
      nombre_organizacion:  ['', Validators.required],
      nit:                  [''],
      email_contacto:       ['', [Validators.required, Validators.email]],
      telefono_organizacion:[''],
      plan:                 ['basico'],
      nombre_admin:         ['', Validators.required],
      email_admin:          ['', [Validators.required, Validators.email]],
      password_admin:       ['', [Validators.required, Validators.minLength(6)]],
      telefono_admin:       [''],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const data: OrgRegisterRequest = this.form.value;
    this.authService.registerOrg(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.successMsg = res.message || 'Organización creada exitosamente. Redirigiendo al login...';
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
        },
        error: (err) => {
          this.loading = false;
          this.errorMsg = err?.message || 'Error al registrar la organización';
        }
      });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
