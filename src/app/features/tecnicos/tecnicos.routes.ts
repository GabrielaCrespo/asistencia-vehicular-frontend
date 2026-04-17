/**
 * RUTAS DEL MÓDULO TÉCNICOS
 */

import { Routes } from '@angular/router';
import { TecnicosComponent } from './pages/tecnicos.component';

export const tecnicosRoutes: Routes = [
  {
    path: '',
    component: TecnicosComponent,
    data: { title: 'Gestión de Técnicos' }
  }
];
