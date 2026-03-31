// app/(app)/talonarios/[id]/imprimir/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { TIPO_PAGO_LABELS, formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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

function ComprobanteCard({ comp, estudiante, anio }: { comp: Comprobante; estudiante: Talonario['estudiante']; anio: number }) {
  return (
    <div className="border-2 border-gray-800 p-4 rounded relative" style={{ minHeight: '180px' }}>
      <div className="text-center border-b border-gray-300 pb-2 mb-3">
        <p className="font-bold text-sm uppercase tracking-wide">Complejo Educativo Católico</p>
        <p className="font-bold text-base uppercase tracking-widest text-blue-800">ZACONATO</p>
        <p className="text-xs text-gray-500">Año Lectivo {anio}</p>
      </div>

      <div className={`absolute top-3 right-3 text-xs font-bold px-2 py-0.5 rounded ${
        comp.tipo === 'MATRICULA' ? 'bg-amber-100 text-amber-800' :
        comp.tipo === 'PAPELERIA' ? 'bg-purple-100 text-purple-800' :
        comp.tipo === 'COLEGIATURA' ? 'bg-blue-100 text-blue-800' :
        'bg-green-100 text-green-800'
      }`}>
        {TIPO_PAGO_LABELS[comp.tipo]}
      </div>

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

      {comp.pagado && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-emerald-500 text-emerald-500 rounded-full w-20 h-20 flex items-center justify-center rotate-[-20deg] opacity-40">
            <span className="font-black text-xs uppercase text-center leading-tight">PAGADO</span>
          </div>
        </div>
      )}

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

  if (loading) return <div className="flex items-center justify-center min-h-screen text-muted-foreground">Cargando...</div>
  if (!talonario || (talonario as any).error) return <div className="p-8 text-center text-muted-foreground">No encontrado</div>

  const comps = [...talonario.comprobantes].sort((a, b) => a.orden - b.orden)
  const pages: Comprobante[][] = []
  for (let i = 0; i < comps.length; i += 4) {
    pages.push(comps.slice(i, i + 4))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Controls bar - hidden on print */}
      <div className="no-print sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background px-4 py-3 shadow-xs sm:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 px-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href={`/talonarios/${id}`}>
              <ArrowLeft className="size-4" /> Volver
            </Link>
          </Button>
          <span className="text-border">|</span>
          <div>
            <p className="text-sm font-semibold">{talonario.estudiante.nombre}</p>
            <p className="text-xs text-muted-foreground">Talonario {talonario.anio} · {comps.length} comprobantes</p>
          </div>
        </div>
        <Button onClick={handlePrint}>
          <Printer className="size-4" />
          Imprimir
        </Button>
      </div>

      {/* Print pages */}
      <div className="py-6 px-4">
        {pages.map((page, pi) => (
          <div key={pi} className="print-page bg-white shadow-md rounded mx-auto mb-4" style={{ width: '21cm', minHeight: '29.7cm', padding: '1.5cm' }}>
            <div className="no-print border-b border-dashed border-gray-200 pb-3 mb-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">Página {pi + 1} de {pages.length}</p>
              <p className="text-xs text-gray-400">4 comprobantes por página</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {page.map(comp => (
                <ComprobanteCard
                  key={comp.id}
                  comp={comp}
                  estudiante={talonario.estudiante}
                  anio={talonario.anio}
                />
              ))}
              {page.length < 4 && [...Array(4 - page.length)].map((_, i) => (
                <div key={`empty-${i}`} className="border-2 border-dashed border-gray-200 rounded min-h-[180px]" />
              ))}
            </div>

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
