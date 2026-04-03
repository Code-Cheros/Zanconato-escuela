// app/api/reportes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function buildRangeFromParams(params: URLSearchParams): { inicio: Date; fin: Date; label: string } {
  const tipo = params.get('tipo') || 'diario'
  const hoy = new Date()

  if (tipo === 'diario') {
    const fecha = params.get('fecha') || hoy.toISOString().split('T')[0]
    const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0)
    const fin = new Date(fecha); fin.setHours(23, 59, 59, 999)
    return { inicio, fin, label: `Reporte Diario — ${fecha}` }
  }
  if (tipo === 'mensual') {
    const mes = parseInt(params.get('mes') || String(hoy.getMonth() + 1))
    const anio = parseInt(params.get('anio') || String(hoy.getFullYear()))
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59, 999)
    const nombreMes = inicio.toLocaleString('es-SV', { month: 'long' })
    return { inicio, fin, label: `Reporte Mensual — ${nombreMes} ${anio}` }
  }
  if (tipo === 'anual') {
    const anio = parseInt(params.get('anio') || String(hoy.getFullYear()))
    const inicio = new Date(anio, 0, 1)
    const fin = new Date(anio, 11, 31, 23, 59, 59, 999)
    return { inicio, fin, label: `Reporte Anual — ${anio}` }
  }
  // personalizado
  const desde = params.get('desde') || hoy.toISOString().split('T')[0]
  const hasta = params.get('hasta') || hoy.toISOString().split('T')[0]
  const inicio = new Date(desde); inicio.setHours(0, 0, 0, 0)
  const fin = new Date(hasta); fin.setHours(23, 59, 59, 999)
  return { inicio, fin, label: `Reporte Personalizado — ${desde} a ${hasta}` }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const { inicio, fin, label } = buildRangeFromParams(searchParams)

  const grado = searchParams.get('grado') || ''
  const seccion = searchParams.get('seccion') || ''
  const tipoPago = searchParams.get('tipoPago') || '' // MATRICULA|COLEGIATURA|ALIMENTACION|PAPELERIA|OTRO

  const pagos = await prisma.pago.findMany({
    where: {
      fecha: { gte: inicio, lte: fin },
      ...(tipoPago && { tipo: tipoPago as any }),
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

  const resumen: Record<string, number> = {
    MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0, OTRO: 0,
  }
  for (const p of pagos) {
    resumen[p.tipo as keyof typeof resumen] = (resumen[p.tipo] || 0) + p.monto
  }

  return NextResponse.json({
    label,
    pagos,
    resumen,
    total: Object.values(resumen).reduce((a, b) => a + b, 0),
    cantidad: pagos.length,
  })
}
