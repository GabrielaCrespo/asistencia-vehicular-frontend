/**
 * RUTAS PRINCIPALES DE LA APLICACIÓN
 * 
 * Define la estructura de navegación de la app.
 * Importa los módulos de rutas de características.
 */

import { Routes } from '@angular/router';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // LANDING PAGE / BIENVENIDA
  {
    path: '',
    component: WelcomeComponent,
    data: { title: 'Asistencia Vehicular' }
  },

  // Rutas de autenticación
  ...AUTH_ROUTES,

  // Ruta protegida: Dashboard (será implementado después)
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { title: 'Dashboard - Taller' }
  },

  // Ruta comodín para página no encontrada
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
