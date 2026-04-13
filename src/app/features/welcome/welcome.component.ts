/**
 * LANDING PAGE — Asistencia Vehicular
 *
 * Diseño profesional:
 * - Navbar azul con logo SVG de auto y toggle lunar
 * - Hero split con ilustración vectorial (mecánico + auto + sparkles)
 * - Sección de características con iconos SVG
 * - Sección de roles (cliente / taller)
 * - Footer
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
<div class="page" [class.dark]="isDarkTheme()">

  <!-- ═══════════ NAVBAR ═══════════ -->
  <header class="navbar">
    <div class="nav-inner">

      <a class="nav-brand" routerLink="/">
        <!-- Logo: auto blanco minimalista -->
        <svg class="brand-car" viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 20 L9 11 L15 6 L33 6 L39 11 L42 20 Z" fill="white" opacity="0.92"/>
          <path d="M16 6 L18 2 L30 2 L32 6 Z" fill="white"/>
          <rect x="18" y="2.5" width="12" height="4" rx="1.5" fill="rgba(147,197,253,0.55)"/>
          <circle cx="13" cy="22" r="5" fill="#3aa7a2" stroke="white" stroke-width="1.8"/>
          <circle cx="13" cy="22" r="2.2" fill="white" opacity="0.75"/>
          <circle cx="35" cy="22" r="5" fill="#3aa7a2" stroke="white" stroke-width="1.8"/>
          <circle cx="35" cy="22" r="2.2" fill="white" opacity="0.75"/>
          <path d="M42 16 L47 18.5 L42 21 Z" fill="rgba(254,249,195,0.85)"/>
          <rect x="3" y="15" width="5" height="8" rx="1.5" fill="rgba(252,165,165,0.7)"/>
        </svg>
        <span class="brand-name">Asistencia Vehicular</span>
      </a>

      <nav class="nav-links" aria-label="Navegación principal">
        <a href="#features" class="nav-link">Servicios</a>
        <a href="#roles" class="nav-link">Para talleres</a>
      </nav>

      <div class="nav-actions">
        <a routerLink="/auth/login" class="nav-btn ghost">Iniciar Sesión</a>
        <a routerLink="/auth/register" class="nav-btn solid">Registrarse</a>
        <button class="theme-btn" (click)="toggleTheme()"
                [title]="isDarkTheme() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'"
                [attr.aria-label]="isDarkTheme() ? 'Modo claro' : 'Modo oscuro'">
          <!-- Moon -->
          <svg *ngIf="!isDarkTheme()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
          <!-- Sun -->
          <svg *ngIf="isDarkTheme()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </button>
      </div>

    </div>
  </header>

  <!-- ═══════════ HERO ═══════════ -->
  <section class="hero">
    <div class="hero-inner">

      <!-- Texto izquierdo -->
      <div class="hero-text">
        <div class="hero-badge">
          <span class="badge-pulse"></span>
          Plataforma de Asistencia Vehicular
        </div>

        <h1 class="hero-h1">
          Tu Asistencia<br>
          <span class="h1-accent">Vehicular</span><br>
          en Línea
        </h1>

        <p class="hero-desc">
          Reporta incidentes, obtén diagnósticos con IA y conecta con talleres
          certificados. Asistencia rápida, confiable y disponible 24/7.
        </p>

        <div class="hero-cta">
          <a routerLink="/auth/login" class="cta cta-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Iniciar Sesión
          </a>
          <a routerLink="/auth/register" class="cta cta-orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
            Registrar Taller
          </a>
        </div>

        <div class="hero-stats">
          <div class="stat">
            <strong>500+</strong><span>Talleres</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <strong>10 mil+</strong><span>Clientes</span>
          </div>
          <div class="stat-sep"></div>
          <div class="stat">
            <strong>24/7</strong><span>Disponible</span>
          </div>
        </div>
      </div>

      <!-- Ilustración derecha -->
      <div class="hero-illo">
        <svg viewBox="0 0 560 500" class="illo-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <radialGradient id="heroBg" cx="52%" cy="48%" r="50%">
              <stop offset="0%" stop-color="#e0f2fe"/>
              <stop offset="100%" stop-color="#ecfdf5"/>
            </radialGradient>
            <filter id="fCard" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.10"/>
            </filter>
            <filter id="fCardSm" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="3" stdDeviation="7" flood-color="#0f172a" flood-opacity="0.08"/>
            </filter>
          </defs>

          <!-- ── FONDO ── -->
          <circle cx="292" cy="252" r="218" fill="url(#heroBg)"/>
          <circle cx="292" cy="252" r="158" fill="#d1fae5" opacity="0.28"/>

          <!-- Grid / mapa sutil -->
          <g stroke="#5cbdb9" stroke-width="0.85" opacity="0.11">
            <line x1="108" y1="148" x2="490" y2="148"/><line x1="108" y1="208" x2="490" y2="208"/>
            <line x1="108" y1="268" x2="490" y2="268"/><line x1="108" y1="328" x2="490" y2="328"/>
            <line x1="108" y1="388" x2="490" y2="388"/>
            <line x1="152" y1="85" x2="152" y2="448"/><line x1="212" y1="85" x2="212" y2="448"/>
            <line x1="272" y1="85" x2="272" y2="448"/><line x1="332" y1="85" x2="332" y2="448"/>
            <line x1="392" y1="85" x2="392" y2="448"/><line x1="452" y1="85" x2="452" y2="448"/>
          </g>

          <!-- Ruta punteada -->
          <path d="M148 374 C184 344 224 316 262 298 S332 278 378 238"
                stroke="#5cbdb9" stroke-width="2.5" stroke-dasharray="8 5"
                fill="none" opacity="0.52" stroke-linecap="round"/>

          <!-- Punto de inicio -->
          <circle cx="148" cy="374" r="10" fill="white" filter="url(#fCardSm)"/>
          <circle cx="148" cy="374" r="6" fill="#5cbdb9"/>

          <!-- Pin destino -->
          <path d="M378 238 C378 218 391 204 404 200 C422 193 440 207 440 227 C440 250 416 272 404 282 C390 272 378 256 378 238 Z"
                fill="#3aa7a2" filter="url(#fCardSm)"/>
          <circle cx="404" cy="228" r="11" fill="white" opacity="0.92"/>
          <circle cx="404" cy="228" r="23" fill="none" stroke="#3aa7a2" stroke-width="2" opacity="0.22"/>
          <circle cx="404" cy="228" r="36" fill="none" stroke="#3aa7a2" stroke-width="1.5" opacity="0.10"/>

          <!-- ── AUTO (moderno, flat) ── -->
          <ellipse cx="250" cy="390" rx="132" ry="11" fill="#1d4ed8" opacity="0.06"/>

          <!-- Chasis -->
          <rect x="112" y="316" width="272" height="58" rx="14" fill="#1d4ed8"/>
          <!-- Carrocería -->
          <path d="M130 316 C142 282 166 268 200 260 L308 260 C342 268 366 282 378 316 Z" fill="#2563eb"/>
          <!-- Techo -->
          <path d="M202 260 L218 236 L306 236 L322 260 Z" fill="#1e40af"/>
          <!-- Parabrisas -->
          <path d="M220 258 L232 240 L308 240 L320 258 Z" fill="#93c5fd" opacity="0.72"/>
          <!-- Ventana izq -->
          <rect x="143" y="265" width="70" height="48" rx="8" fill="#bfdbfe" opacity="0.48"/>
          <!-- Ventana der -->
          <rect x="218" y="265" width="68" height="48" rx="8" fill="#bfdbfe" opacity="0.48"/>
          <!-- Línea de puerta -->
          <line x1="216" y1="265" x2="216" y2="315" stroke="#1d4ed8" stroke-width="2.5" opacity="0.38"/>
          <!-- Tiradores -->
          <rect x="153" y="292" width="22" height="5" rx="2.5" fill="#93c5fd" opacity="0.65"/>
          <rect x="228" y="292" width="22" height="5" rx="2.5" fill="#93c5fd" opacity="0.65"/>

          <!-- Rueda izquierda -->
          <circle cx="178" cy="374" r="38" fill="#0f172a"/>
          <circle cx="178" cy="374" r="26" fill="#1e293b"/>
          <circle cx="178" cy="374" r="13" fill="#5cbdb9"/>
          <circle cx="178" cy="374" r="5" fill="#0f172a"/>
          <line x1="178" y1="348" x2="178" y2="400" stroke="#334155" stroke-width="3"/>
          <line x1="152" y1="374" x2="204" y2="374" stroke="#334155" stroke-width="3"/>
          <line x1="159" y1="355" x2="197" y2="393" stroke="#334155" stroke-width="2.5"/>
          <line x1="197" y1="355" x2="159" y2="393" stroke="#334155" stroke-width="2.5"/>

          <!-- Rueda derecha -->
          <circle cx="322" cy="374" r="38" fill="#0f172a"/>
          <circle cx="322" cy="374" r="26" fill="#1e293b"/>
          <circle cx="322" cy="374" r="13" fill="#5cbdb9"/>
          <circle cx="322" cy="374" r="5" fill="#0f172a"/>
          <line x1="322" y1="348" x2="322" y2="400" stroke="#334155" stroke-width="3"/>
          <line x1="296" y1="374" x2="348" y2="374" stroke="#334155" stroke-width="3"/>
          <line x1="303" y1="355" x2="341" y2="393" stroke="#334155" stroke-width="2.5"/>
          <line x1="341" y1="355" x2="303" y2="393" stroke="#334155" stroke-width="2.5"/>

          <!-- Faro delantero -->
          <path d="M384 326 Q408 340 408 358 Q408 374 384 382 Z" fill="#fef9c3" opacity="0.88"/>
          <ellipse cx="386" cy="354" rx="7" ry="13" fill="#fde68a"/>
          <!-- Luz trasera -->
          <rect x="105" y="316" width="11" height="28" rx="4" fill="#ef4444"/>
          <rect x="105" y="316" width="11" height="14" rx="3" fill="#f97316"/>
          <!-- Parachoques -->
          <rect x="388" y="332" width="18" height="32" rx="5" fill="#64748b"/>
          <!-- Parrilla -->
          <rect x="370" y="313" width="21" height="18" rx="4" fill="#1e3a8a"/>
          <line x1="370" y1="319" x2="391" y2="319" stroke="#3b82f6" stroke-width="1" opacity="0.5"/>
          <line x1="370" y1="325" x2="391" y2="325" stroke="#3b82f6" stroke-width="1" opacity="0.5"/>

          <!-- ── TARJETA IZQUIERDA: Servicio activo ── -->
          <rect x="20" y="146" width="166" height="90" rx="18" fill="white" filter="url(#fCard)"/>
          <rect x="20" y="146" width="5" height="90" rx="2.5" fill="#22c55e"/>
          <!-- Ícono check -->
          <circle cx="54" cy="177" r="18" fill="#f0fdf4"/>
          <path d="M45 177 L51 184 L64 168" stroke="#22c55e" stroke-width="2.8"
                fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Texto simulado -->
          <rect x="79" y="166" width="82" height="9" rx="4.5" fill="#0f172a" opacity="0.72"/>
          <rect x="79" y="180" width="58" height="7" rx="3.5" fill="#94a3b8" opacity="0.48"/>
          <!-- Separador -->
          <line x1="32" y1="207" x2="172" y2="207" stroke="#f1f5f9" stroke-width="1.5"/>
          <!-- Pill status -->
          <rect x="36" y="218" width="68" height="9" rx="4.5" fill="#dcfce7"/>
          <rect x="36" y="218" width="32" height="9" rx="4.5" fill="#22c55e" opacity="0.65"/>
          <!-- Hora -->
          <rect x="118" y="218" width="46" height="9" rx="4.5" fill="#f1f5f9"/>

          <!-- ── TARJETA DERECHA: Métricas ── -->
          <rect x="380" y="56" width="155" height="122" rx="18" fill="white" filter="url(#fCard)"/>
          <!-- Título -->
          <rect x="398" y="74" width="76" height="9" rx="4.5" fill="#0f172a" opacity="0.68"/>
          <rect x="398" y="88" width="52" height="7" rx="3.5" fill="#94a3b8" opacity="0.42"/>
          <!-- Barra 1 -->
          <rect x="398" y="108" width="116" height="7" rx="3.5" fill="#f1f5f9"/>
          <rect x="398" y="108" width="82" height="7" rx="3.5" fill="#5cbdb9"/>
          <!-- Barra 2 -->
          <rect x="398" y="121" width="116" height="7" rx="3.5" fill="#f1f5f9"/>
          <rect x="398" y="121" width="104" height="7" rx="3.5" fill="#3b82f6" opacity="0.65"/>
          <!-- Barra 3 -->
          <rect x="398" y="134" width="116" height="7" rx="3.5" fill="#f1f5f9"/>
          <rect x="398" y="134" width="56" height="7" rx="3.5" fill="#f97316" opacity="0.65"/>
          <!-- Leyenda -->
          <rect x="398" y="151" width="50" height="6" rx="3" fill="#94a3b8" opacity="0.38"/>
          <rect x="460" y="151" width="32" height="6" rx="3" fill="#5cbdb9" opacity="0.45"/>
          <rect x="398" y="162" width="42" height="6" rx="3" fill="#94a3b8" opacity="0.38"/>
          <rect x="452" y="162" width="38" height="6" rx="3" fill="#3b82f6" opacity="0.45"/>

          <!-- ── DECORACIÓN ── -->
          <!-- Estrellas de 4 puntas elegantes -->
          <g transform="translate(86,86) rotate(12)">
            <path d="M0-15 C2-5 5-2 15 0 C5 2 2 5 0 15 C-2 5-5 2-15 0 C-5-2-2-5 0-15Z"
                  fill="#5cbdb9" opacity="0.50"/>
          </g>
          <g transform="translate(512,196) rotate(-8)">
            <path d="M0-11 C1.5-3.5 3.5-1.5 11 0 C3.5 1.5 1.5 3.5 0 11 C-1.5 3.5-3.5 1.5-11 0 C-3.5-1.5-1.5-3.5 0-11Z"
                  fill="#f97316" opacity="0.48"/>
          </g>
          <g transform="translate(48,318) rotate(6)">
            <path d="M0-10 C1.4-3.2 3.2-1.4 10 0 C3.2 1.4 1.4 3.2 0 10 C-1.4 3.2-3.2 1.4-10 0 C-3.2-1.4-1.4-3.2 0-10Z"
                  fill="#a78bfa" opacity="0.44"/>
          </g>
          <g transform="translate(502,108) rotate(-4)">
            <path d="M0-8 C1.1-2.6 2.6-1.1 8 0 C2.6 1.1 1.1 2.6 0 8 C-1.1 2.6-2.6 1.1-8 0 C-2.6-1.1-1.1-2.6 0-8Z"
                  fill="#fbbf24" opacity="0.52"/>
          </g>

          <!-- Dots -->
          <circle cx="74" cy="165" r="5.5" fill="#bfdbfe" opacity="0.78"/>
          <circle cx="522" cy="292" r="5"   fill="#a7f3d0" opacity="0.62"/>
          <circle cx="44" cy="264"  r="4"   fill="#c7d2fe" opacity="0.68"/>
          <circle cx="532" cy="398" r="4.5" fill="#fde68a" opacity="0.68"/>
          <circle cx="100" cy="422" r="3.5" fill="#fed7aa" opacity="0.58"/>

          <!-- Sparkles + -->
          <g transform="translate(510,156)" fill="#5cbdb9" opacity="0.42">
            <rect x="-2" y="-10" width="4" height="20" rx="2"/>
            <rect x="-10" y="-2" width="20" height="4" rx="2"/>
          </g>
          <g transform="translate(490,370)" fill="#a78bfa" opacity="0.42">
            <rect x="-2" y="-9" width="4" height="18" rx="2"/>
            <rect x="-9" y="-2" width="18" height="4" rx="2"/>
          </g>

          <!-- Carretera -->
          <rect x="88" y="414" width="382" height="4.5" rx="2.2" fill="#bfdbfe" opacity="0.52"/>
          <rect x="220" y="414" width="32" height="4.5" fill="#dbeafe" opacity="0.4"/>
          <rect x="282" y="414" width="32" height="4.5" fill="#dbeafe" opacity="0.4"/>

        </svg>
      </div>

    </div>
  </section>

  <!-- ═══════════ FEATURES ═══════════ -->
  <section class="features-section" id="features">
    <div class="section-wrap">

      <div class="section-tag">Beneficios</div>
      <h2 class="section-h2">¿Por qué elegir nuestra plataforma?</h2>
      <p class="section-lead">Todo lo que necesitas para una asistencia vehicular moderna y eficiente</p>

      <div class="features-grid">

        <div class="feat-card">
          <div class="feat-icon" style="--ic:#eff6ff;--cc:#3b82f6">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h4>Asistencia en Emergencia</h4>
          <p>Conecta con talleres certificados en minutos ante cualquier incidente en carretera</p>
        </div>

        <div class="feat-card">
          <div class="feat-icon" style="--ic:#fff7ed;--cc:#f97316">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <h4>Disponibilidad 24/7</h4>
          <p>Servicio activo las 24 horas del día, los 7 días de la semana sin interrupciones</p>
        </div>

        <div class="feat-card">
          <div class="feat-icon" style="--ic:#f0fdf4;--cc:#22c55e">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h4>Talleres Cercanos</h4>
          <p>Geolocalización precisa para encontrar el taller más cercano a tu posición</p>
        </div>

        <div class="feat-card">
          <div class="feat-icon" style="--ic:#fdf4ff;--cc:#a855f7">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
              <line x1="8" y1="21" x2="16" y2="21"/>
              <line x1="12" y1="17" x2="12" y2="21"/>
            </svg>
          </div>
          <h4>Diagnóstico con IA</h4>
          <p>Análisis inteligente de tu incidente mediante audio, imagen y descripción</p>
        </div>

        <div class="feat-card">
          <div class="feat-icon" style="--ic:#fefce8;--cc:#eab308">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <h4>Calificaciones</h4>
          <p>Reseñas verificadas de otros usuarios para elegir siempre el mejor taller</p>
        </div>

        <div class="feat-card">
          <div class="feat-icon" style="--ic:#fff1f2;--cc:#ef4444">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
          </div>
          <h4>Pagos Seguros</h4>
          <p>Transacciones protegidas con comisión transparente y facturación automática</p>
        </div>

      </div>
    </div>
  </section>

  <!-- ═══════════ ROLES ═══════════ -->
  <section class="roles-section" id="roles">
    <div class="section-wrap">

      <div class="section-tag">Únete hoy</div>
      <h2 class="section-h2">¿Cuál es tu perfil?</h2>
      <p class="section-lead">Elige tu rol y empieza a usar la plataforma ahora mismo</p>

      <div class="roles-grid">

        <!-- Cliente -->
        <div class="role-card role-client">
          <div class="role-head">
            <div class="role-ico" style="--rc:#eff6ff;--rcc:#3b82f6">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div>
              <h3>Soy Cliente</h3>
              <p class="role-sub">Para dueños de vehículos</p>
            </div>
          </div>
          <p class="role-body">Tengo vehículo y necesito asistencia rápida cuando ocurra un incidente o necesite un mecánico de confianza.</p>
          <ul class="role-perks">
            <li>Reporte de incidentes en segundos</li>
            <li>Seguimiento en tiempo real</li>
            <li>Historial completo de servicios</li>
          </ul>
          <a routerLink="/auth/login" class="role-cta role-cta-blue">Iniciar Sesión</a>
        </div>

        <!-- Taller -->
        <div class="role-card role-taller">
          <div class="role-badge-pill">Popular</div>
          <div class="role-head">
            <div class="role-ico" style="--rc:#fff7ed;--rcc:#f97316">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
              </svg>
            </div>
            <div>
              <h3>Soy Taller</h3>
              <p class="role-sub">Para talleres mecánicos</p>
            </div>
          </div>
          <p class="role-body">Soy propietario de un taller y quiero recibir más clientes, gestionar mis servicios y hacer crecer mi negocio.</p>
          <ul class="role-perks">
            <li>Solicitudes directas de clientes</li>
            <li>Panel de gestión completo</li>
            <li>Estadísticas y reportes</li>
          </ul>
          <a routerLink="/auth/register" class="role-cta role-cta-orange">Registrar Taller</a>
        </div>

      </div>
    </div>
  </section>

  <!-- ═══════════ FOOTER ═══════════ -->
  <footer class="footer">
    <div class="footer-wrap">
      <div class="footer-brand">
        <svg viewBox="0 0 48 30" fill="none" class="footer-car">
          <path d="M6 20 L9 11 L15 6 L33 6 L39 11 L42 20 Z" fill="white" opacity="0.9"/>
          <path d="M16 6 L18 2 L30 2 L32 6 Z" fill="white"/>
          <circle cx="13" cy="22" r="5" fill="#3aa7a2" stroke="white" stroke-width="1.8"/>
          <circle cx="13" cy="22" r="2" fill="white" opacity="0.75"/>
          <circle cx="35" cy="22" r="5" fill="#3aa7a2" stroke="white" stroke-width="1.8"/>
          <circle cx="35" cy="22" r="2" fill="white" opacity="0.75"/>
        </svg>
        <span>Asistencia Vehicular</span>
      </div>
      <p class="footer-copy">&copy; 2026 Asistencia Vehicular. Todos los derechos reservados.</p>
      <nav class="footer-links">
        <a href="#">Términos</a>
        <a href="#">Privacidad</a>
        <a href="#">Contacto</a>
      </nav>
    </div>
  </footer>

</div>
  `,
  styles: [`
    /* ════════════════════════════════
       WELCOME — Design System
    ════════════════════════════════ */

    :host {
  /* PALETA */
  --pinky: #fbe3e8;
  --blue-greeny: #5cbdb9;
  --blue-greeny-dark: #3aa7a2;
  --teeny-greeny: #ebf6f5;

  /* 🎯 NUEVO SISTEMA */
  --primary: var(--blue-greeny);
  --primary-dark: var(--blue-greeny-dark);
  --accent: var(--pinky);

  --bg: #ffffff;
  --bg2: var(--teeny-greeny);
  --bg3: #f1f5f9;

  --txt: #0f172a;
  --txt2: #475569;
  --txt3: #94a3b8;
  --border: #e2e8f0;

  --green: #22c55e;

  --sh1: 0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.05);
  --sh2: 0 4px 6px -1px rgba(0,0,0,.08), 0 2px 4px rgba(0,0,0,.05);
  --sh3: 0 10px 30px -5px rgba(0,0,0,.12);
  --sh4: 0 20px 60px -10px rgba(0,0,0,.15);

  --ease: cubic-bezier(.4,0,.2,1);
  --t: .25s var(--ease);

  display: block;
}

    :host .page.dark {
      --bg:     #0f172a;
      --bg2:    #1e293b;
      --bg3:    #334155;
      --txt:    #f1f5f9;
      --txt2:   #94a3b8;
      --txt3:   #64748b;
      --border: #334155;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .page {
      background: var(--bg);
      color: var(--txt);
      font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
      min-height: 100vh;
      transition: background var(--t), color var(--t);
    }

    /* ── NAVBAR ── */
    .navbar {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 2px 20px rgba(30, 64, 175, .3);
    }

    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      height: 68px;
      display: flex;
      align-items: center;
      gap: 2rem;
      width: 100%;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      text-decoration: none;
      color: white;
      flex-shrink: 0;
    }

    .brand-car { width: 48px; height: auto; filter: drop-shadow(0 2px 6px rgba(0,0,0,.2)); }

    .brand-name {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -.4px;
      white-space: nowrap;
    }

    .nav-links {
      display: flex;
      gap: 0.25rem;
      flex: 1;
      margin-left: 0.5rem;
    }

    .nav-link {
      color: rgba(255,255,255,.8);
      text-decoration: none;
      font-size: .9rem;
      font-weight: 500;
      padding: .4rem .85rem;
      border-radius: 8px;
      transition: background var(--t), color var(--t);
    }

    .nav-link:hover {
      background: rgba(255,255,255,.12);
      color: white;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: .65rem;
      margin-left: auto;
    }

    .nav-btn {
      padding: .45rem 1.1rem;
      border-radius: 8px;
      font-size: .875rem;
      font-weight: 600;
      text-decoration: none;
      transition: all var(--t);
      white-space: nowrap;
    }

    .nav-btn.ghost {
      color: rgba(255,255,255,.9);
      border: 1.5px solid rgba(255,255,255,.35);
    }

    .nav-btn.ghost:hover {
      background: rgba(255,255,255,.12);
      border-color: rgba(255,255,255,.65);
      color: white;
    }

    .nav-btn.solid {
      background: rgba(255,255,255,.18);
      color: white;
      border: 1.5px solid rgba(255,255,255,.35);
      backdrop-filter: blur(4px);
    }

    .nav-btn.solid:hover {
      background: rgba(255,255,255,.28);
      box-shadow: 0 4px 12px rgba(0,0,0,.15);
    }

    .theme-btn {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1.5px solid rgba(255,255,255,.35);
      background: rgba(255,255,255,.12);
      color: rgba(255,255,255,.9);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all var(--t);
      flex-shrink: 0;
    }

    .theme-btn svg { width: 17px; height: 17px; }

    .theme-btn:hover {
      background: rgba(255,255,255,.22);
      border-color: rgba(255,255,255,.6);
      transform: rotate(18deg);
    }

    /* ── HERO ── */
    .hero {
      position: relative;
      overflow: hidden;
      background: linear-gradient(180deg, var(--bg) 0%, var(--bg2) 100%);
      min-height: calc(100vh - 68px);
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hero-inner {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 5rem 2rem 4rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3.5rem;
      align-items: center;
    }

    .hero-text {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
     background: var(--teeny-greeny);
  border: 1px solid rgba(92,189,185,.25);
  color: var(--primary);
      font-size: .8rem;
      font-weight: 600;
      padding: .35rem .9rem;
      border-radius: 100px;
      width: fit-content;
    }

    .page.dark .hero-badge {
      background: rgba(92,189,185,.1);
      border-color: rgba(59,130,246,.25);
      color: #93c5fd;
    }

    .badge-pulse {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--green);
      animation: pulse-dot 2s ease infinite;
    }

    @keyframes pulse-dot {
      0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,.5); }
      50%      { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
    }

    .hero-h1 {
      font-size: clamp(2.4rem, 5vw, 3.8rem);
      font-weight: 900;
      line-height: 1.12;
      letter-spacing: -2px;
      color: var(--txt);
    }

    .h1-accent {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 60%, #0ea5e9 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      position: relative;
    }

    .hero-desc {
      font-size: clamp(.95rem, 1.8vw, 1.1rem);
      color: var(--txt2);
      line-height: 1.75;
      max-width: 460px;
      font-weight: 400;
      letter-spacing: 0.01em;
    }

    .hero-cta {
      display: flex;
      gap: .85rem;
      flex-wrap: wrap;
    }

    .cta {
      display: inline-flex;
      align-items: center;
      gap: .5rem;
      padding: .9rem 1.9rem;
      border-radius: 12px;
      font-size: .95rem;
      font-weight: 700;
      letter-spacing: .01em;
      text-decoration: none;
      transition: all var(--t);
      border: none;
      cursor: pointer;
    }

    .cta svg { width: 18px; height: 18px; flex-shrink: 0; }

    .cta-blue {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      box-shadow: 0 4px 18px rgba(92,189,185,.38), 0 1px 3px rgba(0,0,0,.06);
    }

    .cta-blue:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 32px rgba(92,189,185,.50);
    }

    .cta-orange {
      background: white;
      color: var(--txt);
      border: 1.5px solid var(--border);
      box-shadow: 0 2px 8px rgba(0,0,0,.06);
    }

    .cta-orange:hover {
      transform: translateY(-3px);
      border-color: var(--primary);
      box-shadow: 0 8px 24px rgba(92,189,185,.18);
    }

    .hero-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding-top: .5rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
    }

    .stat strong {
      font-size: 1.4rem;
      font-weight: 800;
      color: var(--txt);
      line-height: 1;
      letter-spacing: -.5px;
    }

    .stat span {
      font-size: .72rem;
      color: var(--txt3);
      margin-top: 3px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: .05em;
    }

    .stat-sep {
      width: 1px;
      height: 36px;
      background: var(--border);
    }

    /* Ilustración */
    .hero-illo {
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .illo-svg {
      width: 100%;
      max-width: 560px;
      filter: drop-shadow(0 20px 40px rgba(30,64,175,.12));
    }

    /* ── FEATURES ── */
    .features-section {
      background: var(--bg2);
      padding: 5rem 0;
      border-top: 1px solid var(--border);
    }

    .section-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      width: 100%;
    }

    .section-tag {
      display: inline-block;
      font-size: .75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .1em;
      color: var(--primary);
    background: var(--teeny-greeny);
    border: 1px solid rgba(92,189,185,.2);
      padding: .25rem .7rem;
      border-radius: 100px;
      margin-bottom: 1rem;
    }

    .page.dark .section-tag {
      background: rgba(92,189,185,.1);
      border-color: rgba(59,130,246,.2);
      color: #93c5fd;
    }

    .section-h2 {
      font-size: clamp(1.7rem, 3.5vw, 2.5rem);
      font-weight: 800;
      letter-spacing: -1px;
      color: var(--txt);
      margin-bottom: .75rem;
      line-height: 1.2;
    }

    .section-lead {
      font-size: 1rem;
      color: var(--txt2);
      margin-bottom: 3rem;
      max-width: 560px;
      line-height: 1.6;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .feat-card {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.75rem;
      transition: transform var(--t), box-shadow var(--t), border-color var(--t);
      cursor: default;
    }

    .feat-card:hover {
      transform: translateY(-6px);
  box-shadow: var(--sh4);
  border-color: var(--primary);
    }

    .feat-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      background: var(--ic, #eff6ff);
      color: var(--cc, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.1rem;
    }

    .feat-icon svg { width: 24px; height: 24px; }

    .feat-card h4 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--txt);
      margin-bottom: .5rem;
    }

    .feat-card p {
      font-size: .875rem;
      color: var(--txt2);
      line-height: 1.65;
    }

    /* ── ROLES ── */
    .roles-section {
      background: var(--bg);
      padding: 5rem 0;
      border-top: 1px solid var(--border);
    }

    .roles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .role-card {
      position: relative;
      background: var(--bg2);
      border: 1.5px solid var(--border);
      border-radius: 20px;
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform var(--t), box-shadow var(--t);
    }

    .role-card:hover {
      transform: translateY(-8px);
      box-shadow: var(--sh4);
    }

    .role-card.role-taller {
      border-color: var(--primary);
  background: linear-gradient(160deg, var(--teeny-greeny) 0%, #fff 100%);
    }

    .page.dark .role-card.role-taller {
      background: linear-gradient(160deg, rgba(249,115,22,.08) 0%, var(--bg2) 100%);
    }

    .role-badge-pill {
      position: absolute;
      top: -12px;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      font-size: .72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .08em;
      padding: .25rem .85rem;
      border-radius: 100px;
      white-space: nowrap;
      box-shadow: 0 4px 12px rgba(249,115,22,.35);
    }

    .role-head {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .role-ico {
      width: 56px;
      height: 56px;
      min-width: 56px;
      border-radius: 16px;
      background: var(--rc, #eff6ff);
      color: var(--rcc, #3b82f6);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .role-ico svg { width: 26px; height: 26px; }

    .role-head h3 {
      font-size: 1.2rem;
      font-weight: 800;
      color: var(--txt);
    }

    .role-sub {
      font-size: .8rem;
      color: var(--txt3);
      margin-top: 2px;
    }

    .role-body {
      font-size: .9rem;
      color: var(--txt2);
      line-height: 1.65;
    }

    .role-perks {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: .5rem;
      flex: 1;
    }

    .role-perks li {
      display: flex;
      align-items: center;
      gap: .6rem;
      font-size: .875rem;
      color: var(--txt2);
    }

    .role-perks li::before {
      content: '';
      width: 18px;
      height: 18px;
      min-width: 18px;
      border-radius: 50%;
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%2322c55e' stroke-width='2.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 6L9 17l-5-5'/%3E%3C/svg%3E");
      background-size: 12px;
      background-repeat: no-repeat;
      background-position: center;
    }

    .role-cta {
      display: inline-flex;
      justify-content: center;
      padding: .8rem 1.5rem;
      border-radius: 12px;
      font-size: .9rem;
      font-weight: 700;
      text-decoration: none;
      transition: all var(--t);
      margin-top: .5rem;
    }

    .role-cta-blue {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      box-shadow: 0 4px 14px rgba(59,130,246,.3);
    }

    .role-cta-blue:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(59,130,246,.4);
    }

    .role-cta-orange {
      background: var(--pinky);
  color: #0f172a;
      box-shadow: 0 4px 14px rgba(249,115,22,.3);
    }

    .role-cta-orange:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(249,115,22,.42);
    }

    /* ── FOOTER ── */
    .footer {
      background: var(--primary-dark);
      padding: 2.25rem 0;
    }

    .footer-wrap {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .footer-brand {
      display: flex;
      align-items: center;
      gap: .55rem;
      color: white;
      font-size: 1rem;
      font-weight: 700;
    }

    .footer-car { width: 40px; height: auto; }

    .footer-copy {
      font-size: .825rem;
      color: rgba(255,255,255,.5);
    }

    .footer-links {
      display: flex;
      gap: 1.25rem;
    }

    .footer-links a {
      font-size: .825rem;
      color: rgba(255,255,255,.6);
      text-decoration: none;
      transition: color var(--t);
    }

    .footer-links a:hover { color: white; }

    /* ── RESPONSIVE ── */
    @media (max-width: 960px) {
      .features-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-btn.ghost { display: none; }

      .hero-inner {
        grid-template-columns: 1fr;
        padding: 3rem 1rem;
        text-align: center;
      }

      .hero-badge, .hero-cta, .hero-stats { justify-content: center; }
      .hero-desc { margin: 0 auto; }
      .hero-illo { display: none; }

      .features-grid { grid-template-columns: 1fr; }
      .roles-grid { grid-template-columns: 1fr; }

      .footer-wrap {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }

    @media (max-width: 480px) {
      .nav-inner { padding: 0 1rem; }
      .brand-name { font-size: 1rem; }
      .hero-h1 { font-size: 2rem; }
      .hero-cta { flex-direction: column; }
      .cta { width: 100%; justify-content: center; }
    }
  `]
})
export class WelcomeComponent {
  private themeService = inject(ThemeService);

  isDarkTheme(): boolean {
    return this.themeService.getCurrentTheme() === 'dark';
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
