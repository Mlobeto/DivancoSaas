# 🎯 DivancoSaaS - Resumen Ejecutivo

## ¿Qué es DivancoSaaS?

Un **SaaS de gestión modular multitenant** que permite a múltiples empresas (tenants) gestionar diferentes rubros de negocio (business units) sin mezclar datos ni reescribir código.

---

## 🏆 Características Principales

✅ **Multitenant** - Múltiples empresas en una plataforma  
✅ **Multi-Business Unit** - Una empresa puede tener varios rubros  
✅ **Modular** - Activar/desactivar funcionalidades por rubro  
✅ **Workflows Configurables** - Estados y transiciones NO hardcodeados  
✅ **RBAC Dinámico** - Roles y permisos configurables  
✅ **Offline-First Mobile** - App móvil que funciona sin internet  
✅ **Integraciones Flexibles** - Adapters para proveedores externos  
✅ **Auditoría Completa** - Trazabilidad de todas las acciones

---

## 📊 Jerarquía

```
Platform (El SaaS)
 └─ Tenant (Cliente: "Constructora ABC")
     ├─ Business Unit (Rubro: "Obras Civiles")
     │   ├─ Modules: Projects ✅, Machinery ✅, HR ✅
     │   └─ Data: [Proyectos, Tareas, Recursos]
     │
     └─ Business Unit (Rubro: "Desarrollos Inmobiliarios")
         ├─ Modules: Sales ✅, Marketing ✅
         └─ Data: [Propiedades, Leads, Campañas]
```

**Regla de oro**: Los datos NUNCA se mezclan entre Business Units

---

## 🎨 Stack Tecnológico

| Capa           | Tecnología                                         |
| -------------- | -------------------------------------------------- |
| **Backend**    | Node.js + TypeScript + Express + Prisma            |
| **Database**   | PostgreSQL 14+                                     |
| **Web**        | React + Vite + TanStack Query + Zustand + Tailwind |
| **Mobile**     | Expo + React Native (offline-first)                |
| **Auth**       | JWT + bcrypt                                       |
| **Validación** | Zod                                                |

---

## 📁 Estructura

```
DivancoSaas/
├── backend/        Backend API
├── web/            Frontend web
├── mobile/         App móvil
├── shared/         Tipos compartidos
└── docs/           Documentación
```

---

## 🚀 Inicio Rápido

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env
# Editar .env con PostgreSQL credentials
npm run prisma:migrate
npm run dev
# ✅ http://localhost:3000

# 2. Web
cd web
npm install
npm run dev
# ✅ http://localhost:5173

