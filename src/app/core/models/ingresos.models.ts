export interface PagoIngreso {
  pago_id: number;
  incidente_id: number;
  asignacion_id: number | null;
  monto_total: number;
  monto_servicio: number;
  comision_plataforma: number;
  monto_taller: number;
  metodo_pago: string | null;
  estado: string;
  estado_comision: string;
  fecha_pago: string | null;
  fecha_pago_comision: string | null;
  observaciones: string | null;
  creado_en: string;
  cliente_nombre: string | null;
  descripcion_incidente: string | null;
  tipo_problema: string | null;
}

export interface ResumenIngresos {
  total_ingresos: number;
  total_bruto: number;
  total_comision_pendiente: number;
  total_comision_pagada: number;
  cantidad_servicios: number;
  cantidad_comisiones_pendientes: number;
}

export interface IngresosState {
  ingresos: PagoIngreso[];
  comisiones: PagoIngreso[];
  resumen: ResumenIngresos | null;
  loading: boolean;
  error: string | null;
}
