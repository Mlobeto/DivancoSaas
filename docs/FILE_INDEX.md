# 📑 Índice Completo de Archivos - DivancoSaaS

## 📄 Documentación Principal (Raíz)

| Archivo                                        | Descripción                           | Prioridad |
| ---------------------------------------------- | ------------------------------------- | --------- |
| **[ARQUITECTURA.md](./ARQUITECTURA.md)**       | Principios no negociables del sistema | 🔴 MÁXIMA |
| [README.md](./README.md)                       | Introducción al proyecto              | Alta      |
| [QUICKSTART.md](./QUICKSTART.md)               | Guía de inicio rápido                 | Alta      |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md)       | Estado actual del proyecto            | Media     |
| [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) | Resumen ejecutivo                     | Media     |
| [.gitignore](./.gitignore)                     | Archivos ignorados por Git            | -         |

---

## 📁 Backend (Node.js + PostgreSQL)

### Configuración

| Archivo                 | Descripción                  |
| ----------------------- | ---------------------------- |
| `backend/package.json`  | Dependencias y scripts       |
| `backend/tsconfig.json` | Configuración TypeScript     |
| `backend/.env.example`  | Variables de entorno ejemplo |
| `backend/.gitignore`    | Ignorados de Git             |

### Prisma (Base de Datos)

| Archivo                        | Descripción                 |
| ------------------------------ | --------------------------- |
| `backend/prisma/schema.prisma` | Schema completo multitenant |

### Core (Funcionalidad Transversal)

| Archivo                                            | Descripción                                           |
| -------------------------------------------------- | ----------------------------------------------------- |
| **Contracts (Interfaces)**                         |                                                       |
| `backend/src/core/contracts/providers.contract.ts` | PaymentProvider, StorageProvider, EmailProvider, etc. |
| `backend/src/core/contracts/module.contract.ts`    | ModuleContract y ModuleRegistry                       |
| **Types**                                          |                                                       |
| `backend/src/core/types/index.ts`                  | Tipos compartidos del core                            |
| **Middlewares**                                    |                                                       |
| `backend/src/core/middlewares/auth.middleware.ts`  | Autenticación y autorización                          |
| `backend/src/core/middlewares/error.middleware.ts` | Manejo de errores                                     |
| `backend/src/core/middlewares/audit.middleware.ts` | Auditoría automática                                  |
| **Routes**                                         |                                                       |
| `backend/src/core/routes/auth.routes.ts`           | Login, registro, JWT                                  |
| `backend/src/core/routes/tenant.routes.ts`         | Gestión de tenants                                    |
| `backend/src/core/routes/user.routes.ts`           | Gestión de usuarios                                   |
| `backend/src/core/routes/business-unit.routes.ts`  | Gestión de BUs                                        |
| `backend/src/core/routes/module.routes.ts`         | Activar/desactivar módulos                            |
| `backend/src/core/routes/workflow.routes.ts`       | Workflows configurables                               |

### Config

| Archivo                          | Descripción                |
| -------------------------------- | -------------------------- |
| `backend/src/config/database.ts` | Prisma client y middleware |
| `backend/src/config/index.ts`    | Configuración general      |

### Módulos

| Archivo                         | Descripción     |
| ------------------------------- | --------------- |
| `backend/src/modules/README.md` | Guía de módulos |

### Adapters

| Archivo                          | Descripción      |
| -------------------------------- | ---------------- |
| `backend/src/adapters/README.md` | Guía de adapters |

### Entry Points

| Archivo                | Descripción              |
| ---------------------- | ------------------------ |
| `backend/src/app.ts`   | Configuración de Express |
| `backend/src/index.ts` | Entry point del servidor |

---

## 🌐 Frontend Web (React + Vite)

### Configuración

