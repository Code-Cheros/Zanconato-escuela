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
