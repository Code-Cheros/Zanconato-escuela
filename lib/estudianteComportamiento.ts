export const COMPORTAMIENTOS_ALUMNO = [
  'Inquieto',
  'Timido',
  'Cooperador',
  'Creativo',
  'Responsable',
  'Lider',
  'Respetuoso',
] as const

export type ComportamientoAlumno = typeof COMPORTAMIENTOS_ALUMNO[number]

export const VACUNAS_ALUMNO_BASE = [
  'Antipolio',
  'DPT',
  'BCG',
  'Antisarampion',
  'Toxi tetanixo',
] as const
