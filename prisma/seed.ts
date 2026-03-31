// prisma/seed.ts
import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('admin123', 12)

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@zaconato.edu.sv' },
    update: {},
    create: {
      nombre: 'Administrador',
      email: 'admin@zaconato.edu.sv',
      password: passwordHash,
      rol: Rol.ADMINISTRATIVO,
      activo: true,
    },
  })

  const colector = await prisma.usuario.upsert({
    where: { email: 'colector@zaconato.edu.sv' },
    update: {},
    create: {
      nombre: 'Colector Demo',
      email: 'colector@zaconato.edu.sv',
      password: await bcrypt.hash('colector123', 12),
      rol: Rol.COLECTOR,
      activo: true,
    },
  })

  const matricula = await prisma.usuario.upsert({
    where: { email: 'matricula@zaconato.edu.sv' },
    update: {},
    create: {
      nombre: 'Encargado Matrícula',
      email: 'matricula@zaconato.edu.sv',
      password: await bcrypt.hash('matricula123', 12),
      rol: Rol.MATRICULA,
      activo: true,
    },
  })

  console.log('✅ Usuarios seed creados:')
  console.log(`   Admin: admin@zaconato.edu.sv / admin123`)
  console.log(`   Colector: colector@zaconato.edu.sv / colector123`)
  console.log(`   Matrícula: matricula@zaconato.edu.sv / matricula123`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
