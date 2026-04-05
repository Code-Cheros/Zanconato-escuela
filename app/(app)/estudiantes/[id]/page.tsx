// app/(app)/estudiantes/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Edit, BookOpen, CreditCard, User } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS, cn } from '@/lib/utils'
import { hasMoraColegiatura } from '@/lib/mora'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
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
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

export default function EstudianteDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [estudiante, setEstudiante] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 10

  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    Promise.all([
      fetch(`/api/estudiantes/${id}`).then(r => r.json()),
      fetch('/api/configuracion').then(r => r.json()).catch(() => null)
    ])
      .then(([est, conf]) => {
        setEstudiante(est)
        setConfig(conf)
        setLoading(false)
      })
      .catch(() => {
        toast.error('Error cargando datos')
        setLoading(false)
      })
  }, [id])

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header title="Cargando..." />
      <div className="flex-1 p-4 sm:p-6 space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  )

  if (!estudiante || estudiante.error) return (
    <div className="flex flex-col h-full">
      <Header title="No encontrado" />
      <div className="flex-1 flex items-center justify-center p-6">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon"><User /></EmptyMedia>
            <EmptyTitle>Estudiante no encontrado</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title={estudiante.nombre} subtitle={`NIE: ${estudiante.nie}`} />
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-6">
        <Button variant="ghost" size="sm" className="gap-1.5 px-0 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/estudiantes">
            <ArrowLeft className="size-4" /> Volver
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Info personal */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-primary" /> Datos Personales
                </CardTitle>
                {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                  <Button variant="ghost" size="icon-sm" asChild>
                    <Link href={`/estudiantes/${id}/editar`}>
                      <Edit className="size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <dl className="space-y-3 text-sm">
                {[
                  ['Nombre', estudiante.nombre],
                  ['NIE', estudiante.nie],
                  ['Grado', estudiante.grado],
                  ['Sección', estudiante.seccion],
                  ['Encargado', estudiante.encargado || '—'],
                  ['Teléfono', estudiante.telefono || '—'],
                  ['Matriculado', formatDate(estudiante.creadoEn)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2">
                    <dt className="text-muted-foreground shrink-0">{k}</dt>
                    <dd className="font-medium text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Pagos Administrativos y Extras */}
          <Card className="lg:col-span-1 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <CreditCard className="size-4 text-primary" /> Pagos Administrativos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-6 px-6">
              {!estudiante.comprobantes || estudiante.comprobantes.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Sin otros pagos pendientes</p>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const now = new Date()
                    const currMonth = now.getMonth()
                    const currYear = now.getFullYear()

                    const totalComprobantes = estudiante.comprobantes?.length || 0
                    const totalPages = Math.ceil(totalComprobantes / ITEMS_PER_PAGE)
                    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
                    const paginatedList = (estudiante.comprobantes || []).slice(startIdx, startIdx + ITEMS_PER_PAGE)

                    const groups: Record<string, any[]> = {}
                    paginatedList.forEach((c: any) => {
                      const y = String(c.talonario?.anio || 'Histórico')
                      if (!groups[y]) groups[y] = []
                      groups[y].push(c)
                    })

                    const sortedYears = Object.keys(groups).sort((a,b) => {
                      if (a === 'Histórico') return 1
                      if (b === 'Histórico') return -1
                      return parseInt(b) - parseInt(a)
                    })

                    return (
                      <>
                        {sortedYears.map(year => (
                          <div key={year} className="space-y-2">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">Año {year}</span>
                               <div className="h-px w-full bg-primary/10" />
                            </div>
                            <div className="space-y-1">
                              {groups[year].map((c: any) => {
                                const hasMora = hasMoraColegiatura({
                                  tipo: c.tipo,
                                  mes: c.mes,
                                  anio: c.talonario?.anio,
                                  usarMora: config?.usarMora,
                                  montoMora: config?.montoMora,
                                  diaLimitePago: config?.diaLimitePago,
                                })
                                return (
                                  <div key={c.id} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0 border-dashed border-muted/40">
                                    <div className="flex flex-col">
                                      <span className="text-[13px] font-medium leading-tight">
                                        {TIPO_PAGO_LABELS[c.tipo] || c.tipo}
                                        {c.mes ? ` — ${c.mes}` : ''}
                                      </span>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        {c.pagado && c.fechaPago && <span className="text-[10px] text-muted-foreground">{formatDate(c.fechaPago)}</span>}
                                        {!c.pagado && hasMora && (
                                          <span className="text-[10px] text-amber-600 font-medium">+ {formatCurrency(config.montoMora)} mora</span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex flex-col items-end">
                                        <span className={cn('text-[13px] font-bold tabular-nums', c.pagado ? 'text-emerald-600' : 'text-foreground')}>
                                          {formatCurrency(c.monto + (!c.pagado && hasMora ? config.montoMora : 0))}
                                        </span>
                                      </div>
                                      {c.pagado 
                                        ? <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[9px] h-4.5 px-1.5 py-0 shadow-none">Pagado</Badge>
                                        : <Badge variant="secondary" className="text-[9px] h-4.5 px-1.5 py-0 shadow-none font-medium">Pdte</Badge>
                                      }
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                        
                        {totalPages > 1 && (
                          <div className="flex items-center justify-between pt-4 border-t border-dashed mt-2">
                            <span className="text-[11px] text-muted-foreground font-medium">
                              Pág. {currentPage} de {totalPages}
                            </span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                                Ant.
                              </Button>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] px-2.5" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                                Sig.
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Talonarios (Colegiaturas) */}
          <Card className="lg:col-span-2 py-0 border-primary/20 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4 bg-primary/5 rounded-t-xl">
              <CardTitle className="flex items-center gap-2 text-sm text-primary font-bold">
                <BookOpen className="size-4" /> Talonario de Colegiaturas
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs text-primary" asChild>
                <Link href={`/talonarios?estudianteId=${id}`}>Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-4 pb-6 px-6">
              {estudiante.talonarios.length === 0 ? (
                <Empty className="border-0 min-h-[8rem]">
                  <EmptyHeader>
                    <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
                    <EmptyTitle>Sin talonarios</EmptyTitle>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="space-y-4">
                  {estudiante.talonarios.map((tal: any) => {
                    const pagados = tal.comprobantes.filter((c: any) => c.pagado).length
                    const total = tal.comprobantes.length
                    const pct = total > 0 ? Math.round((pagados / total) * 100) : 0
                    return (
                      <div key={tal.id} className="p-3 border rounded-lg hover:border-primary/30 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">Talonario {tal.anio}</span>
                          <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{pagados}/{total} meses pagados</Badge>
                        </div>
                        <Progress value={pct} className="h-1.5" />
                        <div className="flex justify-end mt-2">
                          <Button variant="link" size="sm" className="h-auto p-0 text-xs font-medium" asChild>
                            <Link href={`/talonarios/${tal.id}`}>Gestionar Pagos →</Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pagos recientes */}
        <Card className="py-0">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CreditCard className="size-4 text-primary" /> Pagos Registrados
            </CardTitle>
          </CardHeader>
          {estudiante.pagos.length === 0 ? (
            <Empty className="border-0 min-h-[8rem]">
              <EmptyHeader>
                <EmptyMedia variant="icon"><CreditCard /></EmptyMedia>
                <EmptyTitle>Sin pagos registrados</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {['Tipo', 'Monto', 'Fecha', 'Notas'].map(h => (
                    <TableHead key={h} className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {estudiante.pagos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-3 text-sm">{TIPO_PAGO_LABELS[p.tipo] || p.tipo}</TableCell>
                    <TableCell className="px-4 py-3 text-sm font-medium text-emerald-600">{formatCurrency(p.monto)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{formatDate(p.fecha)}</TableCell>
                    <TableCell className="px-4 py-3 text-sm text-muted-foreground">{p.notas || '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  )
}
