import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { NotificacionesService } from '../../core/services/notificaciones.service';
import { AuthService } from '../../core/auth/auth.service';
import { Notificacion } from '../../core/models/notificacion.models';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.css'],
})
export class NotificacionesComponent implements OnInit, OnDestroy {
  private notifService = inject(NotificacionesService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  notificaciones: Notificacion[] = [];
  noLeidas = 0;
  loading = false;
  error: string | null = null;

  readonly TIPO_LABEL: Record<string, string> = {
    nueva_emergencia:   'Nueva emergencia',
    solicitud_aceptada: 'Solicitud aceptada',
    solicitud_rechazada:'Sin disponibilidad',
    estado_en_camino:   'En camino',
    estado_en_servicio: 'En servicio',
    estado_completada:  'Completada',
    servicio_finalizado:'Servicio finalizado',
    servicio_completado:'Servicio completado',
    pago_procesado:     'Pago procesado',
  };

  readonly TIPO_ICON: Record<string, string> = {
    nueva_emergencia:   'alert',
    solicitud_aceptada: 'check',
    solicitud_rechazada:'alert',
    estado_en_camino:   'truck',
    estado_en_servicio: 'tool',
    estado_completada:  'done',
    servicio_finalizado:'done',
    servicio_completado:'done',
    pago_procesado:     'money',
  };

  ngOnInit(): void {
    this.notifService.startPolling();
    this.notifService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.notificaciones = state.notificaciones;
        this.noLeidas = state.noLeidas;
        this.loading = state.loading;
        this.error = state.error;
      });
  }

  recargar(): void {
    this.notifService.stopPolling();
    this.notifService.startPolling();
  }

  marcarLeida(n: Notificacion): void {
    if (!n.leida) this.notifService.marcarLeida(n.notificacion_id);
  }

  marcarTodasLeidas(): void {
    this.notifService.marcarTodasLeidas();
  }

  tipoLabel(tipo: string): string {
    return this.TIPO_LABEL[tipo] ?? tipo;
  }

  tipoIcon(tipo: string): string {
    return this.TIPO_ICON[tipo] ?? 'bell';
  }

  logout(): void {
    if (confirm('¿Cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate([environment.auth.routes.login]);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
