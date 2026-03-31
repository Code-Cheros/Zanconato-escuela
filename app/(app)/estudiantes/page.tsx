// app/(app)/estudiantes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

interface Estudiante {
  id: string
  nombre: string
  nie: string
  grado: string
  seccion: string
  encargado: string | null
  telefono: string | null
  creadoEn: string
}

export default function EstudiantesPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchEstudiantes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('nombre', search)
      const res = await fetch(`/api/estudiantes?${params}`)
      const data = await res.json()
      setEstudiantes(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error cargando estudiantes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEstudiantes() }, [search])

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Estudiante eliminado')
        fetchEstudiantes()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Estudiantes" subtitle="Gestión de matrícula y datos estudiantiles" />

      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-gray-900">Listado de Estudiantes</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-56 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                <Link
                  href="/estudiantes/nuevo"
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo Estudiante
                </Link>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  {['Nombre', 'NIE', 'Grado', 'Sección', 'Encargado', 'Teléfono', 'Matriculado', 'Acciones'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i}>
                      {[...Array(8)].map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : estudiantes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-gray-400 text-sm">
                      No hay estudiantes registrados
                    </td>
                  </tr>
                ) : (
                  estudiantes.map((est) => (
                    <tr key={est.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{est.nombre}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{est.nie}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.grado}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.seccion}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.encargado || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{est.telefono || '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(est.creadoEn).toLocaleDateString('es-SV')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/estudiantes/${est.id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                            <Link href={`/estudiantes/${est.id}/editar`} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors">
                              <Edit className="w-4 h-4" />
                            </Link>
                          )}
                          {rol === 'ADMINISTRATIVO' && (
                            <button
                              onClick={() => handleDelete(est.id, est.nombre)}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
