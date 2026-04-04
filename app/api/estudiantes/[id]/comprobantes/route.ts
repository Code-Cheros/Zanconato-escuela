// app/api/estudiantes/[id]/comprobantes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { searchParams } = new URL(req.url)
  const anioFilter = searchParams.get('anio')

  try {
    const where: any = {
      estudianteId: id,
      tipo: { not: 'COLEGIATURA' },
      pagado: false,
    }

    if (anioFilter) {
      where.OR = [
        { talonarioId: null },
        {
          talonario: {
            anio: parseInt(anioFilter),
          }
        }
      ]
    }
    const comprobantes = await prisma.comprobante.findMany({
      where,
      include: {
        talonario: {
          select: { anio: true }
        }
      },
      orderBy: { orden: 'asc' },
    })

    return NextResponse.json(comprobantes)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
