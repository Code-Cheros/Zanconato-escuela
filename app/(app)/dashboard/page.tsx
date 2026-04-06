// app/(app)/dashboard/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Users, CheckCircle, FileText, TrendingUp, Plus, Search, Eye, CreditCard, Filter, X, Calendar } from 'lucide-react'
import { formatCurrency, GRADOS, SECCIONES } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

interface Stats {
  totalEstudiantes: number
  estudiantesAlDia: number
  comprobantesEmitidos: number
  pagosHoy: number
  ingresosMes: number
}

interface Estudiante {
  id: string
  nombre: string
  nie: string
  grado: string
  seccion: string
  activo: boolean
  encargado: string | null
  telefono: string | null
  talonarios: Array<{ comprobantes: Array<{ pagado: boolean; tipo: string }> }>
}

function EstadoBadge({ talonarios, activo }: { talonarios: Estudiante['talonarios'], activo?: boolean }) {
  if (activo === false) {
    return <Badge variant="destructive" className="bg-red-500/10 text-red-700 border-red-200">Inactivo</Badge>
  }
  const talonario = talonarios[0]
  if (!talonario) return <Badge variant="secondary">Sin talonario</Badge>

  const comprobantes = talonario.comprobantes
  const colegiaturas = comprobantes.filter(c => c.tipo === 'COLEGIATURA')
  const pagadas = colegiaturas.filter(c => c.pagado).length

  if (pagadas === colegiaturas.length && colegiaturas.length > 0) {
    return (
      <Badge
        className={cn(
          'border-emerald-200 bg-emerald-500/10 text-emerald-800',
          'dark:border-emerald-800 dark:text-emerald-400'
        )}
      >
        ✓ Al día
      </Badge>
    )
  }
  if (pagadas === 0) {
    return <Badge variant="destructive">Pendiente</Badge>
  }
  return (
    <Badge variant="outline">
      {pagadas}/{colegiaturas.length} pagadas
    </Badge>
  )
}

function EstudianteActions({ estudianteId }: { estudianteId: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
        <Link href={`/pagos?estudianteId=${estudianteId}`}>
          <CreditCard className="size-3.5" />
          Pago
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" asChild>
        <Link href={`/estudiantes/${estudianteId}`}>
          <Eye className="size-3.5" />
          Ver
        </Link>
      </Button>
    </div>
  )
}

type Periodo = 'diario' | 'mes' | 'anual' | 'personalizado'

