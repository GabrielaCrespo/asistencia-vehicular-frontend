/**
 * UTILIDADES DE VALIDACIÓN
 * 
 * Funciones reutilizables para validación de email, contraseñas, etc.
 * Se usan en los formularios reactivos
 */

import { AbstractControl, ValidationErrors, ValidatorFn, AsyncValidatorFn } from '@angular/forms';

export class ValidationUtils {

  /**
   * Valida el formato de email
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida que la contraseña cumpla con requisitos mínimos
   * - Al menos 8 caracteres
   * - Contiene número
   * - Contiene letra mayúscula
   * - Contiene letra minúscula
   */
  static isStrongPassword(password: string): boolean {
    const hasMinLength = password.length >= 8;
    const hasNumber = /[0-9]/.test(password);
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);

    return hasMinLength && hasNumber && hasUpperCase && hasLowerCase;
  }

  /**
   * Validador de Angular: verifica que la contraseña sea fuerte
   */
  static passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const password = control.value;
      const hasMinLength = password.length >= 8;
      const hasNumber = /[0-9]/.test(password);
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);

      const isStrong = hasMinLength && hasNumber && hasUpperCase && hasLowerCase;

      if (!isStrong) {
        return {
          weakPassword: {
            hasMinLength,
            hasNumber,
            hasUpperCase,
            hasLowerCase
          }
        };
      }

      return null;
    };
  }

  /**
   * Validador: verifica que dos campos sean iguales (ej: password y confirm password)
   */
  static matchPasswordValidator(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const password = control.get(passwordField);
      const confirmPassword = control.get(confirmPasswordField);

      if (!password || !confirmPassword) {
        return null;
      }

      if (password.value !== confirmPassword.value) {
        confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
        return { passwordMismatch: true };
      } else {
        // Limpiar el error si ahora coinciden
        if (confirmPassword.errors) {
          delete confirmPassword.errors['passwordMismatch'];
          if (Object.keys(confirmPassword.errors).length === 0) {
            confirmPassword.setErrors(null);
          }
        }
      }

      return null;
    };
  }

  /**
   * Validador: verifica que el email no esté en lista de dominios prohibidos
   */
  static allowedEmailDomainsValidator(allowedDomains: string[]): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const email = control.value.toLowerCase();
      const domain = email.split('@')[1];

      if (domain && !allowedDomains.includes(domain)) {
        return { forbiddenDomain: { domain } };
      }

      return null;
    };
  }

  /**
   * Validador: verifica que sea una URL válida
   */
  static urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      try {
        new URL(control.value);
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }
}
