// app/(app)/pagos/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Plus, X, CreditCard, Filter, Search, Eye, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS, GRADOS, SECCIONES } from '@/lib/utils'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter as TableFoot,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { cn } from '@/lib/utils'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import { DateRange } from 'react-day-picker'

interface Pago {
  id: string
  monto: number
  tipo: string
  tipoPersonalizado?: string | null
  fecha: string
  notas: string | null
  estudiante: { nombre: string; nie: string; grado: string; seccion: string; encargado?: string | null }
  comprobante?: { mes: string | null } | null
}

interface Comprobante {
  id: string
  tipo: string
  mes: string | null
  monto: number
  pagado: boolean
}

interface Talonario {
  id: string
  anio: number
  comprobantes: Comprobante[]
}

const typeBadgeClass: Record<string, string> = {
  COLEGIATURA: 'border-blue-200 bg-blue-50 text-blue-700',
  ALIMENTACION: 'border-green-200 bg-green-50 text-green-700',
  MATRICULA: 'border-amber-200 bg-amber-50 text-amber-700',
  PAPELERIA: 'border-purple-200 bg-purple-50 text-purple-700',
}

const TIPO_PAGO_OPTIONS: Record<string, string> = TIPO_PAGO_LABELS
const ITEMS_PER_PAGE = 10

