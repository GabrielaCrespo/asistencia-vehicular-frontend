import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, NgZone, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError, timeout } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { TallerService } from '../../core/services/taller.service';
import { TallerProfile, TallerProfileUpdate } from '../../core/models/auth.models';
import { environment } from '../../environments/environment';

declare var L: any;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private tallerService = inject(TallerService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);
  private http = inject(HttpClient);

  @ViewChild('mapContainer') mapContainer?: ElementRef;

  profile: TallerProfile | null = null;
  loading = true;
  saving = false;
  errorMsg = '';
  successMsg = '';
  editMode = false;
  form!: FormGroup;

  selectedLat: number | null = null;
  selectedLng: number | null = null;

  // Búsqueda de dirección con Nominatim
  searchResults: NominatimResult[] = [];
  searchLoading = false;
  showSuggestions = false;

  private destroy$ = new Subject<void>();
  private searchInput$ = new Subject<string>();
  private map: any = null;
  private marker: any = null;
  private leafletLoaded = false;

  // Centro por defecto: Santa Cruz, Bolivia
  private readonly defaultCenter: [number, number] = [-17.7863, -63.1812];

  ngOnInit(): void {
    const user = this.authService.getAuthState().currentUser;
    if (!user?.taller_id) {
      this.router.navigate([environment.auth.routes.login]);
      return;
    }

    this.profile = {
      usuario_id: user.usuario_id,
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      documento_identidad: user.documento_identidad || '',
      rol_id: user.rol_id,
      estado: 'activo',
      taller_id: user.taller_id,
      razon_social: user.razon_social,
      direccion: user.direccion || '',
      latitud: undefined,
      longitud: undefined,
      telefono_operativo: user.telefono_operativo || '',
      horario_inicio: user.horario_inicio || '',
      horario_fin: user.horario_fin || '',
      disponible: false,
      calificacion_promedio: 0,
    };
    this.buildForm(this.profile);
    this.setupSearch();
    this.loading = false;

    this.tallerService.getProfile(user.taller_id)
      .pipe(timeout(30000))
      .subscribe({
        next: (data) => { this.profile = data; },
        error: () => {}
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private buildForm(p: TallerProfile): void {
    this.form = this.fb.group({
      nombre_contacto: [p.nombre, [Validators.required, Validators.minLength(2)]],
      telefono: [p.telefono, [Validators.required, Validators.minLength(7)]],
      razon_social: [p.razon_social, [Validators.required, Validators.minLength(2)]],
      direccion: [p.direccion, [Validators.required]],
      telefono_operativo: [p.telefono_operativo, [Validators.required, Validators.minLength(7)]],
      horario_inicio: [p.horario_inicio, [Validators.required, Validators.pattern('^([01][0-9]|2[0-3]):[0-5][0-9]$')]],
      horario_fin: [p.horario_fin, [Validators.required, Validators.pattern('^([01][0-9]|2[0-3]):[0-5][0-9]$')]],
      latitud: [p.latitud ?? null],
      longitud: [p.longitud ?? null],
    });
  }

  // ── Búsqueda de dirección (Nominatim) ───────────────────────────────

  private setupSearch(): void {
    this.searchInput$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();
        if (q.length < 4) {
          this.searchResults = [];
          this.searchLoading = false;
          return of([]);
        }
        this.searchLoading = true;
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
        return this.http.get<NominatimResult[]>(url, {
          headers: { 'Accept-Language': 'es' }
        }).pipe(catchError(() => of([])));
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.ngZone.run(() => {
        this.searchResults = results;
        this.searchLoading = false;
        this.showSuggestions = results.length > 0;
      });
    });
  }

  onDireccionInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.form.patchValue({ direccion: value }, { emitEvent: false });
    this.showSuggestions = false;
    this.searchInput$.next(value);
  }

  selectSuggestion(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    this.form.patchValue({ direccion: result.display_name, latitud: lat, longitud: lng });
    this.selectedLat = parseFloat(lat.toFixed(7));
    this.selectedLng = parseFloat(lng.toFixed(7));
    this.searchResults = [];
    this.showSuggestions = false;
    if (this.map && this.marker) {
      const latlng = L.latLng(lat, lng);
      this.marker.setLatLng(latlng);
      this.marker.setOpacity(1);
      this.map.setView(latlng, 16);
    }
  }

  hideSuggestions(): void {
    setTimeout(() => { this.showSuggestions = false; }, 200);
  }

  // ── Carga dinámica de Leaflet ────────────────────────────────────────

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') { resolve(); return; }
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
      document.head.appendChild(script);
    });
  }

  // ── Inicialización del mapa ──────────────────────────────────────────

  private async initMap(): Promise<void> {
    if (this.leafletLoaded || !this.mapContainer?.nativeElement) return;
    try {
      await this.loadLeaflet();
      this.leafletLoaded = true;

      // Re-verificar tras el await: el usuario pudo cerrar el modo edición
      // mientras Leaflet cargaba desde CDN
      if (!this.mapContainer?.nativeElement) return;

      this.ngZone.runOutsideAngular(() => {
        const el = this.mapContainer!.nativeElement as HTMLElement;

        const doInit = () => {
          // Si el elemento ya no está en el DOM (canceló edición), abortar
          if (!el.isConnected) return;

          const center = this.selectedLat
            ? [this.selectedLat, this.selectedLng] as [number, number]
            : this.defaultCenter;

          this.map = L.map(el, { center, zoom: 13, zoomControl: true });

          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
          }).addTo(this.map);

          this.marker = L.marker(center, {
            draggable: true,
            opacity: this.selectedLat ? 1 : 0,
          }).addTo(this.map);

          this.map.on('click', (e: any) => this.placeMarker(e.latlng.lat, e.latlng.lng));

          this.marker.on('dragend', (e: any) => {
            const pos = e.target.getLatLng();
            this.reverseGeocode(pos.lat, pos.lng);
            this.ngZone.run(() => this.updateLatLng(pos.lat, pos.lng));
          });

          // Forzar recálculo después de que el browser complete el layout
          setTimeout(() => { if (this.map) this.map.invalidateSize(); }, 150);
        };

        // Cuando Leaflet ya estaba cargado en memoria (el usuario viene del
        // registro), el await resuelve instantáneamente y el browser puede
        // no haber completado el layout del contenedor recién creado por *ngIf.
        // offsetWidth === 0 indica que el layout aún no corrió → esperar al
        // siguiente frame de animación donde el browser garantiza dimensiones.
        if (el.offsetWidth > 0) {
          doInit();
        } else {
          requestAnimationFrame(() => doInit());
        }
      });
    } catch (err) {
      console.error('Error cargando Leaflet:', err);
    }
  }

  private placeMarker(lat: number, lng: number): void {
    this.marker.setLatLng([lat, lng]);
    this.marker.setOpacity(1);
    this.reverseGeocode(lat, lng);
    this.ngZone.run(() => this.updateLatLng(lat, lng));
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    this.http.get<any>(url, { headers: { 'Accept-Language': 'es' } })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          if (result?.display_name) {
            this.ngZone.run(() => {
              this.form.patchValue({ direccion: result.display_name });
            });
          }
        },
        error: () => {}
      });
  }

  private updateLatLng(lat: number, lng: number): void {
    this.selectedLat = parseFloat(lat.toFixed(7));
    this.selectedLng = parseFloat(lng.toFixed(7));
    this.form.patchValue({ latitud: this.selectedLat, longitud: this.selectedLng });
  }

  // ── Modo edición ─────────────────────────────────────────────────────

  toggleEdit(): void {
    this.editMode = !this.editMode;
    this.successMsg = '';
    this.errorMsg = '';

    if (this.editMode && this.profile) {
      this.form.patchValue({
        nombre_contacto: this.profile.nombre,
        telefono: this.profile.telefono,
        razon_social: this.profile.razon_social,
        direccion: this.profile.direccion,
        telefono_operativo: this.profile.telefono_operativo,
        horario_inicio: this.profile.horario_inicio,
        horario_fin: this.profile.horario_fin,
        latitud: this.profile.latitud,
        longitud: this.profile.longitud,
      }, { emitEvent: false });
      this.form.markAsUntouched();
      this.selectedLat = (this.profile.latitud && this.profile.latitud !== 0) ? this.profile.latitud : null;
      this.selectedLng = (this.profile.longitud && this.profile.longitud !== 0) ? this.profile.longitud : null;
      setTimeout(() => this.initMap(), 250);
    } else {
      this.cleanupEditState();
    }
  }

  private cleanupEditState(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
    this.leafletLoaded = false;
    this.searchResults = [];
    this.showSuggestions = false;
    this.searchLoading = false;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const tallerId = this.profile!.taller_id;
    const payload: TallerProfileUpdate = this.form.value;

    console.log('[PERFIL] 💾 Iniciando guardado de perfil...');
    this.saving = true;
    this.errorMsg = '';
    this.successMsg = '';

    const oldProfile: TallerProfile | null = this.profile ? { ...this.profile } : null;
    if (this.profile) {
      if (payload.nombre_contacto) this.profile.nombre = payload.nombre_contacto;
      if (payload.telefono) this.profile.telefono = payload.telefono;
      if (payload.razon_social) this.profile.razon_social = payload.razon_social;
      if (payload.direccion) this.profile.direccion = payload.direccion;
      if (payload.telefono_operativo) this.profile.telefono_operativo = payload.telefono_operativo;
      if (payload.horario_inicio) this.profile.horario_inicio = payload.horario_inicio;
      if (payload.horario_fin) this.profile.horario_fin = payload.horario_fin;
      if (payload.latitud != null) this.profile.latitud = payload.latitud;
      if (payload.longitud != null) this.profile.longitud = payload.longitud;
    }
    console.log('[PERFIL] ✓ UI actualizada localmente');

    const manualTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.saving) {
          this.saving = false;
          this.errorMsg = 'La solicitud tardó demasiado. Por favor, intenta de nuevo.';
          this.cdr.detectChanges();
        }
      });
    }, 60000);

    console.log('[PERFIL] 📤 Enviando PUT al servidor...');
    this.tallerService.updateProfile(tallerId, payload).subscribe({
      next: (updated) => {
        clearTimeout(manualTimeout);
        console.log('[PERFIL] ✅ Respuesta recibida del servidor:', updated);
        this.profile = updated;
        this.saving = false;
        this.editMode = false;
        this.successMsg = 'Perfil actualizado correctamente.';
        this.cleanupEditState();
        this.cdr.detectChanges();
        console.log('[PERFIL] ✓ saving = false, editMode = false');
        setTimeout(() => {
          console.log('[PERFIL] 🔄 Actualizando auth state en background...');
          this.authService.updateCurrentUserFields({
            nombre: updated.nombre,
            telefono: updated.telefono,
            razon_social: updated.razon_social,
            direccion: updated.direccion,
            telefono_operativo: updated.telefono_operativo,
            horario_inicio: updated.horario_inicio,
            horario_fin: updated.horario_fin,
          });
        }, 0);
      },
      error: (err) => {
        clearTimeout(manualTimeout);
        console.error('[PERFIL] ❌ Error completo:', err);
        console.error('[PERFIL] Status:', err.status);
        console.error('[PERFIL] Message:', err.message);
        console.error('[PERFIL] Headers:', err.headers);
        console.error('[PERFIL] Error Body:', err.error);
        this.profile = oldProfile;
        this.saving = false;
        this.errorMsg = err?.error?.detail || err?.message || 'Error al guardar los cambios.';
        this.cdr.detectChanges();
        console.log('[PERFIL] ✓ saving = false (por error), perfil revertido');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      this.authService.logout();
      this.router.navigate([environment.auth.routes.login]);
    }
  }

  get f() { return this.form?.controls; }
}
