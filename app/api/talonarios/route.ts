// app/api/talonarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MESES } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estudianteId = searchParams.get('estudianteId')
  const anio = searchParams.get('anio')

  const talonarios = await prisma.talonario.findMany({
    where: {
      ...(estudianteId && { estudianteId }),
      ...(anio && { anio: parseInt(anio) }),
    },
    include: {
      estudiante: true,
      comprobantes: { orderBy: { orden: 'asc' } },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return NextResponse.json(talonarios)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const body = await req.json()
    const { estudianteId, anio, montoMatricula, montoPapeleria, montoColegiatura, montoAlimentacion, incluirAlimentacion } = body

    if (!estudianteId || !anio) {
      return NextResponse.json({ error: 'estudianteId y anio son requeridos' }, { status: 400 })
    }

    const existing = await prisma.talonario.findFirst({
      where: { estudianteId, anio: parseInt(anio) },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe talonario para ese año' }, { status: 409 })
    }

    const talonario = await prisma.$transaction(async (tx) => {
      const t = await tx.talonario.create({
        data: { estudianteId, anio: parseInt(anio) },
      })

      const comprobantes = [
        { tipo: 'MATRICULA', monto: montoMatricula || 10.00, mes: null, orden: 1 },
        { tipo: 'PAPELERIA', monto: montoPapeleria || 15.00, mes: null, orden: 2 },
        ...MESES.map((mes, i) => ({
          tipo: 'COLEGIATURA',
          monto: montoColegiatura || 20.00,
          mes,
          orden: 3 + i,
        })),
        ...(incluirAlimentacion !== false
          ? MESES.map((mes, i) => ({
              tipo: 'ALIMENTACION',
              monto: montoAlimentacion || 10.00,
              mes,
              orden: 13 + i,
            }))
          : []),
      ]

      await tx.comprobante.createMany({
        data: comprobantes.map((c) => ({
          talonarioId: t.id,
          tipo: c.tipo as any,
          monto: c.monto,
          mes: c.mes || null,
          orden: c.orden,
          pagado: false,
        })),
      })

      return tx.talonario.findUnique({
        where: { id: t.id },
        include: { comprobantes: { orderBy: { orden: 'asc' } }, estudiante: true },
      })
    })

    return NextResponse.json(talonario, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
