// app/(app)/talonarios/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Plus, BookOpen, Printer, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, TIPO_PAGO_LABELS, GRADOS, SECCIONES, MESES } from '@/lib/utils'
import Link from 'next/link'

export default function TalonariosPage() {
  const searchParams = useSearchParams()
  const [talonarios, setTalonarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nie, setNie] = useState('')
  const [estudiante, setEstudiante] = useState<any>(null)
  const [anio, setAnio] = useState(String(new Date().getFullYear()))
  const [saving, setSaving] = useState(false)

  const estudianteId = searchParams.get('estudianteId')

  const fetchTalonarios = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (estudianteId) params.set('estudianteId', estudianteId)
      const res = await fetch(`/api/talonarios?${params}`)
      const data = await res.json()
      setTalonarios(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error cargando talonarios')
    } finally {
      setLoading(false)
    }
  }, [estudianteId])

  useEffect(() => { fetchTalonarios() }, [fetchTalonarios])

  const buscarEstudiante = async () => {
    if (!nie.trim()) return
    try {
      const res = await fetch(`/api/estudiantes?nie=${encodeURIComponent(nie)}`)
      const data = await res.json()
      if (data.length > 0) {
        setEstudiante(data[0])
      } else {
        toast.error('Estudiante no encontrado')
        setEstudiante(null)
      }
    } catch { toast.error('Error buscando') }
  }

  const handleCrear = async () => {
    if (!estudiante) return toast.error('Busque un estudiante primero')
    setSaving(true)
    try {
      const res = await fetch('/api/talonarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudianteId: estudiante.id, anio }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Talonario creado exitosamente')
        setShowForm(false); setNie(''); setEstudiante(null)
        fetchTalonarios()
      } else {
        toast.error(data.error || 'Error creando talonario')
      }
    } catch { toast.error('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Talonarios" subtitle="Gestión de comprobantes de pago" />
      <div className="flex-1 p-6 space-y-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{talonarios.length} talonario{talonarios.length !== 1 ? 's' : ''}</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Nuevo Talonario
          </button>
        </div>

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Generar Talonario</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">NIE del Estudiante</label>
                <div className="flex gap-2">
                  <input type="text" value={nie} onChange={e => setNie(e.target.value)}
                    placeholder="NIE..." className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
                  <button onClick={buscarEstudiante} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">Buscar</button>
                </div>
                {estudiante && <p className="text-xs text-emerald-600 mt-1">✓ {estudiante.nombre}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Año</label>
                <input type="number" value={anio} onChange={e => setAnio(e.target.value)} min="2020" max="2030"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleCrear} disabled={saving || !estudiante}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors">
                {saving ? 'Creando...' : 'Generar Talonario'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Talonarios grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 h-48 animate-pulse" />
            ))}
          </div>
        ) : talonarios.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-12 text-center">
            <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No hay talonarios registrados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {talonarios.map((tal) => {
              const totalComprobantes = tal.comprobantes.length
              const pagados = tal.comprobantes.filter((c: any) => c.pagado).length
              const pendientes = totalComprobantes - pagados
              const totalMonto = tal.comprobantes.reduce((s: number, c: any) => s + c.monto, 0)
              const montoPagado = tal.comprobantes.filter((c: any) => c.pagado).reduce((s: number, c: any) => s + c.monto, 0)
              const pct = totalComprobantes > 0 ? Math.round((pagados / totalComprobantes) * 100) : 0

              return (
                <div key={tal.id} className="bg-white rounded-xl border border-gray-100 shadow-xs p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{tal.estudiante.nombre}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {tal.estudiante.grado} {tal.estudiante.seccion} · NIE: {tal.estudiante.nie}
                      </p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {tal.anio}
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{pagados}/{totalComprobantes} pagados</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle className="w-3 h-3" /> {formatCurrency(montoPagado)} cobrado
                    </span>
                    <span className="flex items-center gap-1 text-amber-600">
                      <Clock className="w-3 h-3" /> {pendientes} pendientes
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/talonarios/${tal.id}`}
                      className="flex-1 text-center text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-1.5 rounded-lg transition-colors">
                      Ver detalle
                    </Link>
                    <Link href={`/talonarios/${tal.id}/imprimir`}
                      className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors">
                      <Printer className="w-3.5 h-3.5" /> Imprimir
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
