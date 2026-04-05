import { MESES } from '@/lib/utils'

export function normalizeDiaLimitePago(value: number | null | undefined): number {
  const parsed = Math.trunc(Number(value ?? 26))
  if (!Number.isFinite(parsed)) return 26
  return Math.min(31, Math.max(1, parsed))
}

type MoraInput = {
  tipo?: string | null
  mes?: string | null
  anio?: number | null
  usarMora?: boolean | null
  montoMora?: number | null
  diaLimitePago?: number | null
  now?: Date
}

export function hasMoraColegiatura(input: MoraInput): boolean {
  const {
    tipo,
    mes,
    anio,
    usarMora,
    montoMora,
    diaLimitePago,
    now = new Date(),
  } = input

  if (String(tipo || '').toUpperCase() !== 'COLEGIATURA') return false
  if (!usarMora || Number(montoMora ?? 0) <= 0) return false
  if (!mes) return false

  const monthIndex = MESES.findIndex(m => m.toUpperCase() === String(mes).toUpperCase())
  if (monthIndex < 0) return false

  const year = Number.isFinite(Number(anio)) ? Number(anio) : now.getFullYear()
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate()
  const dueDay = Math.min(normalizeDiaLimitePago(diaLimitePago), lastDayOfMonth)

  const dueDate = new Date(year, monthIndex, dueDay, 23, 59, 59, 999)
  return now.getTime() > dueDate.getTime()
}
