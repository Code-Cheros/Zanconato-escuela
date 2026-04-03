// app/api/reportes/pendientes/route.ts
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
  const anio = parseInt(searchParams.get('anio') || String(new Date().getFullYear()))
  const grado = searchParams.get('grado') || ''
  const seccion = searchParams.get('seccion') || ''
  const tipoPago = searchParams.get('tipoPago') || '' // MATRICULA|COLEGIATURA|ALIMENTACION|PAPELERIA

  const comprobantes = await prisma.comprobante.findMany({
    where: {
      pagado: false,
      ...(tipoPago && { tipo: tipoPago as any }),
      talonario: {
        anio,
        estudiante: {
          activo: true,
          ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
          ...(seccion && { seccion: { contains: seccion, mode: 'insensitive' } }),
        },
      },
    },
    include: {
      talonario: {
        include: {
          estudiante: {
            select: { id: true, nombre: true, nie: true, grado: true, seccion: true, encargado: true, telefono: true },
          },
        },
      },
    },
    orderBy: [
      { talonario: { estudiante: { nombre: 'asc' } } },
      { orden: 'asc' },
    ],
  })

  // Resumen por tipo
  const resumen: Record<string, number> = {
    MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0,
  }
  for (const c of comprobantes) {
    resumen[c.tipo as keyof typeof resumen] = (resumen[c.tipo] || 0) + 1
  }

  // Agrupar por estudiante
  const porEstudiante: Record<string, { estudiante: any; comprobantes: any[] }> = {}
  for (const c of comprobantes) {
    const est = c.talonario.estudiante
    if (!porEstudiante[est.id]) {
      porEstudiante[est.id] = { estudiante: est, comprobantes: [] }
    }
    porEstudiante[est.id].comprobantes.push({
      id: c.id,
      tipo: c.tipo,
      mes: c.mes,
      monto: c.monto,
      orden: c.orden,
    })
  }

  const montoTotal = comprobantes.reduce((s, c) => s + c.monto, 0)

  return NextResponse.json({
    anio,
    comprobantes,
    porEstudiante: Object.values(porEstudiante),
    resumen,
    totalComprobantes: comprobantes.length,
    totalEstudiantes: Object.keys(porEstudiante).length,
    montoTotal,
  })
}
