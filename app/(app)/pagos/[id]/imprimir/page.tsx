'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
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

function formatDateTime(value: string) {
  const date = new Date(value)
  return date.toLocaleString('es-SV', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ImprimirReciboPage() {
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

  const tipoLabel = useMemo(() => {
    if (!pago) return ''
    return pago.tipo === 'OTRO' ? (pago.tipoPersonalizado || 'Otro') : (TIPO_PAGO_LABELS[pago.tipo] || pago.tipo)
  }, [pago])

  const folio = useMemo(() => {
    if (!pago) return ''
    return formatReceiptFolio(pago.fecha, pago.id)
  }, [pago])

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 print:p-0">
      <style jsx global>{`
        @media print {
          body {
            background: #fff !important;
          }
          .no-print {
            display: none !important;
          }
          .print-card {
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="no-print mb-4 flex items-center justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href="/pagos">
            <ArrowLeft className="size-4" /> Volver
          </Link>
        </Button>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" /> Imprimir
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3 rounded-xl border bg-card p-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : !pago ? (
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No se pudo cargar el recibo.
        </div>
      ) : (
        <div className="print-card rounded-xl border bg-card p-6 sm:p-8">
          <div className="mb-6 border-b pb-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-bold">{pago.colegio?.nombre || 'Complejo Educativo Católico Zaconato'}</h1>
                <p className="text-sm text-muted-foreground">Recibo de Pago</p>
              </div>
              {pago.colegio?.logoUrl && (
                <img src={pago.colegio.logoUrl} alt="Logo colegio" className="h-14 w-14 rounded object-contain" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recibo</p>
              <p className="font-semibold">{folio}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha de generación</p>
              <p>{formatDateTime(pago.fecha)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Qué se pagó</p>
              <Badge className={cn('border', typeBadgeClass[pago.tipo] || '')}>{tipoLabel}</Badge>
              <p className="mt-1 text-sm text-muted-foreground">
                {pago.comprobante?.mes ? `Mes: ${pago.comprobante.mes}` : 'Pago manual sin comprobante'}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Monto</p>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(pago.monto)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quién pagó</p>
              <p className="font-medium">{pago.estudiante.encargado || pago.estudiante.nombre}</p>
              <p className="text-sm text-muted-foreground">
                Estudiante: {pago.estudiante.nombre} ({pago.estudiante.nie})
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quién generó el pago</p>
              <p className="font-medium">{pago.registrador?.nombre || 'Usuario del sistema'}</p>
              {pago.registrador?.email && <p className="text-sm text-muted-foreground">{pago.registrador.email}</p>}
            </div>
          </div>

          <div className="mt-5 border-t pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota</p>
            <p className="mt-1 text-sm">{pago.notas?.trim() ? pago.notas : 'Sin nota'}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 text-xs text-muted-foreground sm:grid-cols-2">
            <div className="border-t pt-3 text-center">Firma de quien recibe</div>
            <div className="border-t pt-3 text-center">Firma de quien entrega</div>
          </div>
        </div>
      )}
    </div>
  )
}
