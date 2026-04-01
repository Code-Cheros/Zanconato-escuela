// app/(app)/talonarios/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Plus, BookOpen, Printer, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, TIPO_PAGO_LABELS, GRADOS, SECCIONES } from '@/lib/utils'
import Link from 'next/link'

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'


export default function TalonariosPage() {
  const searchParams = useSearchParams()
  const [talonarios, setTalonarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [nie, setNie] = useState('')
  const [estudiante, setEstudiante] = useState<any>(null)
  const [anio, setAnio] = useState(String(new Date().getFullYear() + 1))
  const [grado, setGrado] = useState('')
  const [seccion, setSeccion] = useState('')
  const [saving, setSaving] = useState(false)
  const [filterAnio, setFilterAnio] = useState('')


  const estudianteId = searchParams.get('estudianteId')

  const fetchTalonarios = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (estudianteId) params.set('estudianteId', estudianteId)
      if (filterAnio) params.set('anio', filterAnio)
      const res = await fetch(`/api/talonarios?${params}`)
      const data = await res.json()
      setTalonarios(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error cargando talonarios')
    } finally {
      setLoading(false)
    }
  }, [estudianteId, filterAnio])

  useEffect(() => { fetchTalonarios() }, [fetchTalonarios])

  const buscarEstudiante = async () => {
    if (!nie.trim()) return
    try {
      const res = await fetch(`/api/estudiantes?nie=${encodeURIComponent(nie)}`)
      const data = await res.json()
      if (data.length > 0) {
        setEstudiante(data[0])
        setGrado(data[0].grado)
        setSeccion(data[0].seccion)
      } else {
        toast.error('Estudiante no encontrado')
        setEstudiante(null)
        setGrado('')
        setSeccion('')
      }

    } catch { toast.error('Error buscando') }
  }

  const handleCrear = async () => {
    if (!estudiante) return toast.error('Busque un estudiante primero')
    setSaving(true)
    try {
      const res = await fetch('/api/talonarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estudianteId: estudiante.id, 
          anio,
          grado,
          seccion
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success('Talonario creado exitosamente')
        setShowForm(false); setNie(''); setEstudiante(null)
        fetchTalonarios()
      } else {
        toast.error(data.error || 'Error creando talonario')
      }
    } catch { toast.error('Error de conexión') } finally { setSaving(false) }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Talonarios" subtitle="Gestión de comprobantes de pago" />
      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Select value={filterAnio} onValueChange={setFilterAnio}>
              <SelectTrigger className="w-32 h-9 text-xs">
                <SelectValue placeholder="Todos los años" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los años</SelectItem>
                {[2024, 2025, 2026, 2027, 2028].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {talonarios.length} talonario{talonarios.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="size-4" /> Nuevo Talonario
          </Button>
        </div>

        {showForm && (
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">Generar Talonario</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="nie-search">NIE del Estudiante</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nie-search"
                      value={nie}
                      onChange={e => setNie(e.target.value)}
                      placeholder="NIE..."
                      className="flex-1 font-mono"
                      onKeyDown={e => e.key === 'Enter' && buscarEstudiante()}
                    />
                    <Button variant="secondary" onClick={buscarEstudiante} type="button">
                      Buscar
                    </Button>
                  </div>
                  {estudiante && (
                    <p className={cn(
                      "text-xs font-medium",
                      estudiante.activo === false ? "text-destructive" : "text-emerald-600"
                    )}>
                      {estudiante.activo === false ? '⚠ Estudiante Inactivo' : '✓'} {estudiante.nombre}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="anio">Año</Label>
                  <Input
                    id="anio"
                    type="number"
                    value={anio}
                    onChange={e => setAnio(e.target.value)}
                    min="2020"
                    max="2035"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="grado">Actualizar Grado</Label>
                  <Select value={grado} onValueChange={setGrado}>
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
                  <Label htmlFor="seccion">Actualizar Sección</Label>
                  <Select value={seccion} onValueChange={setSeccion}>
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

              </div>
            </CardContent>
            <CardFooter className="gap-3 border-t pt-4">
              <Button onClick={handleCrear} disabled={saving || !estudiante || estudiante.activo === false}>
                {saving ? 'Creando...' : 'Generar Talonario'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </CardFooter>
          </Card>
        )}

        {/* Talonarios grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-xl" />
            ))}
          </div>
        ) : talonarios.length === 0 ? (
          <Card>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon"><BookOpen /></EmptyMedia>
                <EmptyTitle>No hay talonarios registrados</EmptyTitle>
                <EmptyDescription>Generá un nuevo talonario para un estudiante.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {talonarios.map(tal => {
              const totalComprobantes = tal.comprobantes.length
              const pagados = tal.comprobantes.filter((c: any) => c.pagado).length
              const pendientes = totalComprobantes - pagados
              const totalMonto = tal.comprobantes.reduce((s: number, c: any) => s + c.monto, 0)
              const montoPagado = tal.comprobantes.filter((c: any) => c.pagado).reduce((s: number, c: any) => s + c.monto, 0)
              const pct = totalComprobantes > 0 ? Math.round((pagados / totalComprobantes) * 100) : 0

              return (
                <Card key={tal.id} className="flex flex-col py-0">
                  <CardHeader className="flex flex-row items-start justify-between border-b px-5 py-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{tal.estudiante.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tal.grado || tal.estudiante.grado} {tal.seccion || tal.estudiante.seccion} · NIE: {tal.estudiante.nie}
                      </p>

                    </div>
                    <Badge variant="secondary" className="shrink-0 font-bold">{tal.anio}</Badge>
                  </CardHeader>

                  <CardContent className="flex flex-col gap-3 px-5 py-4 flex-1">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <span>{pagados}/{totalComprobantes} pagados</span>
                        <span>{pct}%</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle className="size-3" /> {formatCurrency(montoPagado)} cobrado
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 font-medium">
                        <Clock className="size-3" /> {pendientes} pendientes
                      </span>
                    </div>
                  </CardContent>

                  <CardFooter className="gap-2 border-t px-5 py-3">
                    <Button variant="secondary" size="sm" className="flex-1" asChild>
                      <Link href={`/talonarios/${tal.id}`}>Ver detalle</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/talonarios/${tal.id}/imprimir`}>
                        <Printer className="size-3.5" /> Imprimir
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
