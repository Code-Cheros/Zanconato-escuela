// app/api/estudiantes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MESES } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const nombre = searchParams.get('nombre')
  const nie = searchParams.get('nie')
  const grado = searchParams.get('grado')

  const estudiantes = await prisma.estudiante.findMany({
    where: {
      ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
      ...(nie && { nie: { contains: nie, mode: 'insensitive' } }),
      ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
    },
    include: {
      pagos: { orderBy: { fecha: 'desc' }, take: 1 },
      talonarios: {
        include: {
          comprobantes: true,
        },
        orderBy: { anio: 'desc' },
        take: 1,
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(estudiantes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'MATRICULA' && rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { nombre, nie, grado, seccion, encargado, telefono } = body

    if (!nombre || !nie || !grado || !seccion) {
      return NextResponse.json({ error: 'Campos requeridos faltantes' }, { status: 400 })
    }

    if (!/^\d{8}$/.test(nie)) {
      return NextResponse.json({ error: 'El NIE debe tener exactamente 8 dígitos numéricos' }, { status: 400 })
    }

    if (telefono && !/^\d{8}$/.test(telefono)) {
      return NextResponse.json({ error: 'El teléfono debe tener exactamente 8 dígitos numéricos' }, { status: 400 })
    }

    const existing = await prisma.estudiante.findUnique({ where: { nie } })
    if (existing) {
      return NextResponse.json({ error: 'NIE ya registrado' }, { status: 409 })
    }

    const anioActual = new Date().getFullYear()
    const emailTemp = `estudiante.${nie.toLowerCase()}@zaconato.edu.sv`
    const passwordTemp = await bcrypt.hash(`${nie}${anioActual}`, 10)

    const resultado = await prisma.$transaction(async (tx) => {
      const usuario = await tx.usuario.create({
        data: {
          nombre,
          email: emailTemp,
          password: passwordTemp,
          rol: 'MATRICULA',
          activo: true,
        },
      })

      const estudiante = await tx.estudiante.create({
        data: {
          nombre,
          nie,
          grado,
          seccion,
          encargado,
          telefono,
          usuarioId: usuario.id,
        },
      })

      // Crear talonario automático
      const talonario = await tx.talonario.create({
        data: {
          estudianteId: estudiante.id,
          anio: anioActual,
        },
      })

      // Comprobantes en orden fijo
      const comprobantes = [
        { tipo: 'MATRICULA', monto: 10.00, mes: null, orden: 1 },
        { tipo: 'PAPELERIA', monto: 15.00, mes: null, orden: 2 },
        ...MESES.map((mes, i) => ({
          tipo: 'COLEGIATURA',
          monto: 20.00,
          mes,
          orden: 3 + i,
        })),
        ...MESES.map((mes, i) => ({
          tipo: 'ALIMENTACION',
          monto: 10.00,
          mes,
          orden: 13 + i,
        })),
      ]

      await tx.comprobante.createMany({
        data: comprobantes.map((c) => ({
          talonarioId: talonario.id,
          tipo: c.tipo as any,
          monto: c.monto,
          mes: c.mes,
          orden: c.orden,
          pagado: false,
        })),
      })

      return { estudiante, usuario, talonario }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
