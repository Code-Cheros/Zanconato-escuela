// app/api/reportes/exportar/pendientes-excel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

const TIPO_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula', PAPELERIA: 'Papelería',
  COLEGIATURA: 'Colegiatura', ALIMENTACION: 'Alimentación',
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()))
  const grado = searchParams.get('grado') || ''
  const seccion = searchParams.get('seccion') || ''
  const tipoPago = searchParams.get('tipoPago') || ''

  const comprobantes = await prisma.comprobante.findMany({
    where: {
      pagado: false,
      ...(tipoPago && { tipo: tipoPago as any }),
      talonario: {
        anio,
        estudiante: {
          activo: true,
          ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
          ...(seccion && { seccion: { contains: seccion, mode: 'insensitive' } }),
        },
      },
    },
    include: {
      talonario: {
        include: {
          estudiante: {
            select: { nombre: true, nie: true, grado: true, seccion: true, encargado: true, telefono: true },
          },
        },
      },
    },
    orderBy: [
      { talonario: { estudiante: { nombre: 'asc' } } },
      { orden: 'asc' },
    ],
  })

  const data = comprobantes.map((c, i) => ({
    '#': i + 1,
    Nombre: c.talonario.estudiante.nombre,
    NIE: c.talonario.estudiante.nie,
    Grado: c.talonario.estudiante.grado,
    Sección: c.talonario.estudiante.seccion,
    Encargado: c.talonario.estudiante.encargado || '—',
    Teléfono: c.talonario.estudiante.telefono || '—',
    'Tipo Pendiente': TIPO_LABELS[c.tipo] || c.tipo,
    Mes: c.mes || '—',
    'Monto Pendiente': c.monto,
    'Año Escolar': anio,
  }))

  const resumen: Record<string, number> = { MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0 }
  for (const c of comprobantes) resumen[c.tipo] = (resumen[c.tipo] || 0) + 1
  const montoTotal = comprobantes.reduce((s, c) => s + c.monto, 0)

  const resumenData = [
    { Categoría: 'Matrícula', 'Pendientes': resumen.MATRICULA },
    { Categoría: 'Papelería', 'Pendientes': resumen.PAPELERIA },
    { Categoría: 'Colegiatura', 'Pendientes': resumen.COLEGIATURA },
    { Categoría: 'Alimentación', 'Pendientes': resumen.ALIMENTACION },
    { Categoría: 'TOTAL MONTO PENDIENTE', 'Pendientes': montoTotal },
  ]

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
    { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 10 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Pendientes')

  const wsResumen = XLSX.utils.json_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const label = `pendientes-${anio}${grado ? `-${grado}` : ''}${seccion ? `-${seccion}` : ''}`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-${label}.xlsx"`,
    },
  })
}
