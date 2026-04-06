// app/api/estudiantes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COMPORTAMIENTOS_ALUMNO, VACUNAS_ALUMNO_BASE } from '@/lib/estudianteComportamiento'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const estudiante = await prisma.estudiante.findUnique({
    where: { id },
    include: {
      talonarios: {
        include: {
          comprobantes: { orderBy: { orden: 'asc' } },
        },
        orderBy: { anio: 'desc' },
      },
      comprobantes: {
        where: { tipo: { not: 'COLEGIATURA' } },
        include: { talonario: { select: { anio: true } } },
        orderBy: { orden: 'asc' },
      },
      pagos: { orderBy: { fecha: 'desc' } },
    },
  })

  if (!estudiante) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(estudiante)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'MATRICULA' && rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const { nombre, nie, grado, seccion, encargado, telefono, pasatiempos, comportamiento, vacunas, activo } = body

    if (nie && !/^\d{8}$/.test(nie)) {
      return NextResponse.json({ error: 'El NIE debe tener exactamente 8 dígitos numéricos' }, { status: 400 })
    }

    if (telefono && !/^\d{8}$/.test(telefono)) {
      return NextResponse.json({ error: 'El teléfono debe tener exactamente 8 dígitos numéricos' }, { status: 400 })
    }

    const comportamientosValidos = new Set<string>(COMPORTAMIENTOS_ALUMNO)
    const comportamientoLimpio = Array.isArray(comportamiento)
      ? Array.from(new Set(comportamiento.filter((item: unknown): item is string => (
          typeof item === 'string' && comportamientosValidos.has(item)
        ))))
      : []

    const pasatiemposLimpio = typeof pasatiempos === 'string' && pasatiempos.trim().length > 0
      ? pasatiempos.trim()
      : null

    const hasPasatiemposField = Object.prototype.hasOwnProperty.call(body, 'pasatiempos')

    const vacunasBaseSet = new Set<string>(VACUNAS_ALUMNO_BASE)
    const vacunasLimpias = Array.isArray(vacunas)
      ? Array.from(new Set(
          vacunas
            .filter((item: unknown): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0 && item.length <= 60)
            .map((item) => {
              const vacunaBase = Array.from(vacunasBaseSet).find((base) => base.toLowerCase() === item.toLowerCase())
              return vacunaBase || item
            })
        ))
      : []

    const estudiante = await prisma.estudiante.update({
      where: { id },
      data: { 
        nombre, 
        nie, 
        grado, 
        seccion, 
        encargado, 
        telefono,
        ...(hasPasatiemposField ? { pasatiempos: pasatiemposLimpio } : {}),
        comportamiento: comportamientoLimpio,
        vacunas: vacunasLimpias,
        activo: activo !== undefined ? Boolean(activo) : undefined
      },
    })

    return NextResponse.json(estudiante)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.estudiante.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
