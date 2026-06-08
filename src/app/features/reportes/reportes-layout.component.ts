import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-reportes-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="reportes-shell">
      <!-- Tabs de navegación -->
      <div class="tabs-bar">
        <a class="tab" routerLink="estaticos" routerLinkActive="tab--active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          Reportes
        </a>
        <a class="tab" routerLink="voz" routerLinkActive="tab--active">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
          Reporte por Voz
        </a>
      </div>

      <!-- Contenido de la pestaña activa -->
      <div class="tab-content">
        <router-outlet/>
      </div>
    </div>
  `,
  styles: [`
    .reportes-shell { display: flex; flex-direction: column; gap: 0; height: 100%; }

    .tabs-bar {
      display: flex; gap: 0; background: white; border-bottom: 2px solid #e2e8f0;
      padding: 0 1.5rem; position: sticky; top: 0; z-index: 10;
    }

    .tab {
      display: flex; align-items: center; gap: 0.5rem; padding: 0.85rem 1.25rem;
      font-size: 0.875rem; font-weight: 600; color: #64748b; text-decoration: none;
      border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.18s;
      white-space: nowrap;
    }
    .tab svg { width: 16px; height: 16px; }
    .tab:hover { color: #0f172a; }
    .tab--active { color: #5cbdb9; border-bottom-color: #5cbdb9; }

    .tab-content { flex: 1; padding: 1.5rem; overflow-y: auto; }

    @media (max-width: 600px) {
      .tabs-bar { padding: 0 0.5rem; }
      .tab { padding: 0.75rem 0.75rem; font-size: 0.8rem; }
      .tab-content { padding: 1rem; }
    }
  `],
})
export class ReportesLayoutComponent {}
