// app/(app)/estudiantes/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Edit, BookOpen, CreditCard, User } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS } from '@/lib/utils'
import { useSession } from 'next-auth/react'

export default function EstudianteDetailPage() {
  const { id } = useParams()
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [estudiante, setEstudiante] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/estudiantes/${id}`)
      .then(r => r.json())
      .then(d => { setEstudiante(d); setLoading(false) })
      .catch(() => { toast.error('Error cargando estudiante'); setLoading(false) })
  }, [id])

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header title="Cargando..." />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 h-96 animate-pulse" />
      </div>
    </div>
  )

  if (!estudiante || estudiante.error) return (
    <div className="flex flex-col h-full">
      <Header title="No encontrado" />
      <div className="flex-1 p-6 text-center text-gray-400">Estudiante no encontrado</div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title={estudiante.nombre} subtitle={`NIE: ${estudiante.nie}`} />
      <div className="flex-1 p-6 space-y-6">
        <Link href="/estudiantes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info card */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" /> Datos Personales
              </h3>
              {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                <Link href={`/estudiantes/${id}/editar`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md">
                  <Edit className="w-4 h-4" />
                </Link>
              )}
            </div>
            <dl className="space-y-3 text-sm">
              {[
                ['Nombre', estudiante.nombre],
                ['NIE', estudiante.nie],
                ['Grado', estudiante.grado],
                ['Sección', estudiante.seccion],
                ['Encargado', estudiante.encargado || '—'],
                ['Teléfono', estudiante.telefono || '—'],
                ['Matriculado', formatDate(estudiante.creadoEn)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <dt className="text-gray-500">{k}</dt>
                  <dd className="font-medium text-gray-900 text-right">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Talonarios */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" /> Talonarios
              </h3>
              <Link
                href={`/talonarios?estudianteId=${id}`}
                className="text-xs text-blue-600 hover:underline"
              >
                Ver todos
              </Link>
            </div>
            <div className="p-6">
              {estudiante.talonarios.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sin talonarios</p>
              ) : (
                estudiante.talonarios.map((tal: any) => {
                  const pagados = tal.comprobantes.filter((c: any) => c.pagado).length
                  const total = tal.comprobantes.length
                  const pct = total > 0 ? Math.round((pagados / total) * 100) : 0
                  return (
                    <div key={tal.id} className="mb-4 last:mb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Talonario {tal.anio}</span>
                        <span className="text-xs text-gray-500">{pagados}/{total} comprobantes</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <Link
                        href={`/talonarios/${tal.id}`}
                        className="mt-2 inline-block text-xs text-blue-600 hover:underline"
                      >
                        Ver detalle →
                      </Link>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Pagos recientes */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Pagos Registrados
            </h3>
          </div>
          {estudiante.pagos.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin pagos registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    {['Tipo', 'Monto', 'Fecha', 'Notas'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {estudiante.pagos.map((p: any) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{TIPO_PAGO_LABELS[p.tipo] || p.tipo}</td>
                      <td className="px-4 py-3 text-sm font-medium text-emerald-600">{formatCurrency(p.monto)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.fecha)}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.notas || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
