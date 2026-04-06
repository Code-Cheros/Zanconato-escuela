// app/(app)/estudiantes/nuevo/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Plus, Save, UserPlus, HeartPulse, Activity, AlertTriangle, Baby, Brain, FileText, X } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Toggle } from '@/components/ui/toggle'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COMPORTAMIENTOS_ALUMNO, ComportamientoAlumno, VACUNAS_ALUMNO_BASE } from '@/lib/estudianteComportamiento'

export default function NuevoEstudiantePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [nuevaVacuna, setNuevaVacuna] = useState('')
  const [nuevaEnfermedad, setNuevaEnfermedad] = useState('')
  const [nuevaAlergia, setNuevaAlergia] = useState('')
  const [nuevaLimitacion, setNuevaLimitacion] = useState('')
  
  const [form, setForm] = useState({
    nombre: '',
    nie: '',
    grado: '',
    seccion: '',
    encargado: '',
    telefono: '',
    comportamiento: [] as ComportamientoAlumno[],
    vacunas: [] as string[],
    // Nuevos campos
    descripcion: '',
    embarazo: '',
    embarazoPorQue: '',
    tipoParto: '',
    problemasAprendizaje: '',
    enfermedades: [] as string[],
    alergias: [] as string[],
    limitaciones: [] as string[],
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

  const handleAgregarEnfermedad = () => {
    const item = nuevaEnfermedad.trim()
    if (!item) return
    setForm(prev => {
      if (prev.enfermedades.some(v => v.toLowerCase() === item.toLowerCase())) return prev
      return { ...prev, enfermedades: [...prev.enfermedades, item] }
    })
    setNuevaEnfermedad('')
  }

  const handleAgregarAlergia = () => {
    const item = nuevaAlergia.trim()
    if (!item) return
    setForm(prev => {
      if (prev.alergias.some(v => v.toLowerCase() === item.toLowerCase())) return prev
      return { ...prev, alergias: [...prev.alergias, item] }
    })
    setNuevaAlergia('')
  }

  const handleAgregarLimitacion = () => {
    const item = nuevaLimitacion.trim()
    if (!item) return
    setForm(prev => {
      if (prev.limitaciones.some(v => v.toLowerCase() === item.toLowerCase())) return prev
      return { ...prev, limitaciones: [...prev.limitaciones, item] }
    })
    setNuevaLimitacion('')
  }

  const removerItem = (field: 'enfermedades' | 'alergias' | 'limitaciones' | 'vacunas', valor: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== valor)
    }))
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

                  <div className="sm:col-span-2 space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2 text-primary">
                      <HeartPulse className="size-5" />
                      <h3 className="font-bold">Ficha Médica / Datos Personales</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="descripcion" className="flex items-center gap-1.5">
                          <FileText className="size-3.5 text-muted-foreground" />
                          Descripción General
                        </Label>
                        <Textarea
                          id="descripcion"
                          name="descripcion"
                          value={form.descripcion}
                          onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                          placeholder="Observaciones generales sobre el alumno..."
                          className="min-h-[80px]"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="embarazo" className="flex items-center gap-1.5">
                          <Baby className="size-3.5 text-muted-foreground" />
                          Embarazo
                        </Label>
                        <Input
                          id="embarazo"
                          name="embarazo"
                          value={form.embarazo}
                          onChange={(e) => setForm({ ...form, embarazo: e.target.value })}
                          placeholder="Estado o condiciones..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="embarazoPorQue">¿Por qué?</Label>
                        <Input
                          id="embarazoPorQue"
                          name="embarazoPorQue"
                          value={form.embarazoPorQue}
                          onChange={(e) => setForm({ ...form, embarazoPorQue: e.target.value })}
                          placeholder="Detalles..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="tipoParto">Tipo de parto</Label>
                        <Input
                          id="tipoParto"
                          name="tipoParto"
                          value={form.tipoParto}
                          onChange={(e) => setForm({ ...form, tipoParto: e.target.value })}
                          placeholder="Normal, cesárea..."
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="problemasAprendizaje" className="flex items-center gap-1.5">
                          <Brain className="size-3.5 text-muted-foreground" />
                          Problemas de aprendizaje
                        </Label>
                        <Input
                          id="problemasAprendizaje"
                          name="problemasAprendizaje"
                          value={form.problemasAprendizaje}
                          onChange={(e) => setForm({ ...form, problemasAprendizaje: e.target.value })}
                          placeholder="Detalles de aprendizaje..."
                        />
                      </div>

                      {/* Listas Dinámicas */}
                      {[
                        { label: 'Enfermedades', field: 'enfermedades', state: nuevaEnfermedad, setState: setNuevaEnfermedad, handler: handleAgregarEnfermedad, icon: Activity },
                        { label: 'Alergias', field: 'alergias', state: nuevaAlergia, setState: setNuevaAlergia, handler: handleAgregarAlergia, icon: AlertTriangle },
                        { label: 'Limitaciones', field: 'limitaciones', state: nuevaLimitacion, setState: setNuevaLimitacion, handler: handleAgregarLimitacion, icon: Activity }
                      ].map((list) => (
                        <div key={list.field} className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                          <div className="space-y-1">
                            <Label className="text-sm font-semibold flex items-center gap-1.5">
                              <list.icon className="size-3.5" />
                              {list.label}
                            </Label>
                            <p className="text-xs text-muted-foreground">Agrega ítems relevantes si aplica.</p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {form[list.field as keyof typeof form] instanceof Array && (form[list.field as keyof typeof form] as string[]).map(item => (
                              <Badge key={item} variant="secondary" className="gap-1 px-2 py-1 pr-1 font-medium">
                                {item}
                                <button
                                  type="button"
                                  onClick={() => removerItem(list.field as any, item)}
                                  className="rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
                                >
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>

                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              value={list.state}
                              onChange={(e) => list.setState(e.target.value)}
                              placeholder={`Agregar ${list.label.toLowerCase()}...`}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  list.handler()
                                }
                              }}
                            />
                            <Button type="button" variant="outline" size="sm" className="sm:w-auto" onClick={list.handler}>
                              <Plus className="size-4" />
                              Agregar
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">Comportamiento del Alumno</Label>
                      <p className="text-xs text-muted-foreground">Registra observaciones para seguimiento pedagógico.</p>
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
