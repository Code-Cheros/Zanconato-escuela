// app/(app)/reportes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { Download, FileSpreadsheet, FileText, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS } from '@/lib/utils'

interface ReporteData {
  fecha: string
  pagos: any[]
  resumen: Record<string, number>
  total: number
  cantidad: number
}

export default function ReportesPage() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [reporte, setReporte] = useState<ReporteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState<string | null>(null)

  const fetchReporte = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reportes/diario?fecha=${fecha}`)
      if (res.ok) {
        const data = await res.json()
        setReporte(data)
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error cargando reporte')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReporte() }, [fecha])

  const handleDownload = async (tipo: 'excel' | 'pdf') => {
    setDownloading(tipo)
    try {
      const url = tipo === 'excel'
        ? `/api/reportes/exportar/excel?fecha=${fecha}`
        : `/api/reportes/exportar/pdf?fecha=${fecha}`

      const res = await fetch(url)
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || 'Error descargando')
        return
      }

      const blob = await res.blob()
      const ext = tipo === 'excel' ? 'xlsx' : 'html'
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `reporte-${fecha}.${ext}`
      link.click()
      URL.revokeObjectURL(link.href)
      toast.success(`Reporte ${tipo === 'excel' ? 'Excel' : 'PDF'} descargado`)
    } catch {
      toast.error('Error al descargar')
    } finally {
      setDownloading(null)
    }
  }

  const resumenItems = reporte ? [
    { tipo: 'COLEGIATURA', label: 'Colegiatura', emoji: '💰', color: 'border-blue-200 bg-blue-50', text: 'text-blue-700' },
    { tipo: 'ALIMENTACION', label: 'Alimentación', emoji: '🍽️', color: 'border-green-200 bg-green-50', text: 'text-green-700' },
    { tipo: 'MATRICULA', label: 'Matrícula', emoji: '📋', color: 'border-amber-200 bg-amber-50', text: 'text-amber-700' },
    { tipo: 'PAPELERIA', label: 'Papelería', emoji: '📦', color: 'border-purple-200 bg-purple-50', text: 'text-purple-700' },
  ] : []

  return (
    <div className="flex flex-col h-full">
      <Header title="Reportes" subtitle="Análisis y exportación de datos financieros" />

      <div className="flex-1 p-6 space-y-5">
        {/* Controls */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Seleccionar Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownload('excel')}
                disabled={downloading !== null || !reporte || reporte.cantidad === 0}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {downloading === 'excel' ? 'Descargando...' : 'Descargar Excel'}
              </button>
              <button
                onClick={() => handleDownload('pdf')}
                disabled={downloading !== null || !reporte || reporte.cantidad === 0}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-medium px-4 py-2.5 rounded-lg text-sm transition-colors"
              >
                <FileText className="w-4 h-4" />
                {downloading === 'pdf' ? 'Descargando...' : 'Descargar PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Resumen cards */}
        {reporte && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {resumenItems.map(item => (
                <div key={item.tipo} className={`border rounded-xl p-4 ${item.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{item.emoji}</span>
                    <span className={`text-xs font-semibold ${item.text}`}>{item.label}</span>
                  </div>
                  <p className={`text-2xl font-bold ${item.text}`}>
                    {formatCurrency(reporte.resumen[item.tipo] || 0)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="bg-blue-700 rounded-xl p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 opacity-80" />
                <div>
                  <p className="text-blue-200 text-sm">Total del Día</p>
                  <p className="text-xs text-blue-300">{reporte.cantidad} transacciones · {fecha}</p>
                </div>
              </div>
              <p className="text-3xl font-bold">{formatCurrency(reporte.total)}</p>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Detalle de Pagos</h2>
                <span className="text-xs text-gray-500">{reporte.cantidad} registros</span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-400 text-sm">Cargando...</div>
              ) : reporte.pagos.length === 0 ? (
                <div className="p-12 text-center text-gray-400 text-sm">
                  No hay pagos registrados para {fecha}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        {['#', 'Estudiante', 'NIE', 'Grado', 'Tipo', 'Mes', 'Monto', 'Hora'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reporte.pagos.map((p: any, i: number) => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.estudiante.nombre}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 font-mono">{p.estudiante.nie}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.estudiante.grado} {p.estudiante.seccion}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.tipo === 'COLEGIATURA' ? 'bg-blue-100 text-blue-700' :
                              p.tipo === 'ALIMENTACION' ? 'bg-green-100 text-green-700' :
                              p.tipo === 'MATRICULA' ? 'bg-amber-100 text-amber-700' :
                              'bg-purple-100 text-purple-700'
                            }`}>
                              {TIPO_PAGO_LABELS[p.tipo]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.comprobante?.mes || '—'}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{formatCurrency(p.monto)}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(p.fecha).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 border-t border-gray-200">
                        <td colSpan={6} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                          Total del día:
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-emerald-600 text-left">
                          {formatCurrency(reporte.total)}
                        </td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
