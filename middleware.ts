// middleware.ts
import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname
    const rol = token?.rol as string

    // Protect reports — only ADMINISTRATIVO
    if (pathname.startsWith('/reportes') || pathname.startsWith('/api/reportes')) {
      if (rol !== 'ADMINISTRATIVO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    // Protect enrollment routes — MATRICULA or ADMINISTRATIVO
    if (
      pathname.startsWith('/estudiantes/nuevo') ||
      pathname.includes('/editar')
    ) {
      if (rol !== 'MATRICULA' && rol !== 'ADMINISTRATIVO') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/estudiantes/:path*',
    '/pagos/:path*',
    '/talonarios/:path*',
    '/reportes/:path*',
    '/api/estudiantes/:path*',
    '/api/talonarios/:path*',
    '/api/pagos/:path*',
    '/api/reportes/:path*',
    '/api/dashboard/:path*',
  ],
}
