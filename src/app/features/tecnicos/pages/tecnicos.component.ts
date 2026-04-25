import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { TecnicosService } from '../../../core/services/tecnicos.service';
import { ServiciosService } from '../../../core/services/servicios.service';
import { Tecnico, TecnicoCreateRequest, TecnicoUpdateRequest } from '../../../core/models/tecnicos.models';
import { TallerServicio } from '../../../core/models/servicios.models';
import { CurrentUser } from '../../../core/models/auth.models';

@Component({
  selector: 'app-tecnicos',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './tecnicos.component.html',
  styleUrls: ['./tecnicos.component.css']
})
export class TecnicosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private tecnicosService = inject(TecnicosService);
  private serviciosService = inject(ServiciosService);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  tecnicos$ = this.tecnicosService.getTecnicos$();
  loading$ = this.tecnicosService.isLoading$();
  error$ = this.tecnicosService.error$();

  stats$ = this.tecnicos$.pipe(
    map(tecnicos => ({
      total: tecnicos.length,
      disponibles: tecnicos.filter(t => t.disponible).length,
      noDisponibles: tecnicos.filter(t => !t.disponible).length,
    }))
  );

  currentUser: CurrentUser | null = null;
  showFormModal = false;
  isEditMode = false;
  selectedTecnico: Tecnico | null = null;

  serviciosTaller: TallerServicio[] = [];
  loadingServicios = false;
  especialidadSeleccionada = '';

  toastMsg = '';
  toastType: 'ok' | 'err' = 'ok';
  private toastTimer: any;

  formulario!: FormGroup;

  ngOnInit() {
    this.setupForm();
    this.loadUserAndTecnicos();
  }

  private setupForm() {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      disponible: [true]
    });
  }

  private cargarServiciosTaller() {
    if (!this.currentUser) return;
    this.loadingServicios = true;
    this.serviciosService.listarServiciosTaller(this.currentUser.taller_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (servicios) => {
          this.serviciosTaller = servicios;
          this.loadingServicios = false;
        },
        error: () => { this.loadingServicios = false; }
      });
  }

  seleccionarEspecialidad(nombre: string) {
    this.especialidadSeleccionada = this.especialidadSeleccionada === nombre ? '' : nombre;
  }

  isEspecialidadSelected(nombre: string): boolean {
    return this.especialidadSeleccionada === nombre;
  }

  especialidadesArray(especialidad: string | null | undefined): string[] {
    if (!especialidad) return [];
    return especialidad.split(',').map(s => s.trim()).filter(Boolean);
  }

  private loadUserAndTecnicos() {
    this.authService.auth$
      .pipe(takeUntil(this.destroy$))
      .subscribe(authState => {
        if (authState.currentUser) {
          this.currentUser = authState.currentUser;
          this.tecnicosService.listarTecnicos(authState.currentUser.taller_id)
            .pipe(takeUntil(this.destroy$))
            .subscribe();
          this.cargarServiciosTaller();
        }
      });
  }

  abrirModalCrear() {
    this.isEditMode = false;
    this.selectedTecnico = null;
    this.especialidadSeleccionada = '';
    this.formulario.reset({ disponible: true });
    this.showFormModal = true;
  }

  abrirModalEditar(tecnico: Tecnico) {
    this.isEditMode = true;
    this.selectedTecnico = tecnico;
    this.especialidadSeleccionada = tecnico.especialidad?.trim() ?? '';
    this.formulario.patchValue({ nombre: tecnico.nombre, disponible: tecnico.disponible });
    this.showFormModal = true;
  }

  cerrarModal() {
    this.showFormModal = false;
    this.especialidadSeleccionada = '';
    this.formulario.reset({ disponible: true });
    this.selectedTecnico = null;
  }

  guardarTecnico() {
    if (!this.formulario.valid || !this.currentUser) return;

    const datos = this.formulario.value;
    const especialidad = this.especialidadSeleccionada || undefined;

    if (this.isEditMode && this.selectedTecnico) {
      const updateData: TecnicoUpdateRequest = { nombre: datos.nombre, especialidad, disponible: datos.disponible };
      this.tecnicosService.actualizarTecnico(
        this.currentUser.taller_id, this.selectedTecnico.tecnico_id, updateData
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => { this.cerrarModal(); this.mostrarToast('Técnico actualizado correctamente', 'ok'); },
        error: (err) => this.mostrarToast(err.message || 'Error actualizando técnico', 'err')
      });
    } else {
      const createData: TecnicoCreateRequest = { nombre: datos.nombre, especialidad };
      this.tecnicosService.crearTecnico(this.currentUser.taller_id, createData)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: () => { this.cerrarModal(); this.mostrarToast('Técnico creado correctamente', 'ok'); },
          error: (err) => this.mostrarToast(err.message || 'Error creando técnico', 'err')
        });
    }
  }

  toggleDisponible(tecnico: Tecnico) {
    if (!this.currentUser) return;
    this.tecnicosService.actualizarTecnico(
      this.currentUser.taller_id,
      tecnico.tecnico_id,
      { disponible: !tecnico.disponible }
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => this.mostrarToast(`${tecnico.nombre} marcado como ${!tecnico.disponible ? 'disponible' : 'no disponible'}`, 'ok'),
      error: (err) => this.mostrarToast(err.message || 'Error actualizando disponibilidad', 'err')
    });
  }

  abrirUbicacion(tecnico: Tecnico) {
    if (tecnico.latitud_actual != null && tecnico.longitud_actual != null) {
      window.open(`https://www.google.com/maps?q=${tecnico.latitud_actual},${tecnico.longitud_actual}`, '_blank');
    }
  }

  eliminarTecnico(tecnico: Tecnico) {
    if (!this.currentUser) return;
    if (confirm(`¿Eliminar técnico "${tecnico.nombre}"?`)) {
      this.tecnicosService.eliminarTecnico(this.currentUser.taller_id, tecnico.tecnico_id)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this.mostrarToast('Técnico eliminado', 'ok'),
          error: (err) => this.mostrarToast(err.message || 'Error eliminando técnico', 'err')
        });
    }
  }

  mostrarToast(msg: string, type: 'ok' | 'err') {
    clearTimeout(this.toastTimer);
    this.toastMsg = msg;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMsg = ''; }, 4500);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    clearTimeout(this.toastTimer);
  }
}
