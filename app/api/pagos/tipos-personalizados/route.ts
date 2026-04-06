// app/api/pagos/tipos-personalizados/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const tipos = await prisma.pago.findMany({
      where: {
        tipo: 'OTRO',
        tipoPersonalizado: { not: null }
      },
      select: {
        tipoPersonalizado: true
      },
      distinct: ['tipoPersonalizado']
    })

    const result = tipos
      .map(t => t.tipoPersonalizado?.trim() || '')
      .filter(Boolean)
      .sort()

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
