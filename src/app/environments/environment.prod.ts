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
      orgRegister: '/auth/org-register',
      orgLogin: '/auth/login',
      dashboard: '/dashboard',
      orgDashboard: '/organizacion/dashboard',
      superAdminDashboard: '/superadmin/dashboard',
      logout: '/logout',
    }
  },

  logging: {
    enableConsoleLog: false,
    enableErrorLog: true,
  }
};
