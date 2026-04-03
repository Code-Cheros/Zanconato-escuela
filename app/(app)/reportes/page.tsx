// app/(app)/reportes/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { FileSpreadsheet, FileText, TrendingUp, Filter, X, AlertCircle, Users } from 'lucide-react'
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

// ─── Types ───────────────────────────────────────────────────────────────────
type TipoPeriodo = 'diario' | 'mensual' | 'anual' | 'personalizado'
type TabActivo = 'realizados' | 'pendientes'

interface ReporteData {
  label: string; pagos: any[]; resumen: Record<string, number>; total: number; cantidad: number
}
interface PendientesData {
  anio: number; porEstudiante: any[]; resumen: Record<string, number>
  totalComprobantes: number; totalEstudiantes: number; montoTotal: number
}

// ─── Constants ───────────────────────────────────────────────────────────────
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
const TIPO_PAGO_OPTIONS = [
  { value: '', label: 'Todos', color: 'bg-primary text-primary-foreground' },
  { value: 'COLEGIATURA', label: 'Colegiatura', color: 'bg-blue-100 text-blue-800 border border-blue-200' },
  { value: 'ALIMENTACION', label: 'Alimentación', color: 'bg-green-100 text-green-800 border border-green-200' },
  { value: 'MATRICULA', label: 'Matrícula', color: 'bg-amber-100 text-amber-800 border border-amber-200' },
  { value: 'PAPELERIA', label: 'Papelería', color: 'bg-purple-100 text-purple-800 border border-purple-200' },
  { value: 'OTRO', label: 'Otro', color: 'bg-slate-100 text-slate-800 border border-slate-200' },
]
const TIPO_PAGO_PENDIENTES = TIPO_PAGO_OPTIONS.filter(t => t.value !== 'OTRO')
const typeBadgeClass: Record<string, string> = {
  COLEGIATURA: 'border-blue-200 bg-blue-50 text-blue-700',
  ALIMENTACION: 'border-green-200 bg-green-50 text-green-700',
  MATRICULA: 'border-amber-200 bg-amber-50 text-amber-700',
  PAPELERIA: 'border-purple-200 bg-purple-50 text-purple-700',
  OTRO: 'border-slate-200 bg-slate-50 text-slate-700',
}
const resumenItems = [
  { tipo: 'COLEGIATURA', label: 'Colegiatura', icon: '💰' },
  { tipo: 'ALIMENTACION', label: 'Alimentación', icon: '🍽️' },
  { tipo: 'MATRICULA', label: 'Matrícula', icon: '📋' },
  { tipo: 'PAPELERIA', label: 'Papelería', icon: '📦' },
  { tipo: 'OTRO', label: 'Otros', icon: '🧾' },
]
const ITEMS_PER_PAGE = 10

