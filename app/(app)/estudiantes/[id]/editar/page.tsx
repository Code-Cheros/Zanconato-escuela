// app/(app)/estudiantes/[id]/editar/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Plus, Save } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { COMPORTAMIENTOS_ALUMNO, ComportamientoAlumno, VACUNAS_ALUMNO_BASE } from '@/lib/estudianteComportamiento'

export default function EditarEstudiantePage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [nuevaVacuna, setNuevaVacuna] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    nie: '',
    grado: '',
    seccion: '',
    encargado: '',
    telefono: '',
    pasatiempos: '',
    comportamiento: [] as ComportamientoAlumno[],
    vacunas: [] as string[],
    activo: true,
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
            pasatiempos: d.pasatiempos || '',
            comportamiento: Array.isArray(d.comportamiento) ? d.comportamiento : [],
            vacunas: Array.isArray(d.vacunas) ? d.vacunas : [],
            activo: d.activo ?? true,
          })
        }
        setLoading(false)
      })
      .catch(() => { toast.error('Error cargando datos'); setLoading(false) })
  }, [id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'nie' || name === 'telefono') {
      const onlyNums = value.replace(/[^0-9]/g, '')
      if (onlyNums.length <= 8) {
        setForm({ ...form, [name]: onlyNums })
      }
      return
    }
    if (name === 'nombre' || name === 'encargado') {
      const onlyLetters = value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ ]/g, '')
      setForm({ ...form, [name]: onlyLetters })
      return
    }
    setForm({ ...form, [name]: value })
  }

  const handleSelect = (field: keyof typeof form) => (value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setForm(prev => ({ ...prev, activo: checked }))
  }

  const toggleComportamiento = (valor: ComportamientoAlumno, checked: boolean) => {
    setForm(prev => {
      if (checked) {
        if (prev.comportamiento.includes(valor)) return prev
        return { ...prev, comportamiento: [...prev.comportamiento, valor] }
      }

      return {
        ...prev,
        comportamiento: prev.comportamiento.filter(item => item !== valor),
      }
    })
  }

  const toggleVacuna = (valor: string, checked: boolean) => {
    setForm(prev => {
      if (checked) {
        if (prev.vacunas.some(v => v.toLowerCase() === valor.toLowerCase())) return prev
        return { ...prev, vacunas: [...prev.vacunas, valor] }
      }

      return {
        ...prev,
        vacunas: prev.vacunas.filter(item => item !== valor),
      }
    })
  }

  const handleAgregarVacuna = () => {
    const vacuna = nuevaVacuna.trim()
    if (!vacuna) return

    setForm(prev => {
      if (prev.vacunas.some(v => v.toLowerCase() === vacuna.toLowerCase())) return prev
      return { ...prev, vacunas: [...prev.vacunas, vacuna] }
    })
    setNuevaVacuna('')
  }

  const vacunasDisponibles = Array.from(new Set([...VACUNAS_ALUMNO_BASE, ...form.vacunas]))

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
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Header title="Editar Estudiante" subtitle="Modificar datos del estudiante" />
      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 px-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href={`/estudiantes/${id}`}>
              <ArrowLeft className="size-4" />
              Volver al perfil
            </Link>
          </Button>

          <Card>
            <CardHeader className="border-b">
              <CardTitle className="text-base">Datos del Estudiante</CardTitle>
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
                    <Label htmlFor="encargado">Encargado</Label>
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

                  <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <Label htmlFor="pasatiempos" className="text-sm font-semibold">Comportamiento del Alumno</Label>
                      <p className="text-xs text-muted-foreground">Registra observaciones para seguimiento pedagógico.</p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="pasatiempos">Pasatiempos</Label>
                      <Input
                        id="pasatiempos"
                        name="pasatiempos"
                        value={form.pasatiempos}
                        onChange={handleChange}
                        placeholder="Ej: Fútbol, dibujo, lectura"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {COMPORTAMIENTOS_ALUMNO.map(item => (
                        <Toggle
                          key={item}
                          variant="outline"
                          size="sm"
                          pressed={form.comportamiento.includes(item)}
                          onPressedChange={(pressed) => toggleComportamiento(item, pressed)}
                          className="h-9 justify-start px-3 font-medium data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                        >
                          {item}
                        </Toggle>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">Vacunas</Label>
                      <p className="text-xs text-muted-foreground">Selecciona vacunas aplicadas y agrega una nueva si no existe en el listado.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {vacunasDisponibles.map(item => (
                        <Toggle
                          key={item}
                          variant="outline"
                          size="sm"
                          pressed={form.vacunas.includes(item)}
                          onPressedChange={(pressed) => toggleVacuna(item, pressed)}
                          className="h-9 justify-start px-3 font-medium data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                        >
                          {item}
                        </Toggle>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Input
                        value={nuevaVacuna}
                        onChange={(e) => setNuevaVacuna(e.target.value)}
                        placeholder="Agregar nueva vacuna"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAgregarVacuna()
                          }
                        }}
                      />
                      <Button type="button" variant="outline" className="sm:w-auto" onClick={handleAgregarVacuna}>
                        <Plus className="size-4" />
                        Agregar
                      </Button>
                    </div>
                  </div>

                  <div className="sm:col-span-2 p-3 rounded-lg border bg-muted/30 flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <Label htmlFor="activo" className="text-sm font-semibold">Estado del Estudiante</Label>
                      <p className="text-xs text-muted-foreground">
                        {form.activo 
                          ? 'Activo: Se pueden generar nuevos talonarios y registrar pagos.' 
                          : 'Inactivo: No se podrá generar nuevos talonarios.'}
                      </p>
                    </div>
                    <Switch 
                      id="activo" 
                      checked={form.activo} 
                      onCheckedChange={handleSwitchChange}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" disabled={saving}>
                    <Save className="size-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/estudiantes/${id}`}>Cancelar</Link>
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
