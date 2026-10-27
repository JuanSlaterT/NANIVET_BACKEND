# NANIVET Backend API

> **Sistema de gestión veterinaria integral** — Backend RESTful con Node.js, Express.js y PostgreSQL para la clínica veterinaria NANIVET.

---

## 📋 Descripción

Backend completo para la aplicación **NANIVET** — una plataforma de gestión veterinaria que expone una API REST para la gestión integral de:

- **Citas y calendarios** veterinarios con slots disponibles y bloqueos
- **Clientes y mascotas** con datos de consentimiento (Ley de Protección de Datos de Ecuador)
- **Casos clínicos** con formato SOAP (Subjetivo, Objetivo, Análisis, Plan)
- **Vacunas, tratamientos y desparasitaciones** con historial completo y **catálogos configurables**
- **Cirugías y exámenes adjuntos** (radiografías, ecografías, laboratorios)
- **Hospitalizaciones** con medicación programada y evoluciones diarias
- **Puntuaciones de citas** — sistema de calificación pública (1-5 estrellas, recomienda/no recomienda) con estadísticas por veterinario
- **Campañas de recordatorios** (vacunas vencidas, desparasitación, cumpleaños)
- **Auditoría completa** de todas las operaciones CRUD con diff de campos
- **Asistencia IA** (mock) para resumen de historias, conversión a SOAP, diagnósticos diferenciales
- **Peso en citas** — registro de peso automático vinculado a la línea de tiempo de la mascota

### Características principales

- ✅ **Autenticación JWT** con access token (24h) y refresh token (7d)
- ✅ **Control de acceso por roles** (admin, veterinario, recepcionista)
- ✅ **Auditoría automática** de todas las operaciones CREATE/UPDATE/DELETE
- ✅ **Zona horaria** `America/Guayaquil` (UTC-5) en todas las fechas
- ✅ **Tokens públicos** para enlaces de confirmación/cancelación de citas y puntuaciones
- ✅ **Integridad referencial** con restricciones ON DELETE RESTRICT
- ✅ **Formato de respuesta consistente**: `{ data, error?, meta? }`
- ✅ **Seed data** con ~192 registros para desarrollo y pruebas
- ✅ **Puntuaciones públicas** — tabla `puntuaciones` para el sistema `/puntuar/[id]` con estadísticas
- ✅ **Auto-creación de vacunas** — cuando una cita de tipo `vacunacion` se marca "atendida"
- ✅ **Auto-creación de desparasitaciones** — cuando una cita de tipo `desparasitacion` se marca "atendida"
- ✅ **Auto-creación de puntuaciones** — cuando una cita se marca "atendida"
- ✅ **Registro de peso en citas** — campo `peso_cita` que se guarda en `registros_peso` al marcar "atendida"

---

## 🛠️ Tecnologías

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Runtime** | Node.js | 20+ |
| **Framework** | Express.js | 4.21+ |
| **Base de datos** | PostgreSQL | 15+ |
| **Driver DB** | pg (node-postgres) | 8.13+ |
| **Autenticación** | jsonwebtoken | 9.0+ |
| **Hashing** | bcryptjs | 2.4+ |
| **Validación** | Zod | 3.23+ |
| **CORS** | cors | 2.8+ |
| **Utilidades** | uuid, dotenv | — |
| **Dev** | nodemon | 3.1+ |

---

## 📁 Estructura del proyecto

```
backend/
├── src/
│   ├── index.js                    # Punto de entrada — inicia servidor en PORT
│   ├── app.js                      # Configuración Express, middleware, rutas
│   ├── config/
│   │   ├── db.js                   # Pool de conexiones PostgreSQL (pg)
│   │   └── cors.js                 # Configuración CORS dinámica
│   ├── controllers/                # Lógica de negocio (21 controladores)
│   │   ├── auth.controller.js
│   │   ├── veterinarios.controller.js
│   │   ├── clientes.controller.js
│   │   ├── mascotas.controller.js
│   │   ├── citas.controller.js
│   │   ├── casos.controller.js
│   │   ├── vacunas.controller.js
│   │   ├── catalogo-vacunas.controller.js
│   │   ├── catalogo-desparasitacion.controller.js
│   │   ├── tratamientos.controller.js
│   │   ├── desparasitaciones.controller.js
│   │   ├── cirugias.controller.js
│   │   ├── examenes.controller.js
│   │   ├── peso.controller.js
│   │   ├── hospitalizaciones.controller.js
│   │   ├── medicaciones.controller.js
│   │   ├── evoluciones.controller.js
│   │   ├── auditoria.controller.js
│   │   ├── campanas.controller.js
│   │   ├── plantillas.controller.js
│   │   ├── ia.controller.js
│   │   └── puntuaciones.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js      # Verifica JWT (access + refresh)
│   │   ├── roles.middleware.js     # Valida permisos por rol
│   │   └── audit.middleware.js     # Log automático en tabla auditoria
│   ├── routes/                     # Definición de endpoints (22 archivos)
│   │   ├── auth.routes.js
│   │   ├── veterinarios.routes.js
│   │   ├── clientes.routes.js
│   │   ├── mascotas.routes.js
│   │   ├── citas.routes.js
│   │   ├── casos.routes.js
│   │   ├── vacunas.routes.js
│   │   ├── catalogo-vacunas.routes.js
│   │   ├── catalogo-desparasitacion.routes.js
│   │   ├── tratamientos.routes.js
│   │   ├── desparasitaciones.routes.js
│   │   ├── cirugias.routes.js
│   │   ├── examenes.routes.js
│   │   ├── peso.routes.js
│   │   ├── hospitalizaciones.routes.js
│   │   ├── medicaciones.routes.js
│   │   ├── evoluciones.routes.js
│   │   ├── auditoria.routes.js
│   │   ├── campanas.routes.js
│   │   ├── plantillas.routes.js
│   │   ├── ia.routes.js
│   │   └── puntuaciones.routes.js
│   ├── services/
│   │   ├── audit.service.js        # Servicio de logging de auditoría
│   │   ├── whatsapp.service.js     # Generación de enlaces wa.me
│   │   ├── campana.service.js      # Cálculo de segmentos de campañas
│   │   ├── availability.service.js # Cálculo de slots disponibles
│   │   └── ia.service.js           # IA mock (respuestas simuladas)
│   └── utils/
│       ├── dates.js                # Utilidades de fecha (America/Guayaquil)
│       ├── genId.js                # Genera IDs tipo "cli_001", "mas_001"
│       ├── genToken.js             # Genera tokens únicos de 16 chars
│       └── validators.js           # Esquemas Zod de validación
├── migrations/                     # Scripts SQL de migración (25 tablas)
│   ├── 001_create_usuarios.sql
│   ├── 002_create_veterinarios.sql
│   ├── 003_create_horarios_bloqueados.sql
│   ├── 004_create_clientes.sql
│   ├── 005_create_mascotas.sql
│   ├── 006_create_citas.sql
│   ├── 007_create_casos_clinicos.sql
│   ├── 008_create_vacunas.sql
│   ├── 009_create_tratamientos.sql
│   ├── 010_create_desparasitaciones.sql
│   ├── 011_create_cirugias.sql
│   ├── 012_create_examenes.sql
│   ├── 013_create_registros_peso.sql
│   ├── 014_create_hospitalizaciones.sql
│   ├── 015_create_medicaciones.sql
│   ├── 016_create_tomas_medicacion.sql
│   ├── 017_create_evoluciones.sql
│   ├── 018_create_auditoria.sql
│   ├── 019_create_campana_envios.sql
│   ├── 020_create_alertas_mascotas.sql
│   ├── 021_create_plantillas.sql
│   ├── 022_create_puntuaciones.sql
│   ├── 024_create_catalogo_vacunas.sql
│   └── 025_create_catalogo_desparasitacion.sql
├── seed/                           # Scripts SQL de datos de prueba (24 archivos)
│   ├── 000-secuencias.sql
│   ├── 001-usuarios.sql
│   ├── 002-veterinarios.sql
│   ├── 003-horarios_bloqueados.sql
│   ├── 004-clientes.sql
│   ├── 005-mascotas.sql
│   ├── 006-citas.sql
│   ├── 007-casos_clinicos.sql
│   ├── 008-vacunas.sql
│   ├── 009-tratamientos.sql
│   ├── 010-desparasitaciones.sql
│   ├── 011-cirugias.sql
│   ├── 012-examenes.sql
│   ├── 013-registros-peso.sql
│   ├── 014-hospitalizaciones.sql
│   ├── 015-medicaciones.sql
│   ├── 016-tomas_medicacion.sql
│   ├── 017-evoluciones.sql
│   ├── 018-auditoria.sql
│   ├── 019-campana_envios.sql
│   ├── 020-alertas-mascotas.sql
│   ├── 021-plantillas.sql
│   ├── 022-puntuaciones.sql
│   ├── 024-catalogo-vacunas.sql
│   └── 025-catalogo-desparasitacion.sql
├── scripts/
│   ├── run-migrations.js           # Ejecuta migraciones en orden
│   └── run-seed.js                 # Carga seed data (con --overwrite)
├── .env.example                    # Variables de entorno de ejemplo
├── package.json
└── README.md
```

---

## 🚀 Instalación

### Prerrequisitos

- **Node.js** 20 o superior
- **PostgreSQL** 15 o superior
- **npm** o **yarn**

### 1. Instalar dependencias

```bash
cd "backend NANIVET"
npm install
```

### 2. Crear base de datos

```sql
CREATE DATABASE nanivet;
```

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env
# O en Windows:
copy .env.example .env
```

Editar `.env` con los valores correctos:

```env
# ═══════════════════════════════════════════
# SERVIDOR
# ═══════════════════════════════════════════
PORT=3001
NODE_ENV=development

# ═══════════════════════════════════════════
# BASE DE DATOS POSTGRESQL
# ═══════════════════════════════════════════
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nanivet
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_POOL_MIN=2
DB_POOL_MAX=10

# ═══════════════════════════════════════════
# AUTENTICACIÓN JWT
# ═══════════════════════════════════════════
JWT_SECRET=tu_secret_key_muy_segura_cambiar_en_produccion
JWT_REFRESH_SECRET=tu_refresh_secret_muy_segura_cambiar_en_produccion
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# ═══════════════════════════════════════════
# CORS (dominios permitidos separados por coma)
# ═══════════════════════════════════════════
CORS_ORIGIN=http://localhost:3000,http://localhost:3001

# ═══════════════════════════════════════════
# ZONA HORARIA
# ═══════════════════════════════════════════
TIMEZONE=America/Guayaquil

# ═══════════════════════════════════════════
# WHATSAPP (opcional)
# ═══════════════════════════════════════════
WHATSAPP_API_KEY=
```

### 4. Ejecutar migraciones y seed

```bash
# Opción A: Setup completo (recomendado)
npm run db:setup

# Opción B: Paso a paso
npm run migrate
npm run seed

# Opción C: Seed con sobrescritura de datos
npm run seed --overwrite
```

### 5. Iniciar el servidor

```bash
# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start
```

El servidor se ejecutará en `http://localhost:3001` y estará disponible la health check en `GET /api/health`.

---

## 🗄️ Esquema de Base de Datos

**22 tablas** con **~192+ registros** de seed data. Todas las fechas usan `TIMESTAMP WITH TIME ZONE` y zona `America/Guayaquil` (UTC-5).

### Relación entre tablas (ER simplificado)

