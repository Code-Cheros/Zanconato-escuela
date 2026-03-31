// app/api/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha')
  const tipo = searchParams.get('tipo')
  const estudianteId = searchParams.get('estudianteId')

  let fechaInicio: Date | undefined
  let fechaFin: Date | undefined
  if (fecha) {
    fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)
    fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)
  }

  const pagos = await prisma.pago.findMany({
    where: {
      ...(fechaInicio && fechaFin && { fecha: { gte: fechaInicio, lte: fechaFin } }),
      ...(tipo && { tipo: tipo as any }),
      ...(estudianteId && { estudianteId }),
    },
    include: {
      estudiante: true,
      comprobante: true,
    },
    orderBy: { fecha: 'desc' },
  })

  return NextResponse.json(pagos)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'COLECTOR' && rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos para registrar pagos' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { estudianteId, comprobanteId, notas } = body

    if (!estudianteId || !comprobanteId) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    const comprobante = await prisma.comprobante.findUnique({
      where: { id: comprobanteId },
    })

    if (!comprobante) {
      return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
    }

    if (comprobante.pagado) {
      return NextResponse.json({ error: 'Comprobante ya fue pagado' }, { status: 409 })
    }

    const pago = await prisma.$transaction(async (tx) => {
      const p = await tx.pago.create({
        data: {
          estudianteId,
          comprobanteId,
          monto: comprobante.monto,
          tipo: comprobante.tipo,
          registradoPor: (session.user as any).id,
          notas,
        },
      })

      await tx.comprobante.update({
        where: { id: comprobanteId },
        data: { pagado: true, fechaPago: new Date() },
      })

      return p
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
