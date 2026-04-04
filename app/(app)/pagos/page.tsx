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
  talonario?: { anio: number } | null
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
  const [aniosDisponibles, setAniosDisponibles] = useState<number[]>([new Date().getFullYear()])
  const [config, setConfig] = useState<any>(null)

  const [nie, setNie] = useState('')
  const [estudiante, setEstudiante] = useState<any>(null)
  const [talonarios, setTalonarios] = useState<Talonario[]>([])
  const [adminComprobantes, setAdminComprobantes] = useState<Comprobante[]>([])
  const [selectedTalonario, setSelectedTalonario] = useState('')
  const [selectedComprobante, setSelectedComprobante] = useState('')
  const [selectedTipoPago, setSelectedTipoPago] = useState('')
  const [nuevoTipoPago, setNuevoTipoPago] = useState('')
  const [selectedTipoRapido, setSelectedTipoRapido] = useState('')
  const [montoManual, setMontoManual] = useState('')
  const [notas, setNotas] = useState('')
  const [savingPago, setSavingPago] = useState(false)

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/configuracion')
      const data = await res.json()
      if (res.ok) setConfig(data)
    } catch { /* FAIL SILENTLY */ }
  }, [])

  const fetchAnios = useCallback(async () => {
    try {
      const res = await fetch('/api/talonarios/anios')
      const data = await res.json()
      if (Array.isArray(data)) setAniosDisponibles(data)
    } catch { /* Usar default */ }
  }, [])

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
      if (res.ok) setPagos(data)
    } catch {
      toast.error('Error cargando pagos')
    } finally {
      setLoading(false)
    }
  }, [dateRange, filterTipo, filterNombre, filterNie, filterGrado, filterSeccion, filterEncargado, filterTelefono, filterEstado, filterAnio, searchParams])

  useEffect(() => {
    fetchConfig()
    fetchAnios()
    fetchPagos()
  }, [fetchConfig, fetchAnios, fetchPagos])

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
        const talRes = await fetch(`/api/talonarios?estudianteId=${data[0].id}&anio=all`)
        const talData = await talRes.json()
        setTalonarios(Array.isArray(talData) ? talData.sort((a, b) => b.anio - a.anio) : [])

        const adminRes = await fetch(`/api/estudiantes/${data[0].id}/comprobantes`)
        const adminData = await adminRes.json()
        setAdminComprobantes(Array.isArray(adminData) ? adminData : [])
      } else {
        toast.error('Estudiante no encontrado con ese NIE')
        setEstudiante(null)
        setTalonarios([])
        setAdminComprobantes([])
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

    if ((esMensualidad || esAdministrativoConRecibo) && !selectedComprobante) {
      toast.error('Debe seleccionar el mes o recibo correspondiente')
      return
    }

    if (!esMensualidad && !esAdministrativoConRecibo && (!montoManual || Number(montoManual) <= 0)) {
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
          comprobanteId: selectedComprobante || undefined,
          monto: selectedComprobante ? undefined : Number(montoManual),
          tipoPersonalizado: selectedTipoPago === 'OTRO' ? nuevoTipoPago.trim() : undefined,
          notas,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pago registrado exitosamente')
        setShowForm(false)
        setNie(''); setEstudiante(null); setTalonarios([]); setAdminComprobantes([])
        setSelectedTalonario(''); setSelectedComprobante('')
        setSelectedTipoPago(''); setNuevoTipoPago(''); setSelectedTipoRapido(''); setMontoManual(''); setNotas('')
        fetchPagos()
      } else {
        toast.error(data.error || 'Error registrando pago')
      }
    } finally {
      setSavingPago(false)
    }
  }

  const talonarioActual = talonarios.find(t => t.id === selectedTalonario)
  const comprobantesDisponibles = talonarioActual?.comprobantes.filter(c => !c.pagado && c.tipo === 'COLEGIATURA') || []

  const esMensualidad = selectedTipoPago === 'COLEGIATURA'
  const esTipoOtro = selectedTipoPago === 'OTRO'
  const esAdministrativoConRecibo = ['MATRICULA', 'PAPELERIA', 'ALIMENTACION'].includes(selectedTipoPago)
  const comprobantesAdminFiltrados = adminComprobantes.filter(c => c.tipo === selectedTipoPago)

  const tiposPersonalizadosRecientes = Array.from(new Set(
    pagos
      .filter(p => p.tipo === 'OTRO' && p.tipoPersonalizado)
      .map(p => String(p.tipoPersonalizado).trim())
      .filter(Boolean)
  )).slice(0, 8)

  const puedeGuardarPago =
    !!estudiante &&
    !!selectedTipoPago &&
    (esTipoOtro
      ? (!!nuevoTipoPago.trim() && !!montoManual && Number(montoManual) > 0)
      : !!selectedComprobante)

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

          {showFilters && (
            <div className="p-3 border-b bg-muted/20">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Estudiante</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Nombre..." value={filterNombre} onChange={e => setFilterNombre(e.target.value)} className="h-8 pl-7 text-xs" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">NIE</label>
                  <Input placeholder="NIE..." value={filterNie} onChange={e => setFilterNie(e.target.value)} className="h-8 text-xs font-mono" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Grado</label>
                  <Select value={filterGrado || 'all'} onValueChange={v => setFilterGrado(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {GRADOS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sección</label>
                  <Select value={filterSeccion || 'all'} onValueChange={v => setFilterSeccion(v === 'all' ? '' : v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {SECCIONES.map(s => <SelectItem key={s} value={s}>Sección {s}</SelectItem>)}
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
                <div className="space-y-1.5">
                  <Label htmlFor="nie-pago">NIE del Estudiante</Label>
                  <div className="flex gap-2">
                    <Input id="nie-pago" value={nie} onChange={e => setNie(e.target.value)} placeholder="NIE..." className="flex-1 font-mono" onKeyDown={e => e.key === 'Enter' && buscarEstudiante()} />
                    <Button variant="secondary" type="button" onClick={buscarEstudiante}>Buscar</Button>
                  </div>
                  {estudiante && <p className="text-xs text-emerald-600 font-medium">✓ {estudiante.nombre}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="tipo-pago-select">Tipo de Pago</Label>
                  <Select value={selectedTipoPago || 'none'} onValueChange={v => {
                    const next = v === 'none' ? '' : v
                    setSelectedTipoPago(next)
                    setSelectedTalonario('')
                    setSelectedComprobante('')
                    if (next === 'COLEGIATURA') {
                      setMontoManual(''); setNuevoTipoPago('')
                    } else if (['MATRICULA', 'PAPELERIA', 'ALIMENTACION'].includes(next)) {
                      setNuevoTipoPago('')
                      const admins = adminComprobantes.filter(c => c.tipo === next)
                      if (next !== 'ALIMENTACION' && admins.length === 1) {
                        setSelectedComprobante(admins[0].id)
                        setMontoManual(String(admins[0].monto))
                      } else {
                        setMontoManual(String(config?.[`monto${next.charAt(0) + next.slice(1).toLowerCase()}`] || ''))
                      }
                    } else { setMontoManual('') }
                  }}>
                    <SelectTrigger id="tipo-pago-select" className="w-full"><SelectValue placeholder="Seleccionar tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Seleccionar tipo</SelectItem>
                      {Object.entries(TIPO_PAGO_OPTIONS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {esMensualidad && (
                  <div className="space-y-1.5">
                    <Label htmlFor="talonario-select">Talonario</Label>
                    <Select value={selectedTalonario} onValueChange={v => { setSelectedTalonario(v); setSelectedComprobante('') }}>
                      <SelectTrigger id="talonario-select" className="w-full"><SelectValue placeholder="Año" /></SelectTrigger>
                      <SelectContent>
                        {talonarios.map(t => <SelectItem key={t.id} value={t.id}>Talonario {t.anio}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {((esMensualidad && !!selectedTalonario) || esAdministrativoConRecibo) && (
                  <div className="space-y-1.5">
                    <Label>Seleccionar Mes / Recibo</Label>
                    <Select value={selectedComprobante} onValueChange={v => {
                      setSelectedComprobante(v)
                      if (!esMensualidad) {
                        const comp = adminComprobantes.find(c => c.id === v)
                        if (comp) setMontoManual(String(comp.monto))
                      }
                    }}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {(esMensualidad ? comprobantesDisponibles : comprobantesAdminFiltrados).map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            {TIPO_PAGO_LABELS[c.tipo]}
                            {c.mes ? ` - ${c.mes}` : ''}
                            {c.talonario?.anio ? ` [${c.talonario.anio}]` : ''}
                            (${c.monto.toFixed(2)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {esTipoOtro && (
                  <>
                    <div className="space-y-1.5">
                      <Label htmlFor="tipo-personalizado">Nombre del Pago</Label>
                      <Input
                        id="tipo-personalizado"
                        value={nuevoTipoPago}
                        onChange={e => {
                          setNuevoTipoPago(e.target.value)
                          setSelectedTipoRapido('manual')
                        }}
                        placeholder="Ej: Camisa, Excursión..."
                        className="h-9"
                      />
                    </div>
                    {tiposPersonalizadosRecientes.length > 0 && (
                      <div className="space-y-1.5">
                        <Label>Sugerencias Recientes</Label>
                        <Select value={selectedTipoRapido} onValueChange={v => {
                          setSelectedTipoRapido(v)
                          if (v !== 'manual') setNuevoTipoPago(v)
                        }}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Tipos anteriores..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">-- Escribir nuevo --</SelectItem>
                            {tiposPersonalizadosRecientes.map(t => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </>
                )}

                {esTipoOtro && !selectedComprobante && (
                  <div className="space-y-1.5">
                    <Label htmlFor="monto-manual">Monto a Pagar</Label>
                    <Input id="monto-manual" type="number" step="0.01" value={montoManual} onChange={e => setMontoManual(e.target.value)} />
                  </div>
                )}

                <div className="space-y-1.5 lg:col-span-2">
                  <Label htmlFor="notas-pago">Notas</Label>
                  <Input id="notas-pago" value={notas} onChange={e => setNotas(e.target.value)} placeholder="Observaciones..." />
                </div>
              </div>
            </CardContent>
            <CardFooter className="gap-3 border-t pt-4">
              <Button onClick={handleRegistrarPago} disabled={savingPago || !puedeGuardarPago}>{savingPago ? 'Guardando...' : 'Confirmar Pago'}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            </CardFooter>
          </Card>
        )}

        {/* List */}
        <Card className="py-0">
          <CardHeader className="border-b px-6 py-4">
            <CardTitle className="text-base">Historial de Pagos</CardTitle>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {['Estudiante', 'NIE', 'Tipo', 'Mes', 'Monto', 'Fecha', 'Notas', 'Acciones'].map(h => <TableHead key={h} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? [...Array(5)].map((_, i) => (
                <TableRow key={i}>{[...Array(8)].map((_, j) => <TableCell key={j} className="px-3 py-2"><Skeleton className="h-3 w-full" /></TableCell>)}</TableRow>
              )) : pagos.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No se encontraron pagos.</TableCell></TableRow>
              ) : paginatedPagos.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="px-3 py-2 text-sm font-medium">{p.estudiante.nombre}</TableCell>
                  <TableCell className="px-3 py-1 font-mono text-[11px] text-muted-foreground">{p.estudiante.nie}</TableCell>
                  <TableCell className="px-3 py-1">
                    <Badge className={cn('border text-[10px] px-1.5 py-0', typeBadgeClass[p.tipo] || '')}>{p.tipo === 'OTRO' ? p.tipoPersonalizado : TIPO_PAGO_LABELS[p.tipo]}</Badge>
                  </TableCell>
                  <TableCell className="px-3 py-1 text-xs">{p.comprobante?.mes || '—'}</TableCell>
                  <TableCell className="px-3 py-1 text-sm font-semibold tabular-nums">{formatCurrency(p.monto)}</TableCell>
                  <TableCell className="px-3 py-1 text-[11px] text-muted-foreground">{formatDate(p.fecha)}</TableCell>
                  <TableCell className="px-3 py-1 text-[11px] text-muted-foreground truncate max-w-[150px]">{p.notas || '—'}</TableCell>
                  <TableCell className="px-3 py-1">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-sm" asChild><Link href={`/pagos/${p.id}`}><Eye className="size-3.5" /></Link></Button>
                      <Button variant="ghost" size="icon-sm" asChild><Link href={`/pagos/${p.id}/imprimir`}><Printer className="size-3.5" /></Link></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>Anterior</Button>
            <span className="flex items-center text-xs text-muted-foreground">Página {currentPage} de {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente</Button>
          </div>
        )}
      </div>
    </div>
  )
}
