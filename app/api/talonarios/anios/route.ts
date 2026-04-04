// app/api/talonarios/anios/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const aniosResult = await prisma.talonario.findMany({
      distinct: ['anio'],
      select: { anio: true },
    })

    const anios = aniosResult.map(t => t.anio).sort((a, b) => b - a)
    
    // Al menos retornar el año actual si no hay registros
    const currentYear = new Date().getFullYear()
    if (!anios.includes(currentYear)) {
      anios.unshift(currentYear)
      anios.sort((a, b) => b - a)
    }

    return NextResponse.json(anios)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
