// app/(app)/talonarios/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Printer, CheckCircle, Circle, BookOpen } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, TIPO_PAGO_LABELS, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'

const typeBadgeClass: Record<string, string> = {
  MATRICULA: 'border-amber-200 bg-amber-50 text-amber-800',
  PAPELERIA: 'border-purple-200 bg-purple-50 text-purple-800',
  COLEGIATURA: 'border-blue-200 bg-blue-50 text-blue-800',
  ALIMENTACION: 'border-green-200 bg-green-50 text-green-800',
}

export default function TalonarioDetailPage() {
  const { id } = useParams()
  const [talonario, setTalonario] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/talonarios/${id}`)
      .then(r => r.json())
      .then(d => { setTalonario(d); setLoading(false) })
      .catch(() => { toast.error('Error'); setLoading(false) })
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

  if (!talonario || talonario.error) return (
    <div className="flex flex-col h-full">
      <Header title="No encontrado" />
      <div className="flex-1 flex items-center justify-center p-6">
        <Empty className="border-0">
          <EmptyHeader>
            <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
            <EmptyTitle>Talonario no encontrado</EmptyTitle>
          </EmptyHeader>
        </Empty>
      </div>
    </div>
  )

  const grupos: Record<string, any[]> = {
    MATRICULA: [], PAPELERIA: [], COLEGIATURA: [], ALIMENTACION: [],
  }
  for (const c of talonario.comprobantes) {
    if (grupos[c.tipo]) grupos[c.tipo].push(c)
  }

  const totalMonto = talonario.comprobantes.reduce((s: number, c: any) => s + c.monto, 0)
  const montoPagado = talonario.comprobantes.filter((c: any) => c.pagado).reduce((s: number, c: any) => s + c.monto, 0)
  const pendiente = totalMonto - montoPagado

  return (
    <div className="flex flex-col h-full">
      <Header 
        title={`Talonario ${talonario.anio}`} 
        subtitle={`${talonario.estudiante.nombre} — ${talonario.grado || talonario.estudiante.grado} ${talonario.seccion || talonario.estudiante.seccion}`} 
      />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 px-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/talonarios">
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link href={`/talonarios/${id}/imprimir`}>
              <Printer className="size-4" /> Imprimir Talonario
            </Link>
          </Button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: 'Total Talonario', value: formatCurrency(totalMonto), className: '' },
            { label: 'Pagado', value: formatCurrency(montoPagado), className: 'text-emerald-600' },
            { label: 'Pendiente', value: formatCurrency(pendiente), className: 'text-amber-600' },
          ].map(item => (
            <Card key={item.label} className="py-3 text-center">
              <CardContent className="px-3 py-0">
                <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                <p className={cn('text-lg font-bold tabular-nums sm:text-xl', item.className)}>{item.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comprobantes by type */}
        {Object.entries(grupos).map(([tipo, comps]) => {
          if (comps.length === 0) return null
          return (
            <Card key={tipo} className="py-0">
              <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3">
                <Badge className={cn('border font-semibold', typeBadgeClass[tipo])}>
                  {TIPO_PAGO_LABELS[tipo]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {comps.filter((c: any) => c.pagado).length}/{comps.length} pagados
                </span>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {comps.map((c: any, idx: number) => (
                    <li key={c.id}>
                      <div className="flex items-center justify-between px-5 py-3 gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {c.pagado
                            ? <CheckCircle className="size-4 shrink-0 text-emerald-500" />
                            : <Circle className="size-4 shrink-0 text-muted-foreground/40" />
                          }
                          <span className="text-sm text-foreground truncate">
                            {TIPO_PAGO_LABELS[c.tipo]}{c.mes ? ` — ${c.mes}` : ''}
                          </span>
                        </div>
                        <div className="flex shrink-0 items-center gap-3 text-sm">
                          {c.pagado && c.fechaPago && (
                            <span className="hidden text-xs text-muted-foreground sm:inline">{formatDate(c.fechaPago)}</span>
                          )}
                          <span className={cn('font-semibold tabular-nums', c.pagado ? 'text-emerald-600' : 'text-foreground')}>
                            {formatCurrency(c.monto)}
                          </span>
                          {c.pagado
                            ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-800 text-xs">Pagado</Badge>
                            : <Badge variant="secondary" className="text-xs">Pendiente</Badge>
                          }
                        </div>
                      </div>
                      {idx < comps.length - 1 && <Separator />}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
