// app/api/reportes/exportar/pendientes-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const TIPO_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula', PAPELERIA: 'Papelería',
  COLEGIATURA: 'Colegiatura', ALIMENTACION: 'Alimentación',
}

const prismaCompat = prisma as any

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
  const tipoPago = searchParams.get('tipoPago') || ''

  const [comprobantes, config] = await Promise.all([
    prisma.comprobante.findMany({
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
              select: { nombre: true, nie: true, grado: true, seccion: true, encargado: true },
            },
          },
        },
      },
      orderBy: [
        { talonario: { estudiante: { nombre: 'asc' } } },
        { orden: 'asc' },
      ],
    }),
    prismaCompat.configuracionSistema.upsert({
      where: { id: 'global' },
      update: {},
      create: { id: 'global', montoMatricula: 10, montoMensualidad: 20, montoMora: 0, usarMora: false },
    }),
  ])

  const formatUSD = (n: number) => `$${n.toFixed(2)}`
  const montoTotal = comprobantes.reduce((s, c) => s + c.monto, 0)
  const resumen: Record<string, number> = { MATRICULA: 0, PAPELERIA: 0, COLEGIATURA: 0, ALIMENTACION: 0 }
  for (const c of comprobantes) resumen[c.tipo] = (resumen[c.tipo] || 0) + 1

  const filtros = [
    tipoPago ? `Tipo: ${TIPO_LABELS[tipoPago] || tipoPago}` : null,
    grado ? `Grado: ${grado}` : null,
    seccion ? `Sección: ${seccion}` : null,
  ].filter(Boolean).join(' · ')

  const tableRows = comprobantes.map((c, i) =>
    `<tr>
      <td>${i + 1}</td>
      <td>${c.talonario.estudiante.nombre}</td>
      <td>${c.talonario.estudiante.nie}</td>
      <td>${c.talonario.estudiante.grado} ${c.talonario.estudiante.seccion}</td>
      <td>${c.talonario.estudiante.encargado || '—'}</td>
      <td>${TIPO_LABELS[c.tipo] || c.tipo}</td>
      <td>${c.mes || '—'}</td>
      <td style="text-align:right;color:#c53030">${formatUSD(c.monto)}</td>
    </tr>`
  ).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Pendientes ${anio}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #1a202c; font-size: 12px; }
    .header { text-align: center; border-bottom: 3px solid #c53030; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 20px; color: #c53030; margin: 0 0 4px; }
    .header h2 { font-size: 14px; font-weight: normal; margin: 0; color: #4a5568; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; color: #4a5568; flex-wrap: wrap; gap: 4px; }
    .filtros { margin-bottom: 16px; font-size: 11px; color: #742a2a; background: #fff5f5; padding: 6px 10px; border-radius: 4px; border-left: 3px solid #c53030; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th { background: #c53030; color: white; padding: 8px 6px; text-align: left; font-size: 11px; }
    td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #fff5f5; }
    .summary { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; flex: 1; min-width: 120px; border-left: 4px solid #c53030; }
    .summary-card h3 { margin: 0 0 4px; font-size: 11px; color: #718096; }
    .summary-card p { margin: 0; font-size: 20px; font-weight: bold; color: #c53030; }
    .total-banner { background: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 14px 20px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
    .total-banner span { font-size: 13px; color: #742a2a; }
    .total-banner strong { font-size: 22px; color: #c53030; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #718096; display: flex; justify-content: space-between; }
  </style>
</head>
<body>
  <div class="header">
    ${config.logoUrl ? `<img src="${config.logoUrl}" alt="Logo" style="height:56px;object-fit:contain;margin-bottom:10px;" />` : ''}
    <h1>Complejo Educativo Católico Zaconato</h1>
    <h2>Reporte de Pagos Pendientes — Año ${anio}</h2>
  </div>
  <div class="meta">
    <span><strong>Año Escolar:</strong> ${anio}</span>
    <span><strong>Total pendientes:</strong> ${comprobantes.length} comprobantes · ${new Set(comprobantes.map(c => c.talonario.estudiante.nie)).size} estudiantes</span>
    <span><strong>Generado:</strong> ${new Date().toLocaleString('es-SV')}</span>
  </div>
  ${filtros ? `<div class="filtros"><strong>Filtros aplicados:</strong> ${filtros}</div>` : ''}

  <table>
    <thead>
      <tr>
        <th>#</th><th>Nombre del Estudiante</th><th>NIE</th>
        <th>Grado/Sección</th><th>Encargado</th><th>Tipo Pendiente</th><th>Mes</th><th>Monto</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="summary">
    ${Object.entries(resumen).filter(([, v]) => v > 0).map(([tipo, count]) =>
      `<div class="summary-card"><h3>${TIPO_LABELS[tipo] || tipo}</h3><p>${count} pendientes</p></div>`
    ).join('')}
  </div>

  <div class="total-banner">
    <span>Monto total pendiente de cobro (${comprobantes.length} comprobantes)</span>
    <strong>${formatUSD(montoTotal)}</strong>
  </div>

  <div class="footer">
    <span>Complejo Educativo Católico Zaconato — Sistema de Gestión Escolar</span>
    <span>Documento generado automáticamente</span>
  </div>
</body>
</html>`

  const label = `pendientes-${anio}${grado ? `-${grado}` : ''}${seccion ? `-${seccion}` : ''}`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="reporte-${label}.html"`,
    },
  })
}
