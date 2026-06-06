/**
 * RUTAS PRINCIPALES DE LA APLICACIÓN
 * 
 * Define la estructura de navegación de la app.
 * Importa los módulos de rutas de características.
 */

import { Routes } from '@angular/router';
import { WelcomeComponent } from './features/welcome/welcome.component';
import { AUTH_ROUTES } from './features/auth/auth.routes';
import { authGuard, orgGuard, superAdminGuard } from './core/guards/auth.guard';
import { tecnicosRoutes } from './features/tecnicos/tecnicos.routes';
import { serviciosRoutes } from './features/servicios/servicios.routes';
import { solicitudesRoutes } from './features/solicitudes/solicitudes.routes';
import { ingresosRoutes } from './features/ingresos/ingresos.routes';
import { historialRoutes } from './features/historial/historial.routes';
import { cotizacionesRoutes } from './features/cotizaciones/cotizaciones.routes';
import { reportesRoutes } from './features/reportes/reportes.routes';

export const routes: Routes = [
  // LANDING PAGE / BIENVENIDA
  {
    path: '',
    component: WelcomeComponent,
    data: { title: 'Asistencia Vehicular' }
  },

  // Rutas de autenticación
  ...AUTH_ROUTES,

  // Ruta protegida: Dashboard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    data: { title: 'Dashboard - Taller' }
  },

  // Ruta protegida: Técnicos
  {
    path: 'tecnicos',
    canActivate: [authGuard],
    children: tecnicosRoutes,
    data: { title: 'Técnicos' }
  },

  // Ruta protegida: Servicios
  {
    path: 'servicios',
    canActivate: [authGuard],
    children: serviciosRoutes,
    data: { title: 'Servicios' }
  },

  // Ruta protegida: Solicitudes
  {
    path: 'solicitudes',
    canActivate: [authGuard],
    children: solicitudesRoutes,
    data: { title: 'Solicitudes' }
  },

  // Ruta protegida: Ingresos y Comisiones
  {
    path: 'ingresos',
    canActivate: [authGuard],
    children: ingresosRoutes,
    data: { title: 'Ingresos y Comisiones' }
  },

  // Ruta protegida: Historial del Taller
  {
    path: 'historial',
    canActivate: [authGuard],
    children: historialRoutes,
    data: { title: 'Historial del Taller' }
  },

  // Ruta protegida: Cotizaciones
  {
    path: 'cotizaciones',
    canActivate: [authGuard],
    children: cotizacionesRoutes,
    data: { title: 'Cotizaciones' }
  },

  // Ruta protegida: Perfil del Taller
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/perfil/perfil.component').then(m => m.PerfilComponent),
    data: { title: 'Perfil del Taller' }
  },

  // Ruta protegida: Monitoreo en tiempo real
  {
    path: 'monitoreo',
    canActivate: [authGuard],
    loadComponent: () => import('./features/monitoreo/monitoreo.component').then(m => m.MonitoreoComponent),
    data: { title: 'Monitoreo Operacional' }
  },

  // Ruta protegida: Reportes (taller)
  {
    path: 'reportes',
    canActivate: [authGuard],
    loadComponent: () => import('./features/reportes/reportes-layout.component').then(m => m.ReportesLayoutComponent),
    children: reportesRoutes,
    data: { title: 'Reportes' }
  },

  // Ruta protegida: Notificaciones
  {
    path: 'notificaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/notificaciones/notificaciones.component').then(
        m => m.NotificacionesComponent,
      ),
    data: { title: 'Notificaciones' },
  },

  // Rutas del portal Organización (tenant_admin)
  {
    path: 'organizacion',
    canActivate: [orgGuard],
    loadComponent: () => import('./features/organizacion/org-layout.component').then(m => m.OrgLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/organizacion/pages/org-dashboard.component').then(m => m.OrgDashboardComponent),
        data: { title: 'Dashboard - Organización' }
      },
      {
        path: 'talleres',
        loadComponent: () => import('./features/organizacion/pages/org-talleres.component').then(m => m.OrgTalleresComponent),
        data: { title: 'Talleres - Organización' }
      },
      {
        path: 'tecnicos',
        loadComponent: () => import('./features/organizacion/pages/org-tecnicos.component').then(m => m.OrgTecnicosComponent),
        data: { title: 'Técnicos - Organización' }
      },
      {
        path: 'incidentes',
        loadComponent: () => import('./features/organizacion/pages/org-incidentes.component').then(m => m.OrgIncidentesComponent),
        data: { title: 'Incidentes - Organización' }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/organizacion/pages/org-reportes.component').then(m => m.OrgReportesComponent),
        data: { title: 'Reportes Financieros - Organización' }
      },
      {
        path: 'reportes-avanzados',
        loadComponent: () => import('./features/reportes/reportes-layout.component').then(m => m.ReportesLayoutComponent),
        children: reportesRoutes,
        data: { title: 'Reportes Avanzados - Organización' }
      },
      {
        path: 'analitica',
        loadComponent: () => import('./features/organizacion/pages/org-analitica.component').then(m => m.OrgAnaliticaComponent),
        data: { title: 'Analítica Operacional - Organización' }
      },
      {
        path: 'calificaciones',
        loadComponent: () => import('./features/organizacion/pages/org-calificaciones.component').then(m => m.OrgCalificacionesComponent),
        data: { title: 'Calificaciones - Organización' }
      },
      {
        path: 'mapa-riesgo',
        loadComponent: () => import('./features/organizacion/pages/org-mapa-riesgo.component').then(m => m.OrgMapaRiesgoComponent),
        data: { title: 'Mapa de Riesgo - Organización' }
      },
      {
        path: 'suscripcion',
        loadComponent: () => import('./features/organizacion/pages/org-suscripcion.component').then(m => m.OrgSuscripcionComponent),
        data: { title: 'Suscripción - Organización' }
      },
    ]
  },

  // Rutas del portal SuperAdministración (administrador)
  {
    path: 'superadmin',
    canActivate: [superAdminGuard],
    loadComponent: () => import('./features/superadmin/superadmin-layout.component').then(m => m.SuperAdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/superadmin/pages/sa-dashboard.component').then(m => m.SaDashboardComponent),
        data: { title: 'Dashboard Global - SuperAdmin' }
      },
      {
        path: 'organizaciones',
        loadComponent: () => import('./features/superadmin/pages/sa-organizaciones.component').then(m => m.SaOrganizacionesComponent),
        data: { title: 'Organizaciones - SuperAdmin' }
      },
      {
        path: 'talleres',
        loadComponent: () => import('./features/superadmin/pages/sa-talleres.component').then(m => m.SaTalleresComponent),
        data: { title: 'Talleres - SuperAdmin' }
      },
      {
        path: 'usuarios',
        loadComponent: () => import('./features/superadmin/pages/sa-usuarios.component').then(m => m.SaUsuariosComponent),
        data: { title: 'Usuarios - SuperAdmin' }
      },
      {
        path: 'kpis',
        loadComponent: () => import('./features/superadmin/pages/sa-kpis.component').then(m => m.SaKpisComponent),
        data: { title: 'KPIs Globales - SuperAdmin' }
      },
      {
        path: 'bitacora',
        loadComponent: () => import('./features/superadmin/pages/sa-bitacora.component').then(m => m.SaBitacoraComponent),
        data: { title: 'Bitácora - SuperAdmin' }
      },
      {
        path: 'reportes',
        loadComponent: () => import('./features/reportes/reportes-layout.component').then(m => m.ReportesLayoutComponent),
        children: reportesRoutes,
        data: { title: 'Reportes Globales - SuperAdmin' }
      },
      {
        path: 'backup',
        loadComponent: () => import('./features/superadmin/pages/sa-backup.component').then(m => m.SaBackupComponent),
        data: { title: 'Copias de Seguridad - SuperAdmin' }
      },
      {
        path: 'roles',
        loadComponent: () => import('./features/superadmin/pages/sa-roles.component').then(m => m.SaRolesComponent),
        data: { title: 'Roles y Permisos - SuperAdmin' }
      },
      {
        path: 'suscripciones',
        loadComponent: () => import('./features/superadmin/pages/sa-suscripciones.component').then(m => m.SaSuscripcionesComponent),
        data: { title: 'Suscripciones SaaS - SuperAdmin' }
      },
    ]
  },

  // Ruta comodín para página no encontrada
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
