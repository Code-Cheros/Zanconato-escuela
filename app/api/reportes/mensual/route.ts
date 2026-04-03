// app/api/reportes/mensual/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const mes = parseInt(searchParams.get('mes') || String(new Date().getMonth() + 1))
  const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()))

  const inicio = new Date(anio, mes - 1, 1)
  const fin = new Date(anio, mes, 0, 23, 59, 59)

  const pagos = await prisma.pago.findMany({
    where: { fecha: { gte: inicio, lte: fin } },
    include: { estudiante: true, comprobante: true },
    orderBy: { fecha: 'asc' },
  })

  const resumen: Record<string, number> = { MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0, OTRO: 0 }
  for (const p of pagos) resumen[p.tipo] = (resumen[p.tipo] || 0) + p.monto

  return NextResponse.json({
    mes,
    anio,
    pagos,
    resumen,
    total: Object.values(resumen).reduce((a, b) => a + b, 0),
    cantidad: pagos.length,
  })
}
