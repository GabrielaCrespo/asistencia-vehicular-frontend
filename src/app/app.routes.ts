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
import { tecnicosRoutes } from './features/tecnicos/tecnicos.routes';
import { serviciosRoutes } from './features/servicios/servicios.routes';
import { solicitudesRoutes } from './features/solicitudes/solicitudes.routes';

export const routes: Routes = [
  // LANDING PAGE / BIENVENIDA
  {
    path: '',
    component: WelcomeComponent,
    data: { title: 'Asistencia Vehicular' }
  },

  // Rutas de autenticación
  ...AUTH_ROUTES,

  // Ruta protegida: Dashboard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { title: 'Dashboard - Taller' }
  },

  // Ruta protegida: Técnicos
  {
    path: 'tecnicos',
    canActivate: [authGuard],
    children: tecnicosRoutes,
    data: { title: 'Técnicos' }
  },

  // Ruta protegida: Servicios
  {
    path: 'servicios',
    canActivate: [authGuard],
    children: serviciosRoutes,
    data: { title: 'Servicios' }
  },

  // Ruta protegida: Solicitudes
  {
    path: 'solicitudes',
    canActivate: [authGuard],
    children: solicitudesRoutes,
    data: { title: 'Solicitudes' }
  },

  // Ruta protegida: Perfil del Taller
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    data: { title: 'Perfil del Taller' }
  },

  // Ruta comodín para página no encontrada
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
