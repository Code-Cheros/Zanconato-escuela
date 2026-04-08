'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Eye, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate, formatReceiptFolio, TIPO_PAGO_LABELS } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PagoDetalle {
  id: string
  tipo: string
  tipoPersonalizado?: string | null
  monto: number
  notas?: string | null
  fecha: string
  registradoPor: string
  estudiante: {
    nombre: string
    nie: string
    grado: string
    seccion: string
    encargado?: string | null
  }
  comprobante?: {
    mes?: string | null
    talonario?: { anio: number } | null
  } | null
  registrador?: {
    nombre: string
    email: string
    rol: string
  } | null
  colegio?: {
    nombre: string
    logoUrl?: string | null
  } | null
}

const typeBadgeClass: Record<string, string> = {
  COLEGIATURA: 'border-blue-200 bg-blue-50 text-blue-700',
  ALIMENTACION: 'border-green-200 bg-green-50 text-green-700',
  MATRICULA: 'border-amber-200 bg-amber-50 text-amber-700',
  PAPELERIA: 'border-purple-200 bg-purple-50 text-purple-700',
  OTRO: 'border-slate-200 bg-slate-50 text-slate-700',
}

export default function PagoDetallePage() {
  const params = useParams<{ id: string }>()
  const [pago, setPago] = useState<PagoDetalle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPago = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/pagos/${params.id}`)
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'No se pudo cargar el recibo')
          return
        }
        setPago(data)
      } catch {
        toast.error('Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) fetchPago()
  }, [params?.id])

  const tipoLabel = pago
    ? (pago.tipo === 'OTRO' ? (pago.tipoPersonalizado || 'Otro') : (TIPO_PAGO_LABELS[pago.tipo] || pago.tipo))
    : ''
  const folio = pago ? formatReceiptFolio(pago.fecha, pago.id) : ''

  return (
    <div className="flex flex-col h-full">
      <Header title="Detalle del Recibo" subtitle="Consulta de pago registrado" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" asChild>
            <Link href="/pagos">
              <ArrowLeft className="size-4" /> Volver a pagos
            </Link>
          </Button>

          {pago && (
            <Button size="sm" asChild>
              <Link href={`/pagos/${pago.id}/imprimir`}>
                <Printer className="size-4" /> Imprimir recibo
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="space-y-3 py-6">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ) : !pago ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No se encontró el recibo solicitado.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="size-4" /> Folio {folio}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Folio</p>
                  <p className="text-sm font-medium">{folio}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Colegio</p>
                  <p className="text-sm font-medium">{pago.colegio?.nombre || 'Complejo Educativo Católico Zanconato'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha de registro</p>
                  <p className="text-sm font-medium">{formatDate(pago.fecha)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estudiante</p>
                  <p className="text-sm font-medium">{pago.estudiante.nombre}</p>
                  <p className="text-xs text-muted-foreground">NIE: {pago.estudiante.nie} · {pago.estudiante.grado} {pago.estudiante.seccion}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pagado por</p>
                  <p className="text-sm font-medium">{pago.estudiante.encargado || pago.estudiante.nombre}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tipo de pago</p>
                  <Badge className={cn('border', typeBadgeClass[pago.tipo] || '')}>{tipoLabel}</Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monto</p>
                  <p className="text-sm font-semibold text-emerald-600">{formatCurrency(pago.monto)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Comprobante / Mes</p>
                  <p className="text-sm">{pago.comprobante?.mes || 'No aplica'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registrado por</p>
                  <p className="text-sm font-medium">{pago.registrador?.nombre || 'Usuario del sistema'}</p>
                  {pago.registrador?.email && (
                    <p className="text-xs text-muted-foreground">{pago.registrador.email}</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota</p>
                <p className="text-sm">{pago.notas?.trim() ? pago.notas : 'Sin nota'}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
