// app/(app)/usuarios/nuevo/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { ArrowLeft, Save, UserPlus, ShieldCheck, Mail, Lock, UserCog } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ROLES = [
  { value: 'ADMINISTRATIVO', label: 'Administrador' },
  { value: 'MATRICULA', label: 'Matrícula' },
  { value: 'COLECTOR', label: 'Colector' },
]

export default function NuevoUsuarioPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSelect = (value: string) => {
    setForm(prev => ({ ...prev, rol: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nombre || !form.email || !form.password || !form.rol) {
      toast.error('Todos los campos son requeridos')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Usuario creado exitosamente')
        router.push('/usuarios')
      } else {
        toast.error(data.error || 'Error al crear usuario')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Nuevo Usuario" subtitle="Crear acceso administrativo al sistema" />

      <div className="flex-1 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-6 gap-1.5 px-0 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/usuarios">
              <ArrowLeft className="size-4" />
              Volver a usuarios
            </Link>
          </Button>

          <Card>
            <CardHeader className="border-b">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <UserPlus className="size-4" />
                </div>
                <div>
                  <CardTitle className="text-base">Crear Cuenta</CardTitle>
                  <CardDescription>Asigna un rol y credenciales de acceso</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre" className="flex items-center gap-1.5">
                      <UserCog className="size-3.5" />
                      Nombre Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="nombre"
                      name="nombre"
                      value={form.nombre}
                      onChange={handleChange}
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="flex items-center gap-1.5">
                        <Mail className="size-3.5" />
                        Correo Electrónico <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="usuario@zanconato.edu.sv"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rol" className="flex items-center gap-1.5">
                        <ShieldCheck className="size-3.5" />
                        Rol del Usuario <span className="text-destructive">*</span>
                      </Label>
                      <Select value={form.rol} onValueChange={handleSelect} required>
                        <SelectTrigger id="rol" className="w-full">
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="flex items-center gap-1.5">
                      <Lock className="size-3.5" />
                      Contraseña <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-primary">
                  <p className="font-medium mb-1">Nota sobre los niveles de acceso:</p>
                  <ul className="space-y-1 text-xs text-primary/80">
                    <li>• **Administrador**: Control total del sistema y gestión de usuarios.</li>
                    <li>• **Matrícula**: Gestión de estudiantes y creación de talonarios.</li>
                    <li>• **Colector**: Gestión exclusiva de pagos y cobros de talonario.</li>
                  </ul>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button type="submit" disabled={loading}>
                    <Save className="size-4" />
                    {loading ? 'Guardando...' : 'Crear Usuario'}
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/usuarios">Cancelar</Link>
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
