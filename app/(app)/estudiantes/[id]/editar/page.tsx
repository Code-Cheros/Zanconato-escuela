// app/(app)/estudiantes/[id]/editar/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES } from '@/lib/utils'

export default function EditarEstudiantePage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    nie: '',
    grado: '',
    seccion: '',
    encargado: '',
    telefono: '',
  })

  useEffect(() => {
    fetch(`/api/estudiantes/${id}`)
      .then(r => r.json())
      .then(d => {
        if (!d.error) {
          setForm({
            nombre: d.nombre || '',
            nie: d.nie || '',
            grado: d.grado || '',
            seccion: d.seccion || '',
            encargado: d.encargado || '',
            telefono: d.telefono || '',
          })
        }
        setLoading(false)
      })
      .catch(() => { toast.error('Error cargando datos'); setLoading(false) })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/estudiantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Datos actualizados correctamente')
        router.push(`/estudiantes/${id}`)
      } else {
        toast.error(data.error || 'Error al actualizar')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex flex-col h-full">
      <Header title="Cargando..." />
      <div className="flex-1 p-6"><div className="bg-white rounded-xl h-80 animate-pulse" /></div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="Editar Estudiante" subtitle="Modificar datos del estudiante" />
      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Link href={`/estudiantes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver al perfil
          </Link>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Datos del Estudiante</h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    NIE <span className="text-red-500">*</span>
                  </label>
                  <input type="text" name="nie" value={form.nie} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <select name="grado" value={form.grado} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="">Seleccionar grado</option>
                    {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sección <span className="text-red-500">*</span>
                  </label>
                  <select name="seccion" value={form.seccion} onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" required>
                    <option value="">Seleccionar sección</option>
                    {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Encargado</label>
                  <input type="text" name="encargado" value={form.encargado} onChange={handleChange}
                    placeholder="Nombre del encargado"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <input type="tel" name="telefono" value={form.telefono} onChange={handleChange}
                    placeholder="7000-0000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
                  <Save className="w-4 h-4" />
                  {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <Link href={`/estudiantes/${id}`}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
