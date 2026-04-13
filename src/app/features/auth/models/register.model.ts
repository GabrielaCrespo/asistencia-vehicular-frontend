/**
 * MODELO DE REGISTRO DE TALLER
 */

import { TallerRegisterRequest } from '../../../core/models/auth.models';

export interface RegisterFormModel {
  // Datos de contacto
  nombre_contacto: string;
  email: string;
  telefono: string;
  
  // Seguridad
  password: string;
  confirmPassword: string;
  
  // Identificación
  documento_identidad: string;
  
  // Datos del taller
  razon_social: string;
  direccion: string;
  latitud: number;
  longitud: number;
  telefono_operativo: string;
  
  // Horarios
  horario_inicio: string;
  horario_fin: string;
}

/**
 * Convierte el formulario en una solicitud al backend
 */
export function toRegisterRequest(form: RegisterFormModel): TallerRegisterRequest {
  return {
    nombre_contacto: form.nombre_contacto,
    email: form.email,
    telefono: form.telefono,
    password: form.password,
    documento_identidad: form.documento_identidad,
    razon_social: form.razon_social,
    direccion: form.direccion,
    latitud: form.latitud,
    longitud: form.longitud,
    telefono_operativo: form.telefono_operativo,
    horario_inicio: form.horario_inicio,
    horario_fin: form.horario_fin,
  };
}