export default function ReportesPage() {
  const hoy = new Date().toISOString().split('T')[0]

  // ─── Tab ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabActivo>('realizados')

  // ─── Realizados controls ──────────────────────────────────────────────────
  const [tipo, setTipo] = useState<TipoPeriodo>('diario')
  const [fecha, setFecha] = useState(hoy)
  const [mes, setMes] = useState(String(new Date().getMonth() + 1))
  const [anio, setAnio] = useState(String(CURRENT_YEAR))
  const [desde, setDesde] = useState(hoy)
  const [hasta, setHasta] = useState(hoy)
  const [tipoPago, setTipoPago] = useState('')

  // ─── Pendientes controls ──────────────────────────────────────────────────
  const [pAnio, setPAnio] = useState(String(CURRENT_YEAR))
  const [pTipoPago, setPTipoPago] = useState('')

  // ─── Shared filters ───────────────────────────────────────────────────────
  const [grado, setGrado] = useState('')
  const [seccion, setSeccion] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // ─── Data ─────────────────────────────────────────────────────────────────
  const [reporte, setReporte] = useState<ReporteData | null>(null)
  const [pendientes, setPendientes] = useState<PendientesData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)

  // ─── Build params ─────────────────────────────────────────────────────────
  const buildRealizadosParams = useCallback(() => {
    const p = new URLSearchParams({ tipo })
    if (tipo === 'diario') p.set('fecha', fecha)
    else if (tipo === 'mensual') { p.set('mes', mes); p.set('anio', anio) }
    else if (tipo === 'anual') p.set('anio', anio)
    else { p.set('desde', desde); p.set('hasta', hasta) }
    if (tipoPago) p.set('tipoPago', tipoPago)
    if (grado) p.set('grado', grado)
    if (seccion) p.set('seccion', seccion)
    return p
  }, [tipo, fecha, mes, anio, desde, hasta, tipoPago, grado, seccion])

  const buildPendientesParams = useCallback(() => {
    const p = new URLSearchParams({ anio: pAnio })
    if (pTipoPago) p.set('tipoPago', pTipoPago)
    if (grado) p.set('grado', grado)
    if (seccion) p.set('seccion', seccion)
    return p
  }, [pAnio, pTipoPago, grado, seccion])

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchRealizados = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes?${buildRealizadosParams()}`)
      if (res.ok) { setReporte(await res.json()); setCurrentPage(1) }
      else toast.error((await res.json()).error || 'Error cargando reporte')
    } catch { toast.error('Error de conexión') }
    finally { setLoading(false) }
  }, [buildRealizadosParams])

  const fetchPendientes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/pendientes?${buildPendientesParams()}`)
      if (res.ok) { setPendientes(await res.json()); setExpandedStudent(null) }
      else toast.error((await res.json()).error || 'Error cargando pendientes')
    } catch { toast.error('Error de conexión') }
    finally { setLoading(false) }
  }, [buildPendientesParams])

  useEffect(() => {
    if (tab === 'realizados') fetchRealizados()
    else fetchPendientes()
  }, [tab, fetchRealizados, fetchPendientes])

  // ─── Downloads ────────────────────────────────────────────────────────────
  const handleDownload = async (formato: 'excel' | 'pdf', es_pendientes = false) => {
    setDownloading(`${es_pendientes ? 'p-' : ''}${formato}`)
    try {
      let url: string
      if (es_pendientes) {
        const params = buildPendientesParams()
        url = formato === 'excel'
          ? `/api/reportes/exportar/pendientes-excel?${params}`
          : `/api/reportes/exportar/pendientes-pdf?${params}`
      } else {
        const params = buildRealizadosParams()
        url = formato === 'excel'
          ? `/api/reportes/exportar/excel?${params}`
          : `/api/reportes/exportar/pdf?${params}`
      }
      const res = await fetch(url)
      if (!res.ok) { toast.error((await res.json()).error || 'Error'); return }
      const blob = await res.blob()
      const ext = formato === 'excel' ? 'xlsx' : 'html'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reporte-${es_pendientes ? 'pendientes' : tipo}-${Date.now()}.${ext}`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success('Reporte descargado')
    } catch { toast.error('Error al descargar') }
    finally { setDownloading(null) }
  }

  const clearFilters = () => { setGrado(''); setSeccion('') }
  const hasFilters = grado || seccion

  // ─── Pagination (realizados) ──────────────────────────────────────────────
  const pagos = reporte?.pagos || []
  const totalItems = pagos.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedPagos = pagos.slice(startIdx, startIdx + ITEMS_PER_PAGE)
  const noData = !loading && (!reporte || reporte.cantidad === 0)

  return (
    <div className="flex flex-col h-full">
      <Header title="Reportes" subtitle="Análisis y exportación de datos financieros" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">

        {/* Main tabs */}
        <div className="flex items-center gap-1 rounded-xl border bg-muted/30 p-1 w-fit">
          {([
            { key: 'realizados', label: 'Pagos Realizados', icon: TrendingUp },
            { key: 'pendientes', label: 'Pendientes', icon: AlertCircle },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                tab === key
                  ? key === 'pendientes'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" />
              {label}
              {key === 'pendientes' && pendientes && pendientes.totalEstudiantes > 0 && (
                <Badge className="ml-1 h-5 px-1.5 text-[10px] bg-red-100 text-red-700 border-red-200">
                  {pendientes.totalEstudiantes}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: REALIZADOS                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'realizados' && (
          <>
            <Card>
              <CardContent className="pt-4 pb-4 space-y-4">
                {/* Period tabs + actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Período
                    </Label>
                    <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-0.5 w-fit">
                      {(['diario', 'mensual', 'anual', 'personalizado'] as TipoPeriodo[]).map(t => (
                        <button
                          key={t}
                          onClick={() => setTipo(t)}
                          className={cn(
                            'rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                            tipo === t ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                          )}
                        >
                          {t === 'diario' ? 'Diario' : t === 'mensual' ? 'Mensual' : t === 'anual' ? 'Anual' : 'Personalizado'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 h-8 text-xs">
                      <Filter className="size-3.5" /> Filtros
                      {hasFilters && <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px]">Activos</Badge>}
                    </Button>
                    <Button onClick={() => handleDownload('excel')} disabled={downloading !== null || noData} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5">
                      <FileSpreadsheet className="size-3.5" />{downloading === 'excel' ? '...' : 'Excel'}
                    </Button>
                    <Button onClick={() => handleDownload('pdf')} disabled={downloading !== null || noData} variant="destructive" size="sm" className="h-8 text-xs gap-1.5">
                      <FileText className="size-3.5" />{downloading === 'pdf' ? '...' : 'PDF'}
                    </Button>
                  </div>
                </div>

                {/* Period date controls */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  {tipo === 'diario' && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Fecha</Label>
                      <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="h-8 text-xs" />
                    </div>
                  )}
                  {tipo === 'mensual' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mes</Label>
                        <Select value={mes} onValueChange={setMes}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{MESES_LABELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año</Label>
                        <Select value={anio} onValueChange={setAnio}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  {tipo === 'anual' && (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año</Label>
                      <Select value={anio} onValueChange={setAnio}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  )}
                  {tipo === 'personalizado' && (
                    <>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Desde</Label>
                        <Input type="date" value={desde} onChange={e => setDesde(e.target.value)} className="h-8 text-xs" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Hasta</Label>
                        <Input type="date" value={hasta} onChange={e => setHasta(e.target.value)} min={desde} className="h-8 text-xs" />
                      </div>
                    </>
                  )}
                </div>

                {/* Tipo de pago chips */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo de Pago</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIPO_PAGO_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setTipoPago(opt.value)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all border',
                          tipoPago === opt.value
                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                            : 'bg-background text-muted-foreground border-border hover:border-primary hover:text-foreground'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                  <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</Label>
                      <Select value={grado || 'all'} onValueChange={v => setGrado(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos los grados" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grados</SelectItem>
                          {GRADOS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sección</Label>
                      <Select value={seccion || 'all'} onValueChange={v => setSeccion(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las secciones</SelectItem>
                          {SECCIONES.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {hasFilters && (
                      <div className="flex items-end">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-xs text-muted-foreground w-full">
                          <X className="size-3.5" /> Limpiar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary cards */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : reporte && (
              <>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                  {resumenItems.map(item => (
                    <Card key={item.tipo} className={cn('border py-3', typeBadgeClass[item.tipo]?.split(' ')[0])}>
                      <CardContent className="px-4 py-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-base">{item.icon}</span>
                          <span className={cn('text-[10px] font-semibold uppercase', typeBadgeClass[item.tipo]?.split(' ').slice(2).join(' '))}>{item.label}</span>
                        </div>
                        <p className={cn('text-lg font-bold tabular-nums', typeBadgeClass[item.tipo]?.split(' ').slice(2).join(' '))}>
                          {formatCurrency(reporte.resumen[item.tipo] || 0)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-0 bg-primary py-4 text-primary-foreground">
                  <CardContent className="flex items-center justify-between px-5">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="size-5 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80">{reporte.label}</p>
                        <p className="text-xs opacity-60">
                          {reporte.cantidad} transacciones
                          {tipoPago && ` · ${TIPO_PAGO_LABELS[tipoPago]}`}
                          {(grado || seccion) && ` · ${[grado, seccion].filter(Boolean).join(' ')}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(reporte.total)}</p>
                  </CardContent>
                </Card>

                {/* Table */}
                <Card className="py-0">
                  <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3">
                    <CardTitle className="text-base">Detalle de Pagos</CardTitle>
                    <span className="text-xs text-muted-foreground">{reporte.cantidad} registros</span>
                  </CardHeader>
                  {pagos.length === 0 ? (
                    <Empty className="border-0 min-h-[8rem]">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><FileText /></EmptyMedia>
                        <EmptyTitle>No hay pagos para este período</EmptyTitle>
                        <EmptyDescription>Cambiá el período o los filtros activos.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <>
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50 hover:bg-muted/50">
                              {['#', 'Estudiante', 'NIE', 'Grado', 'Sec.', 'Tipo', 'Mes', 'Monto', 'Hora'].map(h => (
                                <TableHead key={h} className="px-4 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paginatedPagos.map((p: any, i: number) => (
                              <TableRow key={p.id}>
                                <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">{startIdx + i + 1}</TableCell>
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
                                <TableCell className="px-4 py-2.5 font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.monto)}</TableCell>
                                <TableCell className="px-4 py-2.5 text-xs text-muted-foreground">
                                  {new Date(p.fecha).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Mobile */}
                      <div className="md:hidden divide-y">
                        {paginatedPagos.map((p: any) => (
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {totalPages > 1 && (
                    <CardFooter className="border-t py-3 px-4 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, totalItems)} de {totalItems}
                      </p>
                      <div className="flex items-center gap-1">
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-7 px-2 text-xs">←</Button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(page => (
                          <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)} className="h-7 w-7 p-0 text-xs">{page}</Button>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-7 px-2 text-xs">→</Button>
                      </div>
                    </CardFooter>
                  )}
                </Card>
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB: PENDIENTES                                                     */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {tab === 'pendientes' && (
          <>
            <Card>
              <CardContent className="pt-4 pb-4 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año Escolar</Label>
                    <Select value={pAnio} onValueChange={setPAnio}>
                      <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>{YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant={showFilters ? 'secondary' : 'outline'} size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 h-8 text-xs">
                      <Filter className="size-3.5" /> Filtros
                      {hasFilters && <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px]">Activos</Badge>}
                    </Button>
                    <Button onClick={() => handleDownload('excel', true)} disabled={downloading !== null || !pendientes || pendientes.totalComprobantes === 0} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs gap-1.5">
                      <FileSpreadsheet className="size-3.5" />{downloading === 'p-excel' ? '...' : 'Excel'}
                    </Button>
                    <Button onClick={() => handleDownload('pdf', true)} disabled={downloading !== null || !pendientes || pendientes.totalComprobantes === 0} variant="destructive" size="sm" className="h-8 text-xs gap-1.5">
                      <FileText className="size-3.5" />{downloading === 'p-pdf' ? '...' : 'PDF'}
                    </Button>
                  </div>
                </div>

                {/* Tipo pendiente chips */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Filtrar por Tipo</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {TIPO_PAGO_PENDIENTES.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setPTipoPago(opt.value)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs font-medium transition-all border',
                          pTipoPago === opt.value
                            ? 'bg-red-500 text-white border-red-500 shadow-sm'
                            : 'bg-background text-muted-foreground border-border hover:border-red-400 hover:text-foreground'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters panel */}
                {showFilters && (
                  <div className="grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</Label>
                      <Select value={grado || 'all'} onValueChange={v => setGrado(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos los grados" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos los grados</SelectItem>
                          {GRADOS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sección</Label>
                      <Select value={seccion || 'all'} onValueChange={v => setSeccion(v === 'all' ? '' : v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas las secciones</SelectItem>
                          {SECCIONES.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {hasFilters && (
                      <div className="flex items-end">
                        <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-xs text-muted-foreground w-full">
                          <X className="size-3.5" /> Limpiar
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pendientes summary */}
            {loading ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : pendientes && (
              <>
                {/* Stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: 'Matrícula', value: pendientes.resumen.MATRICULA || 0, color: 'text-amber-700 bg-amber-50 border-amber-200' },
                    { label: 'Colegiatura', value: pendientes.resumen.COLEGIATURA || 0, color: 'text-blue-700 bg-blue-50 border-blue-200' },
                    { label: 'Alimentación', value: pendientes.resumen.ALIMENTACION || 0, color: 'text-green-700 bg-green-50 border-green-200' },
                    { label: 'Papelería', value: pendientes.resumen.PAPELERIA || 0, color: 'text-purple-700 bg-purple-50 border-purple-200' },
                  ].map(item => (
                    <Card key={item.label} className={cn('border py-3', item.color.split(' ')[1])}>
                      <CardContent className="px-4 py-0">
                        <p className={cn('text-[10px] font-semibold uppercase mb-1', item.color.split(' ')[0])}>{item.label}</p>
                        <p className={cn('text-2xl font-bold tabular-nums', item.color.split(' ')[0])}>{item.value}</p>
                        <p className="text-[10px] text-muted-foreground">pendientes</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Total banner (red) */}
                <Card className="border-0 py-4" style={{ background: 'linear-gradient(135deg, #c53030, #9b2c2c)' }}>
                  <CardContent className="flex items-center justify-between px-5 text-white">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="size-5 opacity-80" />
                      <div>
                        <p className="text-sm opacity-80">Pagos Pendientes — Año {pAnio}</p>
                        <p className="text-xs opacity-60">
                          {pendientes.totalEstudiantes} estudiantes · {pendientes.totalComprobantes} comprobantes
                          {pTipoPago && ` · ${TIPO_PAGO_LABELS[pTipoPago]}`}
                        </p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold tabular-nums">{formatCurrency(pendientes.montoTotal)}</p>
                  </CardContent>
                </Card>

                {/* Student list */}
                {pendientes.porEstudiante.length === 0 ? (
                  <Card>
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><Users /></EmptyMedia>
                        <EmptyTitle>¡Sin pendientes!</EmptyTitle>
                        <EmptyDescription>Todos los estudiantes están al día con sus pagos.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </Card>
                ) : (
                  <Card className="py-0">
                    <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3">
                      <CardTitle className="text-base">Estudiantes con Pagos Pendientes</CardTitle>
                      <span className="text-xs text-muted-foreground">{pendientes.totalEstudiantes} estudiantes</span>
                    </CardHeader>
                    <ul className="divide-y">
                      {pendientes.porEstudiante.map(({ estudiante, comprobantes: comps }) => {
                        const isExpanded = expandedStudent === estudiante.id
                        const montoPendiente = comps.reduce((s: number, c: any) => s + c.monto, 0)
                        return (
                          <li key={estudiante.id}>
                            <button
                              className="w-full text-left px-5 py-3 hover:bg-muted/30 transition-colors"
                              onClick={() => setExpandedStudent(isExpanded ? null : estudiante.id)}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{estudiante.nombre}</p>
                                  <p className="text-xs text-muted-foreground font-mono">
                                    {estudiante.nie} · {estudiante.grado} {estudiante.seccion}
                                    {estudiante.encargado && ` · ${estudiante.encargado}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <Badge variant="destructive" className="text-xs">{comps.length} pendientes</Badge>
                                  <span className="font-semibold text-red-600 text-sm tabular-nums">{formatCurrency(montoPendiente)}</span>
                                  <span className="text-muted-foreground text-xs">{isExpanded ? '▲' : '▼'}</span>
                                </div>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="bg-muted/20 border-t px-5 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {comps.map((c: any) => (
                                    <Badge key={c.id} className={cn('border text-xs', typeBadgeClass[c.tipo] || '')}>
                                      {TIPO_PAGO_LABELS[c.tipo]}{c.mes ? ` — ${c.mes}` : ''} · {formatCurrency(c.monto)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </li>
                        )
                      })}
                    </ul>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
