# ARQUITECTURA DIVANC SaaS

## Principios de Diseño No Negociables

---

## 🔒 PRINCIPIOS NO NEGOCIABLES

### 1. Sistema MULTITENANT

- Todo dato pertenece SIEMPRE a un tenant
- Nunca debe existir acceso cruzado entre tenants
- Aislamiento total de datos

### 2. Business Units (Rubros de Negocio)

- Un tenant puede tener múltiples BUSINESS UNITS
- Cada businessUnit representa un negocio distinto
- Los datos NO se mezclan entre businessUnits
- Un mismo usuario puede operar en varias businessUnits con roles distintos

### 3. Módulos de Negocio Independientes

- Comercio, proyectos, ganadería, envíos, etc.
- Un tenant puede activar varios módulos en distintas businessUnits
- El core nunca depende de un módulo
- **Si algo parece "general" pero solo sirve para un rubro específico: NO VA EN EL CORE**

---

## 🏗️ CORE DEL SISTEMA

El CORE solo contiene lógica transversal y genérica:

- ✅ Autenticación
- ✅ Autorización (RBAC dinámico)
- ✅ Tenants
- ✅ Business Units
- ✅ Usuarios
- ✅ Roles y permisos configurables
- ✅ Motor de módulos (enable / disable)
- ✅ Motor de workflows configurables
- ✅ Billing de la PLATAFORMA SaaS (suscripciones)
- ✅ Auditoría y trazabilidad

### El core:

- ❌ NO conoce rubros
- ❌ NO conoce integraciones concretas
- ✅ SOLO define interfaces (contracts)

---

## 🔄 WORKFLOWS

- Los estados NO se hardcodean
- Los workflows son configurables por módulo y businessUnit
- Ejemplos:
  - Estados de un proyecto
  - Etapas de una obra
  - Flujo creativo
  - Estados de un pedido

---

## 🔌 INTEGRACIONES EXTERNAS

Se manejan con **ADAPTERS**:

- El core define interfaces
- Las implementaciones viven fuera del core
- **El core nunca importa adapters**
- La resolución del adapter se realiza por configuración y composición en el bootstrap de la aplicación

### Ejemplo de estructura:

```
core/contracts/payment.provider.ts (interfaz)
integrations/adapters/stripe/stripe.adapter.ts
integrations/adapters/wompi/wompi.adapter.ts
integrations/adapters/mercadopago/mercadopago.adapter.ts
```

### Tipos de integraciones:

- Pagos
- Facturación
- Envíos
- Email/SMS
- Storage
- Analytics

**IMPORTANTE**: El billing del SaaS es independiente de los pagos del negocio del cliente.

---

## 🧪 DOCUMENTACIÓN Y PRUEBAS DE API

La plataforma utiliza **OpenAPI (Swagger)** como estándar obligatorio para documentar y probar la API.

### Objetivos

- Facilitar pruebas manuales y automáticas
- Documentar contratos entre frontend, mobile y backend
- Servir como fuente única de verdad para los endpoints
- Facilitar integraciones externas futuras

---

### Principios

- ✅ **Todo endpoint público debe estar documentado**
- ✅ Los contratos reflejan la arquitectura real (tenants, businessUnits, módulos)
- ❌ Swagger NO contiene lógica de negocio
- ❌ Swagger NO define permisos hardcodeados

---

### Alcance de la documentación

Cada endpoint debe incluir:

- Método y ruta
- Descripción clara
- Requisitos de autenticación
- Parámetros obligatorios:
  - `tenantId`
  - `businessUnitId` (cuando aplique)
- Body con schemas tipados
- Ejemplos de request y response
- Códigos de error esperados

---

### Seguridad en Swagger

- Autenticación vía **Bearer Token (JWT)**
- Swagger debe permitir:
  - Login
  - Setear token
  - Probar endpoints autenticados

⚠️ **Nunca exponer secretos ni claves reales en Swagger**

---

### Separación por Contexto

- Endpoints del CORE documentados como:
  - Auth
  - Tenants
  - Business Units
  - Users
  - Roles / Permissions
  - Billing Plataforma
  - Modules
  - Workflows

- Endpoints de módulos se documentan:
  - Dentro del módulo
  - Con su propio tag OpenAPI
  - Sin contaminar el core

---

### Integraciones y Webhooks

- Webhooks entrantes y salientes deben estar documentados
- Cada adapter define:
  - Payload esperado
  - Firma / validación
  - Ejemplo real del proveedor

---

### Uso esperado

Swagger es una **herramienta de desarrollo y validación**, no un producto final para el cliente.

- Frontend y mobile se desarrollan contra el contrato OpenAPI
- Los tests pueden generarse a partir del schema
- Los cambios en endpoints requieren actualizar Swagger

---

## 💻 FRONTEND WEB

### Stack tecnológico:

- React
- TanStack Query para estado remoto
- Zustand para estado local/UI
- Tailwind CSS
- Siempre responsive

### Principios:

- UI desacoplada de módulos concretos
- La UI se adapta a la configuración enviada por el backend
- Estética profesional tipo AutoCAD 2014 (sobria, técnica, no "marketinera")
- Componentes genéricos reutilizables

---

## 📱 APLICACIÓN MÓVIL

### Stack tecnológico:

- Expo + React Native
- Solo para módulos que lo requieran

### Módulos candidatos:

- Operarios
- Campo/ganadería
- Construcción/obra
- Logística

### Arquitectura OFFLINE FIRST:

- El backend NO asume conectividad constante
- Persistencia local
- Cola de eventos
- Sincronización al reconectar
- Resolución de conflictos por backend

---

## ⚠️ REGLAS ESTRICTAS

1. ❌ Nunca mezclar tenants
2. ❌ Nunca mezclar businessUnits
3. ❌ No hardcodear estados ni roles
4. ❌ No acoplar frontend a módulos específicos
5. ❌ No meter lógica de rubro en el core
6. ✅ Priorizar extensibilidad antes que rapidez
7. ✅ Pensar siempre en web + mobile (pero no mobile-first obligatorio)

---

## 🎯 OBJETIVO FINAL

Construir un SaaS profesional, escalable y extensible, capaz de soportar:

- ✅ Múltiples rubros de negocio
- ✅ Integraciones externas
- ✅ Aplicaciones móviles
- ✅ Sin reescribir el backend
- ✅ Sin comprometer la separación de datos

---

## 📐 ESTRUCTURA DE DATOS

### Jerarquía:

```
Platform
  └── Tenant (empresa cliente del SaaS)
      └── Business Unit (rubro de negocio)
          └── Modules (activados por BU)
              └── Data (aislada por BU)
```

### Ejemplo real:

```
Platform: DivancoSaaS
  └── Tenant: "Constructora ABC"
      ├── Business Unit: "Obras Civiles"
      │   └── Modules: [projects, machinery, hr]
      └── Business Unit: "Desarrollos Inmobiliarios"
          └── Modules: [projects, sales, marketing]
```

### Separación de contextos:

- Un usuario puede tener rol "admin" en "Obras Civiles"
- Y rol "viewer" en "Desarrollos Inmobiliarios"
- Los datos de proyectos NO se mezclan entre BUs

---

**Fecha de creación**: Enero 2026  
**Versión**: 1.0.0  
**Prioridad**: MÁXIMA - Este documento es la guía absoluta del proyecto
