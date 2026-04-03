// app/api/reportes/exportar/excel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import * as XLSX from 'xlsx'

function buildRange(params: URLSearchParams): { inicio: Date; fin: Date; label: string } {
  const tipo = params.get('tipo') || 'diario'
  const hoy = new Date()

  if (tipo === 'diario') {
    const fecha = params.get('fecha') || hoy.toISOString().split('T')[0]
    const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0)
    const fin = new Date(fecha); fin.setHours(23, 59, 59, 999)
    return { inicio, fin, label: fecha }
  }
  if (tipo === 'mensual') {
    const mes = parseInt(params.get('mes') || String(hoy.getMonth() + 1))
    const anio = parseInt(params.get('anio') || String(hoy.getFullYear()))
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59, 999)
    const nombreMes = inicio.toLocaleString('es-SV', { month: 'long' })
    return { inicio, fin, label: `${nombreMes}-${anio}` }
  }
  if (tipo === 'anual') {
    const anio = parseInt(params.get('anio') || String(hoy.getFullYear()))
    return { inicio: new Date(anio, 0, 1), fin: new Date(anio, 11, 31, 23, 59, 59, 999), label: String(anio) }
  }
  const desde = params.get('desde') || hoy.toISOString().split('T')[0]
  const hasta = params.get('hasta') || hoy.toISOString().split('T')[0]
  const inicio = new Date(desde); inicio.setHours(0, 0, 0, 0)
  const fin = new Date(hasta); fin.setHours(23, 59, 59, 999)
  return { inicio, fin, label: `${desde}_${hasta}` }
}

const TIPO_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula', PAPELERIA: 'Papelería',
  COLEGIATURA: 'Colegiatura', ALIMENTACION: 'Alimentación', OTRO: 'Otro',
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const { inicio, fin, label } = buildRange(searchParams)
  const grado = searchParams.get('grado') || ''
  const seccion = searchParams.get('seccion') || ''

  const pagos = await prisma.pago.findMany({
    where: {
      fecha: { gte: inicio, lte: fin },
      estudiante: {
        ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
        ...(seccion && { seccion: { contains: seccion, mode: 'insensitive' } }),
      },
    },
    include: {
      estudiante: { select: { nombre: true, nie: true, grado: true, seccion: true } },
      comprobante: { select: { mes: true } },
    },
    orderBy: { fecha: 'asc' },
  })

  const data = pagos.map((p, i) => ({
    '#': i + 1,
    Nombre: p.estudiante.nombre,
    NIE: p.estudiante.nie,
    Grado: p.estudiante.grado,
    Sección: p.estudiante.seccion,
    'Tipo de Pago': p.tipo === 'OTRO' ? (p.tipoPersonalizado || 'Otro') : (TIPO_LABELS[p.tipo] || p.tipo),
    Mes: p.comprobante?.mes || '—',
    Monto: p.monto,
    Fecha: new Date(p.fecha).toLocaleDateString('es-SV'),
    Hora: new Date(p.fecha).toLocaleTimeString('es-SV'),
    Notas: p.notas || '',
  }))

  const resumen: Record<string, number> = { MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0, OTRO: 0 }
  for (const p of pagos) resumen[p.tipo] = (resumen[p.tipo] || 0) + p.monto
  const total = Object.values(resumen).reduce((a, b) => a + b, 0)

  const wb = XLSX.utils.book_new()

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 15 }, { wch: 20 }, { wch: 10 },
    { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 25 },
  ]
  XLSX.utils.book_append_sheet(wb, ws, 'Pagos')

  const resumenData = [
    { Categoría: 'Matrícula', Total: resumen.MATRICULA },
    { Categoría: 'Papelería', Total: resumen.PAPELERIA },
    { Categoría: 'Colegiatura', Total: resumen.COLEGIATURA },
    { Categoría: 'Alimentación', Total: resumen.ALIMENTACION },
    { Categoría: 'Otro', Total: resumen.OTRO },
    { Categoría: 'TOTAL', Total: total },
  ]
  const wsResumen = XLSX.utils.json_to_sheet(resumenData)
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-${label}.xlsx"`,
    },
  })
}
