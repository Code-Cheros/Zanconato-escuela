// app/(app)/reportes/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { FileSpreadsheet, FileText, TrendingUp, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, TIPO_PAGO_LABELS, GRADOS, SECCIONES } from '@/lib/utils'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
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
  label: string
  pagos: any[]
  resumen: Record<string, number>
  total: number
  cantidad: number
}

type TipoPeriodo = 'diario' | 'mensual' | 'anual' | 'personalizado'

const typeBadgeClass: Record<string, string> = {
  COLEGIATURA: 'border-blue-200 bg-blue-50 text-blue-700',
  ALIMENTACION: 'border-green-200 bg-green-50 text-green-700',
  MATRICULA: 'border-amber-200 bg-amber-50 text-amber-700',
  PAPELERIA: 'border-purple-200 bg-purple-50 text-purple-700',
  OTRO: 'border-slate-200 bg-slate-50 text-slate-700',
}

const resumenItems = [
  { tipo: 'COLEGIATURA', label: 'Colegiatura', icon: '💰', colorClass: 'border-blue-200 bg-blue-50 text-blue-700' },
  { tipo: 'ALIMENTACION', label: 'Alimentación', icon: '🍽️', colorClass: 'border-green-200 bg-green-50 text-green-700' },
  { tipo: 'MATRICULA', label: 'Matrícula', icon: '📋', colorClass: 'border-amber-200 bg-amber-50 text-amber-700' },
  { tipo: 'PAPELERIA', label: 'Papelería', icon: '📦', colorClass: 'border-purple-200 bg-purple-50 text-purple-700' },
  { tipo: 'OTRO', label: 'Otros', icon: '🧾', colorClass: 'border-slate-200 bg-slate-50 text-slate-700' },
]

