/**
 * RUTAS DEL MÓDULO SERVICIOS
 */

import { Routes } from '@angular/router';
import { ServiciosComponent } from './pages/servicios.component';

export const serviciosRoutes: Routes = [
  {
    path: '',
    component: ServiciosComponent,
    data: { title: 'Servicios Ofrecidos' }
  }
];
