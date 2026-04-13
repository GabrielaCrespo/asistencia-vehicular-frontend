/**
 * ROOT COMPONENT DE LA APLICACIÓN
 * 
 * Punto de entrada de la app.
 * - Inicializa el tema claro/oscuro
 * - Renderiza el router outlet
 */

import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class App {
  private themeService = inject(ThemeService);
  protected readonly title = 'Asistencia Vehicular - Portal Talleres';

  constructor() {
    // effect() debe estar en el constructor (contexto de inyección válido)
    effect(() => {
      const theme = this.themeService.getCurrentTheme();
      const host = document.querySelector('app-root');
      if (host) {
        if (theme === 'dark') {
          host.classList.add('dark-theme');
        } else {
          host.classList.remove('dark-theme');
        }
      }
    });
  }
}
