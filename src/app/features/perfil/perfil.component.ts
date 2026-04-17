import { Component, OnInit, inject, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { timeout } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';
import { TallerService } from '../../core/services/taller.service';
import { TallerProfile, TallerProfileUpdate } from '../../core/models/auth.models';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.css']
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private tallerService = inject(TallerService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private ngZone = inject(NgZone);

  profile: TallerProfile | null = null;
  loading = true;
  saving = false;
  errorMsg = '';
  successMsg = '';
  editMode = false;

  form!: FormGroup;

  ngOnInit(): void {
    const user = this.authService.getAuthState().currentUser;
    if (!user?.taller_id) {
      this.router.navigate([environment.auth.routes.login]);
      return;
    }

    // Build partial profile and form immediately from cached login data — no spinner
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
      latitud: 0,
      longitud: 0,
      telefono_operativo: user.telefono_operativo || '',
      horario_inicio: user.horario_inicio || '',
      horario_fin: user.horario_fin || '',
      disponible: false,
      calificacion_promedio: 0,
    };
    this.buildForm(this.profile);
    this.loading = false;

    // Background load to enrich read-only fields (latitud, longitud, calificacion, etc.)
    this.tallerService.getProfile(user.taller_id)
      .pipe(timeout(30000))
      .subscribe({
        next: (data) => { this.profile = data; },
        error: () => { /* silently ignore — partial data is already shown */ }
      });
  }

  private buildForm(p: TallerProfile): void {
    this.form = this.fb.group({
      nombre_contacto: [p.nombre, [Validators.required, Validators.minLength(2)]],
      telefono: [p.telefono, [Validators.required, Validators.minLength(7)]],
      razon_social: [p.razon_social, [Validators.required, Validators.minLength(2)]],
      direccion: [p.direccion, [Validators.required]],
      telefono_operativo: [p.telefono_operativo, [Validators.required, Validators.minLength(7)]],
      horario_inicio: [p.horario_inicio, [Validators.required]],
      horario_fin: [p.horario_fin, [Validators.required]],
    });
  }

  toggleEdit(): void {
    this.editMode = !this.editMode;
    this.successMsg = '';
    this.errorMsg = '';
    if (!this.editMode && this.profile) {
      this.buildForm(this.profile);
    }
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

    // Actualizar UI localmente de inmediato (optimistic update)
    const oldProfile: TallerProfile | null = this.profile ? { ...this.profile } : null;
    if (this.profile) {
      if (payload.nombre_contacto) this.profile.nombre = payload.nombre_contacto;
      if (payload.telefono) this.profile.telefono = payload.telefono;
      if (payload.razon_social) this.profile.razon_social = payload.razon_social;
      if (payload.direccion) this.profile.direccion = payload.direccion;
      if (payload.telefono_operativo) this.profile.telefono_operativo = payload.telefono_operativo;
      if (payload.horario_inicio) this.profile.horario_inicio = payload.horario_inicio;
      if (payload.horario_fin) this.profile.horario_fin = payload.horario_fin;
    }
    console.log('[PERFIL] ✓ UI actualizada localmente');

    // Fallback visual: si tras 60s el botón sigue atascado, lo resetea desde dentro del NgZone
    const manualTimeout = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.saving) {
          this.saving = false;
          this.errorMsg = 'La solicitud tardó demasiado. Por favor, intenta de nuevo.';
          this.cdr.detectChanges();
        }
      });
    }, 60000);

    // Enviar al servidor
    console.log('[PERFIL] 📤 Enviando PUT al servidor...');
    this.tallerService.updateProfile(tallerId, payload).subscribe({
      next: (updated) => {
        clearTimeout(manualTimeout);
        console.log('[PERFIL] ✅ Respuesta recibida del servidor:', updated);
        
        // Actualizar con datos del servidor (por si hay cambios)
        this.profile = updated;
        this.saving = false;
        this.editMode = false;
        this.successMsg = 'Perfil actualizado correctamente.';
        this.cdr.detectChanges();
        console.log('[PERFIL] ✓ saving = false, editMode = false');

        // Actualizar auth state en background (no bloquea la UI)
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
        
        // Revertir cambios locales en caso de error
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
