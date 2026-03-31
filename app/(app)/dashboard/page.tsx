// app/(app)/dashboard/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import Header from '@/components/layout/Header'
import { Users, CheckCircle, FileText, TrendingUp, Plus, Search, Eye, CreditCard } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface Stats {
  totalEstudiantes: number
  estudiantesAlDia: number
  comprobantesEmitidos: number
  pagosHoy: number
  ingresosMes: number
}

interface Estudiante {
  id: string
  nombre: string
  nie: string
  grado: string
  seccion: string
  encargado: string | null
  telefono: string | null
  talonarios: Array<{ comprobantes: Array<{ pagado: boolean; tipo: string }> }>
}

function EstadoBadge({ talonarios }: { talonarios: Estudiante['talonarios'] }) {
  const talonario = talonarios[0]
  if (!talonario) return <span className="badge-pending">Sin talonario</span>

  const comprobantes = talonario.comprobantes
  const colegiaturas = comprobantes.filter(c => c.tipo === 'COLEGIATURA')
  const pagadas = colegiaturas.filter(c => c.pagado).length

  if (pagadas === colegiaturas.length && colegiaturas.length > 0) {
    return <span className="badge-paid">✓ Al día</span>
  }
  if (pagadas === 0) {
    return <span className="badge-overdue">Pendiente</span>
  }
  return <span className="badge-pending">{pagadas}/{colegiaturas.length} pagadas</span>
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, estRes] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch(`/api/estudiantes?${search ? `nombre=${encodeURIComponent(search)}` : ''}`),
      ])
      const statsData = await statsRes.json()
      const estData = await estRes.json()
      setStats(statsData)
      setEstudiantes(Array.isArray(estData) ? estData : [])
    } catch {
      toast.error('Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const statCards = stats ? [
    { label: 'Total Estudiantes', value: stats.totalEstudiantes, icon: Users, color: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
    { label: 'Al Día con Pagos', value: stats.estudiantesAlDia, icon: CheckCircle, color: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
    { label: 'Comprobantes Emitidos', value: stats.comprobantesEmitidos, icon: FileText, color: 'bg-violet-500', light: 'bg-violet-50 text-violet-700' },
    { label: 'Ingresos del Mes', value: formatCurrency(stats.ingresosMes), icon: TrendingUp, color: 'bg-amber-500', light: 'bg-amber-50 text-amber-700' },
  ] : []

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" subtitle="Resumen general del sistema" />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-100 animate-pulse h-24" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center`}>
                    <card.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <h2 className="font-semibold text-gray-900">Gestión de Estudiantes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, NIE o grado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Link
                href="/estudiantes/nuevo"
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Matricular Nuevo
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">NIE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Grado / Sección</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Encargado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teléfono</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(7)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No se encontraron estudiantes
                    </td>
                  </tr>
                ) : (
                  estudiantes.map((est) => (
                    <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{est.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{est.nie}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.grado} — {est.seccion}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.encargado || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.telefono || '—'}</td>
                      <td className="px-4 py-3">
                        <EstadoBadge talonarios={est.talonarios} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/pagos?estudianteId=${est.id}`}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            Pago
                          </Link>
                          <Link
                            href={`/estudiantes/${est.id}`}
                            className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {estudiantes.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
              {estudiantes.length} estudiante{estudiantes.length !== 1 ? 's' : ''} encontrado{estudiantes.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
