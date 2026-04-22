import { Routes } from '@angular/router';
import { SolicitudesComponent } from './pages/solicitudes.component';

export const solicitudesRoutes: Routes = [
  {
    path: '',
    component: SolicitudesComponent,
    data: { title: 'Solicitudes' }
  }
];
