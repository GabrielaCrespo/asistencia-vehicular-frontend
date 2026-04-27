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

  private state = new BehaviorSubject<NotificacionesState>({
    notificaciones: [],
    noLeidas: 0,
    loading: false,
    error: null,
  });

  public state$ = this.state.asObservable();
  public notificaciones$ = this.state$.pipe(map(s => s.notificaciones));
  public noLeidas$ = this.state$.pipe(map(s => s.noLeidas));

  private pollingSub?: Subscription;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.storage.getToken() ?? ''}` });
  }

  startPolling(): void {
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
                console.error('[Notificaciones] Error al consultar notificaciones:', err?.status, err?.error);
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
