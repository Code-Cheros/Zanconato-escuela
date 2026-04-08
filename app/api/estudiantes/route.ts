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

    const nombresT = trimOrNull(nombres)
    const primerApT = trimOrNull(primerApellido)
    const segundoApT = trimOrNull(segundoApellido)
    const nombreCompleto =
      trimOrEmpty(nombre) ||
      [nombresT, primerApT, segundoApT].filter(Boolean).join(' ').trim()

    const nieDigits = String(nie ?? '')
      .replace(/\D/g, '')
      .slice(0, 8)
    const nieFinal: string | null = /^\d{8}$/.test(nieDigits) ? nieDigits : null

    if (nieFinal !== null) {
      const existing = await prisma.estudiante.findUnique({ where: { nie: nieFinal } })
      if (existing) {
        return NextResponse.json({ error: 'NIE ya registrado' }, { status: 409 })
      }
    }

    let fechaNacimientoDate: Date | null = null
    if (fechaNacimiento != null && String(fechaNacimiento).trim() !== '') {
      const d = new Date(String(fechaNacimiento))
      if (!Number.isNaN(d.getTime())) fechaNacimientoDate = d
    }

    const correoLimpio = normCorreo(correo)

    const gradoStr = trimOrEmpty(grado)
    const seccionStr = trimOrEmpty(seccion)

    const telefonoLimpio = normPhone8(telefono)
    const padreTelTrabajo = normPhone8(padreTelefonoTrabajo)

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
          nombre: nombreCompleto,
          nie: nieFinal,
          grado: gradoStr,
          seccion: seccionStr,
          turno: trimOrNull(turno),
          encargado: trimOrNull(encargado),
          telefono: telefonoLimpio,
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
          padreTelefonoTrabajo: padreTelTrabajo,
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
          grado: gradoStr || null,
          seccion: seccionStr || null,
          turno: trimOrNull(turno),
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
