/**
 * GUARD DE AUTENTICACIÓN
 * 
 * Protege rutas que requieren autenticación.
 * Redirige al login si el usuario no está autenticado.
 * 
 * Se usa en las definiciones de rutas con: canActivate: [AuthGuard]
 */

import { Injectable, inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

// Implementación como función (Angular 15+)
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$().pipe(
    take(1),
    map((isAuthenticated) => {
      if (isAuthenticated) {
        return true;
      }
      
      // Redirigir al login
      return router.createUrlTree([environment.auth.routes.login], {
        queryParams: { returnUrl: state.url }
      });
    })
  );
};

/**
 * GUARD INVERSO
 * Previene que usuarios autenticados accedan a rutas de login/registro
 */
export const noAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$().pipe(
    take(1),
    map((isAuthenticated) => {
      if (!isAuthenticated) {
        return true;
      }
      
      // Si está autenticado, enviar al dashboard
      return router.createUrlTree([environment.auth.routes.dashboard]);
    })
  );
};
