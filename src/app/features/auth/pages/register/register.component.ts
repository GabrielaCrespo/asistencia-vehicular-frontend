/**
 * PÁGINA REGISTRO - TALLER
 *
 * Componente standalone para registro de nuevos talleres.
 * - Formulario reactivo en 2 pasos con validación
 * - Manejo de errores con animaciones
 * - Integración con AuthService
 * - Diseño moderno glass-morphism
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../../core/auth/auth.service';
import { TallerRegisterRequest } from '../../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm!: FormGroup;
  currentStep = 1;
  totalSteps = 2;
  isLoading = false;
  showPassword = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(8)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      nombre_taller: ['', [Validators.required, Validators.minLength(2)]],
      ruc: ['', [Validators.required, Validators.minLength(5)]],
      direccion: ['', [Validators.required, Validators.minLength(5)]],
      telefono_operativo: ['', [Validators.required, Validators.minLength(8)]],
      horario_inicio: ['', Validators.required],
      horario_fin: ['', Validators.required],
      latitud: ['', Validators.required],
      longitud: ['', Validators.required]
    });
  }

  get step1Valid(): boolean {
    const fields = ['nombre', 'email', 'telefono', 'password'];
    return fields.every(f => this.registerForm.get(f)?.valid);
  }

  get step2Valid(): boolean {
    const fields = ['nombre_taller', 'ruc', 'direccion', 'telefono_operativo', 'horario_inicio', 'horario_fin', 'latitud', 'longitud'];
    return fields.every(f => this.registerForm.get(f)?.valid);
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
  }

  goToStep1(): void {
    this.currentStep = 1;
    this.clearMessages();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.registerForm.valid) {
      this.markAllTouched();
      return;
    }

    this.isLoading = true;
    this.clearMessages();

    const formData = this.registerForm.value;

    const payload: TallerRegisterRequest = {
      nombre_contacto: formData.nombre,
      email: formData.email,
      telefono: formData.telefono,
      password: formData.password,
      documento_identidad: formData.ruc,
      razon_social: formData.nombre_taller,
      direccion: formData.direccion,
      latitud: parseFloat(formData.latitud),
      longitud: parseFloat(formData.longitud),
      telefono_operativo: formData.telefono_operativo,
      horario_inicio: formData.horario_inicio,
      horario_fin: formData.horario_fin
    };

    this.authService.register(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.successMessage = 'Cuenta creada exitosamente. Redirigiendo al login...';
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 2500);
        },
        error: (error: any) => {
          this.isLoading = false;
          this.errorMessage = error?.error?.detail || error?.error?.message || 'Error al registrarse. Intenta de nuevo.';
        }
      });
  }

  private markAllTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key =>
      this.registerForm.get(key)?.markAsTouched()
    );
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Getters para acceso limpio en template
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
