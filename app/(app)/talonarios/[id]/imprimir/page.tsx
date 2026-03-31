// app/(app)/talonarios/[id]/imprimir/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { TIPO_PAGO_LABELS, formatCurrency } from '@/lib/utils'

interface Comprobante {
  id: string
  tipo: string
  mes: string | null
  monto: number
  pagado: boolean
  fechaPago: string | null
  orden: number
}

interface Talonario {
  id: string
  anio: number
  estudiante: {
    nombre: string
    nie: string
    grado: string
    seccion: string
    encargado: string | null
  }
  comprobantes: Comprobante[]
}

function ComprobanteCard({ comp, estudiante, anio }: { comp: Comprobante; estudiante: any; anio: number }) {
  return (
    <div className="border-2 border-gray-800 p-4 rounded relative" style={{ minHeight: '180px' }}>
      {/* Header */}
      <div className="text-center border-b border-gray-300 pb-2 mb-3">
        <p className="font-bold text-sm uppercase tracking-wide">Complejo Educativo Católico</p>
        <p className="font-bold text-base uppercase tracking-widest text-blue-800">ZACONATO</p>
        <p className="text-xs text-gray-500">Año Lectivo {anio}</p>
      </div>

      {/* Tipo badge */}
      <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded ${
        comp.tipo === 'MATRICULA' ? 'bg-amber-100 text-amber-800' :
        comp.tipo === 'PAPELERIA' ? 'bg-purple-100 text-purple-800' :
        comp.tipo === 'COLEGIATURA' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      }`}>
        {TIPO_PAGO_LABELS[comp.tipo]}
      </div>

      {/* Data */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-500">Estudiante:</span>
          <span className="font-semibold text-right max-w-[140px] truncate">{estudiante.nombre}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">NIE:</span>
          <span className="font-mono font-semibold">{estudiante.nie}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Grado:</span>
          <span className="font-semibold">{estudiante.grado} — {estudiante.seccion}</span>
        </div>
        {comp.mes && (
          <div className="flex justify-between">
            <span className="text-gray-500">Período:</span>
            <span className="font-semibold">{comp.mes} {anio}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-300">
          <span className="text-gray-600 font-medium">Monto a pagar:</span>
          <span className="text-xl font-bold text-blue-800">{formatCurrency(comp.monto)}</span>
        </div>
      </div>

      {/* Status stamp */}
      {comp.pagado && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-emerald-500 text-emerald-500 rounded-full w-20 h-20 flex items-center justify-center rotate-[-20deg] opacity-40">
            <span className="font-black text-xs uppercase text-center leading-tight">
              PAGADO
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="absolute bottom-2 left-4 right-4 flex justify-between text-[9px] text-gray-400">
        <span>Firma: _______________</span>
        <span>Sello</span>
      </div>
    </div>
  )
}

export default function ImprimirTalonarioPage() {
  const { id } = useParams()
  const [talonario, setTalonario] = useState<Talonario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/talonarios/${id}`)
      .then(r => r.json())
      .then(d => { setTalonario(d); setLoading(false) })
      .catch(() => { toast.error('Error'); setLoading(false) })
  }, [id])

  const handlePrint = () => window.print()

  if (loading) return <div className="flex items-center justify-center min-h-screen">Cargando...</div>
  if (!talonario || (talonario as any).error) return <div className="p-8 text-center text-gray-400">No encontrado</div>

  // Group into pages of 4
  const comps = [...talonario.comprobantes].sort((a, b) => a.orden - b.orden)
  const pages: Comprobante[][] = []
  for (let i = 0; i < comps.length; i += 4) {
    pages.push(comps.slice(i, i + 4))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Controls - hidden on print */}
      <div className="no-print bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href={`/talonarios/${id}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <span className="text-gray-300">|</span>
          <div>
            <p className="text-sm font-semibold text-gray-900">{talonario.estudiante.nombre}</p>
            <p className="text-xs text-gray-500">Talonario {talonario.anio} · {comps.length} comprobantes</p>
          </div>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* Print pages */}
      <div className="py-6 px-4">
        {pages.map((page, pi) => (
          <div key={pi} className="print-page bg-white shadow-md rounded mx-auto mb-4" style={{ width: '21cm', minHeight: '29.7cm', padding: '1.5cm' }}>
            {/* Page header */}
            <div className="no-print border-b border-dashed border-gray-200 pb-3 mb-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">Página {pi + 1} de {pages.length}</p>
              <p className="text-xs text-gray-400">{4} comprobantes por página</p>
            </div>

            {/* 2x2 grid */}
            <div className="grid grid-cols-2 gap-4">
              {page.map((comp) => (
                <ComprobanteCard
                  key={comp.id}
                  comp={comp}
                  estudiante={talonario.estudiante}
                  anio={talonario.anio}
                />
              ))}
              {/* Fill empty slots */}
              {page.length < 4 && [...Array(4 - page.length)].map((_, i) => (
                <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200 rounded min-h-[180px]" />
              ))}
            </div>

            {/* Page footer */}
            <div className="mt-6 pt-3 border-t border-gray-200 text-center text-xs text-gray-400">
              Complejo Educativo Católico Zaconato · Talonario {talonario.anio} · {talonario.estudiante.nombre}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            page-break-after: always;
            width: 100% !important;
          }
          .print-page:last-child { page-break-after: avoid; }
        }
      `}</style>
    </div>
  )
}
