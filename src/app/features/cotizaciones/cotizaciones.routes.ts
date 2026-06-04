import { Routes } from '@angular/router';

export const cotizacionesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/cotizaciones.component').then(m => m.CotizacionesComponent),
    data: { title: 'Cotizaciones' },
  },
];
