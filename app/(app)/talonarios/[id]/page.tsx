// app/(app)/talonarios/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Printer, CheckCircle, Circle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, TIPO_PAGO_LABELS, formatDate } from '@/lib/utils'

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
      <div className="flex-1 p-6"><div className="bg-white rounded-xl h-96 animate-pulse" /></div>
    </div>
  )

  if (!talonario || talonario.error) return (
    <div className="flex flex-col h-full">
      <Header title="No encontrado" />
      <div className="flex-1 p-6 text-center text-gray-400 py-16">Talonario no encontrado</div>
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
      <Header title={`Talonario ${talonario.anio}`} subtitle={talonario.estudiante.nombre} />
      <div className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <Link href="/talonarios" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <Link href={`/talonarios/${id}/imprimir`}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Printer className="w-4 h-4" /> Imprimir Talonario
          </Link>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Talonario', value: formatCurrency(totalMonto), color: 'text-gray-900' },
            { label: 'Pagado', value: formatCurrency(montoPagado), color: 'text-emerald-600' },
            { label: 'Pendiente', value: formatCurrency(pendiente), color: 'text-amber-600' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-xl border border-gray-100 shadow-xs p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Comprobantes by type */}
        {Object.entries(grupos).map(([tipo, comps]) => {
          if (comps.length === 0) return null
          const labelColors: Record<string, string> = {
            MATRICULA: 'bg-amber-50 border-amber-200 text-amber-800',
            PAPELERIA: 'bg-purple-50 border-purple-200 text-purple-800',
            COLEGIATURA: 'bg-blue-50 border-blue-200 text-blue-800',
            ALIMENTACION: 'bg-green-50 border-green-200 text-green-800',
          }
          return (
            <div key={tipo} className="bg-white rounded-xl border border-gray-100 shadow-xs">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${labelColors[tipo]}`}>
                  {TIPO_PAGO_LABELS[tipo]}
                </span>
                <span className="text-xs text-gray-500">
                  {comps.filter(c => c.pagado).length}/{comps.length} pagados
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {comps.map((c: any) => (
                  <div key={c.id} className="px-5 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {c.pagado
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                      }
                      <span className="text-sm text-gray-700">
                        {TIPO_PAGO_LABELS[c.tipo]}{c.mes ? ` — ${c.mes}` : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      {c.pagado && c.fechaPago && (
                        <span className="text-xs text-gray-400">{formatDate(c.fechaPago)}</span>
                      )}
                      <span className={`font-semibold ${c.pagado ? 'text-emerald-600' : 'text-gray-600'}`}>
                        {formatCurrency(c.monto)}
                      </span>
                      {c.pagado
                        ? <span className="badge-paid text-xs">Pagado</span>
                        : <span className="badge-pending text-xs">Pendiente</span>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