const ITEMS_PER_PAGE = 10
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]
const MESES_LABELS = [
  { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
  { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
  { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
  { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
  { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

export default function ReportesPage() {
  const hoy = new Date().toISOString().split('T')[0]

  // Period controls
  const [tipo, setTipo] = useState<TipoPeriodo>('diario')
  const [fecha, setFecha] = useState(hoy)
  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [anio, setAnio] = useState(String(CURRENT_YEAR))
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(hoy)

  // Filters
  const [grado, setGrado] = useState('')
  const [seccion, setSeccion] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Data
  const [reporte, setReporte] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)

  const buildParams = useCallback(() => {
    const p = new URLSearchParams({ tipo })
    if (tipo === 'diario') p.set('fecha', fecha)
    else if (tipo === 'mensual') { p.set('mes', mes); p.set('anio', anio) }
    else if (tipo === 'anual') p.set('anio', anio)
    else { p.set('desde', desde); p.set('hasta', hasta) }
    if (grado) p.set('grado', grado)
    if (seccion) p.set('seccion', seccion)
    return p
  }, [tipo, fecha, mes, anio, desde, hasta, grado, seccion])

  const fetchReporte = useCallback(async () => {
    setLoading(true)
    try {
      const params = buildParams()
      const res = await fetch(`/api/reportes?${params}`)
      if (res.ok) {
        setReporte(await res.json())
        setCurrentPage(1)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error cargando reporte')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }, [buildParams])

  useEffect(() => { fetchReporte() }, [fetchReporte])

  const handleDownload = async (formato: 'excel' | 'pdf') => {
    setDownloading(formato)
    try {
      const params = buildParams()
      const endpoint = formato === 'excel'
        ? `/api/reportes/exportar/excel?${params}`
        : `/api/reportes/exportar/pdf?${params}`
      const res = await fetch(endpoint)
      if (!res.ok) {
        toast.error((await res.json()).error || 'Error descargando')
        return
      }
      const blob = await res.blob()
      const ext = formato === 'excel' ? 'xlsx' : 'html'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reporte-${tipo}-${Date.now()}.${ext}`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success(`Reporte ${formato === 'excel' ? 'Excel' : 'HTML'} descargado`)
    } catch {
      toast.error('Error al descargar')
    } finally {
      setDownloading(null)
    }
  }

  const clearFilters = () => { setGrado(''); setSeccion('') }
  const hasActiveFilters = grado || seccion

  const totalItems = reporte?.pagos?.length || 0
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const paginatedPagos = reporte?.pagos?.slice(startIdx, endIdx) || []

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const noData = !loading && (!reporte || reporte.cantidad === 0)

  return (
    <div className="flex flex-col h-full">
      <Header title="Reportes" subtitle="Análisis y exportación de datos financieros" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* Controls card */}
        <Card>
          <CardContent className="pt-4 pb-4 space-y-4">

            {/* Period type tabs */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Tipo de Reporte
                </Label>
                <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5 w-fit">
                  {(['diario', 'mensual', 'anual', 'personalizado'] as TipoPeriodo[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTipo(t)}
                      className={cn(
                        'rounded-md px-3 py-1.5 text-xs font-medium transition-all capitalize',
                        tipo === t
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {t === 'diario' ? 'Diario' : t === 'mensual' ? 'Mensual' : t === 'anual' ? 'Anual' : 'Personalizado'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant={showFilters ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Filter className="size-3.5" />
                  Filtros
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px]">Activos</Badge>
                  )}
                </Button>
                <Button
                  onClick={() => handleDownload('excel')}
                  disabled={downloading !== null || noData}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5"
                >
                  <FileSpreadsheet className="size-3.5" />
                  {downloading === 'excel' ? 'Descargando...' : 'Excel'}
                </Button>
                <Button
                  onClick={() => handleDownload('pdf')}
                  disabled={downloading !== null || noData}
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                >
                  <FileText className="size-3.5" />
                  {downloading === 'pdf' ? 'Descargando...' : 'PDF'}
                </Button>
              </div>
            </div>

            {/* Period-specific controls */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {tipo === 'diario' && (
                <div className="space-y-1.5">
                  <Label htmlFor="fecha-diario" className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Fecha
                  </Label>
                  <Input
                    id="fecha-diario"
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {tipo === 'mensual' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mes</Label>
                    <Select value={mes} onValueChange={setMes}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MESES_LABELS.map(m => (
                          <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año</Label>
                    <Select value={anio} onValueChange={setAnio}>
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {tipo === 'anual' && (
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año</Label>
                  <Select value={anio} onValueChange={setAnio}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tipo === 'personalizado' && (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Desde</Label>
                    <Input
                      type="date"
                      value={desde}
                      onChange={e => setDesde(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hasta</Label>
                    <Input
                      type="date"
                      value={hasta}
                      onChange={e => setHasta(e.target.value)}
                      min={desde}
                      className="h-8 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</Label>
                  <Select value={grado || 'all'} onValueChange={v => setGrado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos los grados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grados</SelectItem>
                      {GRADOS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sección</Label>
                  <Select value={seccion || 'all'} onValueChange={v => setSeccion(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas las secciones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las secciones</SelectItem>
                      {SECCIONES.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-xs text-muted-foreground w-full">
                      <X className="size-3.5" /> Limpiar filtros
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary cards skeleton */}
        {loading ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : reporte && (
          <>
            {/* Resumen por tipo */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
              {resumenItems.map(item => (
                <Card key={item.tipo} className={cn('border py-4', item.colorClass.split(' ')[0])}>
                  <CardContent className="px-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{item.icon}</span>
                      <span className={cn('text-xs font-semibold', item.colorClass.split(' ').slice(2).join(' '))}>
                        {item.label}
                      </span>
                    </div>
                    <p className={cn('text-xl font-bold tabular-nums', item.colorClass.split(' ').slice(2).join(' '))}>
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
                    <p className="text-sm opacity-80">{reporte.label}</p>
                    <p className="text-xs opacity-60">
                      {reporte.cantidad} transacciones
                      {(grado || seccion) && ` · ${[grado, seccion].filter(Boolean).join(' / ')}`}
                    </p>
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
                    <EmptyTitle>No hay pagos para este período</EmptyTitle>
                    <EmptyDescription>
                      {hasActiveFilters
                        ? 'Probá cambiando los filtros de grado o sección.'
                        : 'No se registraron transacciones en el período seleccionado.'}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          {['#', 'Estudiante', 'NIE', 'Grado', 'Sección', 'Tipo', 'Mes', 'Monto', 'Hora'].map(h => (
                            <TableHead key={h} className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {h}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPagos.map((p: any, i: number) => (
                          <TableRow key={p.id}>
                            <TableCell className="px-4 py-2.5 text-muted-foreground text-xs">{startIdx + i + 1}</TableCell>
                            <TableCell className="px-4 py-2.5 font-medium text-sm">{p.estudiante.nombre}</TableCell>
                            <TableCell className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.estudiante.nie}</TableCell>
                            <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{p.estudiante.grado}</TableCell>
                            <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{p.estudiante.seccion}</TableCell>
                            <TableCell className="px-4 py-2.5">
                              <Badge className={cn('border text-xs', typeBadgeClass[p.tipo] || '')}>
                                {p.tipo === 'OTRO' ? (p.tipoPersonalizado || 'Otro') : (TIPO_PAGO_LABELS[p.tipo] || p.tipo)}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{p.comprobante?.mes || '—'}</TableCell>
                            <TableCell className="px-4 py-2.5 font-semibold text-emerald-600 tabular-nums text-sm">
                              {formatCurrency(p.monto)}
                            </TableCell>
                            <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                              {new Date(p.fecha).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile list */}
                  <div className="md:hidden divide-y">
                    {paginatedPagos.map((p: any, i: number) => (
                      <div key={p.id} className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{p.estudiante.nombre}</p>
                            <p className="text-xs font-mono text-muted-foreground">{p.estudiante.nie} · {p.estudiante.grado} {p.estudiante.seccion}</p>
                          </div>
                          <p className="font-bold text-emerald-600 tabular-nums">{formatCurrency(p.monto)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={cn('border text-xs', typeBadgeClass[p.tipo] || '')}>
                            {p.tipo === 'OTRO' ? (p.tipoPersonalizado || 'Otro') : (TIPO_PAGO_LABELS[p.tipo] || p.tipo)}
                          </Badge>
                          {p.comprobante?.mes && <span className="text-xs text-muted-foreground">{p.comprobante.mes}</span>}
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(p.fecha).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Pagination */}
              {reporte.pagos.length > 0 && totalPages > 1 && (
                <CardFooter className="flex flex-col gap-3 border-t py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-muted-foreground">
                    Mostrando <span className="font-medium">{Math.min(startIdx + 1, totalItems)}</span> a{' '}
                    <span className="font-medium">{Math.min(endIdx, totalItems)}</span> de{' '}
                    <span className="font-semibold">{totalItems}</span> registros
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-8 px-2 text-xs"
                    >Anterior</Button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0 text-xs"
                      >{page}</Button>
                    ))}
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="h-8 px-2 text-xs"
                    >Siguiente</Button>
                  </div>
                </CardFooter>
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
                <EmptyDescription>Seleccioná un período para ver el reporte.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        )}
      </div>
    </div>
  )
}
