/**
 * RUTAS DE AUTENTICACIÓN
 * 
 * Rutas específicas para el módulo de autenticación
 * Se importan en app.routes.ts
 */

import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { noAuthGuard } from '../../core/guards/auth.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        component: LoginComponent,
        canActivate: [noAuthGuard],
        data: { title: 'Iniciar Sesión' }
      },
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [noAuthGuard],
        data: { title: 'Registrar Taller' }
      },
      {
        path: 'org-register',
        loadComponent: () => import('./pages/org-register/org-register.component').then(m => m.OrgRegisterComponent),
        canActivate: [noAuthGuard],
        data: { title: 'Crear Organización' }
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