| Archivo                  | Descripción                 |
| ------------------------ | --------------------------- |
| `web/package.json`       | Dependencias React          |
| `web/tsconfig.json`      | TypeScript config           |
| `web/tsconfig.node.json` | TypeScript para Vite        |
| `web/vite.config.ts`     | Configuración Vite          |
| `web/tailwind.config.js` | Tailwind CSS (tema AutoCAD) |
| `web/postcss.config.js`  | PostCSS config              |
| `web/.env.example`       | Variables de entorno        |
| `web/.gitignore`         | Ignorados de Git            |
| `web/index.html`         | HTML principal              |

### Source

| Archivo                            | Descripción                 |
| ---------------------------------- | --------------------------- |
| **Pages**                          |                             |
| `web/src/pages/LoginPage.tsx`      | Página de login             |
| `web/src/pages/RegisterPage.tsx`   | Página de registro          |
| `web/src/pages/DashboardPage.tsx`  | Dashboard principal         |
| **Services**                       |                             |
| `web/src/services/auth.service.ts` | Servicio de autenticación   |
| **Store (Zustand)**                |                             |
| `web/src/store/auth.store.ts`      | Estado de autenticación     |
| `web/src/store/ui.store.ts`        | Estado de UI                |
| **Lib**                            |                             |
| `web/src/lib/api.ts`               | Cliente Axios configurado   |
| **Types**                          |                             |
| `web/src/types/api.types.ts`       | Tipos de API                |
| **Styles**                         |                             |
| `web/src/index.css`                | Estilos globales + Tailwind |
| **Entry**                          |                             |
| `web/src/main.tsx`                 | Entry point React           |

---

## 📱 Mobile (Expo + React Native)

### Configuración

| Archivo                  | Descripción          |
| ------------------------ | -------------------- |
| `mobile/package.json`    | Dependencias Expo    |
| `mobile/app.json`        | Configuración Expo   |
| `mobile/tsconfig.json`   | TypeScript config    |
| `mobile/babel.config.js` | Babel config         |
| `mobile/.env.example`    | Variables de entorno |
| `mobile/.gitignore`      | Ignorados de Git     |

### App (Expo Router)

| Archivo                    | Descripción                  |
| -------------------------- | ---------------------------- |
| `mobile/app/_layout.tsx`   | Layout principal + providers |
| `mobile/app/index.tsx`     | Pantalla inicial             |
| `mobile/app/login.tsx`     | Pantalla de login            |
| `mobile/app/dashboard.tsx` | Dashboard móvil              |

---

## 📘 Shared (Tipos Compartidos)

| Archivo                | Descripción                 |
| ---------------------- | --------------------------- |
| `shared/package.json`  | Package compartido          |
| `shared/tsconfig.json` | TypeScript config           |
| `shared/.gitignore`    | Ignorados de Git            |
| `shared/README.md`     | Documentación               |
| `shared/src/index.ts`  | Todos los tipos compartidos |

---

## 📚 Documentación (docs/)

| Archivo            | Descripción                    |
| ------------------ | ------------------------------ |
| `docs/ADR.md`      | Decisiones arquitectónicas     |
| `docs/DIAGRAMS.md` | Diagramas visuales del sistema |

---

## 🔧 Scripts

| Archivo               | Descripción                          |
| --------------------- | ------------------------------------ |
| `scripts/install.sh`  | Instalación automatizada (Linux/Mac) |
| `scripts/install.bat` | Instalación automatizada (Windows)   |

---

## 🛠️ VSCode

| Archivo                      | Descripción              |
| ---------------------------- | ------------------------ |
| `divancosaas.code-workspace` | Workspace multi-carpeta  |
| `.vscode/settings.json`      | Configuración del editor |
| `.vscode/extensions.json`    | Extensiones recomendadas |

---

## 🎨 Arquitectura Frontend Modular (NEW)

### Product Layer (Infraestructura de Módulos)

