// app/api/reportes/exportar/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const prismaCompat = prisma as any

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const fecha = searchParams.get('fecha') || new Date().toISOString().split('T')[0]

  const fechaInicio = new Date(fecha)
  fechaInicio.setHours(0, 0, 0, 0)
  const fechaFin = new Date(fecha)
  fechaFin.setHours(23, 59, 59, 999)

  const pagos = await prisma.pago.findMany({
    where: { fecha: { gte: fechaInicio, lte: fechaFin } },
    include: {
      estudiante: { select: { nombre: true, nie: true, grado: true, seccion: true } },
      comprobante: { select: { mes: true } },
    },
    orderBy: { fecha: 'asc' },
  })

  const config = await prismaCompat.configuracionSistema.upsert({
    where: { id: 'global' },
    update: {},
    create: {
      id: 'global',
      montoMatricula: 10,
      montoMensualidad: 20,
      montoMora: 0,
      usarMora: false,
    },
  })

  const resumen: Record<string, number> = { MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0 }
  for (const p of pagos) resumen[p.tipo] = (resumen[p.tipo] || 0) + p.monto
  const total = Object.values(resumen).reduce((a, b) => a + b, 0)

  const TIPO_LABELS: Record<string, string> = {
    MATRICULA: 'Matrícula', PAPELERIA: 'Papelería',
    COLEGIATURA: 'Colegiatura', ALIMENTACION: 'Alimentación',
  }

  const formatUSD = (n: number) => `$${n.toFixed(2)}`

  const tableRows = pagos.map((p, i) =>
    `<tr>
      <td>${i + 1}</td>
      <td>${p.estudiante.nombre}</td>
      <td>${p.estudiante.nie}</td>
      <td>${p.estudiante.grado} ${p.estudiante.seccion}</td>
      <td>${TIPO_LABELS[p.tipo]}</td>
      <td>${p.comprobante.mes || '—'}</td>
      <td style="text-align:right">${formatUSD(p.monto)}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Diario - ${fecha}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #1a202c; font-size: 12px; }
    .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; color: #1e40af; margin: 0 0 4px; }
    .header h2 { font-size: 14px; font-weight: normal; margin: 0; color: #4a5568; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 11px; color: #4a5568; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #1e40af; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
    td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f7fafc; }
    .summary { display: flex; gap: 16px; margin-top: 16px; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px 16px; flex: 1; }
    .summary-card.colegiatura { border-left: 4px solid #3182ce; }
    .summary-card.alimentacion { border-left: 4px solid #38a169; }
    .summary-card.matricula { border-left: 4px solid #d69e2e; }
    .summary-card.papeleria { border-left: 4px solid #805ad5; }
    .summary-card h3 { margin: 0 0 4px; font-size: 11px; color: #718096; }
    .summary-card p { margin: 0; font-size: 18px; font-weight: bold; }
    .total-row { background: #ebf8ff !important; font-weight: bold; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #718096; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" style="height:56px;object-fit:contain;margin-bottom:10px;" />` : ''}
    <h1>Complejo Educativo Católico Zaconato</h1>
    <h2>Reporte Diario de Ingresos</h2>
  </div>
  <div class="meta">
    <span><strong>Fecha:</strong> ${new Date(fecha).toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
    <span><strong>Total de pagos:</strong> ${pagos.length}</span>
    <span><strong>Generado:</strong> ${new Date().toLocaleString('es-SV')}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Nombre del Estudiante</th><th>NIE</th>
        <th>Grado/Sección</th><th>Tipo de Pago</th><th>Mes</th><th>Monto</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td colspan="6" style="text-align:right;padding:8px"><strong>TOTAL DEL DÍA</strong></td>
        <td style="text-align:right;padding:8px"><strong>${formatUSD(total)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-card colegiatura">
      <h3>💰 Colegiatura</h3>
      <p>${formatUSD(resumen.COLEGIATURA)}</p>
    </div>
    <div class="summary-card alimentacion">
      <h3>🍽️ Alimentación</h3>
      <p>${formatUSD(resumen.ALIMENTACION)}</p>
    </div>
    <div class="summary-card matricula">
      <h3>📋 Matrícula</h3>
      <p>${formatUSD(resumen.MATRICULA)}</p>
    </div>
    <div class="summary-card papeleria">
      <h3>📦 Papelería</h3>
      <p>${formatUSD(resumen.PAPELERIA)}</p>
    </div>
  </div>

  <div class="footer">
    <span>Complejo Educativo Católico Zaconato — Sistema de Gestión Escolar</span>
    <span>Documento generado automáticamente</span>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte-${fecha}.html"`,
    },
  })
}
