// app/(app)/talonarios/[id]/imprimir/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Printer, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { TIPO_PAGO_LABELS } from '@/lib/utils'
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

function getBarcodeBars(seed: string) {
  const bars: number[] = []
  let hash = 0
  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  for (let index = 0; index < 24; index += 1) {
    const value = (hash >> (index % 16)) & 3
    bars.push(value === 0 ? 1 : value === 1 ? 2 : value === 2 ? 3 : 1)
  }

  return bars
}

function getSeededNumber(seed: string, digits = 4) {
  let hash = 0

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  }

  const minimum = 10 ** (digits - 1)
  const maximum = 10 ** digits

  return String((hash % (maximum - minimum)) + minimum)
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('es-SV', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatMoneyCompact(amount: number) {
  return `$${Number(amount.toFixed(2)).toString()}`
}

function formatShortDate(date: string | null) {
  if (!date) return ''

  return new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase()
}

function getPeriodoLabel(comp: Comprobante, anio: number) {
  if (comp.tipo === 'MATRICULA') return `Matrícula ${anio}`
  if (comp.tipo === 'PAPELERIA') return `Papelería ${anio}`
  if (comp.mes) return `${comp.mes} ${anio}`
  return `Enero ${anio}`
}

function Barcode({ value }: { value: string }) {
  const bars = getBarcodeBars(value)

  return (
    <div className="flex items-end gap-[1px] rounded border border-slate-300 bg-white px-1 py-1">
      {bars.map((width, index) => (
        <span
          key={`${value}-${index}`}
          className="bg-slate-900"
          style={{ width: `${width}px`, height: `${16 + (index % 3) * 4}px` }}
        />
      ))}
    </div>
  )
}

function SlipCopy({
  copyTitle,
  estudiante,
  anio,
  comp,
  talonarioCode,
  logoUrl,
  showExtras,
  mostrarMora,
  montoMora,
}: {
  copyTitle: string
  estudiante: Talonario['estudiante']
  anio: number
  comp: Comprobante
  talonarioCode: string
  logoUrl?: string | null
  showExtras: boolean
  mostrarMora: boolean
  montoMora: number
}) {
  const tipo = TIPO_PAGO_LABELS[comp.tipo]
  const concepto = comp.mes ? `${tipo} ${comp.mes} ${anio}` : tipo
  const numeroRecibo = talonarioCode
  const fecha = showExtras ? formatShortDate(comp.fechaPago) || new Date().toLocaleDateString('es-SV') : new Intl.DateTimeFormat('es-SV', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date())
  const cuota = formatMoney(comp.monto)
  const showMoraForThisType = comp.tipo === 'MATRICULA' || comp.tipo === 'COLEGIATURA'
  const finalMostrarMora = mostrarMora && showMoraForThisType
  const mora = formatMoneyCompact(comp.monto + montoMora)
  const nombre = normalizeText(estudiante.nombre)
  const grado = estudiante.grado || '9'
  const seccion = estudiante.seccion || 'A'
  const sede = 'CENTRAL'
  const turno = 'Matutino'
  const periodo = getPeriodoLabel(comp, anio)

  return (
    <div className="flex h-full flex-col justify-between bg-white px-2.5 py-2 text-[#26485d]">
      <div>
        <div className="flex items-start gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="mt-0.5 h-8 w-8 shrink-0 object-contain" />
          ) : (
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full border border-[#5b86a1] bg-white/70" />
          )}
          <div className="min-w-0 flex-1 text-center">
            <p className="text-[11px] font-semibold leading-tight text-[#467a98]">Complejo Educativo Católico</p>
            <p className="text-[11px] font-semibold leading-tight text-[#467a98]">Padre Mario Zanconato</p>
            <p className="text-[10px] font-semibold leading-tight text-[#467a98]">{periodo}</p>
          </div>
        </div>

        <div className="mt-2 space-y-0.5 text-[10px] font-semibold leading-tight text-[#2f5268]">
          <div><span className="font-bold">Talonario:</span> {numeroRecibo}</div>
          <div><span className="font-bold">Nombre:</span> {nombre}</div>
          <div><span className="font-bold">Grado:</span> {grado}</div>
          <div><span className="font-bold">Sección:</span> &quot;{seccion}&quot;</div>
          <div><span className="font-bold">Sede:</span> {sede}</div>
        </div>

        <div className="mt-2 space-y-0.5 text-[10px] font-semibold leading-tight text-[#2f5268]">
          <div><span className="font-bold">Cuota Tercer Ciclo Matutino:</span></div>
          <div>{cuota}</div>
        </div>
      </div>

      <div className="space-y-0.5 pt-1 text-[9px] font-semibold leading-tight text-[#2f5268]">
        <p className="pt-1 text-[14px] font-black uppercase tracking-tight text-[#295c7a]">{copyTitle}</p>
      </div>

      <div className="flex items-end justify-between gap-3 pt-1">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-black uppercase tracking-wide text-[#295c7a]">ORIGINAL:</div>
          <div className="text-[11px] font-black uppercase tracking-wide text-[#295c7a]">{copyTitle}</div>
        </div>
        <div className="-mt-2 flex shrink-0 flex-col items-center gap-0.5 text-right">
          {showExtras ? (
            <>
              <div className="mb-0.5 text-[10px] font-semibold text-[#2f5268]">
                <span className="font-bold">Última fecha de pago</span> {fecha}
              </div>
              {finalMostrarMora ? (
                <div className="text-[10px] font-semibold text-[#2f5268]">
                  <span className="font-bold">Monto con mora:</span> {mora}
                </div>
              ) : null}
              <div className="text-[10px] font-semibold text-[#2f5268]"><span className="font-bold">Turno:</span> {turno}</div>
            </>
          ) : null}
          <div className="text-[9px] font-semibold text-[#2f5268]">{tipo} {comp.mes ? `${comp.mes} ${anio}` : ''} {cuota}</div>
          <Barcode value={`${comp.id}-${copyTitle}-${talonarioCode}`} />
          <div className="text-[9px] font-bold tracking-[0.2em] text-[#2f5268]">{getSeededNumber(`${comp.id}-${copyTitle}`, 5)}</div>
        </div>
      </div>
    </div>
  )
}

function ComprobanteCard({
  comp,
  estudiante,
  anio,
  logoUrl,
  mostrarMora,
  montoMora,
}: {
  comp: Comprobante
  estudiante: Talonario['estudiante']
  anio: number
  logoUrl?: string | null
  mostrarMora: boolean
  montoMora: number
}) {
  const talonarioCode = getSeededNumber(`${comp.id}-${anio}-${estudiante.nie}`)

  return (
    <div className="relative h-[58mm] overflow-hidden rounded-[2px] border border-[#aac1d0] bg-white text-slate-900 print-slip">
      <div className="grid h-full grid-cols-[35%_65%] divide-x divide-dashed divide-[#a8bfd0]">
        <SlipCopy
          copyTitle="ORIGINAL ESTUDIANTE"
          estudiante={estudiante}
          anio={anio}
          comp={comp}
          talonarioCode={talonarioCode}
          logoUrl={logoUrl}
          showExtras={false}
          mostrarMora={mostrarMora}
          montoMora={montoMora}
        />
        <SlipCopy
          copyTitle="ORIGINAL COLEGIO"
          estudiante={estudiante}
          anio={anio}
          comp={comp}
          talonarioCode={talonarioCode}
          logoUrl={logoUrl}
          showExtras
          mostrarMora={mostrarMora}
          montoMora={montoMora}
        />
      </div>

      {comp.pagado && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-emerald-500 opacity-25 rotate-[-18deg]">
            <span className="text-[9px] font-black uppercase leading-tight text-emerald-600">PAGADO</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ImprimirTalonarioPage() {
  const { id } = useParams()
  const [talonario, setTalonario] = useState<Talonario | null>(null)
  const [loading, setLoading] = useState(true)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [usarMora, setUsarMora] = useState(false)
  const [montoMora, setMontoMora] = useState(0)

  useEffect(() => {
    Promise.all([
      fetch(`/api/talonarios/${id}`).then(r => r.json()),
      fetch('/api/configuracion').then(r => r.json()).catch(() => null),
    ])
      .then(([tal, conf]) => {
        setTalonario(tal)
        setLogoUrl(conf?.logoUrl || null)
        setUsarMora(Boolean(conf?.usarMora))
        setMontoMora(Number(conf?.montoMora ?? 0))
        setLoading(false)
      })
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
      <div className="p-3 sm:p-4">
        {pages.map((page, pi) => (
          <div key={pi} className="print-page mx-auto mb-4 bg-white shadow-md" style={{ width: '210mm', minHeight: '297mm', padding: '8mm' }}>
            <div className="no-print mb-3 flex items-center justify-between border-b border-dashed border-gray-200 pb-2">
              <p className="text-xs text-gray-400">Página {pi + 1} de {pages.length}</p>
              <p className="text-xs text-gray-400">4 comprobantes por página</p>
            </div>

            <div className="flex flex-col gap-[4mm]">
              {page.map(comp => (
                <ComprobanteCard
                  key={comp.id}
                  comp={comp}
                  estudiante={talonario.estudiante}
                  anio={talonario.anio}
                  logoUrl={logoUrl}
                  mostrarMora={usarMora && montoMora > 0}
                  montoMora={montoMora}
                />
              ))}
              {page.length < 4 && [...Array(4 - page.length)].map((_, i) => (
                <div key={`empty-${i}`} className="h-[58mm] rounded border border-dashed border-gray-200" />
              ))}
            </div>

            <div className="mt-4 border-t border-gray-200 pt-2 text-center text-[9px] text-gray-400">
              Complejo Educativo Católico Zaconato · Talonario {talonario.anio} · {talonario.estudiante.nombre}
            </div>
          </div>
        ))}
      </div>

      <style jsx global>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          [data-slot="sidebar-wrapper"] [data-slot="sidebar"],
          [data-slot="sidebar-wrapper"] [data-slot="sidebar-gap"],
          [data-slot="sidebar-wrapper"] header {
            display: none !important;
          }
          [data-slot="sidebar-wrapper"] [data-slot="sidebar-inset"] {
            min-height: auto !important;
            background: white !important;
          }
          .print-page {
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            page-break-after: always;
            width: 100% !important;
            min-height: auto !important;
          }
          .print-page:last-child { page-break-after: avoid; }
          .print-slip {
            break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  )
}
