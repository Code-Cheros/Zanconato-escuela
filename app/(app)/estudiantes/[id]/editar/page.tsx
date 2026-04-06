// app/(app)/estudiantes/[id]/editar/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Plus, Save, HeartPulse, Activity, AlertTriangle, Baby, Brain, FileText, X, Trash2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GRADOS, SECCIONES, TURNOS, cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import { Separator } from '@/components/ui/separator'
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

  const [form, setForm] = useState({
    nombre: '',
    nie: '',
    grado: '',
    seccion: '',
    turno: 'Matutino',
    encargado: '',
    telefono: '',
    comportamiento: [] as ComportamientoAlumno[],
    vacunas: [] as string[],
    activo: true,
    descripcion: '',
    embarazo: '',
    embarazoPorQue: '',
    tipoParto: '',
    problemasAprendizaje: '',
    enfermedades: [] as string[],
    alergias: [] as string[],
    limitaciones: [] as string[],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

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
            turno: d.turno || 'Matutino',
            encargado: d.encargado || '',
            telefono: d.telefono || '',
            comportamiento: Array.isArray(d.comportamiento) ? d.comportamiento : [],
            vacunas: Array.isArray(d.vacunas) ? d.vacunas : [],
            activo: d.activo ?? true,
            descripcion: d.descripcion || '',
            embarazo: d.embarazo || '',
            embarazoPorQue: d.embarazoPorQue || '',
            tipoParto: d.tipoParto || '',
            problemasAprendizaje: d.problemasAprendizaje || '',
            enfermedades: Array.isArray(d.enfermedades) ? d.enfermedades : [],
            alergias: Array.isArray(d.alergias) ? d.alergias : [],
            limitaciones: Array.isArray(d.limitaciones) ? d.limitaciones : [],
          })
        }
        setLoading(false)
      })
      .catch(() => { toast.error('Error cargando datos'); setLoading(false) })
    fetchSuggestions()
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

    setLoading(true)
    setErrors({})

    const newErrors: Record<string, string> = {}
    if (!/^\d{8}$/.test(form.nie)) newErrors.nie = 'El NIE debe tener 8 dígitos numéricos'
    if (form.telefono && !/^\d{8}$/.test(form.telefono)) newErrors.telefono = 'El teléfono debe tener 8 dígitos numéricos'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setLoading(false)
      toast.error('Revisa los errores en el formulario')
      return
    }

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
      setLoading(false)
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
                    <Label htmlFor="nie" className={cn(errors.nie && "text-destructive")}>NIE</Label>
                    <Input
                      id="nie"
                      value={form.nie}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                        setForm({ ...form, nie: val })
                      }}
                      placeholder="00000000"
                      className={cn("h-10 bg-background", errors.nie && "border-destructive focus-visible:ring-destructive")}
                      required
                    />
                    {errors.nie && <p className="text-[10px] text-destructive font-medium">{errors.nie}</p>}
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
                    <Label htmlFor="telefono" className={cn(errors.telefono && "text-destructive")}>Teléfono</Label>
                    <Input
                      id="telefono"
                      value={form.telefono}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 8)
                        setForm({ ...form, telefono: val })
                      }}
                      placeholder="00000000"
                      className={cn("h-10 bg-background", errors.telefono && "border-destructive focus-visible:ring-destructive")}
                    />
                    {errors.telefono && <p className="text-[10px] text-destructive font-medium">{errors.telefono}</p>}
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
                  <Button type="submit" disabled={loading}>
                    <Save className="size-4" />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
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