```
usuarios ──(1:1)──> veterinarios
    │
    └──(1:N)──> auditoria
    └──(1:N)──> citas (como ultimo_cambio_por)

veterinarios ──(1:N)──> horarios_bloqueados
    └──(1:N)──> citas
    └──(1:N)──> casos_clinicos
    └──(1:N)──> vacunas
    └──(1:N)──> tratamientos
    └──(1:N)──> desparasitaciones
    └──(1:N)──> cirugias
    └──(1:N)──> examenes_adjuntos
    └──(1:N)──> puntuaciones
    └──(1:N)──> hospitalizaciones
    └──(1:N)──> evoluciones_hospitalizacion

clientes ──(1:N)──> mascotas
    └──(1:N)──> campana_envios

mascotas ──(1:N)──> citas
    └──(1:N)──> casos_clinicos
    └──(1:N)──> vacunas
    └──(1:N)──> tratamientos
    └──(1:N)──> desparasitaciones
    └──(1:N)──> cirugias
    └──(1:N)──> examenes_adjuntos
    └──(1:N)──> registros_peso
    └──(1:N)──> puntuaciones
    └──(1:N)──> hospitalizaciones
    └──(1:N)──> alertas_mascotas (CASCADE DELETE)

citas ──(1:N)──> puntuaciones
    └──(1:N)──> hospitalizaciones (opcional)

casos_clinicos ──(1:N)──> vacunas (opcional)
    └──(1:N)──> tratamientos (opcional)
    └──(1:N)──> desparasitaciones (opcional)
    └──(1:N)──> cirugias (opcional)
    └──(1:N)──> examenes_adjuntos (opcional)
    └──(1:N)──> hospitalizaciones (opcional)

hospitalizaciones ──(1:N)──> medicaciones_hospitalizacion (CASCADE DELETE)
    └──(1:N)──> evoluciones_hospitalizacion (CASCADE DELETE)

medicaciones_hospitalizacion ──(1:N)──> tomas_medicacion (CASCADE DELETE)
```

---

### 1. `usuarios` — Usuarios del sistema

**Descripción:** Usuarios que acceden al sistema con roles diferenciados.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `usr_001`) |
| `nombre` | VARCHAR(120) | NOT NULL | Nombre completo |
| `email` | VARCHAR(150) | UNIQUE, NOT NULL | Email de login |
| `password_hash` | VARCHAR(255) | NOT NULL | Hash bcrypt (cost 12) |
| `rol` | VARCHAR(20) | NOT NULL, CHECK | `'admin'`, `'veterinario'`, `'recepcionista'` |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NULLABLE | Vinculado si es veterinario |
| `activo` | BOOLEAN | DEFAULT true | Estado del usuario |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `ultima_conexion` | TIMESTAMPTZ | NULLABLE | Última vez que se conectó |

**Índices:** `idx_usuarios_email`, `idx_usuarios_rol`

**Seed data (3 registros):**

| id | nombre | email | rol | veterinario_id |
|---|---|---|---|---|
| `usr_001` | Dra. Nicole Pérez | veterinario@nanivet.com | veterinario | `vet_001` |
| `usr_002` | Carlos Mendoza | recepcion@nanivet.com | recepcionista | NULL |
| `usr_003` | Admin NANIVET | admin@nanivet.com | admin | NULL |

**Password para todos:** `nanivet123` (hasheado con bcrypt, cost 12)

---

### 2. `veterinarios` — Catálogo de veterinarios

**Descripción:** Catálogo de veterinarios con horarios de atención y configuración de turnos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `vet_001`) |
| `nombre` | VARCHAR(120) | NOT NULL | Nombre completo |
| `especialidad` | VARCHAR(100) | NULLABLE | Especialidad principal |
| `telefono` | VARCHAR(20) | NULLABLE | Teléfono de contacto |
| `horario_inicio` | TIME | NOT NULL, DEFAULT '08:00' | Hora de inicio de atención |
| `horario_fin` | TIME | NOT NULL, DEFAULT '17:00' | Hora de fin de atención |
| `dias_semana` | INTEGER[] | NOT NULL, DEFAULT '{1,2,3,4,5,6}' | Días laborables (0=Dom, 1=Lun, ..., 6=Sáb) |
| `intervalo_minutos` | INTEGER | NOT NULL, DEFAULT 30 | Duración de cada slot (minutos) |
| `activo` | BOOLEAN | DEFAULT true | Estado del veterinario |

**Índices:** `idx_veterinarios_activo`

**Seed data (3 registros):**

| id | nombre | especialidad | teléfono | inicio | fin | días | intervalo |
|---|---|---|---|---|---|---|---|
| `vet_001` | Dra. Nicole Pérez | Medicina interna | 0991234567 | 08:00 | 17:00 | {1-6} | 30 |
| `vet_002` | Dr. Andrés Torres | Cirugía | 0987654321 | 09:00 | 18:00 | {1-5} | 30 |
| `vet_003` | Dra. Sofía Vera | Dermatología | 0971122334 | 08:00 | 16:00 | {1-6} | 30 |

---

### 3. `horarios_bloqueados` — Bloqueos de agenda

**Descripción:** Fechas/horarios bloqueados para un veterinario (almuerzo, vacaciones, capacitaciones).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `blk_001`) |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario afectado |
| `fecha` | DATE | NOT NULL | Fecha del bloqueo |
| `motivo` | TEXT | NULLABLE | Motivo del bloqueo |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación del registro |

**Índices:** `idx_horarios_bloqueados_vet_fecha`

**Seed data (2 registros):**

| id | veterinario_id | fecha | motivo |
|---|---|---|---|
| `blk_001` | `vet_001` | 2026-10-16 | Capacitación |
| `blk_002` | `vet_002` | 2026-10-20 | Cirugía programada externa |

---

### 4. `clientes` — Dueños de mascotas

**Descripción:** Dueños/titulares de mascotas. Incluye campos de consentimiento de datos conforme a la Ley de Protección de Datos del Ecuador.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cli_001`) |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre del cliente |
| `apellido` | VARCHAR(100) | NOT NULL | Apellido del cliente |
| `telefono` | VARCHAR(20) | NOT NULL | Teléfono (formato: 09XXXXXXXX) |
| `cedula` | VARCHAR(20) | UNIQUE, NOT NULL | Cédula de identidad |
| `email` | VARCHAR(150) | NULLABLE | Email |
| `direccion` | TEXT | NULLABLE | Dirección |
| `consentimiento_datos` | BOOLEAN | NOT NULL, DEFAULT false | **OBLIGATORIO** para crear cliente |
| `consentimiento_fecha` | TIMESTAMPTZ | NULLABLE | Fecha de aceptación |
| `consentimiento_version` | VARCHAR(10) | NULLABLE | Versión del consentimiento |
| `consentimiento_comunicaciones` | BOOLEAN | DEFAULT false | ¿Acepta campañas/marketing? |
| `consentimiento_comunicaciones_fecha` | TIMESTAMPTZ | NULLABLE | Fecha de aceptación comunicaciones |
| `fecha_revocacion` | TIMESTAMPTZ | NULLABLE | Fecha de revocatoria |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_clientes_cedula`, `idx_clientes_telefono`, `idx_clientes_consiento`

**Reglas de negocio:**
- `consentimiento_datos = true` es **obligatorio** para crear un cliente
- Sin consentimiento no se puede guardar el cliente
- `fecha_revocacion` se establece al revocar consentimiento
- Solo clientes con `consentimiento_comunicaciones = true` reciben campañas

**Seed data (10 registros):**

| id | nombre | apellido | teléfono | cédula | email | consentimiento | comunicaciones |
|---|---|---|---|---|---|---|---|
| `cli_001` | María | González | 0991122334 | 0901234567 | maria.gonzalez@email.com | ✅ | ✅ |
| `cli_002` | Juan | Caicedo | 0992233445 | 0902345678 | juan.caicedo@email.com | ✅ | ✅ |
| `cli_003` | Lucía | Mendoza | 0993344556 | 0903456789 | lucia.mendoza@email.com | ✅ | ✅ |
| `cli_004` | Pedro | Intriago | 0994455667 | 0904567890 | NULL | ✅ | ✅ |
| `cli_005` | Ana | Quintero | 0995566778 | 0905678901 | NULL | ✅ | ❌ |
| `cli_006` | Luis | Briones | 0996677889 | 0906789012 | luis.briones@email.com | ✅ | ✅ |
| `cli_007` | Carmen | Saltos | 0997788990 | 0907890123 | carmen.saltos@email.com | ✅ | ✅ |
| `cli_008` | Diego | Vera | 0998899001 | 0908901234 | diego.vera@email.com | ✅ | ✅ |
| `cli_009` | Rosa | Paredes | 0999900112 | 0909012345 | NULL | ✅ | ❌ |
| `cli_010` | Fernando | Mora | 0980011223 | 0910123456 | fernando.mora@email.com | ✅ | ✅ |

---

### 5. `mascotas` — Mascotas asociadas a clientes

