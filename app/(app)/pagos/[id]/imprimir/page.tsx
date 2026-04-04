'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatReceiptFolio, TIPO_PAGO_LABELS } from '@/lib/utils'

interface PagoDetalle {
  id: string
  tipo: string
  tipoPersonalizado?: string | null
  cantidad?: number | null
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

function toMoney(value: number) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function toSpanishDateUpper(value: string) {
  const date = new Date(value)
  const day = date.toLocaleDateString('es-SV', { day: '2-digit' })
  const month = date.toLocaleDateString('es-SV', { month: 'long' }).toUpperCase()
  const year = date.toLocaleDateString('es-SV', { year: 'numeric' })
  return `SAN SALVADOR, ${day} DE ${month} DE ${year}`
}

function numberToSpanishWords(value: number) {
  const units = [
    'CERO', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
    'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
  ]
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']

  function convertBelow100(n: number): string {
    if (n < 20) return units[n]
    if (n < 30) return n === 20 ? 'VEINTE' : `VEINTI${units[n - 20].toLowerCase()}`.toUpperCase()
    const t = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? tens[t] : `${tens[t]} Y ${units[u]}`
  }

  function convertBelow1000(n: number): string {
    if (n === 0) return 'CERO'
    if (n === 100) return 'CIEN'
    const h = Math.floor(n / 100)
    const rest = n % 100
    if (h === 0) return convertBelow100(rest)
    return rest === 0 ? hundreds[h] : `${hundreds[h]} ${convertBelow100(rest)}`
  }

  function convert(n: number): string {
    if (n < 1000) return convertBelow1000(n)
    if (n < 1000000) {
      const thousands = Math.floor(n / 1000)
      const rest = n % 1000
      const left = thousands === 1 ? 'MIL' : `${convertBelow1000(thousands)} MIL`
      return rest === 0 ? left : `${left} ${convertBelow1000(rest)}`
    }
    const millions = Math.floor(n / 1000000)
    const rest = n % 1000000
    const left = millions === 1 ? 'UN MILLON' : `${convert(millions)} MILLONES`
    return rest === 0 ? left : `${left} ${convert(rest)}`
  }

  const integer = Math.trunc(Math.abs(value))
  const cents = Math.round((Math.abs(value) - integer) * 100)
  const integerWords = convert(integer)
  const centsText = String(cents).padStart(2, '0')
  return `${integerWords} CON ${centsText}/100 DOLARES`
}

function extractCantidad(notas?: string | null) {
  const text = (notas || '').trim()
  if (!text) return 1

  const meta = text.match(/\[CANTIDAD:(\d{1,4})\]/i)
  if (meta?.[1]) {
    const n = Number(meta[1])
    if (Number.isFinite(n) && n > 0) return n
  }

  const patterns = [
    /cantidad\s*(de\s*)?personas?\s*[:=-]\s*(\d{1,3})/i,
    /cantidad\s*[:=-]\s*(\d{1,3})/i,
    /personas?\s*[:=-]\s*(\d{1,3})/i,
    /cant\.?\s*[:=-]\s*(\d{1,3})/i,
  ]

  for (const p of patterns) {
    const m = text.match(p)
    if (m?.[2]) {
      const n = Number(m[2])
      if (Number.isFinite(n) && n > 0) return n
    }
  }

  return 1
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

  const receiptData = useMemo(() => {
    if (!pago) return null

    // Compatibility path: use structured column first, then parse historical notes.
    const cantidad = pago.cantidad && pago.cantidad > 0
      ? pago.cantidad
      : extractCantidad(pago.notas)
    const unitario = pago.monto / Math.max(cantidad, 1)
    const tipoUpper = tipoLabel.toUpperCase()
    const concepto = pago.tipo === 'OTRO'
      ? (pago.tipoPersonalizado || 'PAGO VARIOS').toUpperCase()
      : `${tipoUpper}${pago.comprobante?.mes ? ` ${String(pago.comprobante.mes).toUpperCase()}` : ''}`

    const anio = pago.comprobante?.talonario?.anio || new Date(pago.fecha).getFullYear()
    const recibiDe = `${pago.estudiante.nombre} - ${pago.estudiante.grado} ${pago.estudiante.seccion}`.toUpperCase()
    const folioNumber = folio.replace('REC-', '').replaceAll('-', '')

    return {
      numero: folioNumber,
      titulo: `RECIBO DE ${tipoUpper}`,
      recibiDe,
      cantidadLetras: numberToSpanishWords(pago.monto),
      concepto: `${concepto} ${anio}`,
      cantidad,
      valorUnitario: unitario,
      total: pago.monto,
      fechaCiudad: toSpanishDateUpper(pago.fecha),
    }
  }, [pago, tipoLabel, folio])

  return (
    <div className="mx-auto w-full max-w-4xl p-4 sm:p-6 print:p-0">
      <style jsx global>{`
        @page {
          size: Letter portrait;
          margin: 0;
        }
        @media print {
          html,
          body {
            width: 8.5in !important;
            height: 11in !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
          body {
            background: #fff !important;
          }
          body * {
            visibility: hidden !important;
          }
          .print-page,
          .print-page * {
            visibility: visible !important;
          }
          .print-sheet,
          .print-sheet * {
            visibility: visible !important;
          }
          .no-print {
            display: none !important;
          }
          .print-page {
            position: fixed !important;
            inset: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .print-sheet {
            width: 8.5in !important;
            min-height: 5.5in !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
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
        <div className="print-page mx-auto flex min-h-[calc(100vh-2rem)] items-center justify-center print:min-h-0">
          <div className="print-sheet w-[8.5in] min-h-[5.5in] bg-white px-[0.6in] py-[0.45in] text-[16px] leading-[1.2] text-slate-900">
          <div className="mx-auto max-w-[7.2in]">
            <div className="mb-4 flex items-start justify-between">
              <div className="text-[18px] font-semibold">N° {receiptData?.numero}</div>
              <div className="pt-[1mm] text-center text-[18px] font-semibold tracking-wide">{receiptData?.titulo}</div>
              <div className="flex items-center gap-2 text-[18px]">
                <span className="font-semibold">POR:</span>
                <span className="inline-block min-w-[22mm] border-b border-slate-800 text-center">{toMoney(receiptData?.total || 0)}</span>
              </div>
            </div>

            <div className="mb-[4mm] flex items-end gap-2 text-[17px]">
              <span className="font-semibold">RECIBI DE:</span>
              <span className="inline-block flex-1 border-b border-slate-800 pb-[1mm]">{receiptData?.recibiDe}</span>
            </div>

            <div className="mb-[4mm] flex items-end gap-2 text-[17px]">
              <span className="font-semibold">LA CANTIDAD DE:</span>
              <span className="inline-block flex-1 border-b border-slate-800 pb-[1mm]">{receiptData?.cantidadLetras}</span>
            </div>

            <div className="mb-[2mm] text-[17px] font-semibold">EN CONCEPTO DE :</div>
            <div className="mb-[7mm] text-center text-[18px] font-medium">{receiptData?.concepto}</div>

            <div className="grid grid-cols-3 items-end text-center text-[17px] font-semibold">
              <div>CANTIDAD</div>
              <div>VALOR UNITARIO</div>
              <div>TOTAL</div>
            </div>

            <div className="mt-[2mm] grid grid-cols-3 items-end text-center text-[17px]">
              <div>{receiptData?.cantidad}</div>
              <div>${toMoney(receiptData?.valorUnitario || 0)}</div>
              <div>$ {toMoney(receiptData?.total || 0)}</div>
            </div>

            <div className="mt-[7mm] grid grid-cols-[1fr_auto_auto] items-end text-[18px]">
              <div className="text-right pr-[8mm] font-semibold">TOTAL</div>
              <div className="px-[4mm] font-semibold">$</div>
              <div className="min-w-[30mm] border-b border-slate-800 text-right font-semibold">{toMoney(receiptData?.total || 0)}</div>
            </div>

            <div className="mt-[12mm] text-[16px] font-medium">{receiptData?.fechaCiudad}</div>

            <div className="mt-[13mm] flex justify-end">
              <div className="w-[74mm] text-center">
                <div className="border-b border-slate-800" />
                <div className="pt-[2mm] text-[17px] font-semibold">COLECTURIA</div>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
