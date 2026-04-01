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
  const anioActual = anio ? parseInt(anio) : new Date().getFullYear()
  const mesActual = new Date().getMonth()

  const [
    totalEstudiantes,
    totalComprobantes,
    comprobantesEmitidos,
    pagosHoy,
    ingresosMes,
  ] = await Promise.all([
    prisma.estudiante.count(),
    prisma.comprobante.count(),
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
          gte: new Date(new Date().getFullYear(), mesActual, 1),
          lte: new Date(new Date().getFullYear(), mesActual + 1, 0, 23, 59, 59),
        },
      },
    }),
  ])

  // Estudiantes al día: tienen todas sus colegiaturas del año seleccionado pagadas
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
    ingresosMes: ingresosMes._sum.monto || 0,
  })
}
