import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre',
]

export const GRADOS = [
  'Parvularia 4', 'Parvularia 5', 'Parvularia 6',
  '1° Grado', '2° Grado', '3° Grado', '4° Grado', '5° Grado', '6° Grado',
  '7° Grado', '8° Grado', '9° Grado',
  '1° Bachillerato', '2° Bachillerato',
]

export const SECCIONES = ['A', 'B', 'C', 'D', 'E']

export const TIPO_PAGO_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula',
  PAPELERIA: 'Papelería',
  COLEGIATURA: 'Colegiatura',
  ALIMENTACION: 'Alimentación',
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