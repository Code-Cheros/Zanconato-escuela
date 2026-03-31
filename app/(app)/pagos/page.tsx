// app/(app)/pagos/page.tsx
'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { Plus, X, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatCurrency, formatDate, TIPO_PAGO_LABELS } from '@/lib/utils'
import { useSession } from 'next-auth/react'
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

interface Pago {
  id: string
  monto: number
  tipo: string
  fecha: string
  notas: string | null
  estudiante: { nombre: string; nie: string; grado: string; seccion: string }
  comprobante: { mes: string | null }
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

export default function PagosPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const searchParams = useSearchParams()

  const [pagos, setPagos] = useState<Pago[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterFecha, setFilterFecha] = useState('')
  const [filterTipo, setFilterTipo] = useState('')

  const [nie, setNie] = useState('')
  const [estudiante, setEstudiante] = useState<any>(null)
  const [talonarios, setTalonarios] = useState<Talonario[]>([])
  const [selectedTalonario, setSelectedTalonario] = useState('')
  const [selectedComprobante, setSelectedComprobante] = useState('')
  const [notas, setNotas] = useState('')
  const [savingPago, setSavingPago] = useState(false)

  const fetchPagos = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterFecha) params.set('fecha', filterFecha)
      if (filterTipo) params.set('tipo', filterTipo)
      const estudianteId = searchParams.get('estudianteId')
      if (estudianteId) params.set('estudianteId', estudianteId)
      const res = await fetch(`/api/pagos?${params}`)
      const data = await res.json()
      setPagos(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Error cargando pagos')
    } finally {
      setLoading(false)
    }
  }, [filterFecha, filterTipo, searchParams])

  useEffect(() => { fetchPagos() }, [fetchPagos])

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
      }
    } catch {
      toast.error('Error buscando estudiante')
    }
  }

  const handleRegistrarPago = async () => {
    if (!estudiante || !selectedComprobante) {
      toast.error('Seleccione estudiante y comprobante')
      return
    }
    setSavingPago(true)
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estudianteId: estudiante.id, comprobanteId: selectedComprobante, notas }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Pago registrado exitosamente')
        setShowForm(false)
        setNie(''); setEstudiante(null); setTalonarios([])
        setSelectedTalonario(''); setSelectedComprobante(''); setNotas('')
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

  return (
    <div className="flex flex-col h-full">
      <Header title="Gestionar Pagos" subtitle="Registro y seguimiento de pagos" />

      <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="date"
              value={filterFecha}
              onChange={e => setFilterFecha(e.target.value)}
              className="w-auto"
            />
            <Select value={filterTipo || 'all'} onValueChange={v => setFilterTipo(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(TIPO_PAGO_OPTIONS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(filterFecha || filterTipo) && (
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={() => { setFilterFecha(''); setFilterTipo('') }}>
                <X className="size-4" /> Limpiar
              </Button>
            )}
          </div>
          {(rol === 'COLECTOR' || rol === 'ADMINISTRATIVO') && (
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="size-4" /> Registrar Pago
            </Button>
          )}
        </div>

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

                {/* Talonario select */}
                {talonarios.length > 0 && (
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
                {comprobantesDisponibles.length > 0 && (
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
              <Button onClick={handleRegistrarPago} disabled={savingPago || !selectedComprobante}>
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
                {['Estudiante', 'NIE', 'Tipo', 'Mes', 'Monto', 'Fecha', 'Notas'].map(h => (
                  <TableHead key={h} className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-full max-w-[8rem]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <Empty className="min-h-[12rem] rounded-none border-0">
                      <EmptyHeader>
                        <EmptyMedia variant="icon"><CreditCard /></EmptyMedia>
                        <EmptyTitle>No hay pagos</EmptyTitle>
                        <EmptyDescription>No se encontraron pagos para los filtros seleccionados.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              ) : (
                pagos.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="px-4 py-3 font-medium">{p.estudiante.nombre}</TableCell>
                    <TableCell className="px-4 py-3 font-mono text-muted-foreground">{p.estudiante.nie}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge className={cn('border', typeBadgeClass[p.tipo] || '')}>
                        {TIPO_PAGO_LABELS[p.tipo]}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{p.comprobante?.mes || '—'}</TableCell>
                    <TableCell className="px-4 py-3 font-semibold text-emerald-600 tabular-nums">{formatCurrency(p.monto)}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{formatDate(p.fecha)}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{p.notas || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {pagos.length > 0 && (
              <TableFoot>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableCell colSpan={4} className="px-4 py-3 text-xs text-muted-foreground">
                    {pagos.length} pago{pagos.length !== 1 ? 's' : ''}
                  </TableCell>
                  <TableCell className="px-4 py-3 font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(pagos.reduce((sum, p) => sum + p.monto, 0))}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFoot>
            )}
          </Table>
        </Card>
      </div>
    </div>
  )
}
