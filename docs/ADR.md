# Decisiones Arquitectónicas (ADR)

## ADR-001: Separación Core vs Módulos

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Necesitamos un sistema que soporte múltiples rubros sin reescribir código.

### Decisión

- El **core** solo contiene lógica transversal
- Los **módulos** contienen lógica de negocio específica
- Los módulos son activables por Business Unit

### Consecuencias

✅ Extensibilidad sin modificar el core  
✅ Múltiples rubros en el mismo sistema  
❌ Mayor complejidad inicial

---

## ADR-002: Multi-tenant con Business Units

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Un cliente puede tener múltiples negocios (obras + desarrollos inmobiliarios).

### Decisión

```
Tenant (cliente del SaaS)
└── Business Unit (rubro de negocio)
    └── Modules (activados)
        └── Data (aislada)
```

### Consecuencias

✅ Separación total de datos  
✅ Un usuario puede tener roles distintos por BU  
✅ Facturación clara por tenant  
❌ Mayor complejidad en queries

---

## ADR-003: Workflows Configurables (No Hardcodeados)

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Cada rubro tiene estados distintos (proyecto de obra ≠ campaña de marketing).

### Decisión

- Estados y transiciones en JSON (base de datos)
- Configurables por módulo y Business Unit
- Motor genérico en el core

### Consecuencias

✅ Flexibilidad total  
✅ No hardcodear estados  
❌ Complejidad en validaciones

---

## ADR-004: Integraciones con Adapters

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Diferentes clientes usan diferentes proveedores (Stripe vs MercadoPago).

### Decisión

- Core define **interfaces** (contracts)
- Adapters implementan proveedores concretos
- Configuración por tenant/BU

### Consecuencias

✅ Intercambiables  
✅ Testeable  
✅ No vendor lock-in  
❌ Más código inicial

---

## ADR-005: Frontend Desacoplado de Módulos

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

El frontend no debe conocer módulos específicos.

### Decisión

- UI genérica basada en configuración del backend
- Componentes reutilizables
- Backend envía estructura de UI

### Consecuencias

✅ Un frontend para todos los módulos  
✅ Escalabilidad  
❌ Mayor complejidad en rendering dinámico

---

## ADR-006: Mobile Offline-First

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Operarios en campo sin conectividad constante.

### Decisión

- Persistencia local (SQLite/AsyncStorage)
- Cola de sincronización
- Resolución de conflictos en backend

### Consecuencias

✅ Funciona sin internet  
✅ Mejor UX en campo  
❌ Complejidad en sync  
❌ Manejo de conflictos

---

## ADR-007: RBAC Dinámico (No Hardcodeado)

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Cada módulo tiene permisos distintos.

### Decisión

- Roles y permisos en base de datos
- Format `resource:action` (ej: `projects:create`)
- Scopes: TENANT, BUSINESS_UNIT, OWN

### Consecuencias

✅ Configuración flexible  
✅ No tocar código para nuevos permisos  
❌ Más complejo que roles hardcodeados

---

## ADR-008: Auditoría Obligatoria

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Trazabilidad de todas las acciones.

### Decisión

- Middleware que registra todas las modificaciones
- Tabla `audit_logs` con before/after
- Metadata de IP, user agent, etc.

### Consecuencias

✅ Trazabilidad completa  
✅ Debugging más fácil  
❌ Overhead en writes

---

## ADR-009: Stack Tecnológico

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Decisión

**Backend**:

- Node.js + TypeScript
- PostgreSQL + Prisma ORM
- Express

**Web**:

- React + TypeScript
- TanStack Query (estado remoto)
- Zustand (estado local)
- Tailwind CSS

**Mobile**:

- Expo + React Native
- Offline-first

### Consecuencias

✅ TypeScript end-to-end  
✅ Ecosistema moderno  
✅ Buena DX (Developer Experience)

---

## ADR-010: Estética Profesional (No Marketinera)

**Fecha**: Enero 2026  
**Estado**: Aceptado

### Contexto

Es un sistema de gestión, no una landing page.

### Decisión

- Paleta oscura tipo AutoCAD 2014
- Sobria, técnica, profesional
- Sin animaciones innecesarias
- Enfoque en funcionalidad

### Consecuencias

✅ Look & feel profesional  
✅ Menos distracciones  
❌ Menos "wow factor" visual
