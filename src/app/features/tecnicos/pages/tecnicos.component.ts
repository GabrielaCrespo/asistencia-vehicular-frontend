import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/auth/auth.service';
import { TecnicosService } from '../../../core/services/tecnicos.service';
import { Tecnico, TecnicoCreateRequest, TecnicoUpdateRequest } from '../../../core/models/tecnicos.models';
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

  formulario!: FormGroup;

  ngOnInit() {
    this.setupForm();
    this.loadUserAndTecnicos();
  }

  private setupForm() {
    this.formulario = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3)]],
      especialidad: [''],
      disponible: [true]
    });
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
        }
      });
  }

  abrirModalCrear() {
    this.isEditMode = false;
    this.selectedTecnico = null;
    this.formulario.reset({ disponible: true });
    this.showFormModal = true;
  }

  abrirModalEditar(tecnico: Tecnico) {
    this.isEditMode = true;
    this.selectedTecnico = tecnico;
    this.formulario.patchValue({
      nombre: tecnico.nombre,
      especialidad: tecnico.especialidad,
      disponible: tecnico.disponible
    });
    this.showFormModal = true;
  }

  cerrarModal() {
    this.showFormModal = false;
    this.formulario.reset({ disponible: true });
    this.selectedTecnico = null;
  }

  guardarTecnico() {
    if (!this.formulario.valid || !this.currentUser) return;

    const datos = this.formulario.value;

    if (this.isEditMode && this.selectedTecnico) {
      const updateData: TecnicoUpdateRequest = {
        nombre: datos.nombre,
        especialidad: datos.especialidad,
        disponible: datos.disponible
      };
      this.tecnicosService.actualizarTecnico(
        this.currentUser.taller_id,
        this.selectedTecnico.tecnico_id,
        updateData
      ).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => this.cerrarModal(),
        error: (err) => console.error('Error actualizando técnico:', err)
      });
    } else {
      const createData: TecnicoCreateRequest = {
        nombre: datos.nombre,
        especialidad: datos.especialidad
      };
      this.tecnicosService.crearTecnico(this.currentUser.taller_id, createData)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: () => this.cerrarModal(),
          error: (err) => console.error('Error creando técnico:', err)
        });
    }
  }

  eliminarTecnico(tecnico: Tecnico) {
    if (!this.currentUser) return;
    if (confirm(`¿Eliminar técnico "${tecnico.nombre}"?`)) {
      this.tecnicosService.eliminarTecnico(this.currentUser.taller_id, tecnico.tecnico_id)
        .pipe(takeUntil(this.destroy$)).subscribe({
          error: (err) => console.error('Error eliminando técnico:', err)
        });
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
