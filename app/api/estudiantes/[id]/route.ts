// app/api/estudiantes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { DOCUMENTOS_MATRICULA } from '@/lib/utils'
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
      activo,
    } = body

    const trimOrNull = (v: unknown): string | null =>
      typeof v === 'string' && v.trim().length > 0 ? v.trim() : null

    const trimOrEmpty = (v: unknown): string =>
      typeof v === 'string' ? v.trim() : ''

    const normPhone8 = (v: unknown): string | null => {
      if (v == null || v === '') return null
      const d = String(v).replace(/\D/g, '').slice(0, 8)
      return d.length === 8 ? d : null
    }

    const normCorreo = (v: unknown): string | null => {
      const t = trimOrNull(v)
      if (!t) return null
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? t : null
    }

    const nieDigits = String(nie ?? '')
      .replace(/\D/g, '')
      .slice(0, 8)
    const nieFinal: string | null = /^\d{8}$/.test(nieDigits) ? nieDigits : null

    if (nieFinal) {
      const taken = await prisma.estudiante.findFirst({
        where: { nie: nieFinal, NOT: { id } },
      })
      if (taken) {
        return NextResponse.json({ error: 'NIE ya registrado' }, { status: 409 })
      }
    }

    let fechaNacimientoDate: Date | null = null
    if (fechaNacimiento != null && String(fechaNacimiento).trim() !== '') {
      const d = new Date(String(fechaNacimiento))
      if (!Number.isNaN(d.getTime())) fechaNacimientoDate = d
    }

    const correoLimpio = normCorreo(correo)

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

    const estudiante = await prisma.estudiante.update({
      where: { id },
      data: {
        nombre: trimOrEmpty(nombre),
        nie: nieFinal,
        grado: trimOrEmpty(grado),
        seccion: trimOrEmpty(seccion),
        turno: trimOrNull(turno),
        encargado: trimOrNull(encargado),
        telefono: normPhone8(telefono),
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
        padreTelefonoTrabajo: normPhone8(padreTelefonoTrabajo),
        padreDireccion: trimOrNull(padreDireccion),
        padreDepartamento: trimOrNull(padreDepartamento),
        padreMunicipio: trimOrNull(padreMunicipio),
        padreCanton: trimOrNull(padreCanton),
        documentosEntregados: documentosLimpios,
        ...(activo !== undefined ? { activo: Boolean(activo) } : {}),
        ...fotoUpdate,
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
