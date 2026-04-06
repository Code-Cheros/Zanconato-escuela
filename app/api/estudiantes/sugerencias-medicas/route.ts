import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const estudiantes = await prisma.estudiante.findMany({
      select: {
        enfermedades: true,
        alergias: true,
        limitaciones: true
      }
    })

    const enfermedades = Array.from(new Set(estudiantes.flatMap(e => e.enfermedades))).filter(Boolean)
    const alergias = Array.from(new Set(estudiantes.flatMap(e => e.alergias))).filter(Boolean)
    const limitaciones = Array.from(new Set(estudiantes.flatMap(e => e.limitaciones))).filter(Boolean)

    return NextResponse.json({
      enfermedades,
      alergias,
      limitaciones
    })
  } catch (error) {
    console.error('Error fetching medical suggestions:', error)
    return NextResponse.json({ error: 'Error fetching suggestions' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo')
    const valor = searchParams.get('valor')

    if (!tipo || !valor) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    // Usar raw SQL para limpiar el valor de todos los registros de la base de datos
    // Esto asegura que deje de aparecer como sugerencia global
    await prisma.$executeRawUnsafe(
      `UPDATE "Estudiante" SET "${tipo}" = array_remove("${tipo}", $1)`,
      valor
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting medical suggestion:', error)
    return NextResponse.json({ error: 'Error al eliminar sugerencia' }, { status: 500 })
  }
}
