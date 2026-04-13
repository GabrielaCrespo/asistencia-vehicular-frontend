/**
 * CONFIGURACIÓN DEL AMBIENTE - DESARROLLO
 * 
 * Esta es la configuración por defecto.
 * Para producción, usar environment.prod.ts
 */

export const environment = {
  production: false,
  
  // API Backend
  api: {
    baseUrl: 'http://localhost:8000',
    timeout: 30000,
  },

  // Configuración de autenticación
  auth: {
    // Tiempo de expiración del token en localStorage (ms)
    // Por defecto 24 horas
    tokenExpirationTime: 24 * 60 * 60 * 1000,
    
    // Claves para localStorage
    tokenKey: 'taller_access_token',
    userKey: 'taller_current_user',
    
    // Rutas de autenticación
    routes: {
      login: '/auth/login',
      register: '/auth/register',
      dashboard: '/dashboard',
      logout: '/logout',
    }
  },

  // Configuración de logging
  logging: {
    enableConsoleLog: true,
    enableErrorLog: true,
  }
};
