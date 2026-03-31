// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email es requerido' }, { status: 400 })
    }

    const user = await prisma.usuario.findUnique({ where: { email } })

    // Siempre responder con éxito por seguridad (no revelar si el email existe)
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600 * 1000) // 1 hora

    await prisma.passwordResetToken.upsert({
      where: { token },
      update: { expires },
      create: { email, token, expires },
    })

    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

    await transporter.sendMail({
      from: `"Zaconato Escuela" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Zaconato',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#1d4ed8;margin-bottom:8px">Recuperación de Contraseña</h2>
          <p style="color:#374151">Has solicitado restablecer tu contraseña en el Sistema de Gestión Escolar <strong>Zaconato</strong>.</p>
          <p style="color:#374151">Haz clic en el botón a continuación. El enlace expirará en <strong>1 hora</strong>.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${resetUrl}"
               style="background:#1d4ed8;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:15px">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color:#9ca3af;font-size:12px">Si no solicitaste este cambio, puedes ignorar este correo.</p>
          <hr style="border:0;border-top:1px solid #e5e7eb;margin:20px 0"/>
          <p style="text-align:center;color:#d1d5db;font-size:11px">
            © ${new Date().getFullYear()} Complejo Educativo Católico Zaconato
          </p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('FORGOT_PASSWORD_ERROR:', error)
    return NextResponse.json({ error: 'Error al procesar la solicitud' }, { status: 500 })
  }
}
