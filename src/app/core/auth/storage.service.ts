/**
 * SERVICIO DE ALMACENAMIENTO SEGURO
 * 
 * Abstracción sobre localStorage para manejar tokens y datos sensibles.
 * Facilita la migración a métodos más seguros en el futuro (sessionStorage, etc).
 */

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { CurrentUser } from '../models/auth.models';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private tokenKey = environment.auth.tokenKey;
  private userKey = environment.auth.userKey;

  /**
   * Guarda el token de autenticación
   */
  setToken(token: string): void {
    try {
      localStorage.setItem(this.tokenKey, token);
    } catch (error) {
      console.error('Error saving token to storage:', error);
    }
  }

  /**
   * Obtiene el token almacenado
   */
  getToken(): string | null {
    try {
      return localStorage.getItem(this.tokenKey);
    } catch (error) {
      console.error('Error retrieving token from storage:', error);
      return null;
    }
  }

  /**
   * Elimina el token
   */
  removeToken(): void {
    try {
      localStorage.removeItem(this.tokenKey);
    } catch (error) {
      console.error('Error removing token from storage:', error);
    }
  }

  /**
   * Verifica si existe un token válido
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  /**
   * Guarda el usuario actual
   */
  setCurrentUser(user: CurrentUser): void {
    try {
      localStorage.setItem(this.userKey, JSON.stringify(user));
    } catch (error) {
      console.error('Error saving user to storage:', error);
    }
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): CurrentUser | null {
    try {
      const user = localStorage.getItem(this.userKey);
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error retrieving user from storage:', error);
      return null;
    }
  }

  /**
   * Elimina el usuario actual
   */
  removeCurrentUser(): void {
    try {
      localStorage.removeItem(this.userKey);
    } catch (error) {
      console.error('Error removing user from storage:', error);
    }
  }

  /**
   * Limpia toda la sesión (logout)
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }
}
