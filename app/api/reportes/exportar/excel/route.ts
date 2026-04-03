// app/api/reportes/exportar/excel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { getLogoBuffer } from '@/lib/reportUtils'

function buildRange(params: URLSearchParams): { inicio: Date; fin: Date; label: string; titulo: string; literal: string } {
  const tipo = params.get('tipo') || 'diario'
  const hoy = new Date()

  if (tipo === 'diario') {
    const fecha = params.get('fecha') || hoy.toISOString().split('T')[0]
    const inicio = new Date(fecha); inicio.setHours(0, 0, 0, 0)
    const fin = new Date(fecha); fin.setHours(23, 59, 59, 999)
    const labelFecha = new Date(fecha).toLocaleDateString('es-SV', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    return { inicio, fin, label: fecha, titulo: `Reporte Diario — ${labelFecha}`, literal: `Día ${fecha}` }
  }
  if (tipo === 'mensual') {
    const mes = parseInt(params.get('mes') || String(hoy.getMonth() + 1))
    const anio = parseInt(params.get('anio') || String(hoy.getFullYear()))
    const inicio = new Date(anio, mes - 1, 1)
    const fin = new Date(anio, mes, 0, 23, 59, 59, 999)
    const nombreMes = inicio.toLocaleString('es-SV', { month: 'long' })
    return { inicio, fin, label: `${nombreMes}-${anio}`, titulo: `Reporte Mensual — ${nombreMes} ${anio}`, literal: `${nombreMes} ${anio}` }
  }
  if (tipo === 'anual') {
    const anio = parseInt(params.get('anio') || String(hoy.getFullYear()))
    return {
      inicio: new Date(anio, 0, 1), fin: new Date(anio, 11, 31, 23, 59, 59, 999),
      label: String(anio), titulo: `Reporte Anual — ${anio}`, literal: `Año ${anio}`,
    }
  }
  const desde = params.get('desde') || hoy.toISOString().split('T')[0]
  const hasta = params.get('hasta') || hoy.toISOString().split('T')[0]
  const inicio = new Date(desde); inicio.setHours(0, 0, 0, 0)
  const fin = new Date(hasta); fin.setHours(23, 59, 59, 999)
  return { inicio, fin, label: `${desde}_${hasta}`, titulo: `Reporte Personalizado — ${desde} al ${hasta}`, literal: `Personalizado ${desde} a ${hasta}` }
}

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
  const { inicio, fin, label, titulo, literal } = buildRange(searchParams)
  const grado = searchParams.get('grado') || ''
  const seccion = searchParams.get('seccion') || ''
  const tipoPago = searchParams.get('tipoPago') || ''

  const [pagos, logoInfo] = await Promise.all([
    prisma.pago.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        ...(tipoPago && { tipo: tipoPago as any }),
        estudiante: {
          ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
          ...(seccion && { seccion: { contains: seccion, mode: 'insensitive' } }),
        },
      },
      include: {
        estudiante: { select: { nombre: true, nie: true, grado: true, seccion: true } },
        comprobante: { select: { mes: true } },
      },
      orderBy: { fecha: 'asc' },
    }),
    getLogoBuffer(),
  ])

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Pagos')

  // Header and Logo section
  const startRow = 6
  if (logoInfo) {
    try {
      const imageId = workbook.addImage({
        buffer: logoInfo.buffer as any,
        extension: logoInfo.extension,
      })
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 0 },
        ext: { width: 80, height: 80 }
      })
    } catch (e) {
      console.error('Error adding logo to Excel WORKBOOK:', e)
    }
  }

  worksheet.mergeCells(2, 2, 4, 7)
  const titleCell = worksheet.getCell(2, 2)
  titleCell.value = 'Complejo Educativo Católico Zaconato'
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FF1E40AF' } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  worksheet.mergeCells(5, 1, 5, 7)
  const subTitleCell = worksheet.getCell(5, 1)
  subTitleCell.value = titulo
  subTitleCell.font = { name: 'Arial', size: 12, bold: true }
  subTitleCell.alignment = { horizontal: 'center' }

  // Table headers
  const headerRow = worksheet.getRow(startRow + 1)
  headerRow.values = ['#', 'Nombre del Estudiante', 'NIE', 'Grado', 'Sección', 'Tipo de Pago', 'Mes', 'Monto', 'Fecha', 'Hora']
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
    cell.alignment = { horizontal: 'center' }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })

  // Data rows
  pagos.forEach((p, i) => {
    const row = worksheet.addRow([
      i + 1,
      (p as any).estudiante.nombre,
      (p as any).estudiante.nie,
      (p as any).estudiante.grado,
      (p as any).estudiante.seccion,
      ((p as any).tipo as string) === 'OTRO' ? ((p as any).tipoPersonalizado || 'Otro') : (TIPO_LABELS[(p as any).tipo as string] || (p as any).tipo),
      (p as any).comprobante?.mes || '—',
      p.monto,
      new Date(p.fecha).toLocaleDateString('es-SV'),
      new Date(p.fecha).toLocaleTimeString('es-SV'),
    ])
    row.getCell(8).numFmt = '"$"#,##0.00'
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      if (typeof cell.value === 'string') cell.alignment = { horizontal: 'left' }
    })
  })

  worksheet.getColumn(1).width = 5
  worksheet.getColumn(2).width = 35
  worksheet.getColumn(3).width = 12
  worksheet.getColumn(4).width = 15
  worksheet.getColumn(5).width = 10
  worksheet.getColumn(6).width = 20
  worksheet.getColumn(7).width = 12
  worksheet.getColumn(8).width = 12
  worksheet.getColumn(9).width = 12
  worksheet.getColumn(10).width = 12

  // --- REDESIGN Summary Sheet ---
  const wsResumen = workbook.addWorksheet('Resumen de Gestión')
  
  // Title for Summary
  wsResumen.mergeCells(1, 1, 2, 4)
  const resTitle = wsResumen.getCell(1, 1)
  resTitle.value = 'RESUMEN FINANCIERO DE GESTIÓN'
  resTitle.font = { size: 18, bold: true, color: { argb: 'FF1E40AF' } }
  resTitle.alignment = { horizontal: 'center', vertical: 'middle' }

  wsResumen.mergeCells(3, 1, 3, 4)
  const resPeriodo = wsResumen.getCell(3, 1)
  resPeriodo.value = `Período: ${literal}`
  resPeriodo.font = { size: 12, italic: true }
  resPeriodo.alignment = { horizontal: 'center' }

  wsResumen.addRow([]) // Spacer

  // Metric cards logic (simulated by stylized cells)
  const totalRecaudado = pagos.reduce((s, p) => s + p.monto, 0)
  const totalTransacciones = pagos.length

  const detailStart = 6
  wsResumen.mergeCells(detailStart, 1, detailStart, 2)
  const c1 = wsResumen.getCell(detailStart, 1)
  c1.value = 'Total Recaudado'
  c1.font = { bold: true, size: 12 }
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF8FF' } }
  c1.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' } }
  
  wsResumen.mergeCells(detailStart, 3, detailStart, 4)
  const c1v = wsResumen.getCell(detailStart, 3)
  c1v.value = totalRecaudado
  c1v.font = { bold: true, size: 14, color: { argb: 'FF1E40AF' } }
  c1v.numFmt = '"$"#,##0.00'
  c1v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBF8FF' } }
  c1v.border = { top: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } }

  wsResumen.addRow([]) // Spacer

  // Detailed Table
  const tableHeader = wsResumen.getRow(8)
  tableHeader.values = ['Categoría de Pago', 'Transacciones', 'Monto Acumulado', '% del Total']
  tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  tableHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
    cell.alignment = { horizontal: 'center' }
    cell.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } }
  })

  const resumen: Record<string, { count: number; monto: number }> = {
    MATRICULA: { count: 0, monto: 0 },
    PAPELERIA: { count: 0, monto: 0 },
    COLEGIATURA: { count: 0, monto: 0 },
    ALIMENTACION: { count: 0, monto: 0 },
    OTRO: { count: 0, monto: 0 },
  }
  for (const p of pagos) {
    if (resumen[p.tipo]) {
      resumen[p.tipo].count++
      resumen[p.tipo].monto += p.monto
    } else {
       // Should not happen with current schema but for safety
       resumen.OTRO.count++
       resumen.OTRO.monto += p.monto
    }
  }

  let currRow = 9
  Object.entries(resumen).sort((a,b) => b[1].monto - a[1].monto).forEach(([key, val]) => {
    if (val.count === 0 && val.monto === 0) return
    const row = wsResumen.addRow([
      TIPO_LABELS[key] || key,
      val.count,
      val.monto,
      totalRecaudado > 0 ? (val.monto / totalRecaudado) : 0
    ])
    row.getCell(3).numFmt = '"$"#,##0.00'
    row.getCell(4).numFmt = '0.00%'
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
    currRow++
  })

  wsResumen.addRow([]) // Spacer line
  const nowRow = wsResumen.addRow(['Generado el:', new Date().toLocaleString('es-SV')])
  nowRow.font = { italic: true, size: 9, color: { argb: 'FF718096' } }

  wsResumen.getColumn(1).width = 25
  wsResumen.getColumn(2).width = 15
  wsResumen.getColumn(3).width = 20
  wsResumen.getColumn(4).width = 15

  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-${label}.xlsx"`,
    },
  })
}