**Descripción:** Mascotas vinculadas a un cliente. No se puede eliminar un cliente que tenga mascotas (ON DELETE RESTRICT).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `mas_001`) |
| `cliente_id` | VARCHAR(20) | FK → clientes.id, NOT NULL, RESTRICT | Dueño de la mascota |
| `nombre` | VARCHAR(80) | NOT NULL | Nombre de la mascota |
| `especie` | VARCHAR(20) | NOT NULL, CHECK | `'Perro'`, `'Gato'`, `'Conejo'`, `'Ave'`, `'Otro'` |
| `sexo` | VARCHAR(10) | NOT NULL, CHECK | `'Macho'`, `'Hembra'` |
| `fecha_nacimiento` | DATE | NULLABLE | Fecha de nacimiento |
| `raza` | VARCHAR(100) | NULLABLE | Raza |
| `color` | VARCHAR(50) | NULLABLE | Color |
| `foto_url` | TEXT | NULLABLE | URL de foto |
| `esterilizado` | BOOLEAN | DEFAULT false | ¿Esterilizado? |
| `microchip` | VARCHAR(50) | NULLABLE | Número de microchip |
| `alergias` | TEXT | NULLABLE | Alergias conocidas |
| `notas` | TEXT | NULLABLE | Notas adicionales |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_mascotas_cliente`, `idx_mascotas_especie`, `idx_mascotas_nombre`

**Seed data (20 registros):**

| id | cliente_id | nombre | especie | sexo | raza | color | esterilizado | microchip |
|---|---|---|---|---|---|---|---|---|
| `mas_001` | cli_001 | Max | Perro | Macho | Labrador | Dorado | ✅ | 985112233445566 |
| `mas_002` | cli_001 | Luna | Gato | Hembra | Siamés | Crema | ✅ | NULL |
| `mas_003` | cli_002 | Rocky | Perro | Macho | Bulldog Francés | B/N | ❌ | NULL |
| `mas_004` | cli_003 | Mia | Gato | Hembra | Mestizo | Gris | ❌ | NULL |
| `mas_005` | cli_003 | Coco | Conejo | Macho | Mini Lop | Marrón | ✅ | NULL |
| `mas_006` | cli_004 | Thor | Perro | Macho | Pastor Alemán | N/F | ✅ | 985112233445568 |
| `mas_007` | cli_005 | Kiara | Perro | Hembra | Poodle | Blanco | ✅ | 985112233445569 |
| `mas_008` | cli_006 | Simba | Gato | Macho | Maine Coon | Naranja | ✅ | NULL |
| `mas_009` | cli_006 | Nina | Ave | Hembra | Periquito | V/A | ❌ | NULL |
| `mas_010` | cli_007 | Bruno | Perro | Macho | Rottweiler | N/F | ✅ | 985112233445570 |
| `mas_011` | cli_008 | Bella | Perro | Hembra | Beagle | Tricolor | ❌ | NULL |
| `mas_012` | cli_008 | Mishi | Gato | Hembra | Persa | Blanco | ✅ | 985112233445571 |
| `mas_013` | cli_009 | Toby | Perro | Macho | Mestizo | Café | ✅ | 985112233445572 |
| `mas_014` | cli_009 | Pelusa | Gato | Hembra | Angora | Blanco | ✅ | NULL |
| `mas_015` | cli_010 | Duke | Perro | Macho | Siberian Husky | G/B | ❌ | 985112233445573 |
| `mas_016` | cli_002 | Canela | Gato | Hembra | Mestizo | Atigrada | ❌ | NULL |
| `mas_017` | cli_004 | Piolín | Ave | Macho | Canario | Amarillo | ❌ | NULL |
| `mas_018` | cli_005 | Zoe | Perro | Hembra | Chihuahua | Café claro | ✅ | NULL |
| `mas_019` | cli_007 | Ginger | Conejo | Hembra | Cabeza de León | Naranja | ✅ | NULL |
| `mas_020` | cli_010 | Arya | Gato | Hembra | Bengala | Atigrado | ✅ | 985112233445574 |

---

### 6. `citas` — Citas/consultas programadas

**Descripción:** Citas programadas con token único para enlaces públicos. Cada cita tiene un token de 16 caracteres para acceso público sin autenticación.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cit_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota asociada |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario asignado |
| `tipo_servicio` | VARCHAR(30) | NOT NULL, CHECK | `'consulta'`, `'vacunacion'`, `'cirugia'`, `'desparasitacion'`, `'urgencia'`, `'estetica'`, `'control'` |
| `fecha_hora` | TIMESTAMPTZ | NOT NULL | Fecha y hora de la cita |
| `estado` | VARCHAR(20) | NOT NULL, DEFAULT 'pendiente', CHECK | `'pendiente'`, `'confirmada'`, `'atendida'`, `'cancelada'`, `'no_asistio'` |
| `motivo` | TEXT | NULLABLE | Motivo de la consulta |
| `notas` | TEXT | NULLABLE | Notas internas |
| `token` | VARCHAR(50) | UNIQUE, NOT NULL | Token público para enlace |
| `motivo_cancelacion` | TEXT | NULLABLE | Motivo si fue cancelada |
| `fecha_confirmacion` | TIMESTAMPTZ | NULLABLE | Fecha de confirmación |
| `ultimo_cambio_por` | VARCHAR(50) | NULLABLE | `'cliente'`, `'recepcion'`, etc. |
| `confirmada_por_cliente` | BOOLEAN | DEFAULT false | ¿Confirmada por cliente (enlace público)? |
| `cancelada_por_cliente` | BOOLEAN | DEFAULT false | ¿Cancelada por cliente (enlace público)? |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_citas_mascota`, `idx_citas_veterinario`, `idx_citas_fecha_hora`, `idx_citas_estado`, `idx_citas_token`, `idx_citas_fecha_hora_estado`

**Reglas de negocio:**
- `token` se genera automáticamente al crear la cita
- Cancelar/reprogramar solo si hay **>12 horas** antes de la cita
- No se puede modificar una cita con estado `atendida`
- Al crear cita de tipo `cirugia` con estado `confirmada`/`atendida`, se crea automáticamente una hospitalización

**Seed data (30 registros):**

| id | mascota | veterinario | tipo | fecha_hora | estado | token |
|---|---|---|---|---|---|---|
| `cit_001` | Max | vet_001 | consulta | 2026-10-15 09:00 | confirmada | tok_cit001_abcd |
| `cit_002` | Thor | vet_001 | control | 2026-10-15 10:30 | confirmada | tok_cit002_efgh |
| `cit_003` | Toby | vet_003 | consulta | 2026-10-15 11:00 | pendiente | tok_cit003_ijkl |
| `cit_004` | Rocky | vet_002 | cirugia | 2026-10-15 14:00 | confirmada | tok_cit004_mnop |
| `cit_005` | Bruno | vet_001 | vacunacion | 2026-10-15 15:30 | pendiente | tok_cit005_qrst |
| `cit_006` | Luna | vet_003 | consulta | 2026-10-16 09:00 | confirmada | tok_cit006_uvwx |
| `cit_007` | Kiara | vet_001 | estetica | 2026-10-16 10:00 | pendiente | tok_cit007_yzab |
| `cit_008` | Duke | vet_002 | consulta | 2026-10-16 11:30 | confirmada | tok_cit008_cdef |
| `cit_009` | Simba | vet_003 | consulta | 2026-10-17 09:30 | confirmada | tok_cit009_ghij |
| `cit_010` | Bella | vet_001 | vacunacion | 2026-10-17 11:00 | pendiente | tok_cit010_klmn |
| `cit_011` | Arya | vet_002 | cirugia | 2026-10-17 14:00 | confirmada | tok_cit011_opqr |
| `cit_012` | Mia | vet_001 | urgencia | 2026-10-18 10:00 | atendida | tok_cit012_stuv |
| `cit_013` | Nina | vet_003 | consulta | 2026-10-19 10:00 | pendiente | tok_cit013_wxyz |
| `cit_014` | Mishi | vet_001 | estetica | 2026-10-19 14:30 | confirmada | tok_cit014_abc1 |
| `cit_015` | Coco | vet_001 | desparasitacion | 2026-10-20 09:00 | pendiente | tok_cit015_def2 |
| `cit_016` | Pelusa | vet_003 | control | 2026-10-20 11:00 | confirmada | tok_cit016_ghi3 |
| `cit_017` | Piolín | vet_001 | consulta | 2026-10-21 10:00 | pendiente | tok_cit017_jkl4 |
| `cit_018` | Zoe | vet_003 | consulta | 2026-10-21 15:00 | confirmada | tok_cit018_mno5 |
| `cit_019` | Ginger | vet_001 | desparasitacion | 2026-10-22 09:30 | pendiente | tok_cit019_pqr6 |
| `cit_020` | Canela | vet_002 | vacunacion | 2026-10-22 11:30 | pendiente | tok_cit020_stu7 |
| `cit_021` | Max | vet_001 | control | 2026-10-23 10:00 | pendiente | tok_cit021_vwx8 |
| `cit_022` | Bruno | vet_002 | consulta | 2026-10-23 14:00 | pendiente | tok_cit022_yza9 |
| `cit_023` | Thor | vet_001 | consulta | 2026-10-24 09:00 | pendiente | tok_cit023_bcd0 |
| `cit_024` | Max | vet_001 | consulta | 2026-10-08 09:00 | atendida | tok_cit024_efg1 |
| `cit_025` | Rocky | vet_002 | consulta | 2026-10-08 11:00 | atendida | tok_cit025_hij2 |
| `cit_026` | Simba | vet_003 | consulta | 2026-10-10 10:00 | atendida | tok_cit026_klm3 |
| `cit_027` | Toby | vet_001 | vacunacion | 2026-10-05 09:30 | atendida | tok_cit027_nop4 |
| `cit_028` | Arya | vet_002 | cirugia | 2026-10-03 08:00 | atendida | tok_cit028_qrs5 |
| `cit_029` | Pelusa | vet_001 | consulta | 2026-10-09 14:00 | cancelada | tok_cit029_tuv6 |
| `cit_030` | Bella | vet_003 | control | 2026-10-11 16:00 | no_asistio | tok_cit030_wxy7 |

---

### 7. `casos_clinicos` — Casos clínicos con formato SOAP

