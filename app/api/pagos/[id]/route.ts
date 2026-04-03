// app/api/pagos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const pago = await prisma.pago.findUnique({
    where: { id },
    include: {
      estudiante: true,
      comprobante: { include: { talonario: true } },
    },
  })

  if (!pago) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  const registrador = await prisma.usuario.findUnique({
    where: { id: pago.registradoPor },
    select: { id: true, nombre: true, email: true, rol: true },
  })

  const prismaCompat = prisma as any
  const config = await prismaCompat.configuracionSistema.findUnique({
    where: { id: 'global' },
  })

  return NextResponse.json({
    ...pago,
    registrador,
    colegio: {
      nombre: 'Complejo Educativo Católico Zaconato',
      logoUrl: config?.logoUrl || null,
    },
  })
}