export default function PagosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const searchParams = useSearchParams()

  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // General filters
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [filterTipo, setFilterTipo] = useState('')
  
  // Student filters
  const [filterNombre, setFilterNombre] = useState('')
  const [filterNie, setFilterNie] = useState('')
  const [filterGrado, setFilterGrado] = useState('')
  const [filterSeccion, setFilterSeccion] = useState('')
  const [filterEncargado, setFilterEncargado] = useState('')
  const [filterTelefono, setFilterTelefono] = useState('')
  const [filterEstado, setFilterEstado] = useState('')
  const [filterAnio, setFilterAnio] = useState(String(new Date().getFullYear()))

  const [nie, setNie] = useState('')
  const [estudiante, setEstudiante] = useState<any>(null)
  const [talonarios, setTalonarios] = useState<Talonario[]>([])
  const [selectedTalonario, setSelectedTalonario] = useState('')
  const [selectedComprobante, setSelectedComprobante] = useState('')
  const [selectedTipoPago, setSelectedTipoPago] = useState('')
  const [nuevoTipoPago, setNuevoTipoPago] = useState('')
  const [selectedTipoRapido, setSelectedTipoRapido] = useState('')
  const [montoManual, setMontoManual] = useState('')
  const [notas, setNotas] = useState('')
  const [savingPago, setSavingPago] = useState(false)

  const fetchPagos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange?.from) params.set('desde', dateRange.from.toISOString())
      if (dateRange?.to) params.set('hasta', dateRange.to.toISOString())
      if (filterTipo) params.set('tipo', filterTipo)
      if (filterNombre) params.set('nombre', filterNombre)
      if (filterNie) params.set('nie', filterNie)
      if (filterGrado) params.set('grado', filterGrado)
      if (filterSeccion) params.set('seccion', filterSeccion)
      if (filterEncargado) params.set('encargado', filterEncargado)
      if (filterTelefono) params.set('telefono', filterTelefono)
      if (filterEstado) params.set('estado', filterEstado)
      if (filterAnio) params.set('anio', filterAnio)

      const estudianteId = searchParams.get('estudianteId')
      if (estudianteId) params.set('estudianteId', estudianteId)
      
      const res = await fetch(`/api/pagos?${params.toString()}`)
      const data = await res.json()
      setPagos(Array.isArray(data) ? data : [])
      setCurrentPage(1)
    } catch {
      toast.error('Error cargando pagos')
    } finally {
      setLoading(false)
    }
  }, [dateRange, filterTipo, filterNombre, filterNie, filterGrado, filterSeccion, filterEncargado, filterTelefono, filterEstado, filterAnio, searchParams])

  useEffect(() => { fetchPagos() }, [fetchPagos])

  const clearFilters = () => {
    setDateRange(undefined)
    setFilterTipo('')
    setFilterNombre('')
    setFilterNie('')
    setFilterGrado('')
    setFilterSeccion('')
    setFilterEncargado('')
    setFilterTelefono('')
    setFilterEstado('')
    setFilterAnio(String(new Date().getFullYear()))
  }

  const hasActiveFilters = dateRange?.from || filterTipo || filterNombre || filterNie || filterGrado || filterSeccion || filterEncargado || filterTelefono || filterEstado

  // Pagination logic
  const totalItems = pagos.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const paginatedPagos = pagos.slice(startIdx, endIdx)

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages))
    setCurrentPage(validPage)
  }

  const buscarEstudiante = async () => {
    if (!nie.trim()) return
    try {
      const res = await fetch(`/api/estudiantes?nie=${encodeURIComponent(nie)}`)
      const data = await res.json()
      if (data.length > 0) {
        setEstudiante(data[0])
        const talRes = await fetch(`/api/talonarios?estudianteId=${data[0].id}`)
        const talData = await talRes.json()
        setTalonarios(Array.isArray(talData) ? talData : [])
      } else {
        toast.error('Estudiante no encontrado con ese NIE')
        setEstudiante(null)
        setTalonarios([])
      }
    } catch {
      toast.error('Error buscando estudiante')
    }
  }

  const handleRegistrarPago = async () => {
    if (!estudiante || !selectedTipoPago) {
      toast.error('Seleccione estudiante y tipo de pago')
      return
    }

    if (selectedTipoPago === 'COLEGIATURA' && !selectedComprobante) {
      toast.error('Para mensualidad debe seleccionar un comprobante')
      return
    }

    if (selectedTipoPago !== 'COLEGIATURA' && (!montoManual || Number(montoManual) <= 0)) {
      toast.error('Ingrese un monto válido')
      return
    }

    if (selectedTipoPago === 'OTRO' && !nuevoTipoPago.trim()) {
      toast.error('Ingrese el nombre del nuevo tipo de pago')
      return
    }

    setSavingPago(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estudianteId: estudiante.id,
          tipo: selectedTipoPago,
          comprobanteId: selectedTipoPago === 'COLEGIATURA' ? selectedComprobante : undefined,
          monto: selectedTipoPago === 'COLEGIATURA' ? undefined : Number(montoManual),
          tipoPersonalizado: selectedTipoPago === 'OTRO' ? nuevoTipoPago.trim() : undefined,
          notas,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pago registrado exitosamente')
        setShowForm(false)
        setNie(''); setEstudiante(null); setTalonarios([])
        setSelectedTalonario(''); setSelectedComprobante('')
        setSelectedTipoPago(''); setNuevoTipoPago(''); setSelectedTipoRapido(''); setMontoManual(''); setNotas('')
        fetchPagos()
      } else {
        toast.error(data.error || 'Error registrando pago')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingPago(false)
    }
  }

  const talonarioActual = talonarios.find(t => t.id === selectedTalonario)
  const comprobantesDisponibles = talonarioActual?.comprobantes.filter(c => !c.pagado) || []
  const esMensualidad = selectedTipoPago === 'COLEGIATURA'
  const esTipoOtro = selectedTipoPago === 'OTRO'
  const tiposPersonalizadosRecientes = Array.from(new Set(
    pagos
      .filter(p => p.tipo === 'OTRO' && p.tipoPersonalizado)
      .map(p => String(p.tipoPersonalizado).trim())
      .filter(Boolean)
  )).slice(0, 8)
  const puedeGuardarPago =
    !!estudiante &&
    !!selectedTipoPago &&
    (esMensualidad ? !!selectedComprobante : !!montoManual && Number(montoManual) > 0) &&
    (!esTipoOtro || !!nuevoTipoPago.trim())

  return (
    <div className="flex flex-col h-full">
      <Header title="Gestionar Pagos" subtitle="Registro y seguimiento de pagos" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Filter bar */}
        <Card className="py-0">
          <CardHeader className="flex flex-col gap-3 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
             <div className="flex items-center gap-2">
                <DateRangePicker 
                  value={dateRange} 
                  onChange={setDateRange} 
                />
                <Select value={filterTipo || 'all'} onValueChange={v => setFilterTipo(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    {Object.entries(TIPO_PAGO_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button 
                  variant={showFilters ? "secondary" : "outline"} 
                  size="sm" 
                  onClick={() => setShowFilters(!showFilters)}
                  className="gap-1.5 h-8 text-xs"
                >
                  <Filter className="size-3.5" />
                  {showFilters ? 'Ocultar' : 'Filtros'}
                  {hasActiveFilters && !dateRange?.from && !filterTipo && (
                    <Badge variant="secondary" className="ml-0.5 h-4 px-1 text-[8px] uppercase">
                      Activos
                    </Badge>
                  )}
                </Button>
             </div>
             <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1.5 text-xs text-muted-foreground">
                    <X className="size-3.5" />
                    Limpiar
                  </Button>
                )}
                {(rol === 'COLECTOR' || rol === 'ADMINISTRATIVO') && (
                  <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-8 text-xs gap-1.5">
                    <Plus className="size-3.5" /> Registrar Pago
                  </Button>
                )}
             </div>
          </CardHeader>
          
          {/* Expanded Filters */}
          {showFilters && (
            <div className="p-3 border-b bg-muted/20">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estudiante</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Nombre..."
                      value={filterNombre}
                      onChange={e => setFilterNombre(e.target.value)}
                      className="h-8 pl-7 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">NIE</label>
                  <Input
                    placeholder="NIE..."
                    value={filterNie}
                    onChange={e => setFilterNie(e.target.value)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</label>
                  <Select value={filterGrado || 'all'} onValueChange={v => setFilterGrado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos los grados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los grados</SelectItem>
                      {GRADOS.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sección</label>
                  <Select value={filterSeccion || 'all'} onValueChange={v => setFilterSeccion(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {SECCIONES.map(s => (
                        <SelectItem key={s} value={s}>Sección {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Encargado</label>
                  <Input
                    placeholder="..."
                    value={filterEncargado}
                    onChange={e => setFilterEncargado(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</label>
                  <Input
                    placeholder="..."
                    value={filterTelefono}
                    onChange={e => setFilterTelefono(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estado Estudiante</label>
                  <Select value={filterEstado || 'all'} onValueChange={v => setFilterEstado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="AL_DIA">Al día</SelectItem>
                      <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                      <SelectItem value="INCOMPLETO">Incompleto / Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Año Escolar</label>
                  <Select value={filterAnio} onValueChange={setFilterAnio}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Seleccionar año" />
                    </SelectTrigger>
                    <SelectContent>
                      {[2024, 2025, 2026, 2027, 2028].map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Payment form */}
        {showForm && (rol === 'COLECTOR' || rol === 'ADMINISTRATIVO') && (
          <Card>
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base">Registrar Nuevo Pago</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* NIE search */}
                <div className="space-y-1.5">
                  <Label htmlFor="nie-pago">NIE del Estudiante</Label>
                  <div className="flex gap-2">
                    <Input
                      id="nie-pago"
                      value={nie}
                      onChange={e => setNie(e.target.value)}
                      placeholder="Ej: 123456789"
                      className="flex-1 font-mono"
                      onKeyDown={e => e.key === 'Enter' && buscarEstudiante()}
                    />
                    <Button variant="secondary" type="button" onClick={buscarEstudiante}>
                      Buscar
                    </Button>
                  </div>
                  {estudiante && (
                    <p className="text-xs text-emerald-600 font-medium">✓ {estudiante.nombre}</p>
                  )}
                </div>

                {/* Tipo de pago */}
                <div className="space-y-1.5">
                  <Label htmlFor="tipo-pago-select">Tipo de Pago</Label>
                  <Select
                    value={selectedTipoPago || 'none'}
                    onValueChange={v => {
                      const next = v === 'none' ? '' : v
                      setSelectedTipoPago(next)
                      setSelectedTalonario('')
                      setSelectedComprobante('')
                      if (next === 'COLEGIATURA') {
                        setMontoManual('')
                        setNuevoTipoPago('')
                      }
                    }}
                  >
                    <SelectTrigger id="tipo-pago-select" className="w-full">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar tipo</SelectItem>
                      {Object.entries(TIPO_PAGO_OPTIONS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Si selecciona mensualidad (colegiatura), debe elegir talonario y comprobante.
                  </p>
                </div>

                {/* Talonario select */}
                {esMensualidad && talonarios.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="talonario-select">Talonario</Label>
                    <Select
                      value={selectedTalonario}
                      onValueChange={v => { setSelectedTalonario(v); setSelectedComprobante('') }}
                    >
                      <SelectTrigger id="talonario-select" className="w-full">
                        <SelectValue placeholder="Seleccionar año" />
                      </SelectTrigger>
                      <SelectContent>
                        {talonarios.map(t => (
                          <SelectItem key={t.id} value={t.id}>Talonario {t.anio}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Comprobante select */}
                {esMensualidad && comprobantesDisponibles.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="comprobante-select">Comprobante</Label>
                    <Select value={selectedComprobante} onValueChange={setSelectedComprobante}>
                      <SelectTrigger id="comprobante-select" className="w-full">
                        <SelectValue placeholder="Seleccionar comprobante" />
                      </SelectTrigger>
                      <SelectContent>
                        {comprobantesDisponibles.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {TIPO_PAGO_LABELS[c.tipo]}{c.mes ? ` - ${c.mes}` : ''} (${c.monto.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Selector rapido de tipo personalizado */}
                {esTipoOtro && tiposPersonalizadosRecientes.length > 0 && (
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo-rapido">Tipo Rápido</Label>
                    <Select
                      value={selectedTipoRapido || 'none'}
                      onValueChange={v => {
                        const next = v === 'none' ? '' : v
                        setSelectedTipoRapido(next)
                        if (next) setNuevoTipoPago(next)
                      }}
                    >
                      <SelectTrigger id="tipo-rapido" className="w-full">
                        <SelectValue placeholder="Seleccionar tipo usado recientemente" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Escribir uno nuevo</SelectItem>
                        {tiposPersonalizadosRecientes.map(tipo => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Tipo personalizado */}
                {esTipoOtro && (
                  <div className="space-y-1.5">
                    <Label htmlFor="tipo-personalizado">Nuevo Tipo de Pago</Label>
                    <Input
                      id="tipo-personalizado"
                      value={nuevoTipoPago}
                      onChange={e => setNuevoTipoPago(e.target.value)}
                      placeholder="Ej: Camisa, Transporte, Evento..."
                    />
                  </div>
                )}

                {/* Monto manual */}
                {!esMensualidad && selectedTipoPago && (
                  <div className="space-y-1.5">
                    <Label htmlFor="monto-manual">Monto a Pagar</Label>
                    <Input
                      id="monto-manual"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={montoManual}
                      onChange={e => setMontoManual(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="notas-pago">Notas (opcional)</Label>
                  <Input
                    id="notas-pago"
                    value={notas}
                    onChange={e => setNotas(e.target.value)}
                    placeholder="Observaciones..."
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-3 border-t pt-4">
              <Button onClick={handleRegistrarPago} disabled={savingPago || !puedeGuardarPago}>
                {savingPago ? 'Guardando...' : 'Confirmar Pago'}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </CardFooter>
          </Card>
        )}

        {/* Payments table */}
        <Card className="py-0">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base">Historial de Pagos</CardTitle>
          </CardHeader>

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {['Estudiante', 'NIE', 'Tipo', 'Mes', 'Monto', 'Fecha', 'Notas', 'Acciones'].map(h => (
                  <TableHead key={h} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(8)].map((_, j) => (
                      <TableCell key={j} className="px-3 py-2">
                        <Skeleton className="h-3 w-full max-w-24" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="p-0">
                    <Empty className="min-h-40 rounded-none border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CreditCard /></EmptyMedia>
                        <EmptyTitle>No hay pagos</EmptyTitle>
                        <EmptyDescription>No se encontraron pagos para los filtros seleccionados.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPagos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="px-3 py-2 text-sm font-medium">{p.estudiante.nombre}</TableCell>
                    <TableCell className="px-3 py-2 font-mono text-xs text-muted-foreground">{p.estudiante.nie}</TableCell>
                    <TableCell className="px-3 py-2">
                      <Badge className={cn('border text-xs', typeBadgeClass[p.tipo] || '')}>
                        {p.tipo === 'OTRO' ? (p.tipoPersonalizado || 'Otro') : (TIPO_PAGO_LABELS[p.tipo] || p.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2 text-xs text-muted-foreground">{p.comprobante?.mes || '—'}</TableCell>
                    <TableCell className="px-3 py-2 text-sm font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.monto)}</TableCell>
                    <TableCell className="px-3 py-2 text-xs text-muted-foreground">{formatDate(p.fecha)}</TableCell>
                    <TableCell className="px-3 py-2 text-xs text-muted-foreground">{p.notas || '—'}</TableCell>
                    <TableCell className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/pagos/${p.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/pagos/${p.id}/imprimir`}>
                            <Printer className="size-4" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Pagination */}
        {pagos.length > 0 && !loading && (
          <Card className="py-0">
            <CardFooter className="border-t flex flex-col gap-3 py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">
                  Mostrando {startIdx + 1} a {Math.min(endIdx, totalItems)} de {totalItems} pago{totalItems !== 1 ? 's' : ''}
                </p>
                <p className="text-sm font-semibold text-emerald-600 tabular-nums">
                  Total: {formatCurrency(pagos.reduce((sum, p) => sum + p.monto, 0))}
                </p>
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-7 gap-0.5 px-1.5 text-xs"
                  >
                    ← <span className="hidden sm:inline">Anterior</span>
                  </Button>
                  
                  <div className="flex items-center gap-0.5">
                    {[...Array(totalPages)].map((_, idx) => {
                      const page = idx + 1
                      const isVisible = totalPages <= 7 || 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      if (!isVisible && idx > 0 && (idx === 1 || idx === totalPages - 2)) {
                        return <span key={`dots-${idx}`} className="px-0.5 text-muted-foreground text-[10px]">…</span>
                      }
                      
                      if (!isVisible) return null
                      
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-7 w-6 p-0 text-xs"
                        >
                          {page}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-7 gap-0.5 px-1.5 text-xs"
                  >
                    <span className="hidden sm:inline">Siguiente</span> →
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