**Descripción:** Casos clínicos vinculados a mascotas. Contiene el formato SOAP (Subjetivo, Objetivo, Análisis, Plan) y diagnóstico. Solo admin y veterinario pueden acceder.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cas_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL, RESTRICT | Mascota asociada |
| `motivo` | TEXT | NOT NULL | Motivo de la consulta |
| `soap_subjetivo` | TEXT | NULLABLE | Lo que dice el dueño/paciente |
| `soap_objetivo` | TEXT | NULLABLE | Signos vitales, exploración |
| `soap_analisis` | TEXT | NULLABLE | Interpretación clínica |
| `soap_plan` | TEXT | NULLABLE | Tratamiento, seguimiento |
| `diagnostico` | TEXT | NULLABLE | Diagnóstico final |
| `estado` | VARCHAR(20) | NOT NULL, DEFAULT 'abierto', CHECK | `'abierto'`, `'seguimiento'`, `'cerrado'` |
| `fecha_hora_inicio` | TIMESTAMPTZ | NOT NULL | Inicio del caso |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario responsable |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_casos_mascota`, `idx_casos_estado`, `idx_casos_veterinario`, `idx_casos_fecha`

**Seed data (15 registros):**

| id | mascota | motivo | diagnóstico | estado | veterinario | fecha |
|---|---|---|---|---|---|---|
| `cas_001` | Max | Chequeo anual | Paciente sano - control de rutina | cerrado | vet_001 | 2026-10-08 |
| `cas_002` | Thor | Displasia de cadera | Displasia bilateral grado 2 | seguimiento | vet_001 | 2026-10-08 |
| `cas_003` | Rocky | Problema dermatológico | Dermatitis alérgica por pulgas | cerrado | vet_002 | 2026-10-08 |
| `cas_004` | Simba | Dermatitis felina | Dermatitis por pulgas | cerrado | vet_003 | 2026-10-10 |
| `cas_005` | Toby | Artritis crónica | Artritis degenerativa múltiples articulaciones | seguimiento | vet_001 | 2026-10-05 |
| `cas_006` | Arya | Cirugía de esterilización | Para esterilización electiva | abierto | vet_002 | 2026-10-03 |
| `cas_007` | Rocky | Castración | Para castración electiva | abierto | vet_002 | 2026-10-15 |
| `cas_008` | Luna | Alergia cutánea felina | Dermatitis alérgica (pólen) | seguimiento | vet_003 | 2026-10-12 |
| `cas_009` | Mia | Vómitos persistentes | Gastroenteritis aguda | abierto | vet_001 | 2026-10-18 |
| `cas_010` | Kiara | Control de peso | Paciente sana | cerrado | vet_001 | 2026-09-28 |
| `cas_011` | Bruno | Vacunación y chequeo | Paciente sano - vacunación | cerrado | vet_001 | 2026-09-20 |
| `cas_012` | Duke | Chequeo pre-cirugía | Sano - pre-quirúrgico | cerrado | vet_002 | 2026-09-25 |
| `cas_013` | Zoe | Problema dental | Enfermedad periodontal grado 2 | seguimiento | vet_003 | 2026-10-01 |
| `cas_014` | Coco | Consulta general conejo | Conejo sano | cerrado | vet_001 | 2026-09-15 |
| `cas_015` | Nina | Revisión general ave | Muda de plumaje | seguimiento | vet_003 | 2026-10-02 |

---

### 8. `vacunas` — Historial de vacunas

**Descripción:** Historial de vacunas aplicadas con control de próximas dosis.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `vac_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota |
| `caso_id` | VARCHAR(20) | FK → casos_clinicos.id, NULLABLE | Caso clínico asociado |
| `nombre` | VARCHAR(100) | NOT NULL | Nombre de la vacuna |
| `lote` | VARCHAR(50) | NOT NULL | Número de lote |
| `fecha_aplicacion` | DATE | NOT NULL | Fecha de aplicación |
| `proxima_dosis` | DATE | NULLABLE | Fecha de próxima dosis |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario que aplicó |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_vacunas_mascota`, `idx_vacunas_caso`, `idx_vacunas_proxima`

**Seed data (12 registros):**

| id | mascota | vacuna | lote | fecha | próxima dosis | veterinario |
|---|---|---|---|---|---|---|
| `vac_001` | Max | Antirrábica | AR-2026-001 | 2026-10-08 | 2027-10-08 | vet_001 |
| `vac_002` | Max | Múltiple Canina (DA2PP) | MC-2026-003 | 2026-10-08 | 2027-10-08 | vet_001 |
| `vac_003` | Luna | Triple Felina | TF-2026-010 | 2026-09-10 | 2027-09-10 | vet_003 |
| `vac_004` | Rocky | Antirrábica | AR-2026-005 | 2026-06-15 | 2027-06-15 | vet_002 |
| `vac_005` | Thor | Múltiple Canina (DA2PP) | MC-2026-008 | 2026-05-20 | 2027-05-20 | vet_001 |
| `vac_006` | Bruno | Antirrábica | AR-2026-012 | 2026-09-20 | 2027-09-20 | vet_001 |
| `vac_007` | Bruno | Múltiple Canina (DA2PP) | MC-2026-015 | 2026-09-20 | 2027-09-20 | vet_001 |
| `vac_008` | Toby | Refuerzo Múltiple | MC-2026-020 | 2026-10-05 | 2027-10-05 | vet_001 |
| `vac_009` | Duke | Antirrábica | AR-2026-025 | 2026-08-10 | 2027-08-10 | vet_002 |
| `vac_010` | Bella | Primera Dosis Cachorro | PC-2026-030 | 2026-09-01 | 2026-10-15 | vet_001 |
| `vac_011` | Canela | Triple Felina | TF-2026-035 | 2026-07-20 | 2026-10-20 | vet_002 |
| `vac_012` | Simba | Antirrábica | AR-2026-040 | 2026-06-01 | 2026-12-01 | vet_003 |

---

### 9. `tratamientos` — Tratamientos/recetas

**Descripción:** Tratamientos y medicamentos prescriptos.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `tra_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL, RESTRICT | Mascota |
| `caso_id` | VARCHAR(20) | FK → casos_clinicos.id, NULLABLE | Caso clínico asociado |
| `nombre` | VARCHAR(150) | NOT NULL | Nombre del medicamento |
| `dosis` | VARCHAR(100) | NOT NULL | Dosis prescripta |
| `duracion` | VARCHAR(100) | NULLABLE | Duración del tratamiento |
| `fecha` | DATE | NOT NULL | Fecha de prescripción |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario que prescribió |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_tratamientos_mascota`, `idx_tratamientos_caso`

**Seed data (10 registros):**

| id | mascota | medicamento | dosis | duración | fecha | veterinario |
|---|---|---|---|---|---|---|
| `tra_001` | Thor | Meloxicam 1.5mg/ml | 0.1mg/kg PO c/24h | 30 días | 2026-10-08 | vet_001 |
| `tra_002` | Thor | Condroitina + Glucosamina | 1 comp PO c/24h | Continuo | 2026-10-08 | vet_001 |
| `tra_003` | Rocky | Prednisolona 5mg | 0.5mg/kg PO c/12h | 7 días | 2026-10-08 | vet_002 |
| `tra_004` | Rocky | Spot-on Fipronil | 1 aplicación tópica | Único | 2026-10-08 | vet_002 |
| `tra_005` | Simba | Spot-on Selamectina | 1 aplicación en nuca | Mensual | 2026-10-10 | vet_003 |
| `tra_006` | Toby | Carprofeno 50mg | 2mg/kg PO c/12h | 15 días | 2026-10-05 | vet_001 |
| `tra_007` | Toby | Omega 3 (EPA/DHA) | 1 cápsula PO c/24h | Continuo | 2026-10-05 | vet_001 |
| `tra_008` | Luna | Clorfenamina 4mg | 2mg PO c/12h | 10 días | 2026-10-12 | vet_003 |
| `tra_009` | Mia | Maropitant (Cerenia) | 1mg/kg SC | Único | 2026-10-18 | vet_001 |
| `tra_010` | Zoe | Amox + Ác. Clavulánico | 12.5mg/kg PO c/12h | 10 días | 2026-10-01 | vet_003 |

---

### 10. `desparasitaciones` — Historial de desparasitaciones

**Descripción:** Historial de desparasitaciones internas y externas.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `des_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota |
| `caso_id` | VARCHAR(20) | FK → casos_clinicos.id, NULLABLE | Caso clínico asociado |
| `producto` | VARCHAR(150) | NOT NULL | Nombre del producto |
| `dosis` | VARCHAR(100) | NOT NULL | Dosis aplicada |
| `fecha` | DATE | NOT NULL | Fecha de aplicación |
| `proxima_dosis` | DATE | NULLABLE | Fecha próxima desparasitación |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_desparasitaciones_mascota`, `idx_desparasitaciones_caso`, `idx_desparasitaciones_proxima`

**Seed data (7 registros):**

| id | mascota | producto | dosis | fecha | próxima dosis | veterinario |
|---|---|---|---|---|---|---|
| `des_001` | Max | Praziquantel + Febantel | 1 tableta/10kg PO | 2026-10-08 | 2027-01-08 | vet_001 |
| `des_002` | Coco | Ivermectina 0.1% | 0.2mg/kg SC | 2026-09-15 | 2026-12-15 | vet_001 |
| `des_003` | Bruno | Praziquantel + Febantel | 1.5 tabletas PO | 2026-09-20 | 2026-12-20 | vet_001 |
| `des_004` | Rocky | Milbemicina Oxima | 1 tableta PO | 2026-08-01 | 2026-11-01 | vet_002 |
| `des_005` | Toby | Praziquantel + Febantel | 1 tableta PO | 2026-07-10 | 2026-10-10 | vet_001 |
| `des_006` | Simba | Emodepsida + Praziquantel | 1 aplicación | 2026-08-20 | 2026-11-20 | vet_003 |
| `des_007` | Ginger | Ivermectina 0.1% | 0.2mg/kg SC | 2026-07-01 | 2026-10-01 | vet_001 |

---

### 11. `cirugias` — Registro de cirugías

**Descripción:** Registro de cirugías realizadas con detalles de anestesia y pronóstico.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cir_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota |
| `caso_id` | VARCHAR(20) | FK → casos_clinicos.id, NULLABLE | Caso clínico asociado |
| `tipo` | VARCHAR(150) | NOT NULL | Tipo de cirugía |
| `fecha` | DATE | NOT NULL | Fecha de la cirugía |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario cirujano |
| `anestesia` | TEXT | NULLABLE | Protocolo de anestesia |
| `notas` | TEXT | NULLABLE | Notas quirúrgicas |
| `prognosis` | VARCHAR(100) | NULLABLE | Pronóstico |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_cirugias_mascota`, `idx_cirugias_caso`

**Seed data (3 registros):**

| id | mascota | tipo | fecha | veterinario | anestesia | pronóstico |
|---|---|---|---|---|---|---|
| `cir_001` | Arya | OVH (Esterilización) | 2026-10-03 | vet_002 | Propofol + Ketamina IV | Excelente |
| `cir_002` | Arya | Limpieza dental + extracción | 2026-10-17 | vet_002 | Total IV | Buena |
| `cir_003` | Rocky | Orquiectomía (Castración) | 2026-10-15 | vet_002 | Isoflurano inhalatoria | Excelente |

---

### 12. `examenes_adjuntos` — Exámenes e imágenes

**Descripción:** Exámenes e imágenes adjuntas (radiografías, ecografías, laboratorios).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `exa_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota |
| `caso_id` | VARCHAR(20) | FK → casos_clinicos.id, NULLABLE | Caso clínico asociado |
| `tipo` | VARCHAR(50) | NOT NULL, CHECK | `'radiografia'`, `'ecografia'`, `'laboratorio'`, `'otro'` |
| `titulo` | VARCHAR(200) | NULLABLE | Título del examen |
| `descripcion` | TEXT | NULLABLE | Descripción |
| `fecha` | DATE | NOT NULL | Fecha del examen |
| `archivo_url` | TEXT | NULLABLE | URL del archivo |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NULLABLE | Veterinario que lo solicitó |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_examenes_mascota`, `idx_examenes_caso`

**Seed data (7 registros):**

| id | mascota | tipo | título | fecha | veterinario |
|---|---|---|---|---|---|
| `exa_001` | Thor | radiografía | Radiografía de cadera | 2026-09-15 | vet_001 |
| `exa_002` | Thor | laboratorio | Hemograma y bioquímica | 2026-09-15 | vet_001 |
| `exa_003` | Arya | laboratorio | Examen pre-anestésico | 2026-10-02 | vet_002 |
| `exa_004` | Toby | radiografía | Radiografía de articulaciones | 2026-08-20 | vet_001 |
| `exa_005` | Mia | radiografía | Radiografía abdominal | 2026-10-18 | vet_001 |
| `exa_006` | Zoe | laboratorio | Examen dental | 2026-10-01 | vet_003 |
| `exa_007` | Rocky | laboratorio | Raspado de piel | 2026-10-08 | vet_002 |

---

### 13. `registros_peso` — Historial de peso

**Descripción:** Historial de peso para gráficas de evolución.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `pes_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota |
| `peso_kg` | NUMERIC(5,2) | NOT NULL | Peso en kilogramos |
| `fecha` | DATE | NOT NULL | Fecha del peso |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_registros_peso_mascota`

**Seed data (20 registros):** 4 registros por mascota (Max, Thor, Rocky, Toby) desde 2025 hasta 2026.

| id | mascota | peso_kg | fecha |
|---|---|---|---|
| `pes_001` | Max | 25.0 | 2025-10-08 |
| `pes_002` | Max | 26.5 | 2026-01-15 |
| `pes_003` | Max | 27.0 | 2026-04-10 |
| `pes_004` | Max | 28.0 | 2026-07-05 |
| `pes_005` | Max | 28.5 | 2026-10-08 |
| `pes_006` | Thor | 35.0 | 2025-10-01 |
| `pes_007` | Thor | 34.5 | 2026-01-10 |
| `pes_008` | Thor | 34.0 | 2026-04-15 |
| `pes_009` | Thor | 33.5 | 2026-07-08 |
| `pes_010` | Thor | 33.0 | 2026-10-08 |
| `pes_011` | Rocky | 9.0 | 2025-09-01 |
| `pes_012` | Rocky | 10.5 | 2026-01-20 |
| `pes_013` | Rocky | 11.0 | 2026-04-10 |
| `pes_014` | Rocky | 11.5 | 2026-07-15 |
| `pes_015` | Rocky | 12.0 | 2026-10-08 |
| `pes_016` | Toby | 18.0 | 2025-10-05 |
| `pes_017` | Toby | 17.5 | 2026-01-08 |
| `pes_018` | Toby | 17.0 | 2026-04-10 |
| `pes_019` | Toby | 16.8 | 2026-07-02 |
| `pes_020` | Toby | 16.5 | 2026-10-05 |

---

### 14. `puntuaciones` — Puntuaciones de citas

