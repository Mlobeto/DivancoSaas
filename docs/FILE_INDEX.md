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

### Módulos (Ejemplos)

| Archivo                                           | Descripción                   |
| ------------------------------------------------- | ----------------------------- |
| `backend/src/modules/README.md`                   | Guía de módulos               |
| `backend/src/modules/projects/projects.module.ts` | Módulo de proyectos (ejemplo) |

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

## 📊 Resumen por Tipo

### Documentación: 10 archivos

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

### Frontend Web: ~20 archivos

- 3 páginas React
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

6. **`backend/src/modules/projects/projects.module.ts`**
   - Ejemplo de cómo crear módulos

---

## 📈 Total de Archivos Creados

**~75 archivos** organizados en:

- ✅ Backend funcional
- ✅ Frontend web funcional
- ✅ App móvil funcional
- ✅ Documentación completa
- ✅ Scripts de instalación
- ✅ Configuraciones de desarrollo

---

## 🔍 Búsqueda Rápida

### ¿Necesitas...?

| Necesidad           | Archivo                                  |
| ------------------- | ---------------------------------------- |
| Entender principios | [ARQUITECTURA.md](./ARQUITECTURA.md)     |
| Instalar proyecto   | [QUICKSTART.md](./QUICKSTART.md)         |
| Ver estado          | [PROJECT_STATUS.md](./PROJECT_STATUS.md) |
| Schema DB           | `backend/prisma/schema.prisma`           |
| Crear módulo        | `backend/src/modules/README.md`          |
| Crear adapter       | `backend/src/adapters/README.md`         |
| Auth/Login          | `backend/src/core/routes/auth.routes.ts` |
| Frontend ejemplo    | `web/src/pages/`                         |
| Mobile ejemplo      | `mobile/app/`                            |
| Tipos compartidos   | `shared/src/index.ts`                    |

---

<div align="center">

**DivancoSaaS - Arquitectura Completa Inicializada**

Versión 1.0.0 | Enero 2026

</div>
