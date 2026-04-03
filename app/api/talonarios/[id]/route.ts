// app/api/talonarios/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const talonario = await prisma.talonario.findUnique({
    where: { id },
    include: {
      estudiante: true,
      comprobantes: {
        orderBy: { orden: 'asc' },
        include: { pago: true },
      },
    },
  })

  if (!talonario) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(talonario)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'MATRICULA' && rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos para eliminar talonarios' }, { status: 403 })
  }

  const { id } = await params

  const talonario = await prisma.talonario.findUnique({
    where: { id },
    include: {
      comprobantes: {
        select: { id: true, pagado: true },
      },
    },
  })

  if (!talonario) {
    return NextResponse.json({ error: 'Talonario no encontrado' }, { status: 404 })
  }

  const tienePagos = talonario.comprobantes.some((c) => c.pagado)
  if (tienePagos) {
    return NextResponse.json(
      { error: 'No se puede eliminar: el talonario tiene comprobantes ya pagados.' },
      { status: 409 }
    )
  }

  // Cascade delete: comprobantes se eliminan por onDelete: Cascade en el schema
  await prisma.talonario.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}
