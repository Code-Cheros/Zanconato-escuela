// app/api/estudiantes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { COMPORTAMIENTOS_ALUMNO, VACUNAS_ALUMNO_BASE } from '@/lib/estudianteComportamiento'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const { id } = await params
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        pagos: { orderBy: { fecha: 'desc' } },
        comprobantes: {
          include: { talonario: true },
          orderBy: { orden: 'asc' }
        },
        talonarios: {
          include: {
            comprobantes: {
              orderBy: { orden: 'asc' }
            }
          },
          orderBy: { anio: 'desc' }
        }
      }
    })

    if (!estudiante) {
      return NextResponse.json({ error: 'Estudiante no encontrado' }, { status: 404 })
    }

    return NextResponse.json(estudiante)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener estudiante' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'MATRICULA' && rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const {
      nombre,
      nie,
      grado,
      seccion,
      turno,
      encargado,
      telefono,
      comportamiento,
      vacunas,
      descripcion,
      embarazo,
      embarazoPorQue,
      tipoParto,
      problemasAprendizaje,
      enfermedades,
      alergias,
      limitaciones,
      fotoDataUrl,
      nombres,
      primerApellido,
      segundoApellido,
      lugarNacimiento,
      fechaNacimiento,
      correo,
      religion,
      estadoCivil,
      estudioParvularia,
      repiteGrado,
      transporte,
      distancia,
      tallaPantalon,
      tallaCamisa,
      tallaZapatos,
      direccion,
      departamento,
      municipio,
      canton,
      viveCon,
      dependeEconomicamente,
      miembrosFamilia,
      estudianteTrabaja,
      tieneHijos,
      padreProfesion,
      padreTelefonoTrabajo,
      padreDireccion,
      padreDepartamento,
      padreMunicipio,
      padreCanton,
      documentosEntregados,
    } = body

    const trimOrNull = (v: unknown): string | null =>
      typeof v === 'string' && v.trim().length > 0 ? v.trim() : null

    // Validaciones b\u00e1sicas
    if (nie && !/^\d{8}$/.test(nie)) {
      return NextResponse.json({ error: 'El NIE debe tener 8 d\u00edgitos' }, { status: 400 })
    }

    let fechaNacimientoDate: Date | null = null
    if (fechaNacimiento) {
      const d = new Date(fechaNacimiento)
      if (!isNaN(d.getTime())) {
        fechaNacimientoDate = d
      }
    }

    const correoLimpio = trimOrNull(correo)
    if (correoLimpio && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      return NextResponse.json({ error: 'Correo inv\u00e1lido' }, { status: 400 })
    }

    let fotoUpdate = {}
    if (fotoDataUrl === null) {
      fotoUpdate = { fotoDataUrl: null }
    } else if (typeof fotoDataUrl === 'string') {
      if (fotoDataUrl.startsWith('data:image/')) {
        if (fotoDataUrl.length > 4_000_000) {
          return NextResponse.json({ error: 'La foto es demasiado grande' }, { status: 400 })
        }
        fotoUpdate = { fotoDataUrl: fotoDataUrl }
      } else if (fotoDataUrl === '') {
        fotoUpdate = { fotoDataUrl: null }
      } else if (fotoDataUrl !== undefined) {
        return NextResponse.json({ error: 'Formato de foto inv\u00e1lido' }, { status: 400 })
      }
    }

    const comportamientosValidos = new Set<string>(COMPORTAMIENTOS_ALUMNO)
    const comportamientoLimpio = Array.isArray(comportamiento)
      ? Array.from(new Set(comportamiento.filter((item: unknown): item is string => (
          typeof item === 'string' && comportamientosValidos.has(item)
        ))))
      : []

    const vacunasBaseSet = new Set<string>(VACUNAS_ALUMNO_BASE)
    const vacunasLimpias = Array.isArray(vacunas)
      ? Array.from(new Set(
          vacunas
            .filter((item: unknown): item is string => typeof item === 'string')
            .map((item) => item.trim())
            .filter((item) => item.length > 0 && item.length <= 60)
            .map((item) => {
              const vacunaBase = Array.from(vacunasBaseSet).find((base) => base.toLowerCase() === item.toLowerCase())
              return vacunaBase || item
            })
        ))
      : []

    const estudiante = await prisma.estudiante.update({
      where: { id },
      data: {
        nombre,
        nie,
        grado,
        seccion,
        turno,
        encargado: trimOrNull(encargado),
        telefono: telefono || null,
        comportamiento: comportamientoLimpio,
        vacunas: vacunasLimpias,
        descripcion: trimOrNull(descripcion),
        embarazo: trimOrNull(embarazo),
        embarazoPorQue: trimOrNull(embarazoPorQue),
        tipoParto: trimOrNull(tipoParto),
        problemasAprendizaje: trimOrNull(problemasAprendizaje),
        enfermedades: Array.isArray(enfermedades) ? enfermedades : [],
        alergias: Array.isArray(alergias) ? alergias : [],
        limitaciones: Array.isArray(limitaciones) ? limitaciones : [],
        nombres: trimOrNull(nombres),
        primerApellido: trimOrNull(primerApellido),
        segundoApellido: trimOrNull(segundoApellido),
        lugarNacimiento: trimOrNull(lugarNacimiento),
        fechaNacimiento: fechaNacimientoDate,
        correo: correoLimpio,
        religion: trimOrNull(religion),
        estadoCivil: trimOrNull(estadoCivil),
        estudioParvularia: Boolean(estudioParvularia),
        repiteGrado: Boolean(repiteGrado),
        transporte: trimOrNull(transporte),
        distancia: trimOrNull(distancia),
        tallaPantalon: trimOrNull(tallaPantalon),
        tallaCamisa: trimOrNull(tallaCamisa),
        tallaZapatos: trimOrNull(tallaZapatos),
        direccion: trimOrNull(direccion),
        departamento: trimOrNull(departamento),
        municipio: trimOrNull(municipio),
        canton: trimOrNull(canton),
        viveCon: trimOrNull(viveCon),
        dependeEconomicamente: trimOrNull(dependeEconomicamente),
        miembrosFamilia: trimOrNull(miembrosFamilia),
        estudianteTrabaja: Boolean(estudianteTrabaja),
        tieneHijos: Boolean(tieneHijos),
        padreProfesion: trimOrNull(padreProfesion),
        padreTelefonoTrabajo: padreTelefonoTrabajo ? String(padreTelefonoTrabajo).replace(/\D/g, '').slice(0, 8) || null : null,
        padreDireccion: trimOrNull(padreDireccion),
        padreDepartamento: trimOrNull(padreDepartamento),
        padreMunicipio: trimOrNull(padreMunicipio),
        padreCanton: trimOrNull(padreCanton),
        documentosEntregados: Array.isArray(documentosEntregados) ? documentosEntregados : [],
        ...fotoUpdate
      } as any
    })

    return NextResponse.json(estudiante)
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Error al actualizar estudiante' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.estudiante.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar estudiante' }, { status: 500 })
  }
}
