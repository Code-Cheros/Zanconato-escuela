// types/next-auth.d.ts
import { Rol } from '@prisma/client'
import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      rol: Rol
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    rol: Rol
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    rol: Rol
  }
}
