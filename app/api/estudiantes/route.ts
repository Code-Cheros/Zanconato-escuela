// app/api/estudiantes/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { MESES, DOCUMENTOS_MATRICULA } from '@/lib/utils'
import { COMPORTAMIENTOS_ALUMNO, VACUNAS_ALUMNO_BASE } from '@/lib/estudianteComportamiento'

const prismaCompat = prisma as any

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const nombre = searchParams.get('nombre')
  const nie = searchParams.get('nie')
  const grado = searchParams.get('grado')
  const seccion = searchParams.get('seccion')
  const encargado = searchParams.get('encargado')
  const telefono = searchParams.get('telefono')
  const turno = searchParams.get('turno')
  const estado = searchParams.get('estado')
  const anioHeader = searchParams.get('anio')
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const comportamientoParams = searchParams.getAll('comportamiento')

  const comportamientosValidos = new Set<string>(COMPORTAMIENTOS_ALUMNO)
  const comportamientoFiltro = Array.from(new Set(
    comportamientoParams.filter((item) => comportamientosValidos.has(item))
  ))

  const anioActual = anioHeader ? parseInt(anioHeader) : new Date().getFullYear()

  const where: any = {
    ...(q && {
      OR: [
        { nombre: { contains: q, mode: 'insensitive' } },
        { nie: { contains: q, mode: 'insensitive' } },
        { encargado: { contains: q, mode: 'insensitive' } },
        { telefono: { contains: q, mode: 'insensitive' } },
      ],
    }),
    ...(nombre && { nombre: { contains: nombre, mode: 'insensitive' } }),
    ...(nie && { nie: { contains: nie, mode: 'insensitive' } }),
    ...(grado && { grado: { contains: grado, mode: 'insensitive' } }),
    ...(seccion && { seccion: { contains: seccion, mode: 'insensitive' } }),
    ...(encargado && { encargado: { contains: encargado, mode: 'insensitive' } }),
    ...(telefono && { telefono: { contains: telefono, mode: 'insensitive' } }),
    ...(turno && { turno: { equals: turno } }),
    ...(comportamientoFiltro.length > 0 && { comportamiento: { hasSome: comportamientoFiltro } }),
  }

  // Determinar meses relevantes hasta la fecha 'hasta' (o hoy por defecto)
  const fechaReferencia = hasta ? new Date(hasta + 'T23:59:59') : new Date()
  const mesesRelativos = MESES.slice(0, fechaReferencia.getMonth() + 1)

  // Filtrado por estado (basado en el aÃ±o seleccionado y periodo)
  // Filtrado por estado (basado en el aÃ±o seleccionado y periodo)
  if (estado === 'AL_DIA') {
    where.talonarios = {
      some: {
        anio: anioActual,
        comprobantes: {
          none: { tipo: 'COLEGIATURA', pagado: false, mes: { in: mesesRelativos } },
          some: { tipo: 'COLEGIATURA', mes: { in: mesesRelativos } }
        }
      }
    }
  } else if (estado === 'PENDIENTE') {
    where.talonarios = {
      some: {
        anio: anioActual,
        comprobantes: {
          none: { tipo: 'COLEGIATURA', pagado: true, mes: { in: mesesRelativos } },
          some: { tipo: 'COLEGIATURA', mes: { in: mesesRelativos } }
        }
      }
    }
  } else if (estado === 'INCOMPLETO') {
    where.talonarios = {
      some: {
        anio: anioActual,
        AND: [
          {
            comprobantes: {
              some: { tipo: 'COLEGIATURA', pagado: true, mes: { in: mesesRelativos } }
            }
          },
          {
            comprobantes: {
              some: { tipo: 'COLEGIATURA', pagado: false, mes: { in: mesesRelativos } }
            }
          }
        ]
      }
    }
  }

  const estudiantes = await prisma.estudiante.findMany({
    where,
    include: {
      pagos: { orderBy: { fecha: 'desc' }, take: 1 },
      talonarios: {
        where: { anio: anioActual },
        include: {
          comprobantes: { orderBy: { orden: 'asc' } },
        },
        orderBy: { anio: 'desc' },
        take: 1,
      },
    },
    orderBy: { nombre: 'asc' },
  })

  return NextResponse.json(estudiantes)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const rol = (session.user as any).rol
  if (rol !== 'MATRICULA' && rol !== 'ADMINISTRATIVO') {
    return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })
  }

  try {
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
    } = body

    const trimOrNull = (v: unknown): string | null =>
      typeof v === 'string' && v.trim().length > 0 ? v.trim() : null

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
      return NextResponse.json({ error: 'Nombre completo, NIE, grado, secciÃ³n y turno son requeridos' }, { status: 400 })
    }

    if (!trimOrNull(lugarNacimiento)) {
      return NextResponse.json({ error: 'El lugar de nacimiento es requerido' }, { status: 400 })
    }

    let fechaNacimientoDate: Date | null = null
    if (fechaNacimiento != null && String(fechaNacimiento).trim() !== '') {
      const d = new Date(String(fechaNacimiento))
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: 'Fecha de nacimiento invÃ¡lida' }, { status: 400 })
      }
      fechaNacimientoDate = d
    }
    if (!fechaNacimientoDate) {
      return NextResponse.json({ error: 'La fecha de nacimiento es requerida' }, { status: 400 })
    }

    const correoLimpio = trimOrNull(correo)
    if (!correoLimpio || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)) {
      return NextResponse.json({ error: 'Un correo vÃ¡lido es requerido' }, { status: 400 })
    }

    if (!trimOrNull(direccion) || !trimOrNull(departamento) || !trimOrNull(municipio)) {
      return NextResponse.json({ error: 'DirecciÃ³n, departamento y municipio son requeridos' }, { status: 400 })
    }

    if (!trimOrNull(encargado)) {
      return NextResponse.json({ error: 'El nombre del responsable es requerido' }, { status: 400 })
    }

    if (!telefono || !/^\d{8}$/.test(String(telefono))) {
      return NextResponse.json({ error: 'El telÃ©fono del responsable es requerido (8 dÃ­gitos)' }, { status: 400 })
    }

    if (!/^\d{8}$/.test(nie)) {
      return NextResponse.json({ error: 'El NIE debe tener exactamente 8 dÃ­gitos numÃ©ricos' }, { status: 400 })
    }

    if (padreTelefonoTrabajo && !/^\d{8}$/.test(String(padreTelefonoTrabajo))) {
      return NextResponse.json({ error: 'El telÃ©fono de trabajo del padre debe tener 8 dÃ­gitos' }, { status: 400 })
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

    let fotoLimpia: string | null = null
    if (typeof fotoDataUrl === 'string' && fotoDataUrl.startsWith('data:image/')) {
      if (fotoDataUrl.length > 4_000_000) {
        return NextResponse.json({ error: 'La foto es demasiado grande' }, { status: 400 })
      }
      fotoLimpia = fotoDataUrl
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

    const existing = await prisma.estudiante.findUnique({ where: { nie } })
    if (existing) {
      return NextResponse.json({ error: 'NIE ya registrado' }, { status: 409 })
    }

    const anioActual = new Date().getFullYear()
    const config = await prismaCompat.configuracionSistema.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        montoMatricula: 10,
        montoPapeleria: 15,
        montoMensualidad: 20,
        montoAlimentacion: 10,
        diaLimitePago: 26,
        montoMora: 0,
        usarMora: false,
      },
    })

    const resultado = await prisma.$transaction(async (tx: any) => {
      const estudiante = await tx.estudiante.create({
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
          documentosEntregados: documentosLimpios,
          fotoDataUrl: fotoLimpia,
        } as any,
      })

      // Talonario solo para COLEGIATURA
      const talonario = await tx.talonario.create({
        data: {
          estudianteId: estudiante.id,
          anio: anioActual,
          grado,
          seccion,
          turno
        },
      })

      // Comprobantes de COLEGIATURA (en el talonario)
      const colegiaturas = MESES.map((mes, i) => ({
        talonarioId: talonario.id,
        estudianteId: estudiante.id,
        tipo: 'COLEGIATURA',
        monto: config.montoMensualidad,
        mes,
        orden: 1 + i,
        pagado: false,
      }))

      // Otros comprobantes anuales vinculados al primer talonario
      const otrosPagos = [
        {
          talonarioId: talonario.id,
          estudianteId: estudiante.id,
          tipo: 'MATRICULA',
          monto: config.montoMatricula,
          mes: null,
          orden: 0,
          pagado: false,
        },
        {
          talonarioId: talonario.id,
          estudianteId: estudiante.id,
          tipo: 'PAPELERIA',
          monto: config.montoPapeleria,
          mes: null,
          orden: 0,
          pagado: false,
        },
        ...MESES.map((mes, i) => ({
          talonarioId: talonario.id,
          estudianteId: estudiante.id,
          tipo: 'ALIMENTACION',
          monto: config.montoAlimentacion,
          mes,
          orden: i,
          pagado: false,
        })),
      ]

      await tx.comprobante.createMany({
        data: [...colegiaturas, ...otrosPagos].map((c) => ({
          talonarioId: c.talonarioId,
          estudianteId: c.estudianteId,
          tipo: c.tipo as any,
          monto: c.monto,
          mes: c.mes,
          orden: c.orden,
          pagado: false,
        })),
      })

      return { estudiante, talonario }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