| Archivo                                 | Descripción                            |
| --------------------------------------- | -------------------------------------- |
| `web/src/product/types/module.types.ts` | Tipos e interfaces del sistema modular |
| `web/src/product/module-registry.ts`    | Registro central de módulos            |
| `web/src/product/feature-flags.ts`      | Sistema de feature flags por tenant    |
| `web/src/product/navigation-builder.ts` | Constructor dinámico de navegación     |
| `web/src/product/index.ts`              | API pública de la capa de producto     |

### App Layer (Bootstrapping)

| Archivo                                        | Descripción                          |
| ---------------------------------------------- | ------------------------------------ |
| `web/src/app/module-loader/loadModules.ts`     | Carga e inicializa todos los módulos |
| `web/src/app/router/AppRouter.tsx`             | Router dinámico basado en módulos    |
| `web/src/app/navigation/DynamicNavigation.tsx` | Componente de navegación dinámica    |
| `web/src/app/index.ts`                         | API pública de la capa de aplicación |

### Module Definitions (Auto-registro)

| Archivo                               | Descripción                         |
| ------------------------------------- | ----------------------------------- |
| `web/src/modules/rental/module.ts`    | Definición del módulo de alquileres |
| `web/src/modules/inventory/module.ts` | Definición del módulo de inventario |
| `web/src/modules/clients/module.ts`   | Definición del módulo de clientes   |
| `web/src/modules/purchases/module.ts` | Definición del módulo de compras    |

### Documentación de Arquitectura Modular

| Archivo                                         | Descripción                                   | Prioridad |
| ----------------------------------------------- | --------------------------------------------- | --------- |
| `docs/FRONTEND_MODULAR_ARCHITECTURE_SUMMARY.md` | 📘 Resumen ejecutivo de la nueva arquitectura | 🔴 ALTA   |
| `docs/FRONTEND_MIGRATION_GUIDE.md`              | 📖 Guía paso a paso de migración              | 🔴 ALTA   |
| `docs/FRONTEND_MIGRATION_RISKS.md`              | ⚠️ Análisis de riesgos y mitigación           | 🟡 MEDIA  |
| `docs/MODULE_SYSTEM_QUICK_REFERENCE.md`         | 🚀 Referencia rápida para crear módulos       | 🟢 BAJA   |
| `docs/BACKEND_ARCHITECTURE.md`                  | 🏗️ Arquitectura del backend (referencia)      | 🟢 BAJA   |
| `docs/FRONTEND_ARCHITECTURE.md`                 | 🎨 Arquitectura del frontend (referencia)     | 🟢 BAJA   |

---

## 📊 Resumen por Tipo

### Documentación: 16 archivos (+6 nuevos)

- ARQUITECTURA.md (⚠️ PRIORIDAD MÁXIMA)
- README.md
- QUICKSTART.md
- PROJECT_STATUS.md
- EXECUTIVE_SUMMARY.md
- docs/ADR.md
- docs/DIAGRAMS.md
- backend/src/modules/README.md
- backend/src/adapters/README.md
- shared/README.md
- **docs/FRONTEND_MODULAR_ARCHITECTURE_SUMMARY.md** (⭐ NUEVO)
- **docs/FRONTEND_MIGRATION_GUIDE.md** (⭐ NUEVO)
- **docs/FRONTEND_MIGRATION_RISKS.md** (⭐ NUEVO)
- **docs/MODULE_SYSTEM_QUICK_REFERENCE.md** (⭐ NUEVO)
- **docs/BACKEND_ARCHITECTURE.md** (⭐ NUEVO)
- **docs/FRONTEND_ARCHITECTURE.md** (⭐ NUEVO)

### Backend: ~25 archivos

- 1 schema Prisma
- 6 routes
- 3 middlewares
- 2 contracts
- 3 config
- 2 types
- 2 entry points
- 1 módulo ejemplo
- Varios configs (package.json, tsconfig, etc.)

### Frontend Web: ~35 archivos (+15 nuevos)

