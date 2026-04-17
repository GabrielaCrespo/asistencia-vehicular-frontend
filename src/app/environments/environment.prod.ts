/**
 * CONFIGURACIÓN DEL AMBIENTE - PRODUCCIÓN
 */

export const environment = {
  production: true,

  api: {
    baseUrl: 'https://asistencia-vehicular-backend.onrender.com',
    timeout: 30000,
  },

  auth: {
    tokenExpirationTime: 24 * 60 * 60 * 1000,
    tokenKey: 'taller_access_token',
    userKey: 'taller_current_user',
    routes: {
      login: '/auth/login',
      register: '/auth/register',
      dashboard: '/dashboard',
      logout: '/logout',
    }
  },

  logging: {
    enableConsoleLog: false,
    enableErrorLog: true,
  }
};
