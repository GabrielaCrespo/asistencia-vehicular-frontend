import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sa-configuracion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sa-page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Configuración</h1>
          <p class="page-sub">Ajustes globales de la plataforma</p>
        </div>
      </div>

      <div class="cards-grid">
        <div class="config-card">
          <div class="card-icon card-icon--purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Parámetros del Sistema</h3>
            <p>Tiempo SLA, límites de emergencias, configuración global de la plataforma.</p>
          </div>
          <span class="coming-soon">Próximamente</span>
        </div>

        <div class="config-card">
          <div class="card-icon card-icon--indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Notificaciones</h3>
            <p>Configurar alertas automáticas, emails de sistema y webhooks.</p>
          </div>
          <span class="coming-soon">Próximamente</span>
        </div>

        <div class="config-card">
          <div class="card-icon card-icon--blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Seguridad</h3>
            <p>Políticas de contraseñas, sesiones simultáneas y autenticación de dos factores.</p>
          </div>
          <span class="coming-soon">Próximamente</span>
        </div>

        <div class="config-card">
          <div class="card-icon card-icon--teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Planes y Facturación</h3>
            <p>Gestionar planes disponibles, precios y límites por tier.</p>
          </div>
          <span class="coming-soon">Próximamente</span>
        </div>

        <div class="config-card">
          <div class="card-icon card-icon--amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Zonas Horarias y Regiones</h3>
            <p>Configurar zonas horarias por organización y cobertura geográfica.</p>
          </div>
          <span class="coming-soon">Próximamente</span>
        </div>

        <div class="config-card">
          <div class="card-icon card-icon--slate">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <ellipse cx="12" cy="5" rx="9" ry="3"/>
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <div class="card-body">
            <h3>Base de Datos</h3>
            <p>Estado de la BD, backups programados y mantenimiento.</p>
          </div>
          <span class="coming-soon">Próximamente</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sa-page { max-width: 1200px; }
    .page-header { margin-bottom: 1.5rem; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.25rem; }
    .page-sub   { font-size: 0.875rem; color: #64748b; margin: 0; }

    .cards-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;
    }
    .config-card {
      background: white; border-radius: 14px; border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.06); padding: 1.25rem;
      display: flex; align-items: flex-start; gap: 1rem; position: relative;
      transition: box-shadow 0.2s, border-color 0.2s;
    }
    .config-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1); border-color: #c4b5fd; }

    .card-icon {
      width: 42px; height: 42px; border-radius: 10px; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
    }
    .card-icon svg { width: 20px; height: 20px; }
    .card-icon--purple { background: #f5f3ff; color: #7c3aed; }
    .card-icon--indigo { background: #eef2ff; color: #4f46e5; }
    .card-icon--blue   { background: #eff6ff; color: #2563eb; }
    .card-icon--teal   { background: #f0fdfa; color: #0d9488; }
    .card-icon--amber  { background: #fffbeb; color: #d97706; }
    .card-icon--slate  { background: #f8fafc; color: #475569; }

    .card-body { flex: 1; }
    .card-body h3 { font-size: 0.95rem; font-weight: 700; color: #1e293b; margin: 0 0 0.3rem; }
    .card-body p  { font-size: 0.8rem; color: #64748b; margin: 0; line-height: 1.5; }

    .coming-soon {
      position: absolute; top: 0.75rem; right: 0.75rem;
      font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
      background: #f1f5f9; color: #94a3b8; padding: 0.15rem 0.5rem; border-radius: 99px;
    }

    @media (max-width: 600px) {
      .cards-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SaConfiguracionComponent {}
