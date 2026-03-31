// app/(app)/estudiantes/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Edit, BookOpen, CreditCard, User } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS } from '@/lib/utils'
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

  useEffect(() => {
    fetch(`/api/estudiantes/${id}`)
      .then(r => r.json())
      .then(d => { setEstudiante(d); setLoading(false) })
      .catch(() => { toast.error('Error cargando estudiante'); setLoading(false) })
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

          {/* Talonarios */}
          <Card className="lg:col-span-2 py-0">
            <CardHeader className="flex flex-row items-center justify-between border-b px-6 py-4">
              <CardTitle className="flex items-center gap-2 text-sm">
                <BookOpen className="size-4 text-primary" /> Talonarios
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
                      <div key={tal.id}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Talonario {tal.anio}</span>
                          <Badge variant="secondary" className="text-xs">{pagados}/{total} comprobantes</Badge>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-xs" asChild>
                          <Link href={`/talonarios/${tal.id}`}>Ver detalle →</Link>
                        </Button>
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
