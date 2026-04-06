// app/(app)/estudiantes/nuevo/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Plus, Save, UserPlus, HeartPulse, Activity, AlertTriangle, Baby, Brain, FileText, X, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES, TURNOS, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  
  const [mediSuggestions, setMediSuggestions] = useState({
    enfermedades: [] as string[],
    alergias: [] as string[],
    limitaciones: [] as string[]
  })

  const fetchSuggestions = async () => {
    try {
      const res = await fetch('/api/estudiantes/sugerencias-medicas')
      const data = await res.json()
      if (res.ok) setMediSuggestions(data)
    } catch { /* Silent */ }
  }

  const [confirmDelete, setConfirmDelete] = useState<{ tipo: string, valor: string } | null>(null)

  const handleEliminarSugerencia = async (tipo: string, valor: string) => {
    // Si no está confirmando este elemento específico, marcarlo para confirmación
    if (confirmDelete?.valor !== valor || confirmDelete?.tipo !== tipo) {
      setConfirmDelete({ tipo, valor })
      // Auto-cancelar después de 3 segundos
      setTimeout(() => setConfirmDelete(prev => (prev?.valor === valor ? null : prev)), 3000)
      return
    }

    try {
      const res = await fetch(`/api/estudiantes/sugerencias-medicas?tipo=${tipo}&valor=${encodeURIComponent(valor)}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        toast.success('Sugerencia eliminada del historial')
        setConfirmDelete(null)
        fetchSuggestions()
      } else {
        toast.error('Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  useState(() => {
    fetchSuggestions()
  })
  
  const [form, setForm] = useState({
    nombre: '',
    nie: '',
    grado: '',
    seccion: 'A',
    turno: 'Matutino',
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

                  <div className="space-y-2">
                    <Label htmlFor="turno" className="text-sm font-medium">Turno</Label>
                    <Select 
                      value={form.turno} 
                      onValueChange={(v) => setForm({ ...form, turno: v })}
                    >
                      <SelectTrigger id="turno" className="h-10 bg-background transition-all focus:ring-2 focus:ring-primary/20">
                        <SelectValue placeholder="Seleccionar turno" />
                      </SelectTrigger>
                      <SelectContent>
                        {TURNOS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
                        <Select 
                          value={form.tipoParto} 
                          onValueChange={(v) => setForm({ ...form, tipoParto: v })}
                        >
                          <SelectTrigger id="tipoParto" className="w-full">
                            <SelectValue placeholder="Seleccionar tipo..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Natural">Natural</SelectItem>
                            <SelectItem value="Cesárea">Cesárea</SelectItem>
                            <SelectItem value="Otros">Otros</SelectItem>
                          </SelectContent>
                        </Select>
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
                      {/* Listas Dinámicas con Sugerencias Ágiles */}
                      {[
                        { label: 'Enfermedades', field: 'enfermedades', state: nuevaEnfermedad, setState: setNuevaEnfermedad, handler: handleAgregarEnfermedad, icon: Activity, suggestions: mediSuggestions.enfermedades },
                        { label: 'Alergias', field: 'alergias', state: nuevaAlergia, setState: setNuevaAlergia, handler: handleAgregarAlergia, icon: AlertTriangle, suggestions: mediSuggestions.alergias },
                        { label: 'Limitaciones', field: 'limitaciones', state: nuevaLimitacion, setState: setNuevaLimitacion, handler: handleAgregarLimitacion, icon: Activity, suggestions: mediSuggestions.limitaciones }
                      ].map((list) => (
                        <div key={list.field} className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                          <div className="space-y-1">
                            <Label className="text-sm font-semibold flex items-center gap-1.5">
                              <list.icon className="size-3.5 text-primary" />
                              {list.label}
                            </Label>
                          </div>

                          <div className="flex flex-wrap gap-2 min-h-[1.5rem]">
                            {(form[list.field as keyof typeof form] as string[]).map(item => (
                              <Badge key={item} variant="secondary" className="gap-1 px-2 py-1 pr-1 font-medium bg-background border shadow-sm">
                                {item}
                                <button type="button" onClick={() => removerItem(list.field as any, item)} className="rounded-full p-0.5 hover:bg-destructive/10 hover:text-destructive">
                                  <X className="size-3" />
                                </button>
                              </Badge>
                            ))}
                            {(form[list.field as keyof typeof form] as string[]).length === 0 && <span className="text-[10px] text-muted-foreground italic">Ninguno registrado</span>}
                          </div>

                          <div className="space-y-2">
                             <div className="flex gap-2">
                               <Input
                                 value={list.state}
                                 onChange={(e) => list.setState(e.target.value)}
                                 placeholder={`Escribe para agregar ${list.label.toLowerCase()}...`}
                                 className="h-9 bg-background"
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     e.preventDefault()
                                     list.handler()
                                   }
                                 }}
                               />
                               <Button size="icon-sm" type="button" onClick={list.handler} variant="outline">
                                 <Plus className="size-4" />
                               </Button>
                             </div>

                             {list.suggestions.length > 0 && (
                               <div className="flex flex-wrap gap-1.5 pt-1">
                                 <span className="text-[10px] text-muted-foreground flex items-center shrink-0">Historial:</span>
                                 {list.suggestions
                                   .filter(s => !(form[list.field as keyof typeof form] as string[]).includes(s))
                                   .slice(0, 8)
                                   .map(s => (
                                     <div key={s} className="group flex items-center bg-primary/5 text-primary border border-primary/20 rounded-full pl-2 pr-1 py-0.5 hover:bg-primary/10 transition-colors gap-1">
                                       <button
                                         type="button"
                                         onClick={() => {
                                           setForm(prev => ({
                                             ...prev,
                                             [list.field]: Array.from(new Set([...(prev[list.field as keyof typeof form] as string[]), s]))
                                           }))
                                         }}
                                         className="text-[10px] font-medium"
                                       >
                                         {s}
                                       </button>
                                       <button 
                                         type="button" 
                                         onClick={() => handleEliminarSugerencia(list.field, s)}
                                         className={cn(
                                           "transition-all duration-200",
                                           confirmDelete?.valor === s && confirmDelete?.tipo === list.field
                                             ? "opacity-100 text-destructive scale-110" 
                                             : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                                         )}
                                       >
                                         {confirmDelete?.valor === s && confirmDelete?.tipo === list.field 
                                           ? <Trash2 className="size-3" /> 
                                           : <X className="size-2.5" />
                                         }
                                       </button>
                                     </div>
                                   ))
                                 }
                               </div>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-3 rounded-lg border bg-muted/20 p-4">
                    <div className="space-y-1">
                      <Label className="text-sm font-semibold">Comportamiento del Alumno</Label>
                      <p className="text-sm text-muted-foreground mt-1">Completa la información básica del alumno para iniciar su expediente.</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 text-xs font-semibold">
                        Periodo {new Date().getFullYear()}
                      </Badge>
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
