/**
 * PÁGINA REGISTRO - TALLER
 *
 * Formulario en 2 pasos:
 * - Paso 1: datos personales
 * - Paso 2: datos del taller + selector de ubicación con Leaflet + OpenStreetMap
 *
 * Sin API key, sin costo. Leaflet se carga dinámicamente desde CDN.
 * Geocodificación inversa y búsqueda de direcciones via Nominatim (OSM).
 */

import {
  Component, OnInit, OnDestroy,
  inject, NgZone, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { AuthService } from '../../../../core/auth/auth.service';
import { TallerRegisterRequest } from '../../../../core/models/auth.models';

declare var L: any;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb          = inject(FormBuilder);
  private authService = inject(AuthService);
  private router      = inject(Router);
  private ngZone      = inject(NgZone);
  private http        = inject(HttpClient);

  @ViewChild('mapContainer') mapContainer!: ElementRef<HTMLDivElement>;

  registerForm!: FormGroup;
  currentStep  = 1;
  totalSteps   = 2;
  isLoading    = false;
  showPassword = false;
  errorMessage  = '';
  successMessage = '';

  selectedLat: number | null = null;
  selectedLng: number | null = null;

  // Búsqueda de dirección con Nominatim
  searchResults: NominatimResult[] = [];
  searchLoading  = false;
  showSuggestions = false;

  private destroy$    = new Subject<void>();
  private searchInput$ = new Subject<string>();
  private map: any    = null;
  private marker: any = null;
  private leafletLoaded = false;

  // Centro por defecto: Santa Cruz, Bolivia
  private readonly defaultCenter: [number, number] = [-17.7863, -63.1812];

  ngOnInit(): void {
    this.initForm();
    this.setupSearch();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      nombre:             ['', [Validators.required, Validators.minLength(2)]],
      email:              ['', [Validators.required, Validators.email]],
      telefono:           ['', [Validators.required, Validators.minLength(8)]],
      password:           ['', [Validators.required, Validators.minLength(6)]],
      nombre_taller:      ['', [Validators.required, Validators.minLength(2)]],
      ruc:                ['', [Validators.required, Validators.minLength(5)]],
      direccion:          ['', [Validators.required, Validators.minLength(5)]],
      telefono_operativo: ['', [Validators.required, Validators.minLength(8)]],
      horario_inicio:     ['', Validators.required],
      horario_fin:        ['', Validators.required],
      latitud:            [null, Validators.required],
      longitud:           [null, Validators.required],
    });
  }

  // ── Búsqueda de dirección (Nominatim) ───────────────────────────────────

  private setupSearch(): void {
    this.searchInput$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        const q = query.trim();
        if (q.length < 4) {
          this.searchResults = [];
          this.searchLoading  = false;
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
        this.searchLoading  = false;
        this.showSuggestions = results.length > 0;
      });
    });
  }

  onDireccionInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.registerForm.patchValue({ direccion: value }, { emitEvent: false });
    this.showSuggestions = false;
    this.searchInput$.next(value);
  }

  selectSuggestion(result: NominatimResult): void {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    this.registerForm.patchValue({
      direccion: result.display_name,
      latitud:   lat,
      longitud:  lng,
    });

    this.selectedLat = parseFloat(lat.toFixed(7));
    this.selectedLng = parseFloat(lng.toFixed(7));
    this.searchResults   = [];
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

  // ── Carga dinámica de Leaflet ────────────────────────────────────────────

  private loadLeaflet(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof L !== 'undefined') { resolve(); return; }

      // Inyectar CSS de Leaflet
      if (!document.querySelector('link[href*="leaflet"]')) {
        const css = document.createElement('link');
        css.rel  = 'stylesheet';
        css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(css);
      }

      // Inyectar JS de Leaflet
      const script  = document.createElement('script');
      script.src    = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.async  = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('No se pudo cargar Leaflet'));
      document.head.appendChild(script);
    });
  }

  // ── Inicialización del mapa ──────────────────────────────────────────────

  private async initMap(): Promise<void> {
    if (this.leafletLoaded || !this.mapContainer?.nativeElement) return;

    try {
      await this.loadLeaflet();
      this.leafletLoaded = true;

      this.ngZone.runOutsideAngular(() => {
        const center = this.selectedLat
          ? [this.selectedLat, this.selectedLng] as [number, number]
          : this.defaultCenter;

        this.map = L.map(this.mapContainer.nativeElement, {
          center,
          zoom: 13,
          zoomControl: true,
        });

        // Tiles de OpenStreetMap (gratuito)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(this.map);

        // Marcador draggable (invisible hasta primer clic)
        this.marker = L.marker(center, {
          draggable: true,
          opacity: this.selectedLat ? 1 : 0,
        }).addTo(this.map);

        // Clic en mapa → mover marcador
        this.map.on('click', (e: any) => {
          this.placeMarker(e.latlng.lat, e.latlng.lng);
        });

        // Arrastrar marcador → actualizar coordenadas
        this.marker.on('dragend', (e: any) => {
          const pos = e.target.getLatLng();
          this.reverseGeocode(pos.lat, pos.lng);
          this.ngZone.run(() => this.updateLatLng(pos.lat, pos.lng));
        });
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
              this.registerForm.patchValue({ direccion: result.display_name });
            });
          }
        },
        error: () => {} // silencioso
      });
  }

  private updateLatLng(lat: number, lng: number): void {
    this.selectedLat = parseFloat(lat.toFixed(7));
    this.selectedLng = parseFloat(lng.toFixed(7));
    this.registerForm.patchValue({
      latitud:  this.selectedLat,
      longitud: this.selectedLng,
    });
  }

  // ── Navegación entre pasos ──────────────────────────────────────────────

  get step1Valid(): boolean {
    return ['nombre', 'email', 'telefono', 'password']
      .every(f => this.registerForm.get(f)?.valid);
  }

  get step2Valid(): boolean {
    return ['nombre_taller', 'ruc', 'direccion', 'telefono_operativo',
            'horario_inicio', 'horario_fin', 'latitud', 'longitud']
      .every(f => this.registerForm.get(f)?.valid);
  }

  goToStep2(): void {
    if (!this.step1Valid) {
      ['nombre', 'email', 'telefono', 'password'].forEach(f =>
        this.registerForm.get(f)?.markAsTouched()
      );
      return;
    }
    this.currentStep = 2;
    this.clearMessages();
    setTimeout(() => this.initMap(), 50);
  }

  goToStep1(): void {
    this.currentStep = 1;
    this.clearMessages();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // ── Submit ───────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (!this.registerForm.valid) {
      this.markAllTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const f = this.registerForm.value;
    const payload: TallerRegisterRequest = {
      nombre_contacto:     f.nombre,
      email:               f.email,
      telefono:            f.telefono,
      password:            f.password,
      documento_identidad: f.ruc,
      razon_social:        f.nombre_taller,
      direccion:           f.direccion,
      latitud:             parseFloat(f.latitud),
      longitud:            parseFloat(f.longitud),
      telefono_operativo:  f.telefono_operativo,
      horario_inicio:      f.horario_inicio,
      horario_fin:         f.horario_fin,
    };

    this.authService.register(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Cuenta creada exitosamente. Redirigiendo al login...';
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.errorMessage = err?.error?.detail || err?.error?.message || 'Error al registrarse. Intenta de nuevo.';
        }
      });
  }

  private markAllTouched(): void {
    Object.keys(this.registerForm.controls).forEach(k =>
      this.registerForm.get(k)?.markAsTouched()
    );
  }

  private clearMessages(): void {
    this.errorMessage  = '';
    this.successMessage = '';
  }

  // ── Getters para el template ─────────────────────────────────────────────

  get nombreControl()            { return this.registerForm.get('nombre'); }
  get emailControl()             { return this.registerForm.get('email'); }
  get telefonoControl()          { return this.registerForm.get('telefono'); }
  get passwordControl()          { return this.registerForm.get('password'); }
  get nombreTallerControl()      { return this.registerForm.get('nombre_taller'); }
  get rucControl()               { return this.registerForm.get('ruc'); }
  get direccionControl()         { return this.registerForm.get('direccion'); }
  get telefonoOperativoControl() { return this.registerForm.get('telefono_operativo'); }
  get horarioInicioControl()     { return this.registerForm.get('horario_inicio'); }
  get horarioFinControl()        { return this.registerForm.get('horario_fin'); }
  get latitudControl()           { return this.registerForm.get('latitud'); }
  get longitudControl()          { return this.registerForm.get('longitud'); }
}
