// app/(app)/estudiantes/nuevo/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES } from '@/lib/utils'

export default function NuevoEstudiantePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    nie: '',
    grado: '',
    seccion: '',
    encargado: '',
    telefono: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.nie || !form.grado || !form.seccion) {
      toast.error('Nombre, NIE, Grado y Sección son requeridos')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Estudiante matriculado exitosamente')
        router.push(`/estudiantes/${data.estudiante.id}`)
      } else {
        toast.error(data.error || 'Error al matricular')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Matricular Estudiante" subtitle="Registro de nuevo estudiante" />

      <div className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/estudiantes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Volver a estudiantes
          </Link>

          <div className="bg-white rounded-xl border border-gray-100 shadow-xs">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Datos del Estudiante</h2>
                <p className="text-xs text-gray-500">Se creará automáticamente un talonario para el año actual</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nombre Completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Nombre y apellidos del estudiante"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    NIE <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="nie"
                    value={form.nie}
                    onChange={handleChange}
                    placeholder="Número de identificación"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Grado <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="grado"
                    value={form.grado}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Seleccionar grado</option>
                    {GRADOS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sección <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="seccion"
                    value={form.seccion}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                    required
                  >
                    <option value="">Seleccionar sección</option>
                    {SECCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Encargado / Padre de familia
                  </label>
                  <input
                    type="text"
                    name="encargado"
                    value={form.encargado}
                    onChange={handleChange}
                    placeholder="Nombre del encargado"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Teléfono de contacto
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={form.telefono}
                    onChange={handleChange}
                    placeholder="7000-0000"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
                <p className="font-medium mb-1">Al guardar se generará automáticamente:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Usuario temporal con email: estudiante.{form.nie?.toLowerCase() || 'nie'}@zaconato.edu.sv</li>
                  <li>• Talonario del año {new Date().getFullYear()} con todos los comprobantes</li>
                  <li>• Comprobantes: Matrícula, Papelería, 10 Colegiaturas, 10 Alimentaciones</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors text-sm"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Guardando...' : 'Guardar Matrícula'}
                </button>
                <Link href="/estudiantes" className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
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
