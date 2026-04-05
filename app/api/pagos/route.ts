// app/api/pagos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hasMoraColegiatura } from '@/lib/mora'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const tipo = searchParams.get('tipo')
  const estudianteId = searchParams.get('estudianteId')
  const nombre = searchParams.get('nombre')
  const nie = searchParams.get('nie')
  const grado = searchParams.get('grado')
  const seccion = searchParams.get('seccion')
  const encargado = searchParams.get('encargado')
  const telefono = searchParams.get('telefono')
  const estado = searchParams.get('estado')
  const anioHeader = searchParams.get('anio')

  let fechaInicio: Date | undefined
  let fechaFin: Date | undefined

  if (desde && hasta) {
    fechaInicio = new Date(desde)
    fechaInicio.setHours(0, 0, 0, 0)
    fechaFin = new Date(hasta)
    fechaFin.setHours(23, 59, 59, 999)
  } else if (fecha) {
    fechaInicio = new Date(fecha)
    fechaInicio.setHours(0, 0, 0, 0)
    fechaFin = new Date(fecha)
    fechaFin.setHours(23, 59, 59, 999)
  }

  const anioActual = anioHeader ? parseInt(anioHeader) : new Date().getFullYear()

  const pagos = await prisma.pago.findMany({
    where: {
      ...(fechaInicio && fechaFin && { fecha: { gte: fechaInicio, lte: fechaFin } }),
      ...(tipo && { tipo: tipo as any }),
      ...(estudianteId && { estudianteId }),
      estudiante: {
        ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
        ...(nie && { nie: { contains: nie, mode: 'insensitive' } }),
        ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
        ...(seccion && { seccion: { contains: seccion, mode: 'insensitive' } }),
        ...(encargado && { encargado: { contains: encargado, mode: 'insensitive' } }),
        ...(telefono && { telefono: { contains: telefono, mode: 'insensitive' } }),
        ...(estado === 'AL_DIA' && {
          talonarios: {
            some: {
              anio: anioActual,
              comprobantes: {
                none: { tipo: 'COLEGIATURA', pagado: false },
                some: { tipo: 'COLEGIATURA' }
              }
            }
          }
        }),
        ...(estado === 'PENDIENTE' && {
          talonarios: {
            some: {
              anio: anioActual,
              comprobantes: {
                every: { tipo: 'COLEGIATURA', pagado: false },
                some: { tipo: 'COLEGIATURA' }
              }
            }
          }
        }),
        ...(estado === 'INCOMPLETO' && {
          talonarios: {
            some: {
              anio: anioActual,
              comprobantes: {
                some: { AND: [{ tipo: 'COLEGIATURA' }, { pagado: true }] }
              },
              AND: [
                {
                  comprobantes: {
                    some: { AND: [{ tipo: 'COLEGIATURA' }, { pagado: false }] }
                  }
                }
              ]
            }
          }
        }),
      }
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
    const sessionUser = session.user as any
    const {
      estudianteId,
      comprobanteId,
      notas,
      tipo,
      monto,
      tipoPersonalizado,
      cantidad,
    } = body

    if (!estudianteId || !tipo) {
      return NextResponse.json({ error: 'Datos requeridos faltantes' }, { status: 400 })
    }

    // Resolve a valid registrador id to satisfy FK constraints even with stale session tokens.
    const resolveRegistradorId = async (): Promise<string | null> => {
      const sessionUserId = String(sessionUser?.id || '').trim()
      const sessionEmail = String(sessionUser?.email || '').trim()

      if (sessionUserId) {
        const existsById = await prisma.usuario.findUnique({
          where: { id: sessionUserId },
          select: { id: true },
        })
        if (existsById) return existsById.id
      }

      if (sessionEmail) {
        const existsByEmail = await prisma.usuario.findUnique({
          where: { email: sessionEmail },
          select: { id: true },
        })
        if (existsByEmail) return existsByEmail.id
      }

      const fallbackUser = await prisma.usuario.findFirst({
        where: { activo: true },
        orderBy: { creadoEn: 'asc' },
        select: { id: true },
      })

      return fallbackUser?.id ?? null
    }

    const registradorId = await resolveRegistradorId()
    if (!registradorId) {
      return NextResponse.json({ error: 'No se encontró un usuario válido para registrar el pago' }, { status: 500 })
    }

    // Si se proporciona comprobanteId, realizamos la vinculación y marcamos como pagado.
    if (comprobanteId) {
      const comprobante = await prisma.comprobante.findUnique({
        where: { id: comprobanteId },
        include: { talonario: { select: { anio: true } } },
      })

      if (!comprobante) {
        return NextResponse.json({ error: 'Comprobante no encontrado' }, { status: 404 })
      }

      if (comprobante.pagado) {
        return NextResponse.json({ error: 'Este comprobante ya fue pagado' }, { status: 409 })
      }

      const config = await prisma.configuracionSistema.findUnique({ where: { id: 'global' } })
      
      const hasMora = hasMoraColegiatura({
        tipo: comprobante.tipo,
        mes: comprobante.mes,
        anio: comprobante.talonario?.anio,
        usarMora: config?.usarMora,
        montoMora: config?.montoMora,
        diaLimitePago: (config as any)?.diaLimitePago,
      })
      
      const montoFinal = comprobante.monto + (hasMora ? (config?.montoMora || 0) : 0)

      const pago = await prisma.$transaction(async (tx: any) => {
        const p = await tx.pago.create({
          data: {
            estudianteId,
            comprobanteId,
            monto: montoFinal,
            tipo: comprobante.tipo,
            registradoPor: registradorId,
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
    }

    // Pagos manuales: tipo existente o personalizado (OTRO) sin comprobante.
    if (!monto || Number(monto) <= 0) {
      return NextResponse.json({ error: 'Debe indicar un monto válido' }, { status: 400 })
    }

    if (tipo === 'OTRO' && !String(tipoPersonalizado || '').trim()) {
      return NextResponse.json({ error: 'Debe indicar el nombre del nuevo tipo de pago' }, { status: 400 })
    }

    let cantidadFinal: number | null = null

    if (tipo === 'OTRO') {
      cantidadFinal = Math.trunc(Number(cantidad ?? 1))

      if (!Number.isFinite(cantidadFinal) || cantidadFinal <= 0) {
        return NextResponse.json({ error: 'Debe indicar una cantidad válida' }, { status: 400 })
      }
    }

    const pago = await prisma.pago.create({
      data: {
        estudianteId,
        monto: Number(monto),
        tipo,
        tipoPersonalizado: tipo === 'OTRO' ? String(tipoPersonalizado).trim() : null,
        cantidad: cantidadFinal,
        registradoPor: registradorId,
        notas,
      } as any,
    })

    return NextResponse.json(pago, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
