// app/(app)/dashboard/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Users, CheckCircle, FileText, TrendingUp, Plus, Search, Eye, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
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
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, estRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/estudiantes?${search ? `nombre=${encodeURIComponent(search)}` : ''}`),
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
  }, [search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
          <CardHeader className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <CardTitle className="text-base sm:text-lg">Gestión de Estudiantes</CardTitle>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[min(100%,20rem)] sm:flex-row sm:items-center sm:gap-3">
              <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  placeholder="Buscar por nombre, NIE o grado..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9"
                  autoComplete="off"
                />
              </div>
              <Button className="w-full shrink-0 sm:w-auto" asChild>
                <Link href="/estudiantes/nuevo">
                  <Plus className="size-4" />
                  Matricular Nuevo
                </Link>
              </Button>
            </div>
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
