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

  currentUser: CurrentUser | null = null;
  modalMode: ModalMode | null = null;
  selectedServicio: TallerServicio | null = null;

  formCrear!: FormGroup;  // nuevo servicio directo en el taller
  formEditar!: FormGroup; // editar precio/disponibilidad

  ngOnInit() {
    this.setupForms();
    this.loadUserAndServicios();
  }

  private setupForms() {
    this.formCrear = this.fb.group({
      nombre:      ['', [Validators.required, Validators.minLength(3)]],
      descripcion: [''],
      categoria:   [''],
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
  }

  abrirModalCrear() {
    this.formCrear.reset({ disponible: true });
    this.selectedServicio = null;
    this.modalMode = 'crear';
  }

  abrirModalEditar(servicio: TallerServicio) {
    this.selectedServicio = servicio;
    this.formEditar.patchValue({
      precio_personalizado: servicio.precio_personalizado ?? null,
      disponible: servicio.disponible,
    });
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
      categoria:   datos.categoria   || undefined,
      precio:      parseFloat(datos.precio),
      disponible:  datos.disponible,
    };
    this.serviciosService.crearServicioDirectoEnTaller(this.currentUser.taller_id, payload)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.cerrarModal(),
        error: (err) => console.error('Error creando servicio:', err),
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
      this.currentUser.taller_id,
      this.selectedServicio.taller_servicio_id,
      updateData
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.cerrarModal(),
      error: (err) => console.error('Error actualizando servicio:', err),
    });
  }

  removerServicio(servicio: TallerServicio) {
    if (!this.currentUser) return;
    if (confirm(`¿Remover "${servicio.nombre_servicio}" del taller?`)) {
      this.serviciosService.removerServicioDelTaller(
        this.currentUser.taller_id,
        servicio.taller_servicio_id
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {},
        error: (err) => console.error('Error removiendo servicio:', err),
      });
    }
  }

  getPrecio(servicio: TallerServicio): number {
    return servicio.precio_personalizado ?? servicio.precio_base;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
