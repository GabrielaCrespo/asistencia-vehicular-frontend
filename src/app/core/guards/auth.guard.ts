/**
 * GUARD DE AUTENTICACIÓN
 * 
 * Protege rutas que requieren autenticación.
 * Redirige al login si el usuario no está autenticado.
 * 
 * Se usa en las definiciones de rutas con: canActivate: [AuthGuard]
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.auth$.pipe(
    take(1),
    map((authState) => {
      if (!authState.isAuthenticated) {
        return router.createUrlTree([environment.auth.routes.login], {
          queryParams: { returnUrl: state.url }
        });
      }
      // Redirigir tenant_admin al portal de organización si intenta entrar al portal taller
      if (authState.currentUser?.rol === 'tenant_admin') {
        return router.createUrlTree([environment.auth.routes.orgDashboard]);
      }
      return true;
    })
  );
};

export const orgGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.auth$.pipe(
    take(1),
    map((authState) => {
      if (authState.isAuthenticated && authState.currentUser?.rol === 'tenant_admin') {
        return true;
      }
      if (!authState.isAuthenticated) {
        return router.createUrlTree([environment.auth.routes.login]);
      }
      // Autenticado pero no es tenant_admin → redirigir a su dashboard
      return router.createUrlTree([environment.auth.routes.dashboard]);
    })
  );
};

/**
 * Previene que usuarios autenticados accedan a rutas de login/registro.
 * Redirige según el rol del usuario.
 */
export const noAuthGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.auth$.pipe(
    take(1),
    map((authState) => {
      if (!authState.isAuthenticated) {
        return true;
      }
      const rol = authState.currentUser?.rol;
      if (rol === 'tenant_admin') {
        return router.createUrlTree([environment.auth.routes.orgDashboard]);
      }
      return router.createUrlTree([environment.auth.routes.dashboard]);
    })
  );
};
