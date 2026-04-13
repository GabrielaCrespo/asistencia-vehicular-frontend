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
        canActivate: [noAuthGuard], // No accesibles si está autenticado
        data: { title: 'Iniciar Sesión - Taller' }
      },
      {
        path: 'register',
        component: RegisterComponent,
        canActivate: [noAuthGuard], // No accesibles si está autenticado
        data: { title: 'Registrar Taller' }
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  }
];