**Descripción:** Puntuaciones de citas vinculadas a citas. Cada puntuación tiene un token público para que el cliente califique desde enlace `/puntuar/[token]`.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `pnt_001`) |
| `cita_id` | VARCHAR(20) | FK → citas.id, NOT NULL | Cita asociada |
| `token` | VARCHAR(50) | UNIQUE, NOT NULL | Token público |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario evaluado |
| `calificacion` | INTEGER | CHECK 1-5 | Calificación (1-5 estrellas) |
| `recomienda` | BOOLEAN | NULLABLE | ¿Recomienda el servicio? |
| `comentario` | TEXT | NULLABLE | Comentario del cliente |
| `respondida` | BOOLEAN | DEFAULT false | ¿Ya respondió el cliente? |
| `fecha_respuesta` | TIMESTAMPTZ | NULLABLE | Fecha de respuesta |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_puntuaciones_cita`, `idx_puntuaciones_token`, `idx_puntuaciones_veterinario`, `idx_puntuaciones_respondida`

**Seed data (10 registros):** 8 respondidas, 2 pendientes.

| id | cita | token | mascota | veterinario | calificación | recomienda | respondida |
|---|---|---|---|---|---|---|---|
| `pnt_001` | cit_024 | tok_pnt001_abcd | Max | vet_001 | ⭐⭐⭐⭐⭐ (5) | ✅ | ✅ |
| `pnt_002` | cit_025 | tok_pnt002_efgh | Rocky | vet_002 | ⭐⭐⭐⭐ (4) | ✅ | ✅ |
| `pnt_003` | cit_026 | tok_pnt003_ijkl | Simba | vet_003 | ⭐⭐⭐⭐⭐ (5) | ✅ | ✅ |
| `pnt_004` | cit_027 | tok_pnt004_mnop | Toby | vet_001 | ⭐⭐⭐⭐⭐ (5) | ✅ | ✅ |
| `pnt_005` | cit_028 | tok_pnt005_qrst | Arya | vet_002 | ⭐⭐⭐⭐ (4) | ✅ | ✅ |
| `pnt_006` | cit_024 | tok_pnt006_uvwx | Max | vet_001 | ⭐⭐⭐ (3) | ✅ | ✅ |
| `pnt_007` | cit_025 | tok_pnt007_yzab | Rocky | vet_002 | ⭐⭐⭐⭐⭐ (5) | ✅ | ✅ |
| `pnt_008` | cit_026 | tok_pnt008_cdef | Simba | vet_003 | ⭐⭐ (2) | ❌ | ✅ |
| `pnt_009` | cit_024 | tok_pnt009_ghij | Max | vet_001 | NULL | NULL | ❌ pendiente |
| `pnt_010` | cit_027 | tok_pnt010_klmn | Toby | vet_001 | NULL | NULL | ❌ pendiente |

---

### 15. `hospitalizaciones` — Hospitalizaciones

**Descripción:** Hospitalizaciones de mascotas con estado actual (hospitalizado/alta).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `hos_001`) |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL | Mascota hospitalizada |
| `caso_id` | VARCHAR(20) | FK → casos_clinicos.id, NULLABLE | Caso clínico asociado |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario responsable |
| `cita_id` | VARCHAR(20) | FK → citas.id, NULLABLE | Cita asociada (si aplica) |
| `fecha_ingreso` | TIMESTAMPTZ | NOT NULL | Fecha de ingreso |
| `fecha_alta` | TIMESTAMPTZ | NULLABLE | Fecha de alta |
| `jaula_area` | VARCHAR(20) | NOT NULL | Ubicación (ej: A-01) |
| `motivo` | TEXT | NOT NULL | Motivo de hospitalización |
| `estado` | VARCHAR(20) | NOT NULL, DEFAULT 'hospitalizado', CHECK | `'hospitalizado'`, `'alta'` |
| `resumen_alta` | TEXT | NULLABLE | Resumen del alta |
| `indicaciones_alta` | TEXT | NULLABLE | Indicaciones para el dueño |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_hospitalizaciones_mascota`, `idx_hospitalizaciones_estado`

**Seed data (3 registros):** 2 activas, 1 con alta.

| id | mascota | veterinario | jaula | motivo | estado |
|---|---|---|---|---|---|
| `hos_001` | Arya | vet_002 | A-01 | Post-operatorio OVH - observación 24h | hospitalizado |
| `hos_002` | Mia | vet_001 | B-03 | Gastroenteritis aguda - fluidos IV | hospitalizado |
| `hos_003` | Toby | vet_001 | A-02 | Crisis artrítica - manejo del dolor | **alta** |

**Indicaciones de alta (hos_003):** "Continuar Carprofeno 50mg cada 12h por 10 días. Reposo relativo. Control en 7 días."

---

### 16. `medicaciones_hospitalizacion` — Medicaciones programadas

**Descripción:** Medicaciones programadas para pacientes hospitalizados con horarios en JSONB.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `med_001`) |
| `hospitalizacion_id` | VARCHAR(20) | FK → hospitalizaciones.id, NOT NULL, CASCADE | Hospitalización asociada |
| `medicamento` | VARCHAR(150) | NOT NULL | Nombre del medicamento |
| `dosis` | VARCHAR(100) | NOT NULL | Dosis |
| `via` | VARCHAR(50) | NOT NULL | Vía de administración (IV, SC, PO, tópico) |
| `frecuencia` | VARCHAR(100) | NOT NULL | Frecuencia (cada 8h, continuo, etc.) |
| `horas_programadas` | JSONB | NOT NULL | Array de horas, ej: `["08:00", "16:00", "00:00"]` |
| `fecha_inicio` | DATE | NOT NULL | Fecha de inicio |
| `fecha_fin` | DATE | NULLABLE | Fecha de fin |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_medicaciones_hospitalizacion`

**Seed data (4 registros):**

| id | hospitalización | medicamento | dosis | vía | frecuencia | horas |
|---|---|---|---|---|---|---|
| `med_001` | hos_001 | Tramadol 50mg | 2mg/kg | IV | Cada 8h | ["08:00", "16:00", "00:00"] |
| `med_002` | hos_001 | Amox + Ác. Clavulánico | 12.5mg/kg | SC | Cada 12h | ["09:00", "21:00"] |
| `med_003` | hos_002 | Ringer Lactato | 20ml/kg/h | IV | Flujo continuo | ["continuo"] |
| `med_004` | hos_002 | Maropitant (Cerenia) | 1mg/kg | SC | Cada 24h | ["08:00"] |

---

### 17. `tomas_medicacion` — Registro de tomas administradas

**Descripción:** Registro de cada toma administrada con quién, cuándo y si se administró.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `tom_001`) |
| `medicacion_id` | VARCHAR(20) | FK → medicaciones_hospitalizacion.id, NOT NULL, CASCADE | Medicación asociada |
| `fecha` | DATE | NOT NULL | Fecha de la toma |
| `hora_programada` | VARCHAR(10) | NOT NULL | Hora programada (HH:MM) |
| `administrada` | BOOLEAN | NOT NULL, DEFAULT false | ¿Se administró? |
| `hora_real` | VARCHAR(10) | NULLABLE | Hora real de administración |
| `usuario_administro` | VARCHAR(120) | NULLABLE | Nombre de quien administró |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_tomas_medicacion_medicacion`

**Seed data (10 registros):** Tomas para med_001 (Tramadol), med_002 (Amoxicilina), med_003 (Ringer), med_004 (Cerenia). Algunas administradas, otras pendientes.

---

### 18. `evoluciones_hospitalizacion` — Evoluciones diarias

**Descripción:** Evoluciones diarias de pacientes hospitalizadas con signos vitales.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `evd_001`) |
| `hospitalizacion_id` | VARCHAR(20) | FK → hospitalizaciones.id, NOT NULL, CASCADE | Hospitalización |
| `fecha` | DATE | NOT NULL | Fecha de la evolución |
| `signos_vitales` | TEXT | NULLABLE | T, FC, FR |
| `estado_general` | TEXT | NULLABLE | Descripción del estado |
| `observaciones` | TEXT | NULLABLE | Observaciones del veterinario |
| `veterinario_id` | VARCHAR(20) | FK → veterinarios.id, NOT NULL | Veterinario que registra |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_evoluciones_hospitalizacion`

**Seed data (5 registros):**

| id | hospitalización | fecha | signos vitales | veterinario |
|---|---|---|---|---|
| `evd_001` | hos_001 | 2026-10-14 | T: 38.2°C, FC: 110, FR: 22 | vet_002 |
| `evd_002` | hos_001 | 2026-10-15 | T: 38.5°C, FC: 95, FR: 20 | vet_002 |
| `evd_003` | hos_002 | 2026-10-15 | T: 38.0°C, FC: 140, FR: 28 | vet_001 |
| `evd_004` | hos_003 | 2026-10-13 | T: 38.8°C, FC: 120, FR: 24 | vet_001 |
| `evd_005` | hos_003 | 2026-10-14 | T: 38.3°C, FC: 100, FR: 20 | vet_001 |

---

### 19. `auditoria` — Registro de auditoría

**Descripción:** Registro automático de todas las operaciones CRUD. Captura valores antes/después y diff por campo.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `aud_001`) |
| `usuario` | VARCHAR(120) | NOT NULL | Nombre del usuario |
| `rol` | VARCHAR(20) | NOT NULL | Rol del usuario |
| `fecha_hora` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Fecha/hora del evento |
| `accion` | VARCHAR(30) | NOT NULL, CHECK | `'crear'`, `'editar'`, `'eliminar'`, `'consultar'`, `'revocar'`, `'confirmar'`, `'cancelar'`, `'reprogramar'`, `'enviar_campaña'`, `'alta_hospitalizacion'` |
| `entidad` | VARCHAR(50) | NOT NULL | Nombre de la entidad (ej: 'Cita', 'Cliente') |
| `entidad_id` | VARCHAR(20) | NOT NULL | ID del registro afectado |
| `valores_anteriores` | JSONB | NULLABLE | Snapshot antes del cambio |
| `valores_nuevos` | JSONB | NULLABLE | Snapshot después del cambio |
| `diff_campos` | JSONB | NULLABLE | Array de `{ campo, antes, despues }` |
| `ip_address` | INET | NULLABLE | IP del solicitante |
| `user_agent` | TEXT | NULLABLE | User-Agent del navegador |

**Índices:** `idx_auditoria_usuario`, `idx_auditoria_entidad`, `idx_auditoria_accion`, `idx_auditoria_fecha`

**Seed data (15 registros):** Ejemplos de crear casos, citas, vacunas, confirmar/cancelar citas, enviar campañas, etc.

---

### 20. `campana_envios` — Envíos de campañas

**Descripción:** Registro de envíos de campañas de recordatorios.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cme_001`) |
| `segmento` | VARCHAR(40) | NOT NULL, CHECK | `'vacunas_vencidas'`, `'desparasitacion_pendiente'`, `'clientes_inactivos'`, `'cumpleanos_mascotas'` |
| `cliente_id` | VARCHAR(20) | FK → clientes.id, NOT NULL | Cliente destinatario |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NULLABLE | Mascota asociada |
| `motivo` | TEXT | NOT NULL | Texto del recordatorio |
| `fecha_enviado` | TIMESTAMPTZ | NULLABLE | Fecha de envío |
| `enviado_por` | VARCHAR(120) | NULLABLE | Quién envió la campaña |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_campana_segmento`, `idx_campana_cliente`

**Lógica de cálculo de segmentos:**
- `vacunas_vencidas`: `proxima_dosis <= hoy + 15 días`
- `desparasitacion_pendiente`: `proxima_dosis <= hoy + 15 días`
- `clientes_inactivos`: sin citas `atendida` en los últimos 6 meses
- `cumpleanos_mascotas`: cumpleaños en los próximos días

**Seed data (8 registros):**

| id | segmento | cliente | mascota | motivo |
|---|---|---|---|---|
| `cme_001` | vacunas_vencidas | cli_002 | mas_003 | Vacuna antirrábica vence 2027-06-15 |
| `cme_002` | vacunas_vencidas | cli_007 | mas_010 | Refuerzo múltiple vence 2027-09-20 |
| `cme_003` | vacunas_vencidas | cli_009 | mas_013 | Refuerzo vence 2027-10-05 |
| `cme_004` | desparasitacion_pendiente | cli_001 | mas_001 | Desparasitación próxima: 2027-01-08 |
| `cme_005` | desparasitacion_pendiente | cli_007 | mas_010 | Desparasitación próxima: 2026-12-20 |
| `cme_006` | desparasitacion_pendiente | cli_009 | mas_013 | Desparasitación vencida desde 2026-10-10 |
| `cme_007` | clientes_inactivos | cli_004 | mas_006 | Sin visitas desde hace más de 6 meses |
| `cme_008` | cumpleanos_mascotas | cli_010 | mas_015 | Cumpleaños de Duke - 8 de mayo |

---

### 21. `alertas_mascotas` — Alertas individuales

**Descripción:** Alertas individuales de mascotas (alergia, agresivo, enfermedad crónica, medicación activa).

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único |
| `mascota_id` | VARCHAR(20) | FK → mascotas.id, NOT NULL, CASCADE | Mascota |
| `tipo` | VARCHAR(50) | NOT NULL, CHECK | `'alergia'`, `'agresivo'`, `'enfermedad_cronica'`, `'medicacion_activa'`, `'otra'` |
| `descripcion` | TEXT | NOT NULL | Descripción de la alerta |
| `activa` | BOOLEAN | DEFAULT true | ¿Está activa? |
| `creado_por` | VARCHAR(120) | NULLABLE | Quién creó la alerta |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |

**Índices:** `idx_alertas_mascota`, `idx_alertas_activa`

---

### 22. `plantillas` — Plantillas de diagnóstico/tratamiento

**Descripción:** Plantillas de diagnósticos y tratamientos frecuentes para uso rápido.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único |
| `nombre` | VARCHAR(200) | NOT NULL | Nombre de la plantilla |
| `tipo` | VARCHAR(20) | NOT NULL, CHECK | `'diagnostico'`, `'tratamiento'` |
| `contenido` | TEXT | NOT NULL | Contenido de la plantilla |
| `categoria` | VARCHAR(100) | NULLABLE | Categoría |
| `activo` | BOOLEAN | DEFAULT true | ¿Activa? |
| `uso_count` | INTEGER | DEFAULT 0 | Veces usada |
| `creado_por` | VARCHAR(120) | NULLABLE | Creador |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_plantillas_tipo`, `idx_plantillas_categoria`

