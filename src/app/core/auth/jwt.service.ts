/**
 * SERVICIO DE JWT
 * 
 * Maneja decodificación y validación de tokens JWT
 * sin dependencias externas (compatible con Angular 21+)
 */

import { Injectable } from '@angular/core';
import { DecodedToken } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class JwtService {

  /**
   * Decodifica un JWT sin verificar la firma
   * (En cliente confuamos en HTTPS y validación de servidor)
   */
  decodeToken(token: string): DecodedToken | null {
    try {
      const parts = token.split('.');
      
      if (parts.length !== 3) {
        console.error('Invalid token format');
        return null;
      }

      // Decodificar el payload (parte 2)
      const decoded = JSON.parse(this.atob(parts[1]));
      return decoded as DecodedToken;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Verifica si el token es válido y no ha expirado
   */
  isTokenValid(token: string): boolean {
    const decoded = this.decodeToken(token);
    
    if (!decoded) {
      return false;
    }

    // Verificar expiración (exp está en segundos)
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();

    return currentTime < expirationTime;
  }

  /**
   * Obtiene el tiempo restante antes de expiración (en milisegundos)
   * Retorna -1 si el token es inválido o ya expiró
   */
  getTimeUntilExpiration(token: string): number {
    const decoded = this.decodeToken(token);
    
    if (!decoded) {
      return -1;
    }

    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const timeUntilExpiration = expirationTime - currentTime;

    return timeUntilExpiration > 0 ? timeUntilExpiration : -1;
  }

  /**
   * Implementación de atob sin dependencias
   * Soluciona compatibilidad con Node.js en SSR si es necesario
   */
  private atob(str: string): string {
    return decodeURIComponent(
      atob(str).split('').map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }
}
