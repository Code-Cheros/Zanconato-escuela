import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mkdir, writeFile } from 'fs/promises'
import path from 'path'

const prismaCompat = prisma as any

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('logo')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })
    }

    const ext = EXT_BY_MIME[file.type]
    if (!ext) {
      return NextResponse.json({ error: 'Formato no permitido. Use PNG, JPG, WEBP o SVG.' }, { status: 400 })
    }

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'El logo supera 2MB.' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })

    const filename = `logo-${Date.now()}.${ext}`
    const filePath = path.join(uploadsDir, filename)
    await writeFile(filePath, buffer)

    const logoUrl = `/uploads/${filename}`

    await prismaCompat.configuracionSistema.upsert({
      where: { id: 'global' },
      update: { logoUrl },
      create: {
        id: 'global',
        logoUrl,
        montoMatricula: 10,
        montoPapeleria: 15,
        montoMensualidad: 20,
        montoAlimentacion: 10,
        diaLimitePago: 26,
        montoMora: 0,
        usarMora: false,
      },
    })

    return NextResponse.json({ logoUrl })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error subiendo logo' }, { status: 500 })
  }
}
