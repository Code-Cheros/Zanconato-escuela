// app/(app)/estudiantes/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { Plus, Search, Edit, Trash2, Eye, Users } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Toggle } from '@/components/ui/toggle'
import { COMPORTAMIENTOS_ALUMNO, ComportamientoAlumno } from '@/lib/estudianteComportamiento'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'

interface Estudiante {
  id: string
  nombre: string
  nie: string
  grado: string
  seccion: string
  encargado: string | null
  telefono: string | null
  creadoEn: string
}

const ITEMS_PER_PAGE = 10

export default function EstudiantesPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([])
  const [search, setSearch] = useState('')
  const [comportamientoFiltro, setComportamientoFiltro] = useState<ComportamientoAlumno[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchEstudiantes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('q', search.trim())
      comportamientoFiltro.forEach((item) => params.append('comportamiento', item))
      const res = await fetch(`/api/estudiantes?${params}`, { cache: 'no-store' })
      const data = await res.json()
      setEstudiantes(Array.isArray(data) ? data : [])
      setCurrentPage(1)
    } catch {
      toast.error('Error cargando estudiantes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEstudiantes() }, [search, comportamientoFiltro])

  const toggleComportamientoFiltro = (valor: ComportamientoAlumno, pressed: boolean) => {
    setComportamientoFiltro((prev) => {
      if (pressed) {
        if (prev.includes(valor)) return prev
        return [...prev, valor]
      }
      return prev.filter((item) => item !== valor)
    })
  }

  const totalItems = estudiantes.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const paginatedEstudiantes = estudiantes.slice(startIdx, endIdx)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/estudiantes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Estudiante eliminado')
        fetchEstudiantes()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Estudiantes" subtitle="Gestión de matrícula y datos estudiantiles" />

      <div className="flex-1 p-4 sm:p-6">
        <Card className="py-0">
          <CardHeader className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <CardTitle className="text-base">Listado de Estudiantes</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-56"
                />
              </div>
              {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                <Button className="w-full sm:w-auto" asChild>
                  <Link href="/estudiantes/nuevo">
                    <Plus className="size-4" />
                    Nuevo Estudiante
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
              {COMPORTAMIENTOS_ALUMNO.map((item) => (
                <Toggle
                  key={item}
                  size="sm"
                  variant="outline"
                  pressed={comportamientoFiltro.includes(item)}
                  onPressedChange={(pressed) => toggleComportamientoFiltro(item, pressed)}
                  className="data-[state=on]:border-primary/50 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
                >
                  {item}
                </Toggle>
              ))}
              {comportamientoFiltro.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setComportamientoFiltro([])}
                >
                  Limpiar
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {['Nombre', 'NIE', 'Grado', 'Sección', 'Encargado', 'Teléfono', 'Matriculado', 'Acciones'].map(h => (
                    <TableHead key={h} className="px-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : estudiantes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="p-0">
                      <Empty className="min-h-[12rem] rounded-none border-0">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><Users /></EmptyMedia>
                          <EmptyTitle>No hay estudiantes registrados</EmptyTitle>
                          <EmptyDescription>Matriculá un nuevo estudiante para comenzar.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedEstudiantes.map(est => (
                    <TableRow key={est.id}>
                      <TableCell className="px-4 py-3 font-medium">{est.nombre}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-muted-foreground">{est.nie}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{est.grado}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{est.seccion}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{est.encargado || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{est.telefono || '—'}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground text-sm">
                        {new Date(est.creadoEn).toLocaleDateString('es-SV')}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/estudiantes/${est.id}`}><Eye className="size-4" /></Link>
                          </Button>
                          {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                            <Button variant="ghost" size="icon-sm" asChild>
                              <Link href={`/estudiantes/${est.id}/editar`}><Edit className="size-4" /></Link>
                            </Button>
                          )}
                          {rol === 'ADMINISTRATIVO' && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent size="sm">
                                <AlertDialogHeader>
                                  <AlertDialogMedia><Trash2 /></AlertDialogMedia>
                                  <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción eliminará a <strong>{est.nombre}</strong> de forma permanente y no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction variant="destructive" onClick={() => handleDelete(est.id)}>
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            {loading ? (
              <div className="divide-y">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : estudiantes.length === 0 ? (
              <Empty className="min-h-[12rem] border-0 rounded-none">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><Users /></EmptyMedia>
                  <EmptyTitle>No hay estudiantes registrados</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {paginatedEstudiantes.map(est => (
                  <li key={est.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{est.nombre}</p>
                        <p className="text-xs font-mono text-muted-foreground">{est.nie} · {est.grado} {est.seccion}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <Button variant="ghost" size="icon-sm" asChild>
                          <Link href={`/estudiantes/${est.id}`}><Eye className="size-4" /></Link>
                        </Button>
                        {(rol === 'MATRICULA' || rol === 'ADMINISTRATIVO') && (
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/estudiantes/${est.id}/editar`}><Edit className="size-4" /></Link>
                          </Button>
                        )}
                        {rol === 'ADMINISTRATIVO' && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent size="sm">
                              <AlertDialogHeader>
                                <AlertDialogMedia><Trash2 /></AlertDialogMedia>
                                <AlertDialogTitle>¿Eliminar estudiante?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción eliminará a <strong>{est.nombre}</strong> de forma permanente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => handleDelete(est.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!loading && estudiantes.length > 0 && (
            <CardFooter className="flex flex-col gap-3 border-t py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                <p>
                  Mostrando <span className="font-medium">{Math.min(startIdx + 1, totalItems)}</span> a{' '}
                  <span className="font-medium">{Math.min(endIdx, totalItems)}</span> de{' '}
                  <span className="font-semibold">{totalItems}</span> estudiante{totalItems !== 1 ? 's' : ''}
                </p>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2 text-xs font-medium hidden sm:inline-flex"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 sm:hidden"
                  >
                    ←
                  </Button>

                  {totalPages <= 7 ? (
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <Button
                        key={page}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="h-8 w-8 p-0 text-xs font-medium"
                      >
                        {page}
                      </Button>
                    ))
                  ) : (
                    <>
                      {Array.from({ length: 3 }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-8 w-8 p-0 text-xs font-medium"
                        >
                          {page}
                        </Button>
                      ))}

                      <span className="flex h-8 w-8 items-center justify-center text-xs text-muted-foreground">
                        ...
                      </span>

                      {Array.from({ length: 3 }, (_, i) => totalPages - 2 + i).map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className="h-8 w-8 p-0 text-xs font-medium"
                        >
                          {page}
                        </Button>
                      ))}
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2 text-xs font-medium hidden sm:inline-flex"
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 sm:hidden"
                  >
                    →
                  </Button>
                </div>
              )}
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  )
}
