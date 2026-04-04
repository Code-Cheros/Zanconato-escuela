// app/api/talonarios/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { MESES } from '@/lib/utils'

const prismaCompat = prisma as any

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const estudianteId = searchParams.get('estudianteId')
  const anioParam = searchParams.get('anio')
  const anio = anioParam || String(new Date().getFullYear())
  const nombre = searchParams.get('nombre')
  const nie = searchParams.get('nie')
  const grado = searchParams.get('grado')

  const talonarios = await prisma.talonario.findMany({
    where: {
      ...(estudianteId && { estudianteId }),
      ...(anio && anio !== 'all' && { anio: parseInt(anio) }),
      ...(nombre && {
        estudiante: {
          nombre: { contains: nombre, mode: 'insensitive' }
        }
      }),
      ...(nie && {
        estudiante: {
          nie: { contains: nie, mode: 'insensitive' }
        }
      }),
      ...(grado && {
        OR: [
          { grado: { contains: grado, mode: 'insensitive' } },
          { estudiante: { grado: { contains: grado, mode: 'insensitive' } } }
        ]
      }),
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
    const { 
      estudianteId, 
      anio, 
      montoMatricula, 
      montoColegiatura, 
      montoAlimentacion, 
      incluirAlimentacion,
      grado,
      seccion 
    } = body


    if (!estudianteId || !anio) {
      return NextResponse.json({ error: 'estudianteId y anio son requeridos' }, { status: 400 })
    }

    const student = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      select: { activo: true }
    })

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    if (!student.activo) {
      return NextResponse.json({ error: 'El estudiante está inactivo y no se le puede generar talonario' }, { status: 403 })
    }

    const existing = await prisma.talonario.findFirst({
      where: { estudianteId, anio: parseInt(anio) },
    })
    if (existing) {
      return NextResponse.json({ error: 'Ya existe talonario para ese año' }, { status: 409 })
    }

    const config = await prismaCompat.configuracionSistema.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        montoMatricula: 10,
        montoPapeleria: 15,
        montoMensualidad: 20,
        montoAlimentacion: 10,
        montoMora: 0,
        usarMora: false,
      },
    })

    const talonario = await prisma.$transaction(async (tx) => {
      // Actualizar grado/sección del estudiante si se proporcionan
      if (grado || seccion) {
        await tx.estudiante.update({
          where: { id: estudianteId },
          data: {
            ...(grado && { grado }),
            ...(seccion && { seccion }),
          },
        })
      }

      const t = await tx.talonario.create({
        data: { 
          estudianteId, 
          anio: parseInt(anio),
          grado,
          seccion
        },
      })


      const comprobantes = [
        ...MESES.map((mes, i) => ({
          tipo: 'COLEGIATURA',
          monto: montoColegiatura || config.montoMensualidad,
          mes,
          orden: 1 + i,
        })),
      ]

      await tx.comprobante.createMany({
        data: comprobantes.map((c) => ({
          talonarioId: t.id,
          estudianteId: estudianteId,
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
