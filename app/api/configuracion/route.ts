import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const prismaCompat = prisma as any

async function getOrCreateConfig() {
  return prismaCompat.configuracionSistema.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      montoMatricula: 10,
      montoPapeleria: 15,
      montoMensualidad: 20,
      montoAlimentacion: 10,
      diaLimitePago: 26,
      montoMora: 0,
      usarMora: false,
    },
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const config = await getOrCreateConfig()
  return NextResponse.json(config)
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const currentUser = session.user as any

    const resolveUsuarioIdForHistorial = async (): Promise<string | null> => {
      const sessionUserId = String(currentUser?.id || '').trim()
      const sessionEmail = String(currentUser?.email || '').trim()

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

    const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl.trim() : ''
    const montoMatricula = Number(body.montoMatricula)
    const montoPapeleria = Number(body.montoPapeleria)
    const montoMensualidad = Number(body.montoMensualidad)
    const montoAlimentacion = Number(body.montoAlimentacion)
    const diaLimitePago = Number(body.diaLimitePago)
    const montoMora = body.montoMora === '' || body.montoMora === null || body.montoMora === undefined
      ? 0
      : Number(body.montoMora)
    const usarMora = Boolean(body.usarMora)

    if (!Number.isFinite(montoMatricula) || montoMatricula < 0) {
      return NextResponse.json({ error: 'Monto de matrícula inválido' }, { status: 400 })
    }
    if (!Number.isFinite(montoPapeleria) || montoPapeleria < 0) {
      return NextResponse.json({ error: 'Monto de papelería inválido' }, { status: 400 })
    }
    if (!Number.isFinite(montoMensualidad) || montoMensualidad < 0) {
      return NextResponse.json({ error: 'Monto de mensualidad inválido' }, { status: 400 })
    }
    if (!Number.isFinite(montoAlimentacion) || montoAlimentacion < 0) {
      return NextResponse.json({ error: 'Monto de alimentación inválido' }, { status: 400 })
    }
    if (!Number.isFinite(diaLimitePago) || diaLimitePago < 1 || diaLimitePago > 31) {
      return NextResponse.json({ error: 'Día límite de pago inválido (debe ser entre 1 y 31)' }, { status: 400 })
    }
    if (!Number.isFinite(montoMora) || montoMora < 0) {
      return NextResponse.json({ error: 'Monto de mora inválido' }, { status: 400 })
    }

    const oldConfig = await getOrCreateConfig()

    const config = await prismaCompat.configuracionSistema.upsert({
      where: { id: 'global' },
      update: {
        logoUrl: logoUrl || null,
        montoMatricula,
        montoPapeleria,
        montoMensualidad,
        montoAlimentacion,
        diaLimitePago: Math.trunc(diaLimitePago),
        montoMora,
        usarMora,
      },
      create: {
        id: 'global',
        logoUrl: logoUrl || null,
        montoMatricula,
        montoPapeleria,
        montoMensualidad,
        montoAlimentacion,
        diaLimitePago: Math.trunc(diaLimitePago),
        montoMora,
        usarMora,
      },
    })

    // Registrar cambios en el historial
    const fieldsToTrack = [
      { key: 'montoMatricula', label: 'Matrícula' },
      { key: 'montoPapeleria', label: 'Papelería' },
      { key: 'montoMensualidad', label: 'Mensualidad' },
      { key: 'montoAlimentacion', label: 'Alimentación' },
      { key: 'diaLimitePago', label: 'Día límite de pago mensualidad' },
      { key: 'montoMora', label: 'Mora' },
      { key: 'usarMora', label: 'Usar Mora' },
    ]

    const usuarioIdHistorial = await resolveUsuarioIdForHistorial()

    const changes = fieldsToTrack
      .filter((f) => oldConfig[f.key] !== config[f.key])
      .map((f) => ({
        usuarioId: usuarioIdHistorial,
        nombreUsuario: currentUser.nombre || currentUser.name || currentUser.email || 'Sistema',
        campo: f.label,
        valorAnterior: String(oldConfig[f.key] ?? ''),
        valorNuevo: String(config[f.key] ?? ''),
      }))

    if (changes.length > 0 && usuarioIdHistorial) {
      await (prisma as any).historialConfiguracion.createMany({
        data: changes,
      })
    }

    return NextResponse.json(config)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