---

### 23. `catalogo_vacunas` — Catálogo configurable de vacunas

**Descripción:** Catálogo dinámico de tipos de vacunas. Permite agregar/editar/eliminar tipos de vacunas desde la UI sin modificar código. Las vacunas inactivas (`activa = false`) no aparecen en los selects de registro pero se mantienen históricamente.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cv_001`) |
| `nombre` | VARCHAR(100) | UNIQUE, NOT NULL | Nombre de la vacuna |
| `intervalo_dias` | INTEGER | NOT NULL, CHECK > 0 | Días entre dosis |
| `especie` | VARCHAR(20) | NOT NULL, DEFAULT 'all', CHECK | `'all'`, `'Perro'`, `'Gato'`, `'Conejo'`, `'Ave'` |
| `activa` | BOOLEAN | DEFAULT true | ¿Visible en selects? |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_catalogo_vacunas_activa`, `idx_catalogo_vacunas_especie`

**Trigger:** `trg_catalogo_vacunas_actualizar` — Actualiza `fecha_actualizacion` automáticamente en cada UPDATE.

**Seed data (10 registros):**

| id | nombre | intervalo | especie | activa |
|---|---|---|---|---|
| `cv_001` | Antirrábica | 365 días | all | ✅ |
| `cv_002` | Múltiple Canina (DA2PP) | 365 días | Perro | ✅ |
| `cv_003` | Triple Felina | 365 días | Gato | ✅ |
| `cv_004` | Primera Dosis Cachorro | 45 días | Perro | ✅ |
| `cv_005` | Leishmaniasis | 365 días | Perro | ✅ |
| `cv_006` | Bordetella | 180 días | Perro | ✅ |
| `cv_007` | Leptospirosis | 365 días | Perro | ✅ |
| `cv_008` | Cuádruple Felina | 365 días | Gato | ✅ |
| `cv_009` | Clamidia Felina | 365 días | Gato | ✅ |
| `cv_010` | Vacuna contra la rabia (Gato) | 365 días | Gato | ✅ |

---

### 24. `catalogo_desparasitacion` — Catálogo configurable de desparasitación

**Descripción:** Catálogo dinámico de productos de desparasitación. Permite agregar/editar/eliminar productos desde la UI. Las desparasitaciones registradas usan `proxima_dosis` calculada desde el `intervalo_meses` del catálogo.

| Columna | Tipo | Restricciones | Descripción |
|---------|------|--------------|-------------|
| `id` | VARCHAR(20) | PK | ID único (ej: `cd_001`) |
| `nombre` | VARCHAR(100) | UNIQUE, NOT NULL | Nombre del producto |
| `intervalo_meses` | INTEGER | NOT NULL, CHECK > 0 | Meses entre desparasitación |
| `via` | VARCHAR(20) | NOT NULL, CHECK | `'Oral'`, `'Subcutánea'`, `'Tópica'`, `'Inyectable'` |
| `activa` | BOOLEAN | DEFAULT true | ¿Visible en selects? |
| `fecha_creacion` | TIMESTAMPTZ | DEFAULT NOW() | Fecha de creación |
| `fecha_actualizacion` | TIMESTAMPTZ | DEFAULT NOW() | Última actualización |

**Índices:** `idx_catalogo_desparasitacion_activa`

**Trigger:** `trg_catalogo_desparasitacion_actualizar` — Actualiza `fecha_actualizacion` automáticamente en cada UPDATE.

**Seed data (8 registros):**

| id | nombre | intervalo | vía | activa |
|---|---|---|---|---|
| `cd_001` | Praziquantel + Febantel | 3 meses | Oral | ✅ |
| `cd_002` | Ivermectina 0.1% | 1 mes | Subcutánea | ✅ |
| `cd_003` | Milbemicina Oxima | 3 meses | Oral | ✅ |
| `cd_004` | Emodepsida + Praziquantel (tópico) | 1 mes | Tópica | ✅ |
| `cd_005` | Selamectina (Revolution) | 1 mes | Tópica | ✅ |
| `cd_006` | Milbemicina | 3 meses | Oral | ✅ |
| `cd_007` | Morantel | 2 meses | Oral | ✅ |
| `cd_008` | Mirataz + Praziquantel | 1 mes | Oral | ✅ |

---

## 🔑 Sistema de Autenticación

### Flujo de login

1. **Login:** `POST /api/auth/login` con `{ email, password }`
2. **Respuesta:** `{ data: { token, user } }` donde `token` es JWT de acceso (24h)
3. **Refresh:** `POST /api/auth/refresh` con refresh token (7d)
4. **Usuario actual:** `GET /api/auth/me` con cabecera `Authorization: Bearer <token>`

### Middleware de autenticación (`auth.middleware.js`)

- Verifica cabecera `Authorization: Bearer <token>`
- Decodifica JWT con `process.env.JWT_SECRET`
- Maneja errores: `TOKEN_EXPIRED`, `INVALID_TOKEN`
- Adjunta `req.user` con `{ id, nombre, email, rol, veterinario_id }`

### Middleware de roles (`roles.middleware.js`)

- Recibe array de roles permitidos: `rolesMiddleware(['admin', 'veterinario'])`
- Verifica `req.user.rol` está en la lista
- Retorna 403 con mensaje descriptivo si no tiene permiso

### Permisos por rol

| Recurso | admin | veterinario | recepcionista |
|---------|-------|-------------|---------------|
| Dashboard | ✅ | ✅ | ✅ |
| Calendario | ✅ | ✅ | ✅ |
| Citas | ✅ | ✅ | ✅ |
| Clientes | ✅ | ✅ | ✅ |
| Mascotas | ✅ | ✅ | ✅ |
| **Casos clínicos** | ✅ | ✅ | ❌ |
| Vacunas | ✅ | ✅ | ✅ |
| **Tratamientos** | ✅ | ✅ | ❌ |
| **Desparasitaciones** | ✅ | ✅ | ❌ |
| **Cirugías** | ✅ | ✅ | ❌ |
| **Exámenes** | ✅ | ✅ | ❌ |
| **Hospitalización** | ✅ | ✅ | ❌ |
| **Puntuaciones** | ✅ | ✅ | ✅ |
| **Catálogos** | ✅ | ✅ | ❌ |
| Campañas | ✅ | ✅ | ✅ |
| **Auditoría** | ✅ | ❌ | ❌ |
| **Horarios** | ✅ | ✅ | ❌ |
| **Plantillas** | ✅ | ✅ | ❌ |
| Agendar (público) | ✅ | ✅ | ✅ |
| Puntuar (público) | ✅ | ✅ | ✅ |

---

## 📡 Documentación completa de la API

### Convención de respuestas

**Éxito:**
```json
{
  "data": { ... },
  "meta": { "page": 1, "limit": 20, "total": 150 }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensaje descriptivo"
  }
}
```

**Códigos de error:** `UNAUTHORIZED`, `TOKEN_EXPIRED`, `INVALID_TOKEN`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `SERVER_ERROR`

---

### 2.1 Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login con email/password |
| POST | `/api/auth/refresh` | No | Refresh token |
| GET | `/api/auth/me` | Sí | Usuario actual |

**Request login:**
```json
{ "email": "veterinario@nanivet.com", "password": "nanivet123" }
```

**Response:**
```json
{
  "data": {
    "token": "eyJ...",
    "user": {
      "id": "usr_001",
      "nombre": "Dra. Nicole Pérez",
      "email": "veterinario@nanivet.com",
      "rol": "veterinario",
      "veterinario_id": "vet_001"
    }
  }
}
```

---

### 2.2 Veterinarios

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/veterinarios` | Sí | Listar todos |
| GET | `/api/veterinarios/:id` | Sí | Obtener uno |
| GET | `/api/veterinarios/:id/bloqueos` | Sí | Bloqueos de un veterinario |
| POST | `/api/veterinarios/:id/bloqueos` | Sí | Crear bloqueo |
| DELETE | `/api/veterinarios/bloqueos/:bloqueoId` | Sí | Eliminar bloqueo |

---

### 2.3 Clientes

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/clientes` | Sí | Listar (filtros: `q`, `pagina`) |
| GET | `/api/clientes/:id` | Sí | Obtener uno |
| POST | `/api/clientes` | Sí | Crear (requiere `consentimiento_datos=true`) |
| PUT | `/api/clientes/:id` | Sí | Actualizar |
| DELETE | `/api/clientes/:id` | Sí | Eliminar (solo sin mascotas) |
| POST | `/api/clientes/:id/revocar-consentimiento` | Sí | Revocar consentimiento |
| GET | `/api/clientes/buscar?q=` | Sí | Búsqueda por nombre/cédula/tel |

---

### 2.4 Mascotas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/mascotas` | Sí | Listar (filtros: `clienteId`, `especie`) |
| GET | `/api/mascotas/:id` | Sí | Obtener (con datos del dueño) |
| POST | `/api/mascotas` | Sí | Crear |
| PUT | `/api/mascotas/:id` | Sí | Actualizar |
| DELETE | `/api/mascotas/:id` | Sí | Eliminar |
| GET | `/api/mascotas/buscar?q=` | Sí | Búsqueda por nombre/especie |

---

