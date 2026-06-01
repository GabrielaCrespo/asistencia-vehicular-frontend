import {
  Component, OnInit, OnDestroy, inject,
  AfterViewInit, ElementRef, ViewChild, NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import * as L from 'leaflet';

import { AuthService } from '../../core/auth/auth.service';
import { SolicitudesService } from '../../core/services/solicitudes.service';
import { StorageService } from '../../core/auth/storage.service';
import { SolicitudAsignada } from '../../core/models/solicitudes.models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-monitoreo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">

      <!-- HEADER estilo teal igual al resto -->
      <header class="page-header">
        <div class="header-inner">
          <div class="header-left">
            <a routerLink="/dashboard" class="back-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              Dashboard
            </a>
            <div class="header-title">
              <div class="header-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4l3 3"/>
                </svg>
              </div>
              <div>
                <h1>Monitoreo Operacional</h1>
                <p class="header-subtitle">Seguimiento en tiempo real de tus técnicos</p>
              </div>
            </div>
          </div>
          <div class="header-right">
            <div class="ws-badge" [class.connected]="wsConectado">
              <span class="ws-dot"></span>
              {{ wsConectado ? 'En vivo' : 'Desconectado' }}
            </div>
            <button class="btn-refresh" (click)="cargarAsignadas()">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polyline points="23 4 23 10 17 10"/>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
              </svg>
              Actualizar
            </button>
          </div>
        </div>
      </header>

      <!-- BODY -->
      <main class="page-body">
        <div class="body-wrap">

          <!-- STATS -->
          <div class="stats-row">
            <div class="stat-card">
              <span class="stat-num">{{ asignadas.length }}</span>
              <span class="stat-label">Servicios activos</span>
            </div>
            <div class="stat-card accent-orange">
              <span class="stat-num">{{ enCamino }}</span>
              <span class="stat-label">En camino</span>
            </div>
            <div class="stat-card accent-purple">
              <span class="stat-num">{{ enServicio }}</span>
              <span class="stat-label">En servicio</span>
            </div>
            <div class="stat-card accent-teal">
              <span class="stat-num">{{ tecnicosActivos }}</span>
              <span class="stat-label">Técnicos activos</span>
            </div>
          </div>

          <!-- GRID PRINCIPAL -->
          <div class="main-grid">

            <!-- MAPA -->
            <div class="panel mapa-panel">
              <div class="panel-header">
                <div class="panel-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/>
                    <line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                  Mapa en tiempo real
                </div>
                <div class="leyenda">
                  <span class="leyenda-item"><span class="dot-tecnico"></span> Técnico</span>
                  <span class="leyenda-item"><span class="dot-cliente"></span> Cliente</span>
                </div>
              </div>
              <div #mapaEl class="mapa-leaflet"></div>
            </div>

            <!-- LISTA SERVICIOS -->
            <div class="panel lista-panel">
              <div class="panel-header">
                <div class="panel-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 11l3 3L22 4"/>
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                  </svg>
                  Servicios activos
                </div>
              </div>

              <div *ngIf="cargando" class="empty-state">
                <div class="spinner"></div>
                <p>Cargando servicios...</p>
              </div>

              <div *ngIf="!cargando && asignadas.length === 0" class="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                </svg>
                <p>No hay servicios activos</p>
              </div>

              <div class="servicios-lista">
                <div *ngFor="let a of asignadas"
                     class="servicio-card"
                     [class.selected]="seleccionado?.asignacion_id === a.asignacion_id"
                     (click)="seleccionar(a)">

                  <div class="card-top">
                    <span class="card-id">Servicio #{{ a.asignacion_id }}</span>
                    <span class="badge" [ngClass]="badgeClass(a.estado)">{{ etiqueta(a.estado) }}</span>
                  </div>

                  <div class="card-info">
                    <div class="info-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {{ a.cliente_nombre }}
                    </div>
                    <div class="info-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                      {{ a.tecnico_nombre || 'Sin técnico asignado' }}
                    </div>
                    <div class="info-row">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                      {{ a.marca }} {{ a.modelo }} · {{ a.placa }}
                    </div>
                  </div>

                  <div class="card-footer">
                    <button class="btn-ver-mapa" (click)="centrarEnMapa(a); $event.stopPropagation()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                      </svg>
                      Ver en mapa
                    </button>
                    <span *ngIf="tieneUbicacion(a.incidente_id)" class="gps-badge">
                      <span class="gps-dot"></span> GPS activo
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>

      <!-- TOAST NOTIFICACION -->
      <div class="notif-toast" [class.show]="mostrarNotif" *ngIf="ultimaNotif">
        <div class="notif-icon">🔔</div>
        <div class="notif-body">
          <strong>{{ ultimaNotif.titulo }}</strong>
          <p>{{ ultimaNotif.mensaje }}</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ═══════════════════════════════════════
       MONITOREO — Teal Theme (igual al resto)
    ═══════════════════════════════════════ */

    .page {
      min-height: 100vh;
      background: #f1f5f9;
      display: flex;
      flex-direction: column;
    }

    /* HEADER */
    .page-header {
      background: linear-gradient(135deg, #5cbdb9 0%, #3aa7a2 100%);
      box-shadow: 0 2px 20px rgba(58,167,162,0.3);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    .header-inner {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      height: 72px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
    }

    .header-left { display: flex; align-items: center; gap: 1.5rem; }
    .header-right { display: flex; align-items: center; gap: 1rem; }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      color: rgba(255,255,255,0.8);
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      padding: 0.4rem 0.75rem;
      border-radius: 8px;
      border: 1.5px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.1);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .back-btn:hover { background: rgba(255,255,255,0.2); color: white; }

    .header-title { display: flex; align-items: center; gap: 0.75rem; }

    .header-icon-wrap {
      width: 40px; height: 40px;
      border-radius: 11px;
      background: rgba(255,255,255,0.18);
      border: 1.5px solid rgba(255,255,255,0.28);
      display: flex; align-items: center; justify-content: center;
      color: white;
    }

    .header-title h1 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      color: white;
    }

    .header-subtitle {
      margin: 0;
      font-size: 0.78rem;
      color: rgba(255,255,255,0.75);
    }

    .ws-badge {
      display: flex; align-items: center; gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      background: rgba(255,255,255,0.15);
      border: 1.5px solid rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.85);
      font-size: 12px; font-weight: 600;
    }
    .ws-badge.connected { background: rgba(34,197,94,0.2); border-color: rgba(34,197,94,0.4); color: #bbf7d0; }

    .ws-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .btn-refresh {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 0.45rem 1rem;
      border-radius: 9px;
      border: 1.5px solid rgba(255,255,255,0.25);
      background: rgba(255,255,255,0.12);
      color: white;
      font-size: 0.82rem; font-weight: 600;
      cursor: pointer; transition: all 0.2s;
    }
    .btn-refresh:hover { background: rgba(255,255,255,0.22); }

    /* BODY */
    .page-body { flex: 1; padding: 2rem 0; }

    .body-wrap {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* STATS */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 20px 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      border-left: 4px solid #e2e8f0;
    }
    .stat-card.accent-orange { border-left-color: #f97316; }
    .stat-card.accent-purple { border-left-color: #a855f7; }
    .stat-card.accent-teal   { border-left-color: #14b8a6; }

    .stat-num { display: block; font-size: 2rem; font-weight: 800; color: #1e293b; }
    .stat-label { font-size: 13px; color: #64748b; }

    /* GRID */
    .main-grid {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    /* PANELS */
    .panel {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      overflow: hidden;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f1f5f9;
    }

    .panel-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 14px; font-weight: 700;
      color: #1e293b;
    }

    .leyenda { display: flex; gap: 16px; }
    .leyenda-item { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #64748b; }
    .dot-tecnico { width: 10px; height: 10px; border-radius: 50%; background: #3b82f6; display: inline-block; }
    .dot-cliente { width: 10px; height: 10px; border-radius: 50%; background: #ef4444; display: inline-block; }

    .mapa-leaflet { height: 520px; width: 100%; }

    /* LISTA */
    .lista-panel { display: flex; flex-direction: column; max-height: 620px; }
    .servicios-lista { overflow-y: auto; flex: 1; }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 12px;
      padding: 48px 20px; color: #94a3b8;
    }

    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #e2e8f0;
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .servicio-card {
      padding: 16px 20px;
      border-bottom: 1px solid #f8fafc;
      cursor: pointer;
      transition: background 0.15s;
    }
    .servicio-card:hover { background: #f8fafc; }
    .servicio-card.selected { background: #eff6ff; border-left: 3px solid #3b82f6; }

    .card-top {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 10px;
    }

    .card-id { font-weight: 700; font-size: 13px; color: #1e293b; }

    .badge {
      padding: 3px 10px; border-radius: 20px;
      font-size: 11px; font-weight: 700;
    }
    .badge-camino   { background: #fef3c7; color: #d97706; }
    .badge-servicio { background: #ede9fe; color: #7c3aed; }
    .badge-aceptada { background: #dbeafe; color: #2563eb; }

    .card-info { margin-bottom: 12px; }

    .info-row {
      display: flex; align-items: center; gap: 7px;
      font-size: 12px; color: #475569; margin-bottom: 5px;
    }

    .card-footer {
      display: flex; justify-content: space-between; align-items: center;
    }

    .btn-ver-mapa {
      display: inline-flex; align-items: center; gap: 5px;
      background: #3b82f6; color: white;
      border: none; padding: 5px 12px;
      border-radius: 8px; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: background 0.15s;
    }
    .btn-ver-mapa:hover { background: #2563eb; }

    .gps-badge {
      display: flex; align-items: center; gap: 5px;
      font-size: 11px; font-weight: 600; color: #16a34a;
    }
    .gps-dot {
      width: 7px; height: 7px; border-radius: 50%; background: #16a34a;
      animation: pulse 1.5s infinite;
    }

    /* TOAST */
    .notif-toast {
      position: fixed; bottom: 24px; right: 24px;
      background: white;
      border-radius: 14px;
      padding: 16px 20px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.12);
      display: flex; align-items: flex-start; gap: 12px;
      max-width: 320px;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s ease;
      z-index: 1000;
      border-left: 4px solid #14b8a6;
    }
    .notif-toast.show { transform: translateY(0); opacity: 1; }
    .notif-icon { font-size: 22px; }
    .notif-body strong { display: block; font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
    .notif-body p { margin: 0; font-size: 12px; color: #64748b; }

    @media (max-width: 900px) {
      .stats-row { grid-template-columns: repeat(2,1fr); }
      .main-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class MonitoreoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapaEl') mapaEl!: ElementRef;

  private authService = inject(AuthService);
  private solicitudesService = inject(SolicitudesService);
  private storage = inject(StorageService);
  private ngZone = inject(NgZone);
  private destroy$ = new Subject<void>();

  asignadas: SolicitudAsignada[] = [];
  seleccionado: SolicitudAsignada | null = null;
  cargando = true;
  wsConectado = false;

  ultimaNotif: { titulo: string; mensaje: string } | null = null;
  mostrarNotif = false;
  private notifTimer: any;

  private mapa!: L.Map;
  private tecnicoMarkers = new Map<number, L.Marker>();
  private clienteMarkers = new Map<number, L.Marker>();
  private rutaLines = new Map<number, L.Polyline>();
  private tecnicoUbicaciones = new Map<number, { lat: number; lng: number }>();

  private ws: WebSocket | null = null;

  get enCamino(): number { return this.asignadas.filter(a => a.estado === 'en_camino').length; }
  get enServicio(): number { return this.asignadas.filter(a => a.estado === 'en_servicio').length; }
  get tecnicosActivos(): number { return this.asignadas.filter(a => a.tecnico_id).length; }

  ngOnInit(): void {
    this.authService.currentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => { if (user?.taller_id) this.cargarAsignadas(); });
    this._conectarWS();
  }

  ngAfterViewInit(): void {
    this._iniciarMapa();
  }

  private _iniciarMapa(): void {
    this.ngZone.runOutsideAngular(() => {
      this.mapa = L.map(this.mapaEl.nativeElement).setView([-17.7833, -63.1821], 13);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(this.mapa);
    });
  }

  private _iconTecnico(): L.DivIcon {
    return L.divIcon({
      html: `<div style="background:#3b82f6;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:16px;">🚗</div>`,
      iconSize: [34, 34], iconAnchor: [17, 17], className: '',
    });
  }

  private _iconCliente(): L.DivIcon {
    return L.divIcon({
      html: `<div style="background:#ef4444;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.25);font-size:16px;">📍</div>`,
      iconSize: [34, 34], iconAnchor: [17, 34], className: '',
    });
  }

  private _actualizarMapa(incidenteId: number, tecLat: number, tecLng: number, cliLat?: number, cliLng?: number): void {
    this.ngZone.runOutsideAngular(() => {
      const tecPos = L.latLng(tecLat, tecLng);
      if (this.tecnicoMarkers.has(incidenteId)) {
        this.tecnicoMarkers.get(incidenteId)!.setLatLng(tecPos);
      } else {
        const m = L.marker(tecPos, { icon: this._iconTecnico() })
          .bindPopup(`<b>🚗 Técnico</b><br>Servicio #${incidenteId}`)
          .addTo(this.mapa);
        this.tecnicoMarkers.set(incidenteId, m);
      }

      if (cliLat && cliLng) {
        const cliPos = L.latLng(cliLat, cliLng);
        if (!this.clienteMarkers.has(incidenteId)) {
          const m = L.marker(cliPos, { icon: this._iconCliente() })
            .bindPopup(`<b>📍 Cliente</b><br>Incidente #${incidenteId}`)
            .addTo(this.mapa);
          this.clienteMarkers.set(incidenteId, m);
        }
        if (this.rutaLines.has(incidenteId)) {
          this.rutaLines.get(incidenteId)!.setLatLngs([tecPos, cliPos]);
        } else {
          const line = L.polyline([tecPos, cliPos], {
            color: '#3b82f6', weight: 3, dashArray: '8 5', opacity: 0.8
          }).addTo(this.mapa);
          this.rutaLines.set(incidenteId, line);
        }
      }
      this.mapa.panTo(tecPos);
    });
  }

  private _conectarWS(): void {
    const token = this.storage.getToken();
    if (!token) return;
    const wsUrl = environment.api.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    try {
      this.ws = new WebSocket(`${wsUrl}/ws?token=${token}`);
      this.ws.onopen = () => {
        this.ngZone.run(() => this.wsConectado = true);
        setInterval(() => { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send('ping'); }, 30000);
      };
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.tipo === 'pong' || data.tipo === 'conexion_establecida') return;
          this.ngZone.run(() => {
            if (data.incidente_id && data.estado) {
              const idx = this.asignadas.findIndex(a => a.incidente_id === data.incidente_id);
              if (idx >= 0) this.asignadas[idx] = { ...this.asignadas[idx], estado: data.estado };
            }
            if (data.tipo === 'ubicacion_tecnico' && data.latitud && data.longitud) {
              this.tecnicoUbicaciones.set(data.incidente_id, { lat: data.latitud, lng: data.longitud });
              const asig = this.asignadas.find(a => a.incidente_id === data.incidente_id);
              this._actualizarMapa(data.incidente_id, data.latitud, data.longitud, asig?.latitud, asig?.longitud);
            }
            if (data.titulo) {
              this._mostrarNotif(data.titulo, data.mensaje || '');
              if (['solicitud_aceptada', 'estado_completada'].includes(data.tipo)) this.cargarAsignadas();
            }
          });
        } catch (e) { console.error('[WS]', e); }
      };
      this.ws.onclose = () => {
        this.ngZone.run(() => this.wsConectado = false);
        setTimeout(() => this._conectarWS(), 30000);
      };
      this.ws.onerror = () => { this.ws = null; };
    } catch (e) { console.error('[WS] Error:', e); }
  }

  cargarAsignadas(): void {
    this.authService.currentUser$().pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (!user?.taller_id) return;
      this.cargando = true;
      this.solicitudesService.cargarAsignadas(user.taller_id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.solicitudesService.getAsignadas$()
              .pipe(takeUntil(this.destroy$))
              .subscribe(lista => {
                this.asignadas = lista;
                this.cargando = false;
                this.ngZone.runOutsideAngular(() => {
                  lista.forEach(a => {
                    if (a.latitud && a.longitud && !this.clienteMarkers.has(a.incidente_id)) {
                      const m = L.marker(L.latLng(a.latitud, a.longitud), { icon: this._iconCliente() })
                        .bindPopup(`<b>📍 ${a.cliente_nombre}</b><br>Incidente #${a.incidente_id}`)
                        .addTo(this.mapa);
                      this.clienteMarkers.set(a.incidente_id, m);
                    }
                  });
                });
              });
          },
          error: () => { this.cargando = false; }
        });
    });
  }

  seleccionar(a: SolicitudAsignada): void { this.seleccionado = a; this.centrarEnMapa(a); }

  centrarEnMapa(a: SolicitudAsignada): void {
    if (!this.mapa) return;
    const ubic = this.tecnicoUbicaciones.get(a.incidente_id);
    if (ubic) this.mapa.setView([ubic.lat, ubic.lng], 16);
    else if (a.latitud && a.longitud) this.mapa.setView([a.latitud, a.longitud], 16);
  }

  tieneUbicacion(incidenteId: number): boolean { return this.tecnicoUbicaciones.has(incidenteId); }

  private _mostrarNotif(titulo: string, mensaje: string): void {
    this.ultimaNotif = { titulo, mensaje };
    this.mostrarNotif = true;
    clearTimeout(this.notifTimer);
    this.notifTimer = setTimeout(() => { this.mostrarNotif = false; }, 4000);
  }

  badgeClass(estado: string): string {
    return { en_camino: 'badge-camino', en_servicio: 'badge-servicio', aceptada: 'badge-aceptada' }[estado] ?? 'badge-aceptada';
  }

  etiqueta(estado: string): string {
    return { aceptada: 'Aceptada', en_camino: 'En camino', en_servicio: 'En servicio', completada: 'Completada' }[estado] ?? estado;
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete();
    this.ws?.close(); clearTimeout(this.notifTimer);
  }
}