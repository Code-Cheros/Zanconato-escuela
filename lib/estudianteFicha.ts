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