### 2.5 Citas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/citas` | Sí | Listar (filtros: `fecha`, `veterinarioId`, `estado`) |
| GET | `/api/citas/:id` | Sí | Obtener una |
| GET | `/api/citas/token/:token` | No | Obtener por token (público) |
| POST | `/api/citas` | Sí | Crear (genera token) |
| PUT | `/api/citas/:id` | Sí | Actualizar |
| DELETE | `/api/citas/:id` | Sí | Eliminar |
| POST | `/api/citas/token/:token/confirmar` | No | Confirmar (público) |
| POST | `/api/citas/token/:token/cancelar` | No | Cancelar (público, con motivo) |
| POST | `/api/citas/token/:token/reprogramar` | No | Reprogramar (público) |
| GET | `/api/citas/veterinario/:vetId/slots?fecha=` | No | Slots ocupados |

---

### 2.6 Casos Clínicos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/casos` | admin/vet | Listar (filtros: `mascotaId`, `estado`) |
| GET | `/api/casos/:id` | admin/vet | Obtener uno |
| POST | `/api/casos` | admin/vet | Crear (requiere `mascotaId`) |
| PUT | `/api/casos/:id` | admin/vet | Actualizar (incluye SOAP) |
| DELETE | `/api/casos/:id` | admin/vet | Eliminar |

---

### 2.7 Vacunas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/vacunas` | Sí | Listar (filtros: `mascotaId`, `casoId`, `porVencer`) |
| POST | `/api/vacunas` | admin/vet | Crear |
| DELETE | `/api/vacunas/:id` | admin/vet | Eliminar |

**Query param `porVencer=dias`:** vacunas cuya `proximaDosis` está entre hoy y hoy+dias

---

### 2.8 Tratamientos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/tratamientos` | Sí | Listar (filtros: `mascotaId`, `casoId`) |
| POST | `/api/tratamientos` | admin/vet | Crear |
| DELETE | `/api/tratamientos/:id` | admin/vet | Eliminar |

---

### 2.9 Desparasitaciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/desparasitaciones` | Sí | Listar (filtros: `mascotaId`, `casoId`) |
| POST | `/api/desparasitaciones` | admin/vet | Crear |
| DELETE | `/api/desparasitaciones/:id` | admin/vet | Eliminar |

---

### 2.10 Cirugías

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/cirugias` | Sí | Listar (filtros: `mascotaId`, `casoId`) |
| POST | `/api/cirugias` | admin/vet | Crear |
| DELETE | `/api/cirugias/:id` | admin/vet | Eliminar |

---

### 2.11 Exámenes/Adjuntos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/examenes` | Sí | Listar (filtros: `mascotaId`, `casoId`) |
| POST | `/api/examenes` | admin/vet | Crear (con archivo) |
| DELETE | `/api/examenes/:id` | admin/vet | Eliminar |
| GET | `/api/examenes/:id/archivo` | Sí | Descargar archivo |

---

### 2.12 Peso

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/mascotas/:id/pesos` | Sí | Historial de peso |
| POST | `/api/mascotas/:id/pesos` | admin/vet | Registrar peso |

---

### 2.13 Puntuaciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/puntuaciones` | admin/vet/rec | Listar (filtro: `veterinarioId`) |
| GET | `/api/puntuaciones/stats` | admin/vet/rec | Estadísticas |
| GET | `/api/puntuaciones/token/:token` | No | Obtener por token (público) |
| POST | `/api/puntuaciones/token/:token/responder` | No | Responder puntuación (público) |

**Response de stats:**
```json
{
  "data": {
    "promedio": 4.1,
    "total": 8,
    "recomienda": 87.5,
    "porVeterinario": [
      { "veterinarioId": "vet_001", "nombre": "Dra. Nicole Pérez", "promedio": 4.5, "total": 4 }
    ],
    "comentarios": [...]
  }
}
```

---

### 2.14 Hospitalización

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/hospitalizaciones` | admin/vet | Listar (filtros: `estado`, `mascotaId`) |
| GET | `/api/hospitalizaciones/:id` | admin/vet | Obtener (con medicaciones y evoluciones) |
| POST | `/api/hospitalizaciones` | admin/vet | Crear |
| PUT | `/api/hospitalizaciones/:id/alta` | admin/vet | Dar alta |
| PUT | `/api/hospitalizaciones/:id` | admin/vet | Actualizar |

---

### 2.15 Medicación Hospitalización

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/hospitalizaciones/:id/medicaciones` | admin/vet | Listar medicaciones |
| POST | `/api/hospitalizaciones/:id/medicaciones` | admin/vet | Crear medicación |
| PUT | `/api/medicaciones/:id/tomas/:tomaId/administrar` | admin/vet | Marcar toma como administrada |

---

### 2.16 Evoluciones Hospitalización

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/hospitalizaciones/:id/evoluciones` | admin/vet | Listar evoluciones |
| POST | `/api/hospitalizaciones/:id/evoluciones` | admin/vet | Crear evolución |

---

### 2.17 Auditoría

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/auditoria` | admin | Listar (filtros: `usuario`, `accion`, `entidad`, `desde`, `hasta`, `pagina`) |
| GET | `/api/auditoria/entidad/:entidad/:entidadId` | admin | Historial de una entidad |

---

### 2.18 Campañas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/campanas/segmentos` | admin/vet/recep | Obtener segmentos calculados |
| GET | `/api/campanas/envios` | admin/vet/recep | Listar envíos (filtro: `segmento`) |

---

### 2.19 Plantillas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/plantillas` | admin/vet | Listar (filtros: `tipo`, `categoria`) |
| GET | `/api/plantillas/:id` | admin/vet | Obtener una |
| POST | `/api/plantillas` | admin/vet | Crear |
| PUT | `/api/plantillas/:id` | admin/vet | Actualizar |
| DELETE | `/api/plantillas/:id` | admin | Eliminar |

---

### 2.20 IA Veterinaria (Mock)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/ia/resumir-historia` | admin/vet | Resumir historia clínica |
| POST | `/api/ia/notas-a-soap` | admin/vet | Convertir notas a SOAP |
| POST | `/api/ia/redactar-mensaje` | admin/vet | Redactar mensaje para dueño |
| POST | `/api/ia/diferenciales` | admin/vet | Diagnósticos diferenciales |

Todos devuelven respuestas simuladas con delay de 1-2 segundos. Siempre incluyen el disclaimer:
> *"Sugerencia generada por IA como apoyo. No reemplaza el criterio clínico del veterinario."*

---

### 2.21 Catálogo de Vacunas (Configurable)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/catalogo/vacunas` | Sí | Listar todas las vacunas del catálogo |
| GET | `/api/catalogo/vacunas/activas` | Sí | Solo vacunas activas |
| GET | `/api/catalogo/vacunas/:id` | Sí | Obtener una vacuna del catálogo |
| POST | `/api/catalogo/vacunas` | admin/vet | Crear nueva vacuna |
| PUT | `/api/catalogo/vacunas/:id` | admin/vet | Actualizar vacuna |
| DELETE | `/api/catalogo/vacunas/:id` | admin/vet | Eliminar vacuna |

**Body de creación/actualización:**
```json
{
  "nombre": "Antirrábica",
  "intervaloDias": 365,
  "especie": "all",
  "activa": true
}
```

**Campos:**
- `nombre`: Nombre único de la vacuna (requerido)
- `intervaloDias`: Días entre dosis, debe ser > 0 (requerido)
- `especie`: `'all'`, `'Perro'`, `'Gato'`, `'Conejo'`, `'Ave'` (default: `'all'`)
- `activa`: Booleano para activar/desactivar sin eliminar (default: `true`)

---

### 2.22 Catálogo de Desparasitación (Configurable)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/catalogo/desparasitacion` | Sí | Listar todos los productos del catálogo |
| GET | `/api/catalogo/desparasitacion/activos` | Sí | Solo productos activos |
| GET | `/api/catalogo/desparasitacion/:id` | Sí | Obtener un producto del catálogo |
| POST | `/api/catalogo/desparasitacion` | admin/vet | Crear nuevo producto |
| PUT | `/api/catalogo/desparasitacion/:id` | admin/vet | Actualizar producto |
| DELETE | `/api/catalogo/desparasitacion/:id` | admin/vet | Eliminar producto |

**Body de creación/actualización:**
```json
{
  "nombre": "Praziquantel + Febantel",
  "intervaloMeses": 3,
  "via": "Oral",
  "activa": true
}
```

**Campos:**
- `nombre`: Nombre único del producto (requerido)
- `intervaloMeses`: Meses entre desparasitación, debe ser > 0 (requerido)
- `via`: `'Oral'`, `'Subcutánea'`, `'Tópica'`, `'Inyectable'` (requerido)
- `activa`: Booleano para activar/desactivar sin eliminar (default: `true`)

---

## 🔧 Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia en modo desarrollo con nodemon |
| `npm start` | Inicia en modo producción |
| `npm run migrate` | Ejecuta todas las migraciones SQL |
| `npm run seed` | Carga los datos de prueba |
| `npm run seed --overwrite` | Sobrescribe datos existentes |
| `npm run migrate:down` | Revierte la última migración |
| `npm run db:setup` | Ejecuta `migrate` + `seed` en secuencia |

---

## 🏗️ Arquitectura del middleware de auditoría

Todo endpoint que haga CREATE, UPDATE o DELETE pasa automáticamente por `auditMiddleware`:

1. **Captura valores antes** (para PUT/DELETE, el body son los valores nuevos, los anteriores se obtenían de la BD)
2. **Ejecuta la operación** del controller
3. **Calcula diff** campo por campo entre antes/después
4. **Inserta en `auditoria`** con:
   - `usuario`: nombre del usuario autenticado
   - `rol`: rol del usuario
   - `accion`: 'crear', 'editar', 'eliminar'
   - `entidad`: nombre de la entidad
   - `entidad_id`: ID del registro
   - `valores_anteriores`: JSONB snapshot
   - `valores_nuevos`: JSONB snapshot
   - `diff_campos`: JSONB array de `{ campo, antes, despues }`
   - `ip_address`: IP del solicitante
   - `user_agent`: User-Agent

---

## 📊 Queries importantes

### Ficha clínica completa de mascota
```sql
SELECT
  m.*,
  c.nombre AS cliente_nombre,
  c.apellido AS cliente_apellido,
  c.telefono AS cliente_telefono,
  c.email AS cliente_email,
  (SELECT json_agg(json_build_object('tipo', a.tipo, 'descripcion', a.descripcion))
   FROM alertas_mascotas a
   WHERE a.mascota_id = m.id AND a.activa = true
  ) AS alertas,
  (SELECT json_agg(json_build_object('id', cc.id, 'motivo', cc.motivo, 'diagnostico', cc.diagnostico, 'estado', cc.estado, 'fecha', cc.fecha_hora_inicio)
    ORDER BY cc.fecha_hora_inicio DESC LIMIT 5
   )
   FROM casos_clinicos cc
   WHERE cc.mascota_id = m.id
  ) AS casos_clinicos,
  (SELECT json_agg(json_build_object('nombre', v.nombre, 'proxima_dosis', v.proxima_dosis)
    WHERE v.proxima_dosis <= CURRENT_DATE + INTERVAL '15 days'
   )
   FROM vacunas v
   WHERE v.mascota_id = m.id
  ) AS vacunas_pendientes,
  (SELECT json_agg(json_build_object('fecha', p.fecha, 'peso', p.peso_kg)
    ORDER BY p.fecha
   )
   FROM registros_peso p
   WHERE p.mascota_id = m.id
  ) AS pesos
FROM mascotas m
LEFT JOIN clientes c ON m.cliente_id = c.id
WHERE m.id = $1;
```

