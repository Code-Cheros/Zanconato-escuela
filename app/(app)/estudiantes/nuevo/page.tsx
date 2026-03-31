// app/(app)/estudiantes/nuevo/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, UserPlus } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'nie' || name === 'telefono') {
      const onlyNums = value.replace(/[^0-9]/g, '')
      if (onlyNums.length <= 8) {
        setForm({ ...form, [name]: onlyNums })
      }
      return
    }
    setForm({ ...form, [name]: value })
  }

  const handleSelect = (field: keyof typeof form) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.nie || !form.grado || !form.seccion) {
      toast.error('Nombre, NIE, Grado y Sección son requeridos')
      return
    }

    if (form.nie.length !== 8) {
      toast.error('El NIE debe tener exactamente 8 dígitos')
      return
    }

    if (form.telefono && form.telefono.length !== 8) {
      toast.error('El teléfono debe tener exactamente 8 dígitos')
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

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 px-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/estudiantes">
              <ArrowLeft className="size-4" />
              Volver a estudiantes
            </Link>
          </Button>

          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Datos del Estudiante</CardTitle>
                  <CardDescription>Se creará automáticamente un talonario para el año actual</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="nombre">
                      Nombre Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Nombre y apellidos del estudiante"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nie">
                      NIE (8 dígitos) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nie"
                      name="nie"
                      value={form.nie}
                      onChange={handleChange}
                      placeholder="Ej: 12345678"
                      className="font-mono"
                      maxLength={8}
                      inputMode="numeric"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="grado">
                      Grado <span className="text-destructive">*</span>
                    </Label>
                    <Select value={form.grado} onValueChange={handleSelect('grado')} required>
                      <SelectTrigger id="grado" className="w-full">
                        <SelectValue placeholder="Seleccionar grado" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRADOS.map(g => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="seccion">
                      Sección <span className="text-destructive">*</span>
                    </Label>
                    <Select value={form.seccion} onValueChange={handleSelect('seccion')} required>
                      <SelectTrigger id="seccion" className="w-full">
                        <SelectValue placeholder="Seleccionar sección" />
                      </SelectTrigger>
                      <SelectContent>
                        {SECCIONES.map(s => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="encargado">Encargado / Padre de familia</Label>
                    <Input
                      id="encargado"
                      name="encargado"
                      value={form.encargado}
                      onChange={handleChange}
                      placeholder="Nombre del encargado"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telefono">Teléfono (8 dígitos)</Label>
                    <Input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      value={form.telefono}
                      onChange={handleChange}
                      placeholder="Ej: 71234567"
                      maxLength={8}
                      inputMode="numeric"
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                  <p className="font-medium mb-1">Al guardar se generará automáticamente:</p>
                  <ul className="space-y-1 text-xs text-primary/80">
                    <li>• Usuario temporal con email: estudiante.{form.nie?.toLowerCase() || 'nie'}@zaconato.edu.sv</li>
                    <li>• Talonario del año {new Date().getFullYear()} con todos los comprobantes</li>
                    <li>• Comprobantes: Matrícula, Papelería, 10 Colegiaturas, 10 Alimentaciones</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" disabled={loading}>
                    <Save className="size-4" />
                    {loading ? 'Guardando...' : 'Guardar Matrícula'}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/estudiantes">Cancelar</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
