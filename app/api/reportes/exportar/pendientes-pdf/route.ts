// app/api/reportes/exportar/pendientes-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getLogoBase64 } from '@/lib/reportUtils'

const TIPO_LABELS: Record<string, string> = {
  MATRICULA: 'Matrícula', PAPELERIA: 'Papelería',
  COLEGIATURA: 'Colegiatura', ALIMENTACION: 'Alimentación', OTRO: 'Otro',
}

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

  const [comprobantes, logoBase64] = await Promise.all([
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
              select: { nombre: true, nie: true, grado: true, seccion: true, encargado: true, telefono: true },
            },
          },
        },
      },
      orderBy: [
        { talonario: { estudiante: { nombre: 'asc' } } },
        { orden: 'asc' },
      ],
    }),
    getLogoBase64(),
  ])

  const datosValidos = comprobantes.filter(c => c.talonario?.estudiante)
  const montoTotal = datosValidos.reduce((s, c) => s + c.monto, 0)
  const formatUSD = (n: number) => `$${n.toFixed(2)}`

  const tableRows = datosValidos.map((c, i) => {
    const s = c.talonario!.estudiante
    return `<tr ${i % 2 === 0 ? '' : 'style="background:#f7fafc"'}>
      <td>${i + 1}</td>
      <td>${s.nombre}</td>
      <td>${s.nie}</td>
      <td>${s.grado} ${s.seccion}</td>
      <td>${TIPO_LABELS[c.tipo] || c.tipo}</td>
      <td>${c.mes || '—'}</td>
      <td style="text-align:right">${formatUSD(c.monto)}</td>
      <td>${s.telefono || '—'}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte de Pagos Pendientes</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; color: #1a202c; font-size: 11px; }
    .header { text-align: center; border-bottom: 3px solid #c53030; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 18px; color: #c53030; margin: 0 0 4px; }
    .header h2 { font-size: 13px; font-weight: normal; margin: 0; color: #4a5568; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 10px; color: #4a5568; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #c53030; color: white; padding: 6px; text-align: left; font-size: 10px; text-transform: uppercase; }
    td { padding: 6px; border-bottom: 1px solid #e2e8f0; }
    .total-row td { background: #fff5f5 !important; font-weight: bold; border-top: 2px solid #c53030; }
    .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 20px; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px 12px; }
    .summary-card.total { border-left: 4px solid #c53030; background: #fff5f5; }
    .summary-card h3 { margin: 0 0 2px; font-size: 10px; color: #718096; text-transform: uppercase; }
    .summary-card p { margin: 0; font-size: 16px; font-weight: bold; color: #2d3748; }
    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 9px; color: #a0aec0; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="height:50px;object-fit:contain;margin-bottom:8px;" />` : ''}
    <h1>Complejo Educativo Católico Zanconato</h1>
    <h2>Reporte de Pagos Pendientes — Año ${anio}</h2>
  </div>

  <div class="meta">
    <span><strong>Filtros:</strong> ${grado ? `Grado: ${grado}` : 'Todos'} ${seccion ? `| Sec: ${seccion}` : ''}</span>
    <span><strong>Items:</strong> ${datosValidos.length}</span>
    <span><strong>Generado:</strong> ${new Date().toLocaleString('es-SV')}</span>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:30px">#</th>
        <th>Nombre del Estudiante</th>
        <th style="width:70px">NIE</th>
        <th style="width:80px">Grado/Sec</th>
        <th>Concepto</th>
        <th style="width:80px">Mes</th>
        <th style="width:80px; text-align:right">Monto</th>
        <th style="width:80px">Teléfono</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
      <tr class="total-row">
        <td colspan="6" style="text-align:right">MONTO TOTAL PENDIENTE</td>
        <td style="text-align:right">${formatUSD(montoTotal)}</td>
        <td></td>
      </tr>
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-card total">
      <h3>Deducción de Cartera</h3>
      <p>${formatUSD(montoTotal)}</p>
    </div>
    <div class="summary-card">
      <h3>Estudiantes</h3>
      <p>${new Set(datosValidos.map(v => v.talonario!.estudiante.nie)).size}</p>
    </div>
    <div class="summary-card">
      <h3>Pagos Pendientes</h3>
      <p>${datosValidos.length}</p>
    </div>
  </div>

  <div class="footer">
    Sistema de Control de Pagos Zanconato — Este documento tiene carácter informativo de cobro interno.
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="pendientes-${anio}.html"`,
    },
  })
}
