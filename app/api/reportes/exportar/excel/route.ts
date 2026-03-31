// app/api/reportes/exportar/excel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

  const fechaInicio = new Date(fecha)
  fechaInicio.setHours(0, 0, 0, 0)
  const fechaFin = new Date(fecha)
  fechaFin.setHours(23, 59, 59, 999)

  const pagos = await prisma.pago.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    include: {
      estudiante: { select: { nombre: true, nie: true, grado: true, seccion: true } },
      comprobante: { select: { mes: true } },
    },
    orderBy: { fecha: 'asc' },
  })

  const TIPO_LABELS: Record<string, string> = {
    MATRICULA: 'Matrícula',
    PAPELERIA: 'Papelería',
    COLEGIATURA: 'Colegiatura',
    ALIMENTACION: 'Alimentación',
  }

  const data = pagos.map((p, i) => ({
    '#': i + 1,
    Nombre: p.estudiante.nombre,
    NIE: p.estudiante.nie,
    Grado: `${p.estudiante.grado} ${p.estudiante.seccion}`,
    'Tipo de Pago': TIPO_LABELS[p.tipo] || p.tipo,
    Mes: p.comprobante.mes || '—',
    Monto: p.monto,
    Hora: new Date(p.fecha).toLocaleTimeString('es-SV'),
    Notas: p.notas || '',
  }))

  // Resumen
  const resumen: Record<string, number> = { MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0 }
  for (const p of pagos) resumen[p.tipo] = (resumen[p.tipo] || 0) + p.monto
  const total = Object.values(resumen).reduce((a, b) => a + b, 0)

  const wb = XLSX.utils.book_new()

  // Hoja principal de pagos
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 15 },
    { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Pagos del Día')

  // Hoja de resumen
  const resumenData = [
    { Categoría: 'Matrícula', Total: resumen.MATRICULA },
    { Categoría: 'Papelería', Total: resumen.PAPELERIA },
    { Categoría: 'Colegiatura', Total: resumen.COLEGIATURA },
    { Categoría: 'Alimentación', Total: resumen.ALIMENTACION },
    { Categoría: 'TOTAL', Total: total },
  ]
  const wsResumen = XLSX.utils.json_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-${fecha}.xlsx"`,
    },
  })
}
