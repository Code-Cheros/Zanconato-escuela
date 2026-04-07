import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export const GRADOS = [
  'Parvularia 4', 'Parvularia 5', 'Parvularia 6',
  '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado',
  '7° Grado', '8° Grado', '9° Grado',
  '1° Bachillerato', '2° Bachillerato',
  '3° Bachillerato'
  
]

export const SECCIONES = ['A', 'B', 'C', 'D', 'E']

export const TURNOS = ['Matutino', 'Vespertino', 'Nocturno']

export const RELIGIONES_OPCIONES = [
  'Católica',
  'Evangélica',
  'Testigo de Jehová',
  'Mormón',
  'Judaísmo',
  'Islam',
  'Otra',
  'Sin especificar',
] as const

export const ESTADOS_CIVILES_OPCIONES = [
  'Soltero',
  'Casado',
  'Unión libre',
  'Divorciado',
  'Viudo',
] as const

export const DOCUMENTOS_MATRICULA = [
  'Ficha integral',
  'Fé de bautismo',
  'Certificado',
  'Partida de nacimiento',
  'Const. servicio social',
  'Fotografía',
  'Solvencia económica',
  'Const. conducta',
  'Matrícula oficial',
] as const

export const TIPO_PAGO_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula',
  PAPELERIA: 'Papelería',
  COLEGIATURA: 'Colegiatura',
  ALIMENTACION: 'Alimentación',
  OTRO: 'Otro',
}

export const ROL_LABELS: Record<string, string> = {
  COLECTOR: 'Colector',
  MATRICULA: 'Matrícula',
  ADMINISTRATIVO: 'Administrativo',
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('es-SV', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

export function formatReceiptFolio(date: Date | string, id: string): string {
  const year = new Date(date).getFullYear()
  const suffix = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-8).padStart(8, '0')
  return `REC-${year}-${suffix}`
}