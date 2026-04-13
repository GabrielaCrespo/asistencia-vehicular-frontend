/**
 * INTERCEPTOR JWT
 * 
 * Intercepta todos los requests HTTP y automáticamente agrega
 * el token JWT en el header Authorization.
 * 
 * Se registra globalmente en app.config.ts
 */

import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from '../auth/auth.service';
import { StorageService } from '../auth/storage.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private storageService = inject(StorageService);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Obtener el token del storage
    const token = this.storageService.getToken();

    // Si existe el token, agregarlo al request
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Si recibimos 401, significa que el token expiró o es inválido
        if (error.status === 401) {
          this.authService.logout();
          // El componente debe redirigir al login via el guard
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Agrega el token JWT al header Authorization
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
