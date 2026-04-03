// app/(app)/usuarios/page.tsx
'use client'
import { useState, useEffect } from 'react'
import Header from '@/components/layout/Header'
import { Plus, Search, Edit, Trash2, UserCog, ShieldCheck, Mail, ShieldAlert, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
  activo: boolean
  creadoEn: string
}

const ITEMS_PER_PAGE = 10

export default function UsuariosPage() {
  const { data: session } = useSession()
  const currentUserRol = (session?.user as any)?.rol
  const currentUserId = (session?.user as any)?.id
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  const fetchUsuarios = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/usuarios')
      const data = await res.json()
      if (res.ok) {
        setUsuarios(Array.isArray(data) ? data : [])
        setCurrentPage(1)
      } else {
        toast.error(data.error || 'Error al cargar usuarios')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (currentUserRol === 'ADMINISTRATIVO') {
      fetchUsuarios()
    }
  }, [currentUserRol])

  const handleDelete = async (id: string) => {
    if (id === currentUserId) {
      toast.error('No puedes eliminarte a ti mismo')
      return
    }
    try {
      const res = await fetch(`/api/usuarios/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Usuario eliminado')
        fetchUsuarios()
      } else {
        const err = await res.json()
        toast.error(err.error || 'Error al eliminar')
      }
    } catch {
      toast.error('Error de conexión')
    }
  }

  const filteredUsuarios = usuarios.filter(u => 
    u.nombre.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const totalItems = filteredUsuarios.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const paginatedUsuarios = filteredUsuarios.slice(startIdx, endIdx)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (currentUserRol !== 'ADMINISTRATIVO' && !loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-6">
        <ShieldAlert className="size-12 text-destructive mb-4" />
        <h1 className="text-xl font-bold">Acceso Denegado</h1>
        <p className="text-muted-foreground">Solo administradores pueden acceder a esta sección.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Usuarios" subtitle="Gestión de cuentas y roles administrativos" />

      <div className="flex-1 p-4 sm:p-6">
        <Card className="py-0">
          <CardHeader className="flex flex-col gap-4 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <CardTitle className="text-base">Personal Administrativo</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  type="search"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 w-full sm:w-56"
                />
              </div>
              <Button className="w-full sm:w-auto" asChild>
                <Link href="/usuarios/nuevo">
                  <Plus className="size-4" />
                  Nuevo Usuario
                </Link>
              </Button>
            </div>
          </CardHeader>

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  {['Nombre', 'Email', 'Rol', 'Estado', 'Creado', 'Acciones'].map(h => (
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
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full max-w-[8rem]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredUsuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="p-0">
                      <Empty className="min-h-[12rem] rounded-none border-0">
                        <EmptyHeader>
                          <EmptyMedia variant="icon"><UserCog /></EmptyMedia>
                          <EmptyTitle>No se encontraron usuarios</EmptyTitle>
                          <EmptyDescription>Asegúrate de que el nombre o email sea correcto.</EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsuarios.map(user => (
                    <TableRow key={user.id}>
                      <TableCell className="px-4 py-3 font-medium">{user.nombre}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Mail className="size-3.5" />
                          {user.email}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant="outline" className="font-medium text-[10px] uppercase">
                          {user.rol}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={user.activo ? "default" : "secondary"} className="text-[10px]">
                          {user.activo ? 'ACTIVO' : 'INACTIVO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                        {new Date(user.creadoEn).toLocaleDateString('es-SV')}
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* 
                          // Comentado temporalmente porque no se pidió editar específicamente, 
                          // pero la lógica está lista si el usuario lo requiere.
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/usuarios/${user.id}/editar`}><Edit className="size-4" /></Link>
                          </Button> 
                          */}
                          {user.id !== currentUserId && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon-sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent size="sm">
                                <AlertDialogHeader>
                                  <AlertDialogMedia><Trash2 /></AlertDialogMedia>
                                  <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de eliminar a <strong>{user.nombre}</strong>? Esta acción no se puede deshacer.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction variant="destructive" onClick={() => handleDelete(user.id)}>
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
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : filteredUsuarios.length === 0 ? (
              <Empty className="min-h-[12rem] border-0 rounded-none">
                <EmptyHeader>
                  <EmptyMedia variant="icon"><UserCog /></EmptyMedia>
                  <EmptyTitle>No hay usuarios registrados</EmptyTitle>
                </EmptyHeader>
              </Empty>
            ) : (
              <ul className="divide-y">
                {paginatedUsuarios.map(user => (
                  <li key={user.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                       <div className="min-w-0">
                        <p className="font-medium text-sm flex items-center gap-1.5">
                          {user.nombre}
                          {user.rol === 'ADMINISTRATIVO' && <ShieldCheck className="size-3 text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <div className="mt-1.5 flex gap-1.5">
                          <Badge variant="outline" className="text-[9px] uppercase px-1 h-4">{user.rol}</Badge>
                          {!user.activo && <Badge variant="secondary" className="text-[9px] px-1 h-4">INACTIVO</Badge>}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {user.id !== currentUserId && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon-sm" className="text-destructive">
                                <Trash2 className="size-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent size="sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar?</AlertDialogTitle>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>No</AlertDialogCancel>
                                <AlertDialogAction variant="destructive" onClick={() => handleDelete(user.id)}>Sí</AlertDialogAction>
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

          {!loading && filteredUsuarios.length > 0 && (
            <CardFooter className="flex flex-col gap-3 border-t py-3 px-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-muted-foreground">
                <p>
                  Mostrando <span className="font-medium">{Math.min(startIdx + 1, totalItems)}</span> a{' '}
                  <span className="font-medium">{Math.min(endIdx, totalItems)}</span> de{' '}
                  <span className="font-semibold">{totalItems}</span> usuario{totalItems !== 1 ? 's' : ''}
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
