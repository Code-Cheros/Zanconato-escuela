# 🏫 Complejo Educativo Católico Zaconato
## Sistema de Gestión Escolar — Documentación Completa

---

## 📋 Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Requisitos Previos](#requisitos-previos)
4. [Configuración de Azure PostgreSQL](#configuración-de-azure-postgresql)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Variables de Entorno](#variables-de-entorno)
7. [Base de Datos y Migraciones](#base-de-datos-y-migraciones)
8. [Usuarios por Defecto](#usuarios-por-defecto)
9. [Módulos del Sistema](#módulos-del-sistema)
10. [API Reference](#api-reference)
11. [Control de Acceso por Rol](#control-de-acceso-por-rol)
12. [Deploy en Producción](#deploy-en-producción)

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14+ (App Router), React 18 |
| Estilos | Tailwind CSS |
| Backend | Next.js API Routes (REST) |
| Base de Datos | PostgreSQL en Azure (Flexible Server) |
| ORM | Prisma ORM |
| Autenticación | NextAuth.js (JWT + Credentials) |
| Excel | xlsx |
| PDF | HTML exportable (imprimible desde navegador) |
| UI | Componentes custom + lucide-react |
| Notificaciones | react-hot-toast |

---

## 📁 Estructura del Proyecto

```
zaconato-escuela/
├── app/
│   ├── (app)/                      ← Rutas protegidas (requieren sesión)
│   │   ├── layout.tsx              ← Layout con Sidebar
│   │   ├── dashboard/page.tsx      ← Dashboard principal
│   │   ├── estudiantes/
│   │   │   ├── page.tsx            ← Listado de estudiantes
│   │   │   ├── nuevo/page.tsx      ← Formulario de matrícula
│   │   │   └── [id]/
│   │   │       ├── page.tsx        ← Detalle del estudiante
│   │   │       └── editar/page.tsx ← Editar datos
│   │   ├── pagos/page.tsx          ← Gestión de pagos
│   │   ├── talonarios/
│   │   │   ├── page.tsx            ← Listado de talonarios
│   │   │   └── [id]/
│   │   │       ├── page.tsx        ← Detalle del talonario
│   │   │       └── imprimir/page.tsx ← Vista de impresión (4×hoja)
│   │   └── reportes/page.tsx       ← Reportes y exportación
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── estudiantes/route.ts + [id]/route.ts
│   │   ├── talonarios/route.ts + [id]/route.ts
│   │   ├── pagos/route.ts + [id]/route.ts
│   │   ├── dashboard/stats/route.ts
│   │   └── reportes/
│   │       ├── diario/route.ts
│   │       ├── mensual/route.ts
│   │       └── exportar/excel/route.ts + pdf/route.ts
│   ├── login/page.tsx              ← Pantalla de login
│   ├── layout.tsx                  ← Root layout
│   ├── page.tsx                    ← Redirect a /dashboard
│   ├── providers.tsx               ← SessionProvider + Toaster
│   └── globals.css
├── components/
│   └── layout/
│       ├── Sidebar.tsx             ← Navegación lateral
│       └── Header.tsx              ← Cabecera de página
├── lib/
│   ├── prisma.ts                   ← Singleton Prisma client
│   ├── auth.ts                     ← Configuración NextAuth
│   └── utils.ts                    ← Helpers y constantes
├── prisma/
│   ├── schema.prisma               ← Esquema de base de datos
│   └── seed.ts                     ← Datos iniciales
├── types/
│   └── next-auth.d.ts              ← Tipos extendidos de NextAuth
├── middleware.ts                   ← Protección de rutas
├── .env.example                    ← Plantilla de variables de entorno
└── package.json
```

---

## ✅ Requisitos Previos

- **Node.js** 18.17.0 o superior
- **npm** 9+ o **pnpm** 8+
- **Cuenta de Azure** con acceso a Azure Database for PostgreSQL
- **Git**

---

## ☁️ Configuración de Azure PostgreSQL

### 1. Crear el recurso en Azure

1. Ir a [portal.azure.com](https://portal.azure.com)
2. Crear nuevo recurso → **Azure Database for PostgreSQL Flexible Server**
3. Configuración recomendada:
   - **Tier de cómputo**: Burstable, B1ms (suficiente para inicio)
   - **PostgreSQL version**: 15 o 16
   - **Nombre del servidor**: `zaconato-db` (o el que prefieras)
   - **Admin username**: `zaconato_admin`
   - **Password**: Generar contraseña segura
   - **Database name**: `escuela_db`

### 2. Configurar Firewall

En el recurso de Azure PostgreSQL:
- **Seguridad > Redes** → Agregar regla de firewall
- Para desarrollo: agregar tu IP actual
- Para producción: agregar la IP del servidor de la app

### 3. Habilitar SSL

Azure PostgreSQL requiere SSL por defecto. La cadena de conexión debe incluir `?sslmode=require`.

---

## 🚀 Instalación y Configuración

### Paso 1: Clonar e instalar dependencias

```bash
git clone <repo-url>
cd zaconato-escuela
npm install
```

### Paso 2: Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con tus valores reales (ver sección Variables de Entorno).

### Paso 3: Generar el cliente Prisma

```bash
npx prisma generate
```

### Paso 4: Ejecutar migraciones en Azure

```bash
npx prisma migrate dev --name init
```

O si prefieres hacer push directo (sin historial de migraciones):
```bash
npx prisma db push
```

### Paso 5: Crear datos iniciales (seed)

```bash
npm run db:seed
```

### Paso 6: Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: **http://localhost:3000**

---

## 🔐 Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Base de Datos — Azure PostgreSQL
DATABASE_URL="postgresql://zaconato_admin:TuPassword@zaconato-db.postgres.database.azure.com:5432/escuela_db?sslmode=require"

# NextAuth — Autenticación
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Entorno
NODE_ENV="development"
```

Para generar `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

---

## 🗄️ Base de Datos y Migraciones

### Comandos disponibles

```bash
# Aplicar esquema en Azure (desarrollo)
npm run db:migrate

# Push directo sin migraciones (útil en primeras pruebas)
npx prisma db push

# Poblar con datos iniciales
npm run db:seed

# Abrir Prisma Studio (interfaz visual de la BD)
npm run db:studio

# Regenerar cliente tras cambios en schema
npx prisma generate
```

### Esquema de la Base de Datos

```
Usuario         → Autenticación y roles
Estudiante      → Datos del alumno (vinculado a Usuario)
Talonario       → Talonario anual por estudiante
Comprobante     → Comprobantes individuales dentro del talonario
Pago            → Registro de pago de un comprobante
```

**Tipos de pago (TipoPago):**
- `MATRICULA` — Cuota de inscripción anual
- `PAPELERIA` — Materiales y papelería
- `COLEGIATURA` — Mensualidad (Enero–Octubre)
- `ALIMENTACION` — Programa de alimentación (Enero–Octubre)

**Orden fijo de comprobantes en el talonario:**
1. Matrícula (único)
2. Papelería (único)
3. Colegiatura Enero — Colegiatura Octubre (10 comprobantes)
4. Alimentación Enero — Alimentación Octubre (10 comprobantes)

---

## 👤 Usuarios por Defecto

El seed crea automáticamente estos usuarios:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| admin@zaconato.edu.sv | admin123 | ADMINISTRATIVO |
| colector@zaconato.edu.sv | colector123 | COLECTOR |
| matricula@zaconato.edu.sv | matricula123 | MATRICULA |

> ⚠️ **Cambiar las contraseñas inmediatamente después del primer login en producción.**

---

## 📚 Módulos del Sistema

### 1. Dashboard (`/dashboard`)
- Tarjetas de estadísticas: Total Estudiantes, Al Día, Comprobantes Emitidos, Ingresos del Mes
- Tabla completa de estudiantes con búsqueda en tiempo real
- Estado de pago por alumno (Al día / Pendiente / Atrasado)
- Accesos directos a Registrar Pago y Ver perfil

### 2. Gestionar Pagos (`/pagos`)
- Historial completo de pagos con filtros por fecha y tipo
- Formulario de registro: buscar estudiante por NIE → seleccionar talonario → seleccionar comprobante pendiente → confirmar
- Validación automática: no permite pagar comprobantes ya pagados
- Resumen de totales en la tabla

### 3. Talonarios (`/talonarios`)
- Tarjetas visuales por estudiante con barra de progreso de pago
- Crear talonario manualmente para cualquier año
- Vista de detalle agrupada por tipo (Matrícula, Papelería, Colegiatura, Alimentación)
- **Vista de impresión** (`/talonarios/[id]/imprimir`): layout 2×2 (4 comprobantes por hoja A4), con sello de "PAGADO" en comprobantes ya cobrados

### 4. Estudiantes (`/estudiantes`)
- Listado con búsqueda
- **Matrícula nueva** (`/estudiantes/nuevo`): crea automáticamente usuario temporal + talonario del año
- Perfil completo del estudiante con historial de talonarios y pagos
- Edición de datos personales

### 5. Reportes (`/reportes`) — Solo ADMINISTRATIVO
- Selector de fecha con reporte instantáneo
- Desglose por categorías: 💰 Colegiatura / 🍽️ Alimentación / 📋 Matrícula / 📦 Papelería
- **Descargar Excel** (`.xlsx`): dos hojas — Detalle de pagos + Resumen por categoría
- **Descargar PDF** (`.html` imprimible): incluye tabla completa, totales y desglose visual

---

## 🔌 API Reference

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/signin` | Login con NextAuth.js |

### Estudiantes
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/estudiantes` | Listar (filtros: nombre, nie, grado) | Todos |
| POST | `/api/estudiantes` | Matricular + crear usuario + talonario | MATRICULA, ADMIN |
| GET | `/api/estudiantes/[id]` | Detalle con talonarios y pagos | Todos |
| PUT | `/api/estudiantes/[id]` | Actualizar datos | MATRICULA, ADMIN |
| DELETE | `/api/estudiantes/[id]` | Eliminar | Solo ADMIN |

### Talonarios
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/talonarios` | Listar (filtros: estudianteId, anio) | Todos |
| POST | `/api/talonarios` | Generar talonario | Todos |
| GET | `/api/talonarios/[id]` | Detalle con comprobantes | Todos |

### Pagos
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/pagos` | Listar (filtros: fecha, tipo, estudianteId) | Todos |
| POST | `/api/pagos` | Registrar pago | COLECTOR, ADMIN |
| GET | `/api/pagos/[id]` | Detalle de pago | Todos |

### Dashboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/dashboard/stats` | Estadísticas generales |

### Reportes
| Método | Ruta | Descripción | Roles |
|--------|------|-------------|-------|
| GET | `/api/reportes/diario?fecha=YYYY-MM-DD` | Reporte del día | ADMIN |
| GET | `/api/reportes/mensual?mes=MM&anio=YYYY` | Reporte mensual | ADMIN |
| GET | `/api/reportes/exportar/excel?fecha=YYYY-MM-DD` | Descargar Excel | ADMIN |
| GET | `/api/reportes/exportar/pdf?fecha=YYYY-MM-DD` | Descargar PDF | ADMIN |

---

## 🔐 Control de Acceso por Rol

| Módulo / Acción | COLECTOR | MATRICULA | ADMINISTRATIVO |
|-----------------|:--------:|:---------:|:--------------:|
| Dashboard | ✅ | ✅ | ✅ |
| Ver estudiantes | ✅ | ✅ | ✅ |
| Matricular nuevo | ❌ | ✅ | ✅ |
| Editar estudiante | ❌ | ✅ | ✅ |
| Eliminar estudiante | ❌ | ❌ | ✅ |
| Registrar pago | ✅ | ❌ | ✅ |
| Ver talonarios | ✅ | ✅ | ✅ |
| Crear talonario | ✅ | ✅ | ✅ |
| Ver reportes | ❌ | ❌ | ✅ |
| Exportar Excel/PDF | ❌ | ❌ | ✅ |

---

## 🚢 Deploy en Producción

### Opción A: Vercel (Recomendado)

1. Subir el proyecto a GitHub/GitLab
2. Conectar el repositorio en [vercel.com](https://vercel.com)
3. Agregar las variables de entorno en el panel de Vercel:
   - `DATABASE_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` = `https://tu-dominio.vercel.app`
4. Vercel detecta Next.js automáticamente y hace el build

### Opción B: Azure App Service

```bash
# Build de producción
npm run build

# El servidor se inicia con
npm start
```

Variables de entorno en Azure App Service → Configuration → Application Settings.

### Consideraciones de producción

- Cambiar `NEXTAUTH_URL` al dominio real
- Cambiar todas las contraseñas del seed
- Habilitar `NODE_ENV=production`
- Verificar que el firewall de Azure PostgreSQL permita la IP del servidor de la app
- Considerar habilitar **connection pooling** en Azure PostgreSQL para mejor rendimiento

---

## 🧪 Comandos Útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm run start        # Iniciar en producción
npm run lint         # Verificar código
npm run db:migrate   # Aplicar migraciones
npm run db:seed      # Crear usuarios iniciales
npm run db:studio    # Prisma Studio (UI visual de BD)
npx prisma generate  # Regenerar cliente Prisma
```

---

## 🆘 Solución de Problemas Comunes

### Error: "Can't reach database server"
- Verificar que `DATABASE_URL` esté correctamente formateada
- Verificar que la IP esté en el firewall de Azure PostgreSQL
- Asegurarse de que `?sslmode=require` esté al final de la URL

### Error: "NEXTAUTH_SECRET not set"
- Asegurarse de que `.env` existe y tiene `NEXTAUTH_SECRET` con un valor

### Error de Prisma: "P1001" o "P1002"
- La base de datos no está accesible. Verificar la cadena de conexión y el firewall de Azure

### Los estilos no cargan
- Ejecutar `npm run build` y revisar la consola
- Verificar que `tailwind.config.ts` incluye los paths correctos en `content`

---

*© 2024 Complejo Educativo Católico Zaconato — Sistema de Gestión Escolar*
