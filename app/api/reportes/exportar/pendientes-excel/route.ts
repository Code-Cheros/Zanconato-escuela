// app/api/reportes/exportar/pendientes-excel/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { getLogoBuffer } from '@/lib/reportUtils'

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

  const [comprobantes, logoInfo] = await Promise.all([
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
    getLogoBuffer(),
  ])

  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Pendientes')

  // Header and Logo
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
      console.error('Error adding logo to Pendientes Excel:', e)
    }
  }

  worksheet.mergeCells(2, 2, 4, 7)
  const titleCell = worksheet.getCell(2, 2)
  titleCell.value = 'Complejo Educativo Católico Zaconato'
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFC53030' } } // Red for penalties/debt
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }

  worksheet.mergeCells(5, 1, 5, 7)
  const subTitleCell = worksheet.getCell(5, 1)
  subTitleCell.value = `Reporte de Pagos Pendientes — Año ${anio}`
  subTitleCell.font = { name: 'Arial', size: 12, bold: true }
  subTitleCell.alignment = { horizontal: 'center' }

  // Table Headers
  const headerRow = worksheet.getRow(startRow + 1)
  headerRow.values = ['#', 'Nombre del Estudiante', 'NIE', 'Grado', 'Sección', 'Encargado', 'Teléfono', 'Tipo Pendiente', 'Mes', 'Monto Pendiente']
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC53030' } }
    cell.alignment = { horizontal: 'center' }
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
  })

  // Data rows
  comprobantes.forEach((c, i) => {
    const row = worksheet.addRow([
      i + 1,
      c.talonario.estudiante.nombre,
      c.talonario.estudiante.nie,
      c.talonario.estudiante.grado,
      c.talonario.estudiante.seccion,
      c.talonario.estudiante.encargado || '—',
      c.talonario.estudiante.telefono || '—',
      TIPO_LABELS[c.tipo as string] || c.tipo,
      c.mes || '—',
      c.monto,
    ])
    row.getCell(10).numFmt = '"$"#,##0.00'
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
  })

  worksheet.getColumn(1).width = 5
  worksheet.getColumn(2).width = 35
  worksheet.getColumn(3).width = 12
  worksheet.getColumn(4).width = 15
  worksheet.getColumn(5).width = 10
  worksheet.getColumn(6).width = 25
  worksheet.getColumn(7).width = 15
  worksheet.getColumn(8).width = 15
  worksheet.getColumn(9).width = 12
  worksheet.getColumn(10).width = 15

  // --- REDESIGN Summary Sheet ---
  const wsResumen = workbook.addWorksheet('Resumen de Cartera')
  
  wsResumen.mergeCells(1, 1, 2, 4)
  const resTitle = wsResumen.getCell(1, 1)
  resTitle.value = 'RESUMEN DE MOROSIDAD Y PENDIENTES'
  resTitle.font = { size: 18, bold: true, color: { argb: 'FFC53030' } }
  resTitle.alignment = { horizontal: 'center', vertical: 'middle' }

  wsResumen.mergeCells(3, 1, 3, 4)
  const resPeriodo = wsResumen.getCell(3, 1)
  resPeriodo.value = `Año Lectivo: ${anio}`
  resPeriodo.font = { size: 12, italic: true }
  resPeriodo.alignment = { horizontal: 'center' }

  const montoTotal = comprobantes.reduce((s, c) => s + c.monto, 0)
  const numEstudiantes = new Set(comprobantes.map(c => c.talonario.estudiante.nie)).size

  const detailStart = 6
  wsResumen.mergeCells(detailStart, 1, detailStart, 2)
  const c1 = wsResumen.getCell(detailStart, 1)
  c1.value = 'Monto Total Pendiente'
  c1.font = { bold: true, size: 12 }
  c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } }
  c1.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' } }
  
  wsResumen.mergeCells(detailStart, 3, detailStart, 4)
  const c1v = wsResumen.getCell(detailStart, 3)
  c1v.value = montoTotal
  c1v.font = { bold: true, size: 14, color: { argb: 'FFC53030' } }
  c1v.numFmt = '"$"#,##0.00'
  c1v.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF5F5' } }
  c1v.border = { top: { style: 'medium' }, right: { style: 'medium' }, bottom: { style: 'medium' } }

  wsResumen.addRow(['Estudiantes con Pendientes', numEstudiantes]).font = { bold: true }

  wsResumen.addRow([]) // Spacer

  // Breakdown table
  const tableHeader = wsResumen.getRow(10)
  tableHeader.values = ['Categoría Pendiente', 'Comprobantes', 'Monto Deuda', '% Morosidad']
  tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  tableHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC53030' } }
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
  for (const c of comprobantes) {
    if (resumen[c.tipo]) {
      resumen[c.tipo].count++
      resumen[c.tipo].monto += c.monto
    }
  }

  Object.entries(resumen).sort((a,b) => b[1].monto - a[1].monto).forEach(([key, val]) => {
    if (val.count === 0 && val.monto === 0) return
    const row = wsResumen.addRow([
      TIPO_LABELS[key] || key,
      val.count,
      val.monto,
      montoTotal > 0 ? (val.monto / montoTotal) : 0
    ])
    row.getCell(3).numFmt = '"$"#,##0.00'
    row.getCell(4).numFmt = '0.00%'
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
    })
  })

  wsResumen.addRow([])
  wsResumen.addRow(['Informe de Auditoría Escolar']).font = { italic: true, size: 9, color: { argb: 'FF718096' } }
  wsResumen.addRow(['Generado el:', new Date().toLocaleString('es-SV')]).font = { size: 9, italic: true }

  wsResumen.getColumn(1).width = 25
  wsResumen.getColumn(2).width = 15
  wsResumen.getColumn(3).width = 20
  wsResumen.getColumn(4).width = 15

  const buffer = await workbook.xlsx.writeBuffer()
  const label = `pendientes-${anio}${grado ? `-${grado}` : ''}${seccion ? `-${seccion}` : ''}`

  return new NextResponse(buffer as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="reporte-${label}.xlsx"`,
    },
  })
}
