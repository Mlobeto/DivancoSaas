# DivancoSaaS

<div align="center">

**SaaS de gestión modular multitenant para múltiples rubros de negocio**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev/)

</div>

---

## 📋 Documentación Prioritaria

### ⚠️ **LECTURA OBLIGATORIA ANTES DE EMPEZAR**

1. **[ARQUITECTURA.md](./ARQUITECTURA.md)** 🔴 **PRIORIDAD MÁXIMA**
   - Principios no negociables del sistema
   - Este es el documento MAESTRO - consultarlo SIEMPRE

2. **[QUICKSTART.md](./QUICKSTART.md)**
   - Guía paso a paso para iniciar el proyecto
   - Instalación, configuración y primeros pasos

3. **[PROJECT_STATUS.md](./PROJECT_STATUS.md)**
   - Estado actual del proyecto
   - Qué está implementado y qué falta

4. **[docs/ADR.md](./docs/ADR.md)**
   - Decisiones arquitectónicas (por qué se hizo así)

5. **[docs/DIAGRAMS.md](./docs/DIAGRAMS.md)**
   - Diagramas visuales de arquitectura

---

## 🏗️ Estructura del Proyecto

```
DivancoSaas/
├── 📄 ARQUITECTURA.md          # ⚠️ DOCUMENTO MAESTRO
├── 📄 QUICKSTART.md            # Guía de inicio
├── 📄 PROJECT_STATUS.md        # Estado del proyecto
│
├── 📁 backend/                 # API Node.js + PostgreSQL
│   ├── prisma/
│   │   └── schema.prisma       # Schema multitenant completo
│   ├── src/
│   │   ├── core/               # Lógica transversal (auth, RBAC, etc.)
│   │   ├── modules/            # Módulos de negocio independientes
│   │   ├── adapters/           # Integraciones externas
│   │   └── config/             # Configuración
│   └── package.json
│
├── 📁 web/                     # Aplicación web React
│   ├── src/
│   │   ├── pages/              # Páginas (Login, Dashboard, etc.)
│   │   ├── services/           # API calls
│   │   ├── store/              # Estado (Zustand)
│   │   └── lib/                # Utilidades
│   └── package.json
│
├── 📁 mobile/                  # App móvil Expo/React Native
│   ├── app/                    # Screens (Expo Router)
│   └── package.json
│
├── 📁 shared/                  # Tipos y contratos compartidos
│   └── src/
│       └── index.ts            # Tipos TypeScript compartidos
│
└── 📁 docs/                    # Documentación adicional
    ├── ADR.md                  # Decisiones arquitectónicas
    └── DIAGRAMS.md             # Diagramas visuales
```

---

## 🚀 Quick Start

### 1️⃣ Backend (API)

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tu configuración de PostgreSQL
npm run prisma:migrate
npm run dev
```

✅ **Backend corriendo en**: `http://localhost:3000`

### 2️⃣ Web (Frontend)

```bash
cd web
npm install
npm run dev
```

✅ **Web corriendo en**: `http://localhost:5173`

### 3️⃣ Mobile (Opcional)

```bash
cd mobile
npm install
npm start
```

✅ **Escanear QR** con Expo Go o presionar `w` para web

### 🎯 Primer uso

1. Ir a `http://localhost:5173/register`
2. Crear un nuevo tenant (empresa)
3. Hacer login
4. Explorar el dashboard

📖 **Más detalles**: Ver [QUICKSTART.md](./QUICKSTART.md)

---

## 🔑 Conceptos Clave

### Jerarquía del Sistema

```
Platform (SaaS)
└── Tenant (Cliente: "Empresa XYZ")
    └── Business Unit (Rubro: "Construcción")
        └── Modules (Activados: Projects, HR, Machinery)
            └── Data (Aislada por BU)
```

### Definiciones

- **Tenant**: Cliente del SaaS (una empresa/organización)
- **Business Unit**: Rubro de negocio dentro de un tenant
  - Ejemplo: "Construcción", "Inmobiliaria", "Ganadería"
  - Los datos NO se mezclan entre Business Units
- **Module**: Funcionalidad activable por Business Unit
  - Ejemplos: Projects, Sales, Livestock, Logistics
- **Workflow**: Estados y transiciones configurables por módulo
  - NO hardcodeados, se configuran por Business Unit

---

## 📖 Stack Tecnológico

### Backend

- **Runtime**: Node.js 18+ con TypeScript
- **Framework**: Express
- **Base de Datos**: PostgreSQL 14+
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Validación**: Zod

### Web

- **Framework**: React 18 con TypeScript
- **Build Tool**: Vite
- **Estado Remoto**: TanStack Query
- **Estado Local**: Zustand
- **Estilos**: Tailwind CSS
- **Routing**: React Router

### Mobile

- **Framework**: React Native con Expo
- **Routing**: Expo Router
- **Offline**: SQLite + AsyncStorage
- **Sync**: Queue + Conflict resolution

### Shared

- **Tipos**: TypeScript (compartidos entre backend, web, mobile)

---

## ⚙️ Características Principales

### ✅ Core (Ya implementado)

