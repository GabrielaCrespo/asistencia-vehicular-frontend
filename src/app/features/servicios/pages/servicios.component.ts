import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { ServiciosService } from '../../../core/services/servicios.service';
import {
  TallerServicio,
  TallerServicioUpdateRequest,
  TallerServicioDirectoCreateRequest,
} from '../../../core/models/servicios.models';
import { CurrentUser } from '../../../core/models/auth.models';

type ModalMode = 'crear' | 'editar';

interface CategoriaConfig {
  id: string;
  label: string;
  subLabel: string;
  nombreBase: string;
  problemaFlutter: string;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private serviciosService = inject(ServiciosService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  servicios_taller$ = this.serviciosService.getServiciosTaller$();
  loading$ = this.serviciosService.isLoading$();
  error$ = this.serviciosService.error$();

  stats$ = this.servicios_taller$.pipe(
    map(servicios => ({
      total: servicios.length,
      disponibles: servicios.filter(s => s.disponible).length,
      noDisponibles: servicios.filter(s => !s.disponible).length,
    }))
  );

  readonly CATEGORIAS: CategoriaConfig[] = [
    { id: 'AUXILIO',   label: 'Auxilio Vial',       subLabel: 'Cambio de llantas · Asistencia en carretera · Neumáticos', nombreBase: 'ASISTENCIA AUXILIO VEHICULAR',  problemaFlutter: 'Llanta'  },
    { id: 'MECANICA',  label: 'Mecánica General',   subLabel: 'Motor · Frenos · Transmisión · Revisión general',          nombreBase: 'SERVICIO DE MECANICA GENERAL',  problemaFlutter: 'Motor'   },
    { id: 'ELECTRICO', label: 'Eléctrico',           subLabel: 'Batería · Alternador · Luces · Arranque',                  nombreBase: 'SERVICIO ELECTRICO VEHICULAR',  problemaFlutter: 'Batería' },
    { id: 'GRUA',      label: 'Grúa y Remolque',    subLabel: 'Choques · Vehículo inmovilizado · Remolque al taller',     nombreBase: 'SERVICIO DE GRUA Y REMOLQUE',   problemaFlutter: 'Choque'  },
    { id: 'OTROS',     label: 'Asistencia General', subLabel: 'Otros servicios de asistencia vehicular',                  nombreBase: 'ASISTENCIA GENERAL',            problemaFlutter: 'Otros'   },
  ];

  serviciosList: TallerServicio[] = [];
  toggling: string | null = null;

  currentUser: CurrentUser | null = null;
  modalMode: ModalMode | null = null;
  selectedServicio: TallerServicio | null = null;

  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  private toastTimer: any;

  formCrear!: FormGroup;
  formEditar!: FormGroup;

  ngOnInit() {
    this.setupForms();
    this.loadUserAndServicios();
  }

  private setupForms() {
    this.formCrear = this.fb.group({
      nombre:      ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      categoria:   ['', Validators.required],
      precio:      [null, [Validators.required, Validators.min(0)]],
      disponible:  [true],
    });
    this.formEditar = this.fb.group({
      precio_personalizado: [null],
      disponible:           [true],
    });
  }

  private loadUserAndServicios() {
    this.authService.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.currentUser) {
          this.currentUser = authState.currentUser;
          this.serviciosService.listarServiciosTaller(authState.currentUser.taller_id)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
        }
      });

    this.servicios_taller$
      .pipe(takeUntil(this.destroy$))
      .subscribe(lista => { this.serviciosList = lista; });
  }

  // ── HELPERS ──────────────────────────────────────────────────

  getServiciosDeCategoria(catId: string): TallerServicio[] {
    return this.serviciosList.filter(
      s => (s.categoria ?? '').toUpperCase().trim() === catId
    );
  }

  getCoberturaActiva(catId: string): boolean {
    return this.getServiciosDeCategoria(catId).some(s => s.disponible);
  }

  categoriasActivas(): number {
    return this.CATEGORIAS.filter(c => this.getCoberturaActiva(c.id)).length;
  }

  getPrecio(servicio: TallerServicio): number {
    return servicio.precio_personalizado ?? servicio.precio_base;
  }

  // ── TOGGLE CATEGORÍA ─────────────────────────────────────────

  toggleCategoria(cat: CategoriaConfig): void {
    if (!this.currentUser || this.toggling) return;
    const tallerId = this.currentUser.taller_id;
    const activo = this.getCoberturaActiva(cat.id);
    const servicios = this.getServiciosDeCategoria(cat.id);
    this.toggling = cat.id;

    const done = (msg: string) => { this.toggling = null; this.recargar(); this.mostrarToast(msg, 'ok'); };
    const onError = (err: any) => { this.toggling = null; this.mostrarToast(err.message || 'Error actualizando categoría', 'err'); };

    if (activo) {
      const activos = servicios.filter(s => s.disponible);
      let pendientes = activos.length;
      if (pendientes === 0) { this.toggling = null; return; }
      activos.forEach(s =>
        this.serviciosService.actualizarServicioTaller(tallerId, s.taller_servicio_id, { disponible: false })
          .pipe(takeUntil(this.destroy$))
          .subscribe({ next: () => { if (--pendientes === 0) done(`${cat.label} desactivado`); }, error: onError })
      );
    } else if (servicios.length > 0) {
      this.serviciosService.actualizarServicioTaller(tallerId, servicios[0].taller_servicio_id, { disponible: true })
        .pipe(takeUntil(this.destroy$)).subscribe({ next: () => done(`${cat.label} activado`), error: onError });
    } else {
      const payload: TallerServicioDirectoCreateRequest = { nombre: cat.nombreBase, categoria: cat.id, precio: 0, disponible: true };
      this.serviciosService.crearServicioDirectoEnTaller(tallerId, payload)
        .pipe(takeUntil(this.destroy$)).subscribe({ next: () => done(`${cat.label} activado`), error: onError });
    }
  }

  recargar(): void {
    if (!this.currentUser) return;
    this.serviciosService.listarServiciosTaller(this.currentUser.taller_id)
      .pipe(takeUntil(this.destroy$)).subscribe();
  }

  // ── MODAL ────────────────────────────────────────────────────

  abrirModalCrear() {
    this.formCrear.reset({ disponible: true });
    this.selectedServicio = null;
    this.modalMode = 'crear';
  }

  abrirModalEditar(servicio: TallerServicio) {
    this.selectedServicio = servicio;
    this.formEditar.patchValue({ precio_personalizado: servicio.precio_personalizado ?? null, disponible: servicio.disponible });
    this.modalMode = 'editar';
  }

  cerrarModal() {
    this.modalMode = null;
    this.selectedServicio = null;
    this.formCrear.reset({ disponible: true });
    this.formEditar.reset({ disponible: true });
  }

  crearServicio() {
    if (!this.formCrear.valid || !this.currentUser) return;
    const datos = this.formCrear.value;
    const payload: TallerServicioDirectoCreateRequest = {
      nombre:      datos.nombre,
      descripcion: datos.descripcion || undefined,
      categoria:   datos.categoria,
      precio:      parseFloat(datos.precio),
      disponible:  datos.disponible,
    };
    this.serviciosService.crearServicioDirectoEnTaller(this.currentUser.taller_id, payload)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.cerrarModal(); this.mostrarToast('Servicio creado correctamente', 'ok'); },
        error: (err) => this.mostrarToast(err.message || 'Error creando servicio', 'err'),
      });
  }

  guardarEdicion() {
    if (!this.formEditar.valid || !this.currentUser || !this.selectedServicio) return;
    const datos = this.formEditar.value;
    const updateData: TallerServicioUpdateRequest = {
      precio_personalizado: datos.precio_personalizado ?? undefined,
      disponible: datos.disponible,
    };
    this.serviciosService.actualizarServicioTaller(
      this.currentUser.taller_id, this.selectedServicio.taller_servicio_id, updateData
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => { this.cerrarModal(); this.mostrarToast('Servicio actualizado correctamente', 'ok'); },
      error: (err) => this.mostrarToast(err.message || 'Error actualizando servicio', 'err'),
    });
  }

  removerServicio(servicio: TallerServicio) {
    if (!this.currentUser) return;
    if (confirm(`¿Remover "${servicio.nombre_servicio}" del taller?`)) {
      this.serviciosService.removerServicioDelTaller(this.currentUser.taller_id, servicio.taller_servicio_id)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this.mostrarToast('Servicio eliminado', 'ok'),
          error: (err) => this.mostrarToast(err.message || 'Error eliminando servicio', 'err'),
        });
    }
  }

  // ── TOAST ────────────────────────────────────────────────────

  mostrarToast(msg: string, type: 'ok' | 'err') {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; }, 4000);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }
}
