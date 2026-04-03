// app/api/reportes/diario/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

  const resumen = {
    MATRICULA: 0,
    PAPELERIA: 0,
    COLEGIATURA: 0,
    ALIMENTACION: 0,
    OTRO: 0,
  }

  for (const pago of pagos) {
    resumen[pago.tipo as keyof typeof resumen] += pago.monto
  }

  const total = Object.values(resumen).reduce((a, b) => a + b, 0)

  return NextResponse.json({
    fecha,
    pagos,
    resumen,
    total,
    cantidad: pagos.length,
  })
}
