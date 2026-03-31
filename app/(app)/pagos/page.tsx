// app/(app)/pagos/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Plus, Filter, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS } from '@/lib/utils'
import { useSession } from 'next-auth/react'

interface Pago {
  id: string
  monto: number
  tipo: string
  fecha: string
  notas: string | null
  estudiante: { nombre: string; nie: string; grado: string; seccion: string }
  comprobante: { mes: string | null }
}

interface Comprobante {
  id: string
  tipo: string
  mes: string | null
  monto: number
  pagado: boolean
}

interface Talonario {
  id: string
  anio: number
  comprobantes: Comprobante[]
}

export default function PagosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const searchParams = useSearchParams()

  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterFecha, setFilterFecha] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  // Form state
  const [nie, setNie] = useState('')
  const [estudiante, setEstudiante] = useState<any>(null)
  const [talonarios, setTalonarios] = useState<Talonario[]>([])
  const [selectedTalonario, setSelectedTalonario] = useState('')
  const [selectedComprobante, setSelectedComprobante] = useState('')
  const [notas, setNotas] = useState('')
  const [savingPago, setSavingPago] = useState(false)

  const fetchPagos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFecha) params.set('fecha', filterFecha)
      if (filterTipo) params.set('tipo', filterTipo)
      const estudianteId = searchParams.get('estudianteId')
      if (estudianteId) params.set('estudianteId', estudianteId)
      const res = await fetch(`/api/pagos?${params}`)
      const data = await res.json()
      setPagos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error cargando pagos')
    } finally {
      setLoading(false)
    }
  }, [filterFecha, filterTipo, searchParams])

  useEffect(() => { fetchPagos() }, [fetchPagos])

  const buscarEstudiante = async () => {
    if (!nie.trim()) return
    try {
      const res = await fetch(`/api/estudiantes?nie=${encodeURIComponent(nie)}`)
      const data = await res.json()
      if (data.length > 0) {
        setEstudiante(data[0])
        const talRes = await fetch(`/api/talonarios?estudianteId=${data[0].id}`)
        const talData = await talRes.json()
        setTalonarios(Array.isArray(talData) ? talData : [])
      } else {
        toast.error('Estudiante no encontrado con ese NIE')
        setEstudiante(null)
      }
    } catch {
      toast.error('Error buscando estudiante')
    }
  }

  const handleRegistrarPago = async () => {
    if (!estudiante || !selectedComprobante) {
      toast.error('Seleccione estudiante y comprobante')
      return
    }
    setSavingPago(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudianteId: estudiante.id,
          comprobanteId: selectedComprobante,
          notas,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pago registrado exitosamente')
        setShowForm(false)
        setNie(''); setEstudiante(null); setTalonarios([])
        setSelectedTalonario(''); setSelectedComprobante(''); setNotas('')
        fetchPagos()
      } else {
        toast.error(data.error || 'Error registrando pago')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingPago(false)
    }
  }

  const talonarioActual = talonarios.find(t => t.id === selectedTalonario)
  const comprobantesDisponibles = talonarioActual?.comprobantes.filter(c => !c.pagado) || []

  return (
    <div className="flex flex-col h-full">
      <Header title="Gestionar Pagos" subtitle="Registro y seguimiento de pagos" />

      <div className="flex-1 p-6 space-y-5">
        {/* Controls */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={filterFecha}
              onChange={e => setFilterFecha(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">Todos los tipos</option>
              {Object.entries(TIPO_PAGO_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {(filterFecha || filterTipo) && (
              <button onClick={() => { setFilterFecha(''); setFilterTipo('') }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
                <X className="w-4 h-4" /> Limpiar
              </button>
            )}
          </div>
          {(rol === 'COLECTOR' || rol === 'ADMINISTRATIVO') && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Pago
            </button>
          )}
        </div>

        {/* Payment form */}
        {showForm && (rol === 'COLECTOR' || rol === 'ADMINISTRATIVO') && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Registrar Nuevo Pago</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">NIE del Estudiante</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nie}
                    onChange={e => setNie(e.target.value)}
                    placeholder="Ej: 123456789"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={buscarEstudiante}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                    Buscar
                  </button>
                </div>
                {estudiante && (
                  <p className="text-xs text-emerald-600 mt-1 font-medium">✓ {estudiante.nombre}</p>
                )}
              </div>

              {talonarios.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Talonario</label>
                  <select
                    value={selectedTalonario}
                    onChange={e => { setSelectedTalonario(e.target.value); setSelectedComprobante('') }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Seleccionar año</option>
                    {talonarios.map(t => (
                      <option key={t.id} value={t.id}>Talonario {t.anio}</option>
                    ))}
                  </select>
                </div>
              )}

              {comprobantesDisponibles.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Comprobante</label>
                  <select
                    value={selectedComprobante}
                    onChange={e => setSelectedComprobante(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Seleccionar comprobante</option>
                    {comprobantesDisponibles.map(c => (
                      <option key={c.id} value={c.id}>
                        {TIPO_PAGO_LABELS[c.tipo]}{c.mes ? ` - ${c.mes}` : ''} (${c.monto.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Notas (opcional)</label>
                <input
                  type="text"
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  placeholder="Observaciones..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleRegistrarPago}
                disabled={savingPago || !selectedComprobante}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
              >
                {savingPago ? 'Guardando...' : 'Confirmar Pago'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Payments table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Historial de Pagos</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Estudiante', 'NIE', 'Tipo', 'Mes', 'Monto', 'Fecha', 'Notas'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                      ))}
                    </tr>
                  ))
                ) : pagos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No hay pagos para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  pagos.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.estudiante.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{p.estudiante.nie}</td>
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
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.notas || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pagos.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{pagos.length} pago{pagos.length !== 1 ? 's' : ''}</span>
              <span className="font-semibold text-gray-700">
                Total: {formatCurrency(pagos.reduce((sum, p) => sum + p.monto, 0))}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
