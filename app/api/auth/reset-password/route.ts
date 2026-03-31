// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const stored = await prisma.passwordResetToken.findUnique({ where: { token } })

    if (!stored) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 })
    }

    if (new Date() > stored.expires) {
      await prisma.passwordResetToken.delete({ where: { token } })
      return NextResponse.json({ error: 'El enlace ha expirado. Solicita uno nuevo.' }, { status: 400 })
    }

    const user = await prisma.usuario.findUnique({ where: { email: stored.email } })
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.$transaction([
      prisma.usuario.update({ where: { id: user.id }, data: { password: hashed } }),
      prisma.passwordResetToken.delete({ where: { id: stored.id } }),
    ])

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('RESET_PASSWORD_ERROR:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
