// app/(app)/reportes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { FileSpreadsheet, FileText, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, TIPO_PAGO_LABELS } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter as TableFoot,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface ReporteData {
  fecha: string
  pagos: any[]
  resumen: Record<string, number>
  total: number
  cantidad: number
}

const typeBadgeClass: Record<string, string> = {
  COLEGIATURA: 'border-blue-200 bg-blue-50 text-blue-700',
  ALIMENTACION: 'border-green-200 bg-green-50 text-green-700',
  MATRICULA: 'border-amber-200 bg-amber-50 text-amber-700',
  PAPELERIA: 'border-purple-200 bg-purple-50 text-purple-700',
}

export default function ReportesPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [reporte, setReporte] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchReporte = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/diario?fecha=${fecha}`)
      if (res.ok) {
        setReporte(await res.json())
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error cargando reporte')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReporte() }, [fecha])

  const handleDownload = async (tipo: 'excel' | 'pdf') => {
    setDownloading(tipo)
    try {
      const url = tipo === 'excel'
        ? `/api/reportes/exportar/excel?fecha=${fecha}`
        : `/api/reportes/exportar/pdf?fecha=${fecha}`
      const res = await fetch(url)
      if (!res.ok) {
        toast.error((await res.json()).error || 'Error descargando')
        return
      }
      const blob = await res.blob()
      const ext = tipo === 'excel' ? 'xlsx' : 'html'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reporte-${fecha}.${ext}`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success(`Reporte ${tipo === 'excel' ? 'Excel' : 'PDF'} descargado`)
    } catch {
      toast.error('Error al descargar')
    } finally {
      setDownloading(null)
    }
  }

  const resumenItems = [
    { tipo: 'COLEGIATURA', label: 'Colegiatura', icon: '💰' },
    { tipo: 'ALIMENTACION', label: 'Alimentación', icon: '🍽️' },
    { tipo: 'MATRICULA', label: 'Matrícula', icon: '📋' },
    { tipo: 'PAPELERIA', label: 'Papelería', icon: '📦' },
  ]

  const noData = !loading && (!reporte || reporte.cantidad === 0)

  return (
    <div className="flex flex-col h-full">
      <Header title="Reportes" subtitle="Análisis y exportación de datos financieros" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Controls */}
        <Card>
          <CardContent className="flex flex-wrap items-end gap-3 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha-reporte">Seleccionar Fecha</Label>
              <Input
                id="fecha-reporte"
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => handleDownload('excel')}
                disabled={downloading !== null || noData}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FileSpreadsheet className="size-4" />
                {downloading === 'excel' ? 'Descargando...' : 'Descargar Excel'}
              </Button>
              <Button
                onClick={() => handleDownload('pdf')}
                disabled={downloading !== null || noData}
                variant="destructive"
              >
                <FileText className="size-4" />
                {downloading === 'pdf' ? 'Descargando...' : 'Descargar PDF'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary cards */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : reporte && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {resumenItems.map(item => (
                <Card key={item.tipo} className={cn('border py-4', typeBadgeClass[item.tipo].split(' ')[0])}>
                  <CardContent className="px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className={cn('text-xs font-semibold', typeBadgeClass[item.tipo].split(' ').slice(2).join(' '))}>
                        {item.label}
                      </span>
                    </div>
                    <p className={cn('text-2xl font-bold tabular-nums', typeBadgeClass[item.tipo].split(' ').slice(2).join(' '))}>
                      {formatCurrency(reporte.resumen[item.tipo] || 0)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Total banner */}
            <Card className="border-0 bg-primary py-5 text-primary-foreground">
              <CardContent className="flex items-center justify-between px-5">
                <div className="flex items-center gap-3">
                  <TrendingUp className="size-6 opacity-80" />
                  <div>
                    <p className="text-sm opacity-80">Total del Día</p>
                    <p className="text-xs opacity-60">{reporte.cantidad} transacciones · {fecha}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold tabular-nums sm:text-3xl">{formatCurrency(reporte.total)}</p>
              </CardContent>
            </Card>

            {/* Payments table */}
            <Card className="py-0">
              <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
                <CardTitle className="text-base">Detalle de Pagos</CardTitle>
                <span className="text-xs text-muted-foreground">{reporte.cantidad} registros</span>
              </CardHeader>

              {reporte.pagos.length === 0 ? (
                <Empty className="border-0 min-h-[10rem]">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                    <EmptyTitle>No hay pagos para {fecha}</EmptyTitle>
                    <EmptyDescription>No se registraron transacciones en esta fecha.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      {['#', 'Estudiante', 'NIE', 'Grado', 'Tipo', 'Mes', 'Monto', 'Hora'].map(h => (
                        <TableHead key={h} className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {h}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reporte.pagos.map((p: any, i: number) => (
                      <TableRow key={p.id}>
                        <TableCell className="px-4 py-3 text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="px-4 py-3 font-medium">{p.estudiante.nombre}</TableCell>
                        <TableCell className="px-4 py-3 font-mono text-muted-foreground">{p.estudiante.nie}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{p.estudiante.grado} {p.estudiante.seccion}</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge className={cn('border', typeBadgeClass[p.tipo] || '')}>
                            {TIPO_PAGO_LABELS[p.tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">{p.comprobante?.mes || '—'}</TableCell>
                        <TableCell className="px-4 py-3 font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.monto)}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground">
                          {new Date(p.fecha).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFoot>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={6} className="px-4 py-3 text-right font-semibold">
                        Total del día:
                      </TableCell>
                      <TableCell className="px-4 py-3 font-bold text-emerald-600 tabular-nums">
                        {formatCurrency(reporte.total)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFoot>
                </Table>
              )}
            </Card>
          </>
        )}

        {!loading && !reporte && (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                <EmptyTitle>Sin datos</EmptyTitle>
                <EmptyDescription>Seleccioná una fecha para ver el reporte diario.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        )}
      </div>
    </div>
  )
}
