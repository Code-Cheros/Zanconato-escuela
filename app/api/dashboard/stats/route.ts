// app/api/dashboard/stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const anio = searchParams.get('anio')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')

  const anioActual = anio ? parseInt(anio) : new Date().getFullYear()

  // Build date range for income stats
  let fechaDesde: Date
  let fechaHasta: Date

  if (desde && hasta) {
    fechaDesde = new Date(desde + 'T00:00:00')
    fechaHasta = new Date(hasta + 'T23:59:59')
  } else if (anio) {
    // Annual mode: full year
    fechaDesde = new Date(anioActual, 0, 1)
    fechaHasta = new Date(anioActual, 11, 31, 23, 59, 59)
  } else {
    // Default: current month
    const now = new Date()
    fechaDesde = new Date(now.getFullYear(), now.getMonth(), 1)
    fechaHasta = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  }

  const [
    totalEstudiantes,
    comprobantesEmitidos,
    pagosHoy,
    ingresosPeriodo,
  ] = await Promise.all([
    prisma.estudiante.count(),
    prisma.comprobante.count({ where: { pagado: true } }),
    prisma.pago.count({
      where: {
        fecha: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.pago.aggregate({
      _sum: { monto: true },
      where: {
        fecha: {
          gte: fechaDesde,
          lte: fechaHasta,
        },
      },
    }),
  ])

  const estudiantesAlDia = await prisma.estudiante.count({
    where: {
      talonarios: {
        some: {
          anio: anioActual,
          comprobantes: {
            every: {
              OR: [
                { pagado: true },
                { tipo: { not: 'COLEGIATURA' } },
              ],
            },
          },
        },
      },
    },
  })

  return NextResponse.json({
    totalEstudiantes,
    estudiantesAlDia,
    comprobantesEmitidos,
    pagosHoy,
    ingresosMes: ingresosPeriodo._sum.monto || 0,
  })
}
