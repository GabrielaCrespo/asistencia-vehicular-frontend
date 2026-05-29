import { Injectable, inject, OnDestroy } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Subscription, timer, EMPTY } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';
import { StorageService } from '../auth/storage.service';
import {
  NotificacionesResponse,
  NotificacionesState,
} from '../models/notificacion.models';

const POLL_INTERVAL_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class NotificacionesService implements OnDestroy {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  private apiUrl = `${environment.api.baseUrl}/api/notificaciones`;
  private wsUrl = environment.api.baseUrl.replace('http', 'ws');

  private state = new BehaviorSubject<NotificacionesState>({
    notificaciones: [],
    noLeidas: 0,
    loading: false,
    error: null,
  });

  public state$ = this.state.asObservable();
  public notificaciones$ = this.state$.pipe(map(s => s.notificaciones));
  public noLeidas$ = this.state$.pipe(map(s => s.noLeidas));

  // ── WebSocket ──────────────────────────────────────────
  private ws: WebSocket | null = null;
  private wsReconnectTimer: any = null;

  // ── Polling (fallback) ─────────────────────────────────
  private pollingSub?: Subscription;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.storage.getToken() ?? ''}` });
  }

  // ── WEBSOCKET ──────────────────────────────────────────

  connectWebSocket(): void {
    const token = this.storage.getToken();
    if (!token) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(`${this.wsUrl}/ws?token=${token}`);

    this.ws.onopen = () => {
      console.log('[WS] Conectado al servidor de tiempo real');
      // Iniciar ping cada 30s para mantener la conexión viva
      this.wsReconnectTimer = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send('ping');
        }
      }, 30_000);
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.tipo === 'pong' || data.tipo === 'conexion_establecida') return;

        // Agregar la nueva notificación al estado actual
        const nuevaNotif = {
          notificacion_id: Date.now(),
          tipo: data.tipo,
          titulo: data.titulo,
          descripcion: data.mensaje,
          datos_asociados: data,
          leida: false,
          fecha_creacion: new Date().toISOString(),
        };

        const notificaciones = [nuevaNotif, ...this.state.value.notificaciones];
        this.state.next({
          ...this.state.value,
          notificaciones,
          noLeidas: this.state.value.noLeidas + 1,
        });
      } catch (e) {
        console.error('[WS] Error procesando mensaje:', e);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Conexión cerrada');
      clearInterval(this.wsReconnectTimer);
      // Solo reconectar si hay token activo, máximo 1 intento cada 30s
      if (this.storage.getToken()) {
        setTimeout(() => this.connectWebSocket(), 30_000);
      }
    };

    this.ws.onerror = () => {
      this.ws = null;
    };
  }

  disconnectWebSocket(): void {
    clearInterval(this.wsReconnectTimer);
    this.ws?.close();
    this.ws = null;
  }

  // ── POLLING (fallback, mantener por compatibilidad) ────

  startPolling(): void {
    // Primero conectar WebSocket
    this.connectWebSocket();

    // Polling para cargar notificaciones históricas
    if (this.pollingSub && !this.pollingSub.closed) return;
    this.pollingSub = timer(0, POLL_INTERVAL_MS)
      .pipe(
        switchMap(() => {
          const token = this.storage.getToken();
          if (!token) return EMPTY;
          this.state.next({ ...this.state.value, loading: true, error: null });
          return this.http
            .get<NotificacionesResponse>(this.apiUrl, { headers: this.getHeaders() })
            .pipe(
              catchError(err => {
                console.error('[Notificaciones] Error:', err?.status);
                this.state.next({
                  ...this.state.value,
                  loading: false,
                  error: 'No se pudieron cargar las notificaciones',
                });
                return EMPTY;
              }),
            );
        }),
      )
      .subscribe(resp => {
        if (resp?.notificaciones !== undefined) {
          this.state.next({
            notificaciones: resp.notificaciones,
            noLeidas: resp.no_leidas ?? resp.notificaciones.filter(n => !n.leida).length,
            loading: false,
            error: null,
          });
        }
      });
  }

  stopPolling(): void {
    this.pollingSub?.unsubscribe();
    this.disconnectWebSocket();
  }

  marcarLeida(id: number): void {
    if (!this.storage.getToken()) return;
    this.http
      .put<{ success: boolean }>(`${this.apiUrl}/${id}/leer`, {}, { headers: this.getHeaders() })
      .subscribe(() => {
        const notificaciones = this.state.value.notificaciones.map(n =>
          n.notificacion_id === id ? { ...n, leida: true } : n,
        );
        this.state.next({
          ...this.state.value,
          notificaciones,
          noLeidas: notificaciones.filter(n => !n.leida).length,
        });
      });
  }

  marcarTodasLeidas(): void {
    if (!this.storage.getToken()) return;
    this.http
      .put<{ success: boolean }>(`${this.apiUrl}/leer-todas`, {}, { headers: this.getHeaders() })
      .subscribe(() => {
        const notificaciones = this.state.value.notificaciones.map(n => ({ ...n, leida: true }));
        this.state.next({ ...this.state.value, notificaciones, noLeidas: 0 });
      });
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }
}