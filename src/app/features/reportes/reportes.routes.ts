import { Routes } from '@angular/router';

export const reportesRoutes: Routes = [
  { path: '', redirectTo: 'estaticos', pathMatch: 'full' },
  {
    path: 'estaticos',
    loadComponent: () =>
      import('./pages/reportes-estaticos.component').then(m => m.ReportesEstaticosComponent),
    data: { title: 'Reportes Estáticos' },
  },
  {
    path: 'dinamico',
    loadComponent: () =>
      import('./pages/reportes-dinamicos.component').then(m => m.ReportesDinamicosComponent),
    data: { title: 'Reporte Dinámico' },
  },
  {
    path: 'voz',
    loadComponent: () =>
      import('./pages/reportes-voz.component').then(m => m.ReportesVozComponent),
    data: { title: 'Reporte por Voz' },
  },
];