const ITEMS_PER_PAGE = 10

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Period filter
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [customDesde, setCustomDesde] = useState('')
  const [customHasta, setCustomHasta] = useState('')

  // Student filters
  const [filterNombre, setFilterNombre] = useState('')
  const [filterNie, setFilterNie] = useState('')
  const [filterGrado, setFilterGrado] = useState('')
  const [filterSeccion, setFilterSeccion] = useState('')
  const [filterEncargado, setFilterEncargado] = useState('')
  const [filterTelefono, setFilterTelefono] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterAnio, setFilterAnio] = useState(String(new Date().getFullYear()))

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (filterNombre) params.set('nombre', filterNombre)
      if (filterNie) params.set('nie', filterNie)
      if (filterGrado) params.set('grado', filterGrado)
      if (filterSeccion) params.set('seccion', filterSeccion)
      if (filterEncargado) params.set('encargado', filterEncargado)
      if (filterTelefono) params.set('telefono', filterTelefono)
      if (filterEstado) params.set('estado', filterEstado)
      if (filterAnio) params.set('anio', filterAnio)

      // Build stats query params based on period
      const statsParams = new URLSearchParams()
      statsParams.set('anio', filterAnio)
      if (periodo === 'diario') {
        const now = new Date()
        const yyyy = now.getFullYear()
        const mm = String(now.getMonth() + 1).padStart(2, '0')
        const dd = String(now.getDate()).padStart(2, '0')
        const hoy = `${yyyy}-${mm}-${dd}`
        statsParams.set('desde', hoy)
        statsParams.set('hasta', hoy)
      } else if (periodo === 'mes') {
        const now = new Date()
        const y = now.getFullYear(), m = now.getMonth()
        const desde = `${y}-${String(m + 1).padStart(2, '0')}-01`
        const lastDay = new Date(y, m + 1, 0).getDate()
        const hasta = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
        statsParams.set('desde', desde)
        statsParams.set('hasta', hasta)
      } else if (periodo === 'anual') {
        statsParams.set('desde', `${filterAnio}-01-01`)
        statsParams.set('hasta', `${filterAnio}-12-31`)
      } else if (periodo === 'personalizado' && customDesde && customHasta) {
        statsParams.set('desde', customDesde)
        statsParams.set('hasta', customHasta)
      }

      const [statsRes, estRes] = await Promise.all([
        fetch(`/api/dashboard/stats?${statsParams.toString()}`),
        fetch(`/api/estudiantes?${params.toString()}`),
      ])
      const statsData = await statsRes.json()
      const estData = await estRes.json()
      setStats(statsData)
      setEstudiantes(Array.isArray(estData) ? estData : [])
      setCurrentPage(1)
    } catch {
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [filterNombre, filterNie, filterGrado, filterSeccion, filterEncargado, filterTelefono, filterEstado, filterAnio, periodo, customDesde, customHasta])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const clearFilters = () => {
    setFilterNombre('')
    setFilterNie('')
    setFilterGrado('')
    setFilterSeccion('')
    setFilterEncargado('')
    setFilterTelefono('')
    setFilterEstado('')
    setFilterAnio(String(new Date().getFullYear()))
  }

  const hasActiveFilters = filterNombre || filterNie || filterGrado || filterSeccion || filterEncargado || filterTelefono || filterEstado

  // Pagination logic
  const totalItems = estudiantes.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const paginatedEstudiantes = estudiantes.slice(startIdx, endIdx)

  // Handle page change
  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const statCards = stats
    ? [
        {
          label:
            periodo === 'diario'
              ? 'Ingresos del Día'
              : periodo === 'mes'
                ? 'Ingresos del Mes'
                : periodo === 'anual'
                  ? `Ingresos ${filterAnio}`
                  : 'Ingresos del Período',
          value: formatCurrency(stats.ingresosMes),
          icon: TrendingUp,
          iconWrap: 'bg-amber-500 text-white',
        },
        {
          label: 'Total Estudiantes',
          value: stats.totalEstudiantes,
          icon: Users,
          iconWrap: 'bg-blue-500 text-white',
        },
        {
          label: 'Al Día con Pagos',
          value: stats.estudiantesAlDia,
          icon: CheckCircle,
          iconWrap: 'bg-emerald-500 text-white',
        },
        {
          label: 'Comprobantes Emitidos',
          value: stats.comprobantesEmitidos,
          icon: FileText,
          iconWrap: 'bg-violet-500 text-white',
        },
      ]
    : []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Dashboard" subtitle="Resumen general del sistema" />

      <div className="flex-1 space-y-3 p-4 sm:space-y-4 sm:p-6">
        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 rounded-lg border bg-card p-0.5">
            {(['diario', 'mes', 'anual', 'personalizado'] as Periodo[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={cn(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors capitalize',
                  periodo === p
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p === 'diario' ? 'Diario' : p === 'mes' ? 'Mes actual' : p === 'anual' ? 'Anual' : 'Personalizado'}
              </button>
            ))}
          </div>

          {periodo === 'personalizado' && (
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center gap-1">
                <Calendar className="size-3 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">Desde</span>
                <input
                  type="date"
                  value={customDesde}
                  onChange={e => setCustomDesde(e.target.value)}
                  className="h-7 rounded-md border bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted-foreground">Hasta</span>
                <input
                  type="date"
                  value={customHasta}
                  onChange={e => setCustomHasta(e.target.value)}
                  min={customDesde}
                  className="h-7 rounded-md border bg-background px-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="py-3">
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="flex flex-1 flex-col gap-1.5">
                    <Skeleton className="h-2.5 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
            {statCards.map(card => (
              <Card key={card.label} className="py-3">
                <CardContent className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-0.5 truncate text-lg font-bold tabular-nums">{card.value}</p>
                  </div>
                  <div
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg',
                      card.iconWrap
                    )}
                  >
                    <card.icon className="size-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Students */}
        <Card className="min-w-0 py-0">
          <CardHeader className="flex flex-col gap-3 border-b px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Gestión de Estudiantes</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant={showFilters ? "secondary" : "outline"} 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Filter className="size-3.5" />
                  {showFilters ? 'Ocultar Filtros' : 'Filtros'}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px] uppercase">
                      Activos
                    </Badge>
                  )}
                </Button>
                <Button size="sm" asChild className="h-8 text-xs gap-1.5">
                  <Link href="/estudiantes/nuevo">
                    <Plus className="size-3.5" />
                    Nueva Matrícula
                  </Link>
                </Button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-2 border-t pt-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nombre</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={filterNombre}
                      onChange={e => setFilterNombre(e.target.value)}
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">NIE</label>
                  <Input
                    placeholder="Número de NIE..."
                    value={filterNie}
                    onChange={e => setFilterNie(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</label>
                  <Select value={filterGrado || 'all'} onValueChange={v => setFilterGrado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos los grados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grados</SelectItem>
                      {GRADOS.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sección</label>
                  <Select value={filterSeccion || 'all'} onValueChange={v => setFilterSeccion(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {SECCIONES.map(s => (
                        <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Encargado</label>
                  <Input
                    placeholder="Nombre del encargado..."
                    value={filterEncargado}
                    onChange={e => setFilterEncargado(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</label>
                  <Input
                    placeholder="Número de teléfono..."
                    value={filterTelefono}
                    onChange={e => setFilterTelefono(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado de Pago</label>
                  <Select value={filterEstado || 'all'} onValueChange={v => setFilterEstado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos los estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="AL_DIA">Al día</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="INCOMPLETO">Incompleto / Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año Escolar</label>
                  <Select value={filterAnio} onValueChange={setFilterAnio}>
                    <SelectTrigger className="h-8 text-xs font-medium">
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end pb-0.5">
                  {(hasActiveFilters || filterAnio !== String(new Date().getFullYear())) && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 w-full gap-2 text-[11px] text-muted-foreground">
                      <X className="size-3.5" />
                      Limpiar filtros
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardHeader>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Nombre
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    NIE
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Grado / Sección
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Encargado
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Teléfono
                  </TableHead>
                  <TableHead className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="px-3 py-2">
                          <Skeleton className="h-3 w-full max-w-28" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : estudiantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <Empty className="min-h-40 rounded-none border-0">
                        <EmptyHeader>
                          <EmptyMedia variant="icon">
                            <Users />
                          </EmptyMedia>
                          <EmptyTitle>No se encontraron estudiantes</EmptyTitle>
                          <EmptyDescription>
                            Probá otro término de búsqueda o matriculá un nuevo estudiante.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEstudiantes.map(est => (
                    <TableRow key={est.id}>
                      <TableCell className="px-3 py-2 text-sm font-medium">{est.nombre}</TableCell>
                      <TableCell className="px-3 py-2 font-mono text-xs text-muted-foreground">{est.nie}</TableCell>
                      <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                        {est.grado} — {est.seccion}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                        {est.encargado || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm text-muted-foreground">
                        {est.telefono || '—'}
                      </TableCell>
                      <TableCell className="px-3 py-2">
                        <EstadoBadge talonarios={est.talonarios} activo={est.activo} />
                      </TableCell>
                      <TableCell className="px-3 py-2 text-right">
                        <div className="flex justify-end">
                          <EstudianteActions estudianteId={est.id} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            {loading ? (
              <div className="divide-y">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-3 p-4">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                ))}
              </div>
            ) : estudiantes.length === 0 ? (
              <Empty className="min-h-[12rem] rounded-none border-0">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Users />
                  </EmptyMedia>
                  <EmptyTitle>No se encontraron estudiantes</EmptyTitle>
                  <EmptyDescription>
                    Probá otro término de búsqueda o matriculá un nuevo estudiante.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {paginatedEstudiantes.map(est => (
                  <li key={est.id} className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{est.nombre}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{est.nie}</p>
                        </div>
                        <EstadoBadge talonarios={est.talonarios} activo={est.activo} />
                      </div>
                      <dl className="grid gap-1.5 text-sm text-muted-foreground">
                        <div className="flex flex-wrap gap-x-2">
                          <dt className="sr-only">Grado</dt>
                          <dd>
                            {est.grado} — {est.seccion}
                          </dd>
                        </div>
                        {(est.encargado || est.telefono) && (
                          <div className="flex flex-col gap-0.5">
                            {est.encargado && (
                              <div>
                                <span className="text-xs text-muted-foreground/80">Encargado: </span>
                                {est.encargado}
                              </div>
                            )}
                            {est.telefono && (
                              <div>
                                <span className="text-xs text-muted-foreground/80">Tel: </span>
                                {est.telefono}
                              </div>
                            )}
                          </div>
                        )}
                      </dl>
                      <EstudianteActions estudianteId={est.id} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {estudiantes.length > 0 && !loading && (
            <CardFooter className="border-t flex flex-col gap-3 py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-muted-foreground">
                Mostrando {startIdx + 1} a {Math.min(endIdx, totalItems)} de {totalItems} estudiante{totalItems !== 1 ? 's' : ''}
              </p>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 gap-0.5 px-1.5 text-xs"
                  >
                    ←{' '}
                    <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  
                  <div className="flex items-center gap-0.5">
                    {[...Array(totalPages)].map((_, idx) => {
                      const page = idx + 1
                      const isVisible = totalPages <= 7 || 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      if (!isVisible && idx > 0 && (idx === 1 || idx === totalPages - 2)) {
                        return <span key={`dots-${idx}`} className="px-0.5 text-muted-foreground text-[10px]">…</span>
                      }
                      
                      if (!isVisible) return null
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-7 w-6 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 gap-0.5 px-1.5 text-xs"
                  >
                    <span className="hidden sm:inline">Siguiente</span>
                    {' '}→
                  </Button>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
