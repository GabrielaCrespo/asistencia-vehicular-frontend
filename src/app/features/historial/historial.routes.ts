import { Routes } from '@angular/router';
import { HistorialComponent } from './pages/historial.component';

export const historialRoutes: Routes = [
  {
    path: '',
    component: HistorialComponent,
    data: { title: 'Historial del Taller' }
  }
];
