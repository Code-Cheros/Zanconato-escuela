export const RELIGIONES = ['Católica', 'Evangélica', 'Otra', 'Sin religión'] as const

export type Religion = (typeof RELIGIONES)[number]

export const ESTADOS_CIVILES = ['Soltero', 'Casado', 'Unión libre', 'Divorciado', 'Viudo'] as const

export type EstadoCivil = (typeof ESTADOS_CIVILES)[number]

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

export type DocumentoMatricula = (typeof DOCUMENTOS_MATRICULA)[number]

export function inferNombrePartsFromCompleto(nombreCompleto: string): {
  nombres: string
  primerApellido: string
  segundoApellido: string
} {
  const t = nombreCompleto.trim()
  if (!t) return { nombres: '', primerApellido: '', segundoApellido: '' }
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { nombres: parts[0], primerApellido: '', segundoApellido: '' }
  if (parts.length === 2) return { nombres: parts[0], primerApellido: parts[1], segundoApellido: '' }
  return {
    nombres: parts.slice(0, -2).join(' '),
    primerApellido: parts[parts.length - 2]!,
    segundoApellido: parts[parts.length - 1]!,
  }
}

export function formatDateForInput(value: string | Date | null | undefined): string {
  if (value == null) return ''
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