# 3. Registrar tenant en /register
```

---

## 🔑 Conceptos Clave

### Tenant

- Cliente del SaaS (una empresa/organización)
- Ejemplo: "Constructora ABC"

### Business Unit

- Rubro de negocio dentro de un tenant
- Ejemplo: "Obras Civiles", "Inmobiliaria"
- **Datos aislados** entre BUs

### Module

- Funcionalidad activable por BU
- Ejemplos: Projects, Sales, Livestock, HR
- Independientes entre sí

### Workflow

- Estados y transiciones configurables
- NO hardcodeados en código
- Definidos en JSON en la DB

---

## ⚠️ Reglas NO Negociables

### ❌ NUNCA

1. Mezclar datos entre tenants
2. Mezclar datos entre business units
3. Hardcodear estados, roles o flujos
4. Acoplar UI a módulos específicos
5. Meter lógica de rubro en el core

### ✅ SIEMPRE

1. Filtrar por `tenantId` y `businessUnitId`
2. Usar workflows configurables
3. Implementar `ModuleContract` para módulos
4. Usar contracts (interfaces) para integraciones
5. Consultar ARQUITECTURA.md antes de cambios

---

## 📚 Documentación

| Documento                                | Descripción                                      |
| ---------------------------------------- | ------------------------------------------------ |
| **[ARQUITECTURA.md](./ARQUITECTURA.md)** | 🔴 **PRIORIDAD MÁXIMA** - Principios del sistema |
| [QUICKSTART.md](./QUICKSTART.md)         | Guía de instalación paso a paso                  |
| [PROJECT_STATUS.md](./PROJECT_STATUS.md) | Estado actual del proyecto                       |
| [docs/ADR.md](./docs/ADR.md)             | Decisiones arquitectónicas                       |
| [docs/DIAGRAMS.md](./docs/DIAGRAMS.md)   | Diagramas visuales                               |

---

## 🔌 Extensibilidad

### Agregar un Módulo

1. Crear en `backend/src/modules/[nombre]/`
2. Implementar `ModuleContract`
3. Definir permisos y workflows
4. Registrar en el sistema

### Agregar una Integración

1. Identificar el contract (ej: `PaymentProvider`)
2. Implementar adapter en `backend/src/adapters/`
3. Configurar por tenant/BU

---

## 📊 Base de Datos (Prisma)

**Tablas Core:**

- `tenants` - Clientes del SaaS
- `business_units` - Rubros de negocio
- `users` - Usuarios
- `roles` + `permissions` - RBAC
- `modules` + `business_unit_modules` - Motor de módulos
- `workflows` - Estados configurables
- `platform_subscriptions` - Billing del SaaS
- `audit_logs` - Auditoría

---

## 🎨 Diseño

**Filosofía**: Profesional, sobrio, técnico (tipo AutoCAD 2014)

- Paleta oscura
- Sin animaciones innecesarias
- Enfoque en funcionalidad
- UI genérica adaptable

---

## 🔒 Seguridad

✅ **Implementado:**

- JWT con expiración
- Contraseñas hasheadas (bcrypt)
- CORS configurado
- Helmet (security headers)
- Validación Zod
- Middleware de auth
- Autorización por permisos

⚠️ **Producción (Pendiente):**

- Rate limiting
- HTTPS obligatorio
- 2FA
- Logs de seguridad

---

## 📱 Mobile: Offline-First

**Arquitectura:**

1. Datos en SQLite local
2. Cola de sincronización
3. Retry al reconectar
4. Resolución de conflictos en backend

**Uso:**

- Operarios en campo sin internet
- Ganadería sin cobertura
- Logística en movimiento

---

## 🧩 Módulos Ejemplo

### Projects (Incluido)

- Gestión de proyectos
- Tareas y subtareas
- Workflow configurable
- Ver: `backend/src/modules/projects/`

### Otros Módulos (Crear según necesidad)

- Livestock (Ganadería)
- Sales (Ventas)
- Marketing
- Logistics (Logística)
- Manufacturing (Manufactura)
- HR (Recursos Humanos)

---

## 🚀 Roadmap Futuro

- [ ] Tests (Jest + Vitest)
- [ ] API Documentation (Swagger)
- [ ] Rate limiting
- [ ] Notificaciones real-time (WebSockets)
- [ ] Exportación de reportes
- [ ] Dashboard analytics
- [ ] Integración con BI tools
- [ ] White-labeling

---

## 📞 Contacto y Soporte

**Documentación:**

- `ARQUITECTURA.md` - Principios
- `QUICKSTART.md` - Instalación
- `PROJECT_STATUS.md` - Estado actual
- READMEs en cada carpeta

**Ejemplos de código:**

- Módulo: `backend/src/modules/projects/`
- Contracts: `backend/src/core/contracts/`
- Frontend: `web/src/pages/`

---

## ✅ Checklist Desarrollo

Antes de hacer un cambio:

- [ ] ¿Leí ARQUITECTURA.md?
- [ ] ¿Estoy filtrando por tenantId?
- [ ] ¿Estoy filtrando por businessUnitId?
- [ ] ¿Es lógica de rubro? → va en módulo
- [ ] ¿Es integración externa? → va en adapter
- [ ] ¿Es transversal? → puede ir en core
- [ ] ¿Hardcodeé estados? → usar workflows
- [ ] ¿Hardcodeé roles? → usar RBAC

---

## 🎯 Valor del Proyecto

### Para Clientes (Tenants)

- ✅ Un sistema, múltiples rubros
- ✅ Pagar solo lo que usan (módulos)
- ✅ Workflows adaptados a su negocio
- ✅ App móvil para campo
- ✅ Datos siempre aislados

### Para Desarrolladores

- ✅ Arquitectura clara y escalable
- ✅ TypeScript end-to-end
- ✅ No reescribir código por rubro
- ✅ Fácil agregar módulos
- ✅ Patrones bien definidos

### Para el Negocio

- ✅ Escalable horizontalmente
- ✅ SaaS rentable (multi-tenant)
- ✅ Rápido time-to-market
- ✅ Extensible sin límites
- ✅ Diferenciador competitivo

---

<div align="center">

**DivancoSaaS**  
_Sistema de gestión modular multitenant profesional_

---

⚠️ **Consultar [ARQUITECTURA.md](./ARQUITECTURA.md) SIEMPRE antes de hacer cambios**

Versión 1.0.0 | Enero 2026

</div>
