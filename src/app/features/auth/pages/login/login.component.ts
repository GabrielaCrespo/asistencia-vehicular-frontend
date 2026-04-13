/**
 * PÁGINA LOGIN - CLIENTE/TALLER
 * 
 * Componente standalone que maneja el login.
 * - Formulario reactivo con validación
 * - Manejo de errores
 * - Integración con AuthService
 * - Redirección post-login
 * - Tema claro/oscuro
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { LoginRequest } from '../../../../core/models/auth.models';
import { environment } from '../../../../environments/environment';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="auth-page">

      <!-- ── Panel izquierdo: branding ── -->
      <aside class="brand-panel">
        <div class="brand-inner">

          <a class="brand-logo" routerLink="/">
            <svg viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 20 L9 11 L15 6 L33 6 L39 11 L42 20 Z" fill="white" opacity="0.92"/>
              <path d="M16 6 L18 2 L30 2 L32 6 Z" fill="white"/>
              <rect x="18" y="2.5" width="12" height="4" rx="1.5" fill="rgba(147,197,253,0.5)"/>
              <circle cx="13" cy="22" r="5" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="1.8"/>
              <circle cx="13" cy="22" r="2.2" fill="white" opacity="0.7"/>
              <circle cx="35" cy="22" r="5" fill="rgba(255,255,255,0.25)" stroke="white" stroke-width="1.8"/>
              <circle cx="35" cy="22" r="2.2" fill="white" opacity="0.7"/>
            </svg>
            <span>Asistencia Vehicular</span>
          </a>

          <h1 class="brand-h1">Bienvenido<br><strong>de vuelta</strong></h1>
          <p class="brand-desc">Accede a tu panel de gestión y conecta con clientes que necesitan tu ayuda ahora mismo.</p>

          <ul class="brand-feats">
            <li>
              <span class="feat-dot"></span>
              <span>Solicitudes en tiempo real</span>
            </li>
            <li>
              <span class="feat-dot"></span>
              <span>Diagnóstico inteligente con IA</span>
            </li>
            <li>
              <span class="feat-dot"></span>
              <span>Panel de gestión completo</span>
            </li>
            <li>
              <span class="feat-dot"></span>
              <span>Pagos seguros integrados</span>
            </li>
            <li>
              <span class="feat-dot"></span>
              <span>Soporte y asistencia 24/7</span>
            </li>
          </ul>
        </div>
      </aside>

      <!-- ── Panel derecho: formulario ── -->
      <main class="form-panel">
        <a class="back-link" routerLink="/">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Volver al inicio
        </a>

        <div class="form-card">

          <div class="card-header">
            <h2>Iniciar sesión</h2>
            <p>Ingresa tus credenciales para continuar</p>
          </div>

          <!-- Demo info -->
          <div class="demo-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <div>
              <strong>Demo:</strong> taller.express&#64;example.com &nbsp;/&nbsp; <strong>Contraseña:</strong> taller123
            </div>
          </div>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form" novalidate>

            <!-- Email -->
            <div class="field-group">
              <label for="email" class="field-label">Correo electrónico</label>
              <div class="input-wrapper" [class.has-error]="isFieldInvalid('email')">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input id="email" type="email" formControlName="email"
                       placeholder="taller@example.com" class="field-input" autocomplete="email"/>
              </div>
              <span class="field-error" *ngIf="isFieldInvalid('email')">{{ emailError }}</span>
            </div>

            <!-- Contraseña -->
            <div class="field-group">
              <label for="password" class="field-label">Contraseña</label>
              <div class="input-wrapper" [class.has-error]="isFieldInvalid('password')">
                <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input id="password" [type]="showPassword ? 'text' : 'password'" formControlName="password"
                       placeholder="Mínimo 6 caracteres" class="field-input" autocomplete="current-password"/>
                <button type="button" class="toggle-eye" (click)="togglePasswordVisibility()"
                        [attr.aria-label]="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <svg *ngIf="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg *ngIf="showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
              <span class="field-error" *ngIf="isFieldInvalid('password')">{{ passwordError }}</span>
            </div>

            <!-- Error general -->
            <div class="alert alert-error" *ngIf="errorMessage" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {{ errorMessage }}
            </div>

            <!-- Submit -->
            <button type="submit" class="btn-submit" [disabled]="isLoading || loginForm.invalid">
              <span class="spinner" *ngIf="isLoading"></span>
              <span>{{ isLoading ? 'Iniciando sesión...' : 'Iniciar sesión' }}</span>
              <svg *ngIf="!isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
            </button>

          </form>

          <div class="card-footer">
            <p>¿No tienes cuenta? <a routerLink="/auth/register">Regístrate aquí</a></p>
          </div>

        </div>
      </main>

    </div>
  `,
  styles: [`
    /* ══ AUTH PAGE LAYOUT ══ */
    .auth-page {
      display: grid;
      grid-template-columns: 420px 1fr;
      min-height: 100vh;
    }

    /* ══ BRAND PANEL ══ */
    .brand-panel {
      background: linear-gradient(160deg, #5cbdb9 0%, #3aa7a2 50%, #1a6b68 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem 2.5rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow: hidden;
    }

    .brand-panel::before {
      content: '';
      position: absolute;
      top: -100px; left: -80px;
      width: 480px; height: 480px;
      background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 68%);
      pointer-events: none;
    }

    .brand-panel::after {
      content: '';
      position: absolute;
      bottom: -80px; right: -60px;
      width: 360px; height: 360px;
      background: radial-gradient(circle, rgba(0,0,0,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .brand-inner {
      position: relative;
      z-index: 1;
      color: white;
    }

    .brand-logo {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: white;
      margin-bottom: 2.5rem;
    }

    .brand-logo svg {
      width: 44px;
      height: auto;
      filter: drop-shadow(0 2px 8px rgba(0,0,0,0.2));
    }

    .brand-logo span {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.3px;
      opacity: 0.92;
    }

    .brand-h1 {
      font-size: 2.1rem;
      font-weight: 400;
      line-height: 1.2;
      margin: 0 0 1rem;
      color: rgba(255,255,255,0.88);
    }

    .brand-h1 strong {
      font-weight: 800;
      color: white;
      display: block;
    }

    .brand-desc {
      font-size: 0.93rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.7;
      margin: 0 0 2rem;
    }

    .brand-feats {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .brand-feats li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.88rem;
      color: rgba(255,255,255,0.82);
    }

    .feat-dot {
      width: 20px; height: 20px; min-width: 20px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.4);
      display: flex; align-items: center; justify-content: center;
    }

    .feat-dot::after {
      content: '✓';
      font-size: 11px;
      font-weight: 700;
      color: white;
    }

    /* ══ FORM PANEL ══ */
    .form-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem 2rem 4rem;
      background: var(--bg, #f8fafc);
      overflow-y: auto;
      transition: background 0.22s ease;
    }

    html.dark-theme .form-panel {
      background: var(--bg, #0f172a);
    }

    .back-link {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--txt3, #94a3b8);
      text-decoration: none;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 1.5rem;
      transition: color 0.2s, gap 0.2s;
    }

    .back-link:hover {
      color: #5cbdb9;
      gap: 0.65rem;
    }

    /* ══ FORM CARD ══ */
    .form-card {
      width: 100%;
      max-width: 460px;
      background: var(--bg, #ffffff);
      border: 1px solid var(--border, #e2e8f0);
      border-radius: 20px;
      padding: 2.5rem 2.5rem 2rem;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,.06), 0 20px 60px -10px rgba(0,0,0,.10);
      animation: cardIn 0.35s ease-out;
    }

    html.dark-theme .form-card {
      background: var(--bg2, #1e293b);
      border-color: var(--border, #334155);
    }

    @keyframes cardIn {
      from { opacity: 0; transform: translateY(22px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .card-header {
      margin-bottom: 1.5rem;
    }

    .card-header h2 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: var(--txt, #0f172a);
      margin: 0 0 0.25rem;
    }

    html.dark-theme .card-header h2 { color: var(--txt, #f1f5f9); }

    .card-header p {
      font-size: 0.88rem;
      color: var(--txt2, #475569);
      margin: 0;
    }

    html.dark-theme .card-header p { color: var(--txt2, #94a3b8); }

    /* Demo box */
    .demo-box {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      background: #fefce8;
      border: 1px solid #fde68a;
      color: #92400e;
      border-radius: 10px;
      padding: 0.8rem 1rem;
      font-size: 0.82rem;
      line-height: 1.5;
      margin-bottom: 1.5rem;
    }

    html.dark-theme .demo-box {
      background: rgba(234,179,8,0.08);
      border-color: rgba(234,179,8,0.25);
      color: #fde68a;
    }

    .demo-box svg { flex-shrink: 0; margin-top: 1px; }

    /* ══ FORM ══ */
    .login-form {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .field-group {
      margin-bottom: 1.1rem;
    }

    .field-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--txt2, #475569);
      margin-bottom: 0.4rem;
    }

    html.dark-theme .field-label { color: var(--txt2, #94a3b8); }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 0.875rem;
      width: 16px; height: 16px;
      color: var(--txt3, #94a3b8);
      pointer-events: none;
      flex-shrink: 0;
      transition: color 0.2s;
    }

    .field-input {
      width: 100%;
      padding: 0.72rem 1rem 0.72rem 2.65rem;
      border: 1.5px solid var(--border, #e2e8f0);
      border-radius: 10px;
      font-size: 0.9rem;
      color: var(--txt, #0f172a);
      background: var(--bg2, #f8fafc);
      transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
      box-sizing: border-box;
    }

    html.dark-theme .field-input {
      background: var(--bg3, #334155);
      border-color: var(--border, #334155);
      color: var(--txt, #f1f5f9);
    }

    .field-input::placeholder { color: var(--txt3, #94a3b8); }

    .field-input:focus {
      outline: none;
      border-color: #5cbdb9;
      background: var(--bg, #fff);
      box-shadow: 0 0 0 3px rgba(92,189,185,0.14);
    }

    html.dark-theme .field-input:focus { background: var(--bg2, #1e293b); }

    .input-wrapper:focus-within .input-icon { color: #5cbdb9; }

    .input-wrapper.has-error .field-input {
      border-color: #ef4444;
    }

    .input-wrapper.has-error .input-icon { color: #ef4444; }

    .field-error {
      display: block;
      font-size: 0.78rem;
      color: #ef4444;
      margin-top: 0.3rem;
    }

    /* Toggle eye */
    .toggle-eye {
      position: absolute; right: 0.75rem;
      background: none; border: none; cursor: pointer;
      padding: 0.25rem; color: var(--txt3, #94a3b8);
      display: flex; align-items: center;
      border-radius: 6px;
      transition: color 0.2s, background 0.2s;
    }

    .toggle-eye svg { width: 16px; height: 16px; }

    .toggle-eye:hover {
      color: #5cbdb9;
      background: rgba(92,189,185,0.1);
    }

    /* Alert */
    .alert {
      display: flex; align-items: flex-start; gap: 0.55rem;
      padding: 0.8rem 0.95rem;
      border-radius: 10px;
      font-size: 0.85rem;
      line-height: 1.5;
      margin-bottom: 1rem;
    }

    .alert svg { flex-shrink: 0; margin-top: 1px; }

    .alert-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
    }

    html.dark-theme .alert-error {
      background: rgba(239,68,68,0.08);
      border-color: rgba(239,68,68,0.25);
      color: #fca5a5;
    }

    /* Submit button */
    .btn-submit {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #5cbdb9 0%, #3aa7a2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.01em;
      cursor: pointer;
      transition: all 0.22s ease;
      box-shadow: 0 4px 16px rgba(92,189,185,0.38);
      margin-top: 0.5rem;
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(92,189,185,0.48);
    }

    .btn-submit:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      display: inline-block;
      width: 15px; height: 15px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Card footer */
    .card-footer {
      text-align: center;
      margin-top: 1.25rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border, #e2e8f0);
      font-size: 0.85rem;
      color: var(--txt2, #475569);
    }

    html.dark-theme .card-footer {
      border-color: var(--border, #334155);
      color: var(--txt2, #94a3b8);
    }

    .card-footer a {
      color: #5cbdb9;
      font-weight: 600;
      text-decoration: none;
      transition: color 0.2s;
    }

    .card-footer a:hover { color: #3aa7a2; text-decoration: underline; }

    /* ══ RESPONSIVE ══ */
    @media (max-width: 900px) {
      .auth-page { grid-template-columns: 1fr; }

      .brand-panel {
        position: static;
        height: auto;
        padding: 2rem 1.5rem 2.5rem;
      }

      .brand-inner {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .brand-feats li { justify-content: center; }
      .brand-h1 { font-size: 1.6rem; }

      .form-panel { padding: 1.5rem 1rem 3rem; }
      .form-card { padding: 2rem 1.5rem; }
    }

    @media (max-width: 480px) {
      .form-card { padding: 1.5rem 1.25rem; border-radius: 14px; }
      .card-header h2 { font-size: 1.35rem; }
    }
  `]
})
export class LoginComponent implements OnInit, OnDestroy {
  // Inyección de dependencias
  private authService = inject(AuthService);
  private formBuilder = inject(FormBuilder);
  private router = inject(Router);
  protected themeService = inject(ThemeService);

  // Formulario
  loginForm!: FormGroup;

  // Estado
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  // Limpieza de suscripciones
  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initializeForm();
    this.subscribeToAuthState();
  }

  /**
   * Inicializa el formulario reactivo
   */
  private initializeForm(): void {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  /**
   * Se suscribe al estado de autenticación
   */
  private subscribeToAuthState(): void {
    this.authService.loading$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    this.authService.error$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error || '';
      });
  }

  /**
   * Envía el formulario de login
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    const credentials: LoginRequest = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(credentials)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Redireccionar al dashboard
          this.router.navigate([environment.auth.routes.dashboard]);
        },
        error: (err) => {
          console.error('Login error:', err);
          // El error ya está seteado en authService
        }
      });
  }

  /**
   * Toggle para mostrar/ocultar contraseña
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Marca todos los campos como touched para mostrar errores
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  /**
   * Getters para el template
   */
  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get emailError(): string {
    const control = this.emailControl;
    if (control?.hasError('required')) {
      return 'El email es requerido';
    }
    if (control?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    return '';
  }

  get passwordError(): string {
    const control = this.passwordControl;
    if (control?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    return '';
  }

  /**
   * Verifica si un campo es inválido y está marcado como touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
