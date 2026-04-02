'use client'

import { useEffect, useRef, useState } from 'react'
import Header from '@/components/layout/Header'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

interface Configuracion {
  logoUrl: string | null
  montoMatricula: number
  montoPapeleria: number
  montoMensualidad: number
  montoAlimentacion: number
  montoMora: number | null
  usarMora: boolean
}

export default function ConfiguracionPage() {
  const { data: session } = useSession()
  const rol = (session?.user as any)?.rol

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState<Configuracion>({
    logoUrl: '',
    montoMatricula: 10,
    montoPapeleria: 15,
    montoMensualidad: 20,
    montoAlimentacion: 10,
    montoMora: 0,
    usarMora: false,
  })

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch('/api/configuracion')
        const data = await res.json()
        if (!res.ok) {
          toast.error(data.error || 'Error cargando configuración')
          return
        }
        setForm({
          logoUrl: data.logoUrl || '',
          montoMatricula: Number(data.montoMatricula ?? 10),
          montoPapeleria: Number(data.montoPapeleria ?? 15),
          montoMensualidad: Number(data.montoMensualidad ?? 20),
          montoAlimentacion: Number(data.montoAlimentacion ?? 10),
          montoMora: Number(data.montoMora ?? 0),
          usarMora: Boolean(data.usarMora),
        })
      } catch {
        toast.error('Error de conexión')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/configuracion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error guardando configuración')
        return
      }
      toast.success('Configuración actualizada')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  const handlePickLogo = () => fileInputRef.current?.click()

  const handleUploadLogo = async (file?: File) => {
    if (!file) return
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)

      const res = await fetch('/api/configuracion/logo', {
        method: 'POST',
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Error subiendo logo')
        return
      }

      setForm((prev) => ({ ...prev, logoUrl: data.logoUrl || '' }))
      toast.success('Logo cargado correctamente')
    } catch {
      toast.error('Error de conexión al subir logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  if (rol !== 'ADMINISTRATIVO') {
    return (
      <div className="flex flex-col h-full">
        <Header title="Configuración" subtitle="Administración del sistema" />
        <div className="p-6 text-sm text-muted-foreground">No tienes permisos para acceder a esta sección.</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Configuración" subtitle="Parámetros globales del sistema" />

      <div className="p-4 sm:p-6">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Talonarios y Recibos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando configuración...</p>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Logo institucional</Label>
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" onClick={handlePickLogo} disabled={uploadingLogo}>
                      {uploadingLogo ? 'Subiendo...' : 'Seleccionar logo'}
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      onChange={(e) => handleUploadLogo(e.target.files?.[0])}
                    />
                    <span className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG. Máx 2MB.</span>
                  </div>

                  {form.logoUrl ? (
                    <div className="mt-3 rounded-md border p-3 w-fit bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-2">Vista previa del logo</p>
                      <img src={form.logoUrl} alt="Logo institucional" className="h-14 object-contain" />
                    </div>
                  ) : null}

                  <p className="text-xs text-muted-foreground">Este logo se mostrará en impresión de talonarios, reportes PDF y encabezado del sistema.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="montoMatricula">Monto de matrícula</Label>
                    <Input
                      id="montoMatricula"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.montoMatricula}
                      onChange={(e) => setForm({ ...form, montoMatricula: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="montoMensualidad">Monto de mensualidad</Label>
                    <Input
                      id="montoMensualidad"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.montoMensualidad}
                      onChange={(e) => setForm({ ...form, montoMensualidad: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="montoPapeleria">Monto de papelería</Label>
                    <Input
                      id="montoPapeleria"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.montoPapeleria}
                      onChange={(e) => setForm({ ...form, montoPapeleria: Number(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="montoAlimentacion">Monto de alimentación</Label>
                    <Input
                      id="montoAlimentacion"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.montoAlimentacion}
                      onChange={(e) => setForm({ ...form, montoAlimentacion: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="rounded-md border p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Aplicar mora por pagos atrasados</p>
                      <p className="text-xs text-muted-foreground">Activar solo si el colegio requiere cobro de mora.</p>
                    </div>
                    <Switch
                      checked={form.usarMora}
                      onCheckedChange={(checked) => setForm({ ...form, usarMora: checked })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="montoMora">Monto de mora</Label>
                    <Input
                      id="montoMora"
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.montoMora ?? 0}
                      onChange={(e) => setForm({ ...form, montoMora: Number(e.target.value) })}
                      disabled={!form.usarMora}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={save} disabled={loading || saving}>
              {saving ? 'Guardando...' : 'Guardar configuración'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