### Citas de hoy por veterinario
```sql
SELECT
  ci.*,
  mas.nombre AS mascota_nombre,
  mas.especie AS mascota_especie,
  v.nombre AS veterinario_nombre,
  cli.nombre AS cliente_nombre,
  cli.apellido AS cliente_apellido,
  cli.telefono AS cliente_telefono
FROM citas ci
JOIN mascotas mas ON ci.mascota_id = mas.id
JOIN veterinarios v ON ci.veterinario_id = v.id
JOIN clientes cli ON mas.cliente_id = cli.id
WHERE ci.veterinario_id = $1
  AND ci.fecha_hora::date = CURRENT_DATE
  AND ci.estado != 'cancelada'
ORDER BY ci.fecha_hora;
```

### Vacunas por vencer
```sql
SELECT
  v.*,
  mas.nombre AS mascota_nombre,
  cli.nombre AS cliente_nombre,
  cli.apellido AS cliente_apellido,
  cli.telefono AS cliente_telefono,
  cli.consentimiento_comunicaciones
FROM vacunas v
JOIN mascotas mas ON v.mascota_id = mas.id
JOIN clientes cli ON mas.cliente_id = cli.id
WHERE v.proxima_dosis <= CURRENT_DATE + INTERVAL '15 days'
  AND cli.consentimiento_comunicaciones = true
ORDER BY v.proxima_dosis;
```

### Dashboard general
```sql
-- Citas de hoy
SELECT COUNT(*) FROM citas
WHERE fecha_hora::date = CURRENT_DATE AND estado != 'cancelada';

-- Vacunas por vencer
SELECT COUNT(*) FROM vacunas
WHERE proxima_dosis <= CURRENT_DATE + INTERVAL '15 days';

-- Casos abiertos
SELECT COUNT(*) FROM casos_clinicos WHERE estado = 'abierto';

-- Hospitalizados actuales
SELECT COUNT(*) FROM hospitalizaciones WHERE estado = 'hospitalizado';

-- Última calificación
SELECT calificacion, fecha_respuesta FROM puntuaciones
WHERE respondida = true
ORDER BY fecha_respuesta DESC LIMIT 1;
```

### Slots ocupados de un veterinario en un día
```sql
SELECT
  TO_CHAR(fecha_hora, 'HH24:MI') AS hora
FROM citas
WHERE veterinario_id = $1
  AND fecha_hora::date = $2::date
  AND estado != 'cancelada'
ORDER BY fecha_hora;
```

---

## 🌐 Conectar con el Frontend

El frontend NANIVET (Next.js) consume esta API reemplazando la capa de repositorios mock (`lib/repositories.ts`) por un adaptador HTTP.

### Configuración del frontend

1. Asegurar que el backend esté corriendo en `http://localhost:3001`
2. El frontend está en `http://localhost:3000`
3. Configurar `CORS_ORIGIN` en `.env` del backend:
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

### Patrón de integración

El frontend usa un patrón de repositorio:

```typescript
// Antes (mock)
import { citaRepository } from '@/lib/repositories';

// Después (HTTP adapter)
import { HttpCitaRepository } from '@/lib/http-repositories';

const citaRepository = new HttpCitaRepository('http://localhost:3001/api/citas');
```

### Endpoints públicos (sin auth)

Estos endpoints se usan directamente desde el frontend sin necesidad de token:
- `GET /api/citas/token/:token` — Ver cita pública
- `POST /api/citas/token/:token/confirmar` — Confirmar cita
- `POST /api/citas/token/:token/cancelar` — Cancelar cita
- `POST /api/citas/token/:token/reprogramar` — Reprogramar cita
- `GET /api/citas/veterinario/:vetId/slots?fecha=` — Slots disponibles
- `GET /api/puntuaciones/token/:token` — Ver puntuación
- `POST /api/puntuaciones/token/:token/responder` — Responder puntuación

---

## 📝 Notas importantes

1. **Zona horaria:** Todo usa `America/Guayaquil` (UTC-5). PostgreSQL almacena con `TIMESTAMPTZ` y convierte al insertar/consultar.

2. **Integridad referencial:**
   - No eliminar cliente con mascotas (`ON DELETE RESTRICT`)
   - No eliminar mascota con citas/casos (`ON DELETE RESTRICT`)
   - No eliminar mascota si tiene registros de peso/vacunas/etc.
   - Medicaciones y tomas se eliminan con CASCADE al eliminar hospitalización

3. **Tokens:** Generados automáticamente con `utils/genToken.js` — 16 caracteres alfanuméricos.

4. **IDs:** Generados con `utils/genId.js` — formato `entidad_ddd` (ej: `cli_001`, `mas_020`, `cit_030`).

5. **WhatsApp:** Números se normalizan de `09XXXXXXXX` a `+5939XXXXXXXX`. Enlace: `https://wa.me/5939XXXXXXXX?text=mensaje`

6. **Variables de plantilla:** `{{dueno}}`, `{{mascota}}`, `{{fecha}}`, `{{hora}}`, `{{servicio}}`, `{{motivo}}`

7. **Paginación:** Todos los endpoints de lista soportan `?page=1&limit=20`

8. **Seed data:** Los scripts son re-runnable con `ON CONFLICT DO NOTHING` o `ON CONFLICT DO UPDATE`.

9. **IA Mock:** Las respuestas son realistas basadas en datos de la mascota, siempre con el disclaimer clínico.

---

## 📄 Licencia

MIT

---

## 👥 Equipo

**NANIVET** — Sistema de Gestión Veterinaria

---

## 📞 Soporte

Para reportar issues o sugerencias, abrir un issue en el repositorio.

### Clientes

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/clientes` | Sí | Listar (q, pagina) |
| GET | `/api/clientes/:id` | Sí | Obtener uno |
| POST | `/api/clientes` | Sí | Crear |
| PUT | `/api/clientes/:id` | Sí | Actualizar |
| DELETE | `/api/clientes/:id` | Sí | Eliminar |
| POST | `/api/clientes/:id/revocar-consentimiento` | Sí | Revocar consentimiento |
| GET | `/api/clientes/buscar?q=` | Sí | Búsqueda |

### Mascotas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/mascotas` | Sí | Listar (clienteId, especie) |
| GET | `/api/mascotas/:id` | Sí | Obtener (con dueño) |
| POST | `/api/mascotas` | Sí | Crear |
| PUT | `/api/mascotas/:id` | Sí | Actualizar |
| DELETE | `/api/mascotas/:id` | Sí | Eliminar |
| GET | `/api/mascotas/:id/pesos` | Sí | Historial de peso |
| POST | `/api/mascotas/:id/pesos` | Sí | Registrar peso |

### Citas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/citas` | Sí | Listar (fecha, veterinarioId, estado) |
| GET | `/api/citas/:id` | Sí | Obtener uno |
| GET | `/api/citas/token/:token` | No | Obtener por token (público) |
| POST | `/api/citas` | Sí | Crear |
| PUT | `/api/citas/:id` | Sí | Actualizar |
| DELETE | `/api/citas/:id` | Sí | Eliminar |
| POST | `/api/citas/token/:token/confirmar` | No | Confirmar (público) |
| POST | `/api/citas/token/:token/cancelar` | No | Cancelar (público) |
| POST | `/api/citas/token/:token/reprogramar` | No | Reprogramar (público) |
| GET | `/api/citas/veterinario/:vetId/slots` | No | Slots ocupados |

### Casos Clínicos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/casos` | admin/vet | Listar (mascotaId, estado) |
| GET | `/api/casos/:id` | admin/vet | Obtener uno |
| POST | `/api/casos` | admin/vet | Crear |
| PUT | `/api/casos/:id` | admin/vet | Actualizar |
| DELETE | `/api/casos/:id` | admin/vet | Eliminar |

### Vacunas, Tratamientos, Desparasitaciones, Cirugías, Exámenes

Endpoints CRUD estándar con filtros por `mascotaId` y `casoId`.

### Hospitalización

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/hospitalizaciones` | admin/vet | Listar (estado, mascotaId) |
| GET | `/api/hospitalizaciones/:id` | admin/vet | Obtener (con medicaciones) |
| POST | `/api/hospitalizaciones` | admin/vet | Crear |
| PUT | `/api/hospitalizaciones/:id/alta` | admin/vet | Dar alta |

### Puntuaciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/puntuaciones` | admin/vet/rec | Listar (veterinarioId) |
| GET | `/api/puntuaciones/stats` | admin/vet/rec | Estadísticas |
| GET | `/api/puntuaciones/token/:token` | No | Obtener por token |
| POST | `/api/puntuaciones/token/:token/responder` | No | Responder |

### Campañas

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/campanas/segmentos` | admin/vet/rec | Segmentos calculados |
| GET | `/api/campanas/envios` | admin/vet/rec | Listar envíos |

### IA Veterinaria (Mock)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/ia/resumir-historia` | admin/vet | Resumir historia clínica |
| POST | `/api/ia/notas-a-soap` | admin/vet | Convertir notas a SOAP |
| POST | `/api/ia/redactar-mensaje` | admin/vet | Redactar mensaje |
| POST | `/api/ia/diferenciales` | admin/vet | Diagnósticos diferenciales |

### Auditoría (Solo Admin)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/auditoria` | admin | Listar (usuario, accion, entidad) |
| GET | `/api/auditoria/entidad/:entidad/:id` | admin | Historial de entidad |

## 🔐 Permisos por rol

| Recurso | admin | veterinario | recepcionista |
|---------|-------|-------------|---------------|
| Dashboard | ✅ | ✅ | ✅ |
| Calendario/Citas | ✅ | ✅ | ✅ |
| Clientes/Mascotas | ✅ | ✅ | ✅ |
| Casos clínicos | ✅ | ✅ | ❌ |
| Tratamientos | ✅ | ✅ | ❌ |
| Hospitalización | ✅ | ✅ | ❌ |
| Auditoría | ✅ | ❌ | ❌ |

## 📝 Formato de respuesta

### Éxito

```json
{
  "data": { ... },
  "meta": {
    "pagina": 1,
    "limit": 20,
    "total": 100
  }
}
```

### Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Mensaje descriptivo"
  }
}
```

## ⚙️ Reglas de negocio implementadas

1. **Consentimiento de datos:** Obligatorio para crear cliente (Ley de Protección de Datos de Ecuador)
2. **Integridad referencial:** No eliminar cliente con mascotas (RESTRICT)
3. **Citas:**
   - Solo cancelar/reprogramar con >12 horas de anticipación
   - No modificar citas atendidas
   - Generación automática de token para enlaces públicos
4. **Hospitalización automática:** Al crear cita de cirugía confirmada/atendida
5. **Zona horaria:** Todas las fechas en `America/Guayaquil` (UTC-5)
6. **Auditoría:** Todas las operaciones CRUD se registran automáticamente
7. **Tokens públicos:** Para citas y encuestas (16 caracteres alfanuméricos)

## 🧪 Ejecución

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

### Health Check

```bash
curl http://localhost:3001/api/health
```

## 📦 Scripts npm

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Ejecutar en modo desarrollo (nodemon) |
| `npm start` | Ejecutar en producción |
| `npm run migrate` | Ejecutar migraciones pendientes |
| `npm run seed` | Cargar datos de prueba |
| `npm run seed --overwrite` | Sobrescribir datos existentes |
| `npm run migrate:down` | Revertir todas las migraciones |
| `npm run db:setup` | Migrar + Seed completo |

## 🔗 Conexión con frontend

El frontend NANIVET debe consumir esta API reemplazando la capa de repositorios mock por un `HttpAdapter` que llame a los endpoints expuestos.

**Base URL:** `http://localhost:3001/api` (desarrollo)

**Autenticación:** Incluir cabecera `Authorization: Bearer <token>` en todas las peticiones protegidas.

## 📄 Licencia

MIT