- ✅ **Multitenant** con aislamiento total de datos
- ✅ **Business Units** para múltiples rubros por tenant
- ✅ **Autenticación JWT** con roles y permisos
- ✅ **RBAC dinámico** (no hardcodeado)
- ✅ **Motor de módulos** activables por BU
- ✅ **Workflows configurables** (estados + transiciones)
- ✅ **Auditoría automática** de todas las acciones
- ✅ **Billing del SaaS** (suscripciones)
- ✅ **API REST** con validación
- ✅ **Frontend responsive** con tema profesional
- ✅ **Mobile app** con preparación para offline

### 🔌 Integraciones (Preparadas mediante Adapters)

Los **contracts** (interfaces) ya están definidos para:

- Payment Providers (Stripe, MercadoPago, etc.)
- Storage Providers (S3, Cloudinary, etc.)
- Email Providers (SendGrid, SMTP, etc.)
- Invoice Providers (Facturación electrónica)
- Shipping Providers (FedEx, DHL, etc.)

Ver: `backend/src/core/contracts/providers.contract.ts`

---

## 📦 Módulos

### Ejemplo Incluido: Projects

Ubicación: `backend/src/modules/projects/`

Implementa:

- ✅ `ModuleContract`
- ✅ Permisos requeridos
- ✅ Workflow por defecto
- ✅ Rutas del módulo

### Crear un Nuevo Módulo

Ver documentación: `backend/src/modules/README.md`

---

## ⚠️ Reglas No Negociables

### ❌ LO QUE NUNCA DEBES HACER

1. **NO mezclar datos entre tenants**
   - Siempre filtrar por `tenantId`

2. **NO mezclar datos entre Business Units**
   - Siempre filtrar por `businessUnitId`

3. **NO hardcodear estados, roles o flujos**
   - Usar workflows configurables

4. **NO acoplar frontend a módulos específicos**
   - UI debe ser genérica y basada en configuración

5. **NO meter lógica de rubro en el core**
   - Si es específico de un rubro → va en un módulo

### ✅ LO QUE SIEMPRE DEBES HACER

1. **Consultar [ARQUITECTURA.md](./ARQUITECTURA.md)** antes de cambios importantes

2. **Aislar por tenant y Business Unit** en todas las queries

3. **Usar contracts (interfaces)** para integraciones externas

4. **Implementar `ModuleContract`** para nuevos módulos

5. **Mantener el core genérico** y transversal

---

## 🧪 Testing (Pendiente)

Frameworks recomendados:

- **Backend**: Jest + Supertest
- **Web**: Vitest + React Testing Library
- **Mobile**: Jest + React Native Testing Library
- **E2E**: Playwright

---

## 🚀 Deployment

### Backend

- Azure App Service (Docker + ACR)
- AWS ECS / DigitalOcean
- Vercel (con Postgres)

### Web

- Vercel
- Netlify
- Cloudflare Pages

### Mobile

- Expo EAS Build
- App Store / Google Play

### Database

- AWS RDS PostgreSQL
- Supabase
- Azure Database for PostgreSQL

---

## 📊 Base de Datos

Schema Prisma multitenant incluye:

- `Tenant` - Clientes del SaaS
- `BusinessUnit` - Rubros de negocio
- `User` - Usuarios con roles por BU
- `Role` + `Permission` - RBAC dinámico
- `Module` + `BusinessUnitModule` - Motor de módulos
- `Workflow` - Workflows configurables
- `PlatformSubscription` - Billing del SaaS
- `AuditLog` - Trazabilidad completa

Ver: `backend/prisma/schema.prisma`

---

## 🎨 Diseño

**Filosofía**: Profesional, sobria, técnica (tipo AutoCAD 2014)

- Paleta oscura
- Sin animaciones innecesarias
- Enfoque en funcionalidad
- UI genérica adaptable a cualquier módulo

---

## 📞 Soporte y Ayuda

1. **Documentación**:
   - [ARQUITECTURA.md](./ARQUITECTURA.md) - Principios
   - [QUICKSTART.md](./QUICKSTART.md) - Inicio rápido
   - [PROJECT_STATUS.md](./PROJECT_STATUS.md) - Estado actual
   - [docs/ADR.md](./docs/ADR.md) - Decisiones
   - [docs/DIAGRAMS.md](./docs/DIAGRAMS.md) - Diagramas

2. **Ejemplos de código**:
   - Módulo: `backend/src/modules/projects/`
   - Adapter: `backend/src/adapters/README.md`
   - Frontend: `web/src/pages/`

3. **READMEs por carpeta**:
   - Cada subcarpeta tiene su README explicativo

---

## 📄 Licencia

UNLICENSED (Privado)

---

## ✅ Estado del Proyecto

✅ **Completamente inicializado y funcional**

Ver detalles: [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

<div align="center">

**⚠️ IMPORTANTE: Este proyecto sigue principios arquitectónicos estrictos.**

**SIEMPRE consultar [ARQUITECTURA.md](./ARQUITECTURA.md) antes de hacer cambios.**

---

**Fecha de inicio**: Enero 2026  
**Versión**: 1.0.0

</div>