- **Product Layer (5 archivos):** Sistema modular core
- **App Layer (4 archivos):** Bootstrapping y routing
- **Module Definitions (4 archivos):** Auto-registro de módulos
- 3 páginas React (core)
- 1 servicio API
- 2 stores Zustand
- 1 cliente API
- 1 types
- Varios configs (Vite, Tailwind, etc.)

### Mobile: ~10 archivos

- 4 screens Expo
- Varios configs (Expo, Babel, etc.)

### Shared: ~5 archivos

- 1 archivo de tipos
- Configs y docs

### Utilidades: ~5 archivos

- Scripts de instalación
- Configs VSCode
- Gitignore

---

## 🎯 Archivos Críticos (Lectura Obligatoria)

1. **[ARQUITECTURA.md](./ARQUITECTURA.md)** 🔴
   - Documento MAESTRO del proyecto
   - Leer SIEMPRE antes de hacer cambios

2. **[QUICKSTART.md](./QUICKSTART.md)**
   - Para iniciar el proyecto

3. **`backend/prisma/schema.prisma`**
   - Schema de base de datos
   - Entender el modelo multitenant

4. **`backend/src/core/contracts/`**
   - Interfaces que define el core
   - Base para extensibilidad

5. **`backend/src/core/middlewares/auth.middleware.ts`**
   - Cómo funciona la autenticación

---

## 📈 Total de Archivos Creados

**~90 archivos** (+15 nuevos) organizados en:

- ✅ Backend funcional
- ✅ Frontend web funcional con **arquitectura modular**
- ✅ App móvil funcional
- ✅ Documentación completa + **guías de migración**
- ✅ Scripts de instalación
- ✅ Configuraciones de desarrollo

**Nuevos Archivos (Arquitectura Modular):**

- 5 archivos de Product Layer (infraestructura)
- 4 archivos de App Layer (bootstrapping)
- 4 module definitions (auto-registro)
- 6 documentos de arquitectura y migración

---

## 🔍 Búsqueda Rápida

### ¿Necesitas...?

| Necesidad                         | Archivo                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| Entender principios               | [ARQUITECTURA.md](./ARQUITECTURA.md)                                                       |
| **Migrar a arquitectura modular** | **[FRONTEND_MIGRATION_GUIDE.md](./FRONTEND_MIGRATION_GUIDE.md)**                           |
| **Arquitectura frontend nueva**   | **[FRONTEND_MODULAR_ARCHITECTURE_SUMMARY.md](./FRONTEND_MODULAR_ARCHITECTURE_SUMMARY.md)** |
| **Crear nuevo módulo**            | **[MODULE_SYSTEM_QUICK_REFERENCE.md](./MODULE_SYSTEM_QUICK_REFERENCE.md)**                 |
| **Análisis de riesgos**           | **[FRONTEND_MIGRATION_RISKS.md](./FRONTEND_MIGRATION_RISKS.md)**                           |
| Instalar proyecto                 | [QUICKSTART.md](./QUICKSTART.md)                                                           |
| Ver estado                        | [PROJECT_STATUS.md](./PROJECT_STATUS.md)                                                   |
| Schema DB                         | `backend/prisma/schema.prisma`                                                             |
| Crear módulo backend              | `backend/src/modules/README.md`                                                            |
| Crear adapter                     | `backend/src/adapters/README.md`                                                           |
| Auth/Login                        | `backend/src/core/routes/auth.routes.ts`                                                   |
| Frontend ejemplo                  | `web/src/pages/`                                                                           |
| **Module definition ejemplo**     | **`web/src/modules/rental/module.ts`**                                                     |
| Mobile ejemplo                    | `mobile/app/`                                                                              |
| Tipos compartidos                 | `shared/src/index.ts`                                                                      |

---

<div align="center">

**DivancoSaaS - Arquitectura Completa + Sistema Modular Frontend**

Versión 1.1.0 | Febrero 2026

⭐ **NUEVO:** Arquitectura modular multi-tenant lista para implementar

</div>
