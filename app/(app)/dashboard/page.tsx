// app/(app)/dashboard/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Users, CheckCircle, FileText, TrendingUp, Plus, Search, Eye, CreditCard, Filter, X } from 'lucide-react'
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
  encargado: string | null
  telefono: string | null
  talonarios: Array<{ comprobantes: Array<{ pagado: boolean; tipo: string }> }>
}

function EstadoBadge({ talonarios }: { talonarios: Estudiante['talonarios'] }) {
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

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [filterNombre, setFilterNombre] = useState('')
  const [filterNie, setFilterNie] = useState('')
  const [filterGrado, setFilterGrado] = useState('')
  const [filterSeccion, setFilterSeccion] = useState('')
  const [filterEncargado, setFilterEncargado] = useState('')
  const [filterTelefono, setFilterTelefono] = useState('')
  const [filterEstado, setFilterEstado] = useState('')

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

      const [statsRes, estRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/estudiantes?${params.toString()}`),
      ])
      const statsData = await statsRes.json()
      const estData = await estRes.json()
      setStats(statsData)
      setEstudiantes(Array.isArray(estData) ? estData : [])
    } catch {
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [filterNombre, filterNie, filterGrado, filterSeccion, filterEncargado, filterTelefono, filterEstado])

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
  }

  const hasActiveFilters = filterNombre || filterNie || filterGrado || filterSeccion || filterEncargado || filterTelefono || filterEstado

  const statCards = stats
    ? [
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
        {
          label: 'Ingresos del Mes',
          value: formatCurrency(stats.ingresosMes),
          icon: TrendingUp,
          iconWrap: 'bg-amber-500 text-white',
        },
      ]
    : []

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Header title="Dashboard" subtitle="Resumen general del sistema" />

      <div className="flex-1 space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="py-4">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="size-10 shrink-0 rounded-lg" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {statCards.map(card => (
              <Card key={card.label} className="py-4">
                <CardContent className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-muted-foreground">{card.label}</p>
                    <p className="mt-1 truncate text-2xl font-bold tabular-nums">{card.value}</p>
                  </div>
                  <div
                    className={cn(
                      'flex size-10 shrink-0 items-center justify-center rounded-lg',
                      card.iconWrap
                    )}
                  >
                    <card.icon className="size-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Students */}
        <Card className="min-w-0 py-0">
          <CardHeader className="flex flex-col gap-4 border-b px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base sm:text-lg">Gestión de Estudiantes</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Button 
                  variant={showFilters ? "secondary" : "outline"} 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-2"
                >
                  <Filter className="size-4" />
                  {showFilters ? 'Ocultar Filtros' : 'Filtros'}
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[9px] uppercase">
                      Activos
                    </Badge>
                  )}
                </Button>
                <Button size="sm" asChild>
                  <Link href="/estudiantes/nuevo">
                    <Plus className="size-4" />
                    Nueva Matrícula
                  </Link>
                </Button>
              </div>
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 gap-3 border-t pt-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Nombre</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nombre..."
                      value={filterNombre}
                      onChange={e => setFilterNombre(e.target.value)}
                      className="h-9 pl-8 text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">NIE</label>
                  <Input
                    placeholder="Número de NIE..."
                    value={filterNie}
                    onChange={e => setFilterNie(e.target.value)}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</label>
                  <Select value={filterGrado || 'all'} onValueChange={v => setFilterGrado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-9 text-sm">
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
                    <SelectTrigger className="h-9 text-sm">
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
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</label>
                  <Input
                    placeholder="Número de teléfono..."
                    value={filterTelefono}
                    onChange={e => setFilterTelefono(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado de Pago</label>
                  <Select value={filterEstado || 'all'} onValueChange={v => setFilterEstado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-9 text-sm">
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
                <div className="flex items-end pb-0.5">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 w-full gap-2 text-muted-foreground">
                      <X className="size-4" />
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
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Nombre
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    NIE
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Grado / Sección
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Encargado
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Teléfono
                  </TableHead>
                  <TableHead className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Estado
                  </TableHead>
                  <TableHead className="px-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(7)].map((_, j) => (
                        <TableCell key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-32" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : estudiantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <Empty className="min-h-48 rounded-none border-0">
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
                  estudiantes.map(est => (
                    <TableRow key={est.id}>
                      <TableCell className="px-4 py-3 font-medium">{est.nombre}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-muted-foreground">{est.nie}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {est.grado} — {est.seccion}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {est.encargado || '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        {est.telefono || '—'}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <EstadoBadge talonarios={est.talonarios} />
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
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
                {estudiantes.map(est => (
                  <li key={est.id} className="p-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium leading-snug">{est.nombre}</p>
                          <p className="mt-0.5 font-mono text-xs text-muted-foreground">{est.nie}</p>
                        </div>
                        <EstadoBadge talonarios={est.talonarios} />
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
            <CardFooter className="border-t py-3 text-xs text-muted-foreground">
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} encontrado
              {estudiantes.length !== 1 ? 's' : ''}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
