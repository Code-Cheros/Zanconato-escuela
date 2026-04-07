// app/api/estudiantes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DOCUMENTOS_MATRICULA } from '@/lib/utils'
import { COMPORTAMIENTOS_ALUMNO, VACUNAS_ALUMNO_BASE } from '@/lib/estudianteComportamiento'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const estudiante = await prisma.estudiante.findUnique({
    where: { id },
    include: {
      talonarios: {
        include: {
          comprobantes: { orderBy: { orden: 'asc' } },
        },
        orderBy: { anio: 'desc' },
      },
      comprobantes: {
        where: { tipo: { not: 'COLEGIATURA' } },
        include: { talonario: { select: { anio: true } } },
        orderBy: { orden: 'asc' },
      },
      pagos: { orderBy: { fecha: 'desc' } },
    },
  })

  if (!estudiante) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
  return NextResponse.json(estudiante)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      pasatiempos,
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
      fotoDataUrl,
      activo,
    } = body

    const trimOrNull = (v: unknown): string | null =>
      typeof v === 'string' && v.trim().length > 0 ? v.trim() : null

    const current = await prisma.estudiante.findUnique({ where: { id } })
    if (!current) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

    const nombresT = trimOrNull(nombres)
    const primerApT = trimOrNull(primerApellido)
    const segundoApT = trimOrNull(segundoApellido)

    if (!nombresT) {
      return NextResponse.json({ error: 'Los nombres son requeridos' }, { status: 400 })
    }
    if (!primerApT && !segundoApT) {
      return NextResponse.json({ error: 'Al menos un apellido es requerido' }, { status: 400 })
    }

    if (!nombre || !nie || !grado || !seccion || !String(turno ?? '').trim()) {
      return NextResponse.json({ error: 'Nombre completo, NIE, grado, sección y turno son requeridos' }, { status: 400 })
    }

    if (!trimOrNull(lugarNacimiento)) {
      return NextResponse.json({ error: 'El lugar de nacimiento es requerido' }, { status: 400 })
    }

    let fechaNacimientoDate: Date | null = null
    if (fechaNacimiento != null && String(fechaNacimiento).trim() !== '') {
      const d = new Date(String(fechaNacimiento))
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Fecha de nacimiento inválida' }, { status: 400 })
      }
      fechaNacimientoDate = d
    }
    if (!fechaNacimientoDate) {
      return NextResponse.json({ error: 'La fecha de nacimiento es requerida' }, { status: 400 })
    }

    const correoLimpio = trimOrNull(correo)
    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      return NextResponse.json({ error: 'Un correo válido es requerido' }, { status: 400 })
    }

    if (!trimOrNull(direccion) || !trimOrNull(departamento) || !trimOrNull(municipio)) {
      return NextResponse.json({ error: 'Dirección, departamento y municipio son requeridos' }, { status: 400 })
    }

    if (!trimOrNull(encargado)) {
      return NextResponse.json({ error: 'El nombre del responsable es requerido' }, { status: 400 })
    }

    if (!telefono || !/^\d{8}$/.test(String(telefono))) {
      return NextResponse.json({ error: 'El teléfono del responsable es requerido (8 dígitos)' }, { status: 400 })
    }

    if (!/^\d{8}$/.test(nie)) {
      return NextResponse.json({ error: 'El NIE debe tener exactamente 8 dígitos numéricos' }, { status: 400 })
    }

    if (nie !== current.nie) {
      const nieTaken = await prisma.estudiante.findUnique({ where: { nie } })
      if (nieTaken) {
        return NextResponse.json({ error: 'NIE ya registrado' }, { status: 409 })
      }
    }

    if (padreTelefonoTrabajo && !/^\d{8}$/.test(String(padreTelefonoTrabajo))) {
      return NextResponse.json({ error: 'El teléfono de trabajo del padre debe tener 8 dígitos' }, { status: 400 })
    }

    const documentosPermitidos = new Set<string>(DOCUMENTOS_MATRICULA as unknown as string[])
    const documentosLimpios = Array.isArray(documentosEntregados)
      ? Array.from(
          new Set(
            documentosEntregados.filter(
              (item: unknown): item is string =>
                typeof item === 'string' && documentosPermitidos.has(item)
            )
          )
        )
      : []

    let fotoUpdate: { fotoDataUrl: string | null } | Record<string, never> = {}
    if (Object.prototype.hasOwnProperty.call(body, 'fotoDataUrl')) {
      if (typeof fotoDataUrl === 'string' && fotoDataUrl.startsWith('data:image/')) {
        if (fotoDataUrl.length > 4_000_000) {
          return NextResponse.json({ error: 'La foto es demasiado grande' }, { status: 400 })
        }
        fotoUpdate = { fotoDataUrl: fotoDataUrl }
      } else if (fotoDataUrl === null || fotoDataUrl === '') {
        fotoUpdate = { fotoDataUrl: null }
      } else if (fotoDataUrl !== undefined) {
        return NextResponse.json({ error: 'Formato de foto inválido' }, { status: 400 })
      }
    }

    const comportamientosValidos = new Set<string>(COMPORTAMIENTOS_ALUMNO)
    const comportamientoLimpio = Array.isArray(comportamiento)
      ? Array.from(new Set(comportamiento.filter((item: unknown): item is string => (
          typeof item === 'string' && comportamientosValidos.has(item)
        ))))
      : []

    const hasPasatiemposField = Object.prototype.hasOwnProperty.call(body, 'pasatiempos')
    const pasatiemposLimpio = typeof pasatiempos === 'string' && pasatiempos.trim().length > 0
      ? pasatiempos.trim()
      : null

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
        ...(hasPasatiemposField ? { pasatiempos: pasatiemposLimpio } : {}),
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
        documentosEntregados: documentosLimpios,
        ...fotoUpdate,
        ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
      },
    })

    return NextResponse.json(estudiante)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Solo administradores pueden eliminar' }, { status: 403 })
  }

  try {
    const { id } = await params
    await prisma.estudiante.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
