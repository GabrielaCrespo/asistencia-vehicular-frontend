import { Routes } from '@angular/router';
import { IngresosComponent } from './pages/ingresos.component';

export const ingresosRoutes: Routes = [
  {
    path: '',
    component: IngresosComponent,
    data: { title: 'Ingresos y Comisiones' }
  }
];
