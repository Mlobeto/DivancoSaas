# 🛡️ GUARD RAILS ARQUITECTÓNICOS - DivancoSaaS

## 🔒 PRINCIPIOS NO NEGOCIABLES

### 1. **MULTITENANT ABSOLUTO**

```
✅ TODO dato pertenece a un tenant
✅ Aislamiento total de datos
❌ NUNCA acceso cruzado entre tenants
❌ NUNCA compartir datos sin validación de tenant

Ejemplo:
WHERE tenantId = ? AND businessUnitId = ?
```

### 2. **BUSINESS UNITS (Rubros Independientes)**

```
✅ Un tenant tiene múltiples Business Units
✅ Cada BU representa un negocio/rubro distinto
✅ Los datos NO se mezclan entre BUs
✅ Usuario puede operar en múltiples BUs con roles distintos
❌ NO asumir un solo rubro
❌ NO mezclar contextos de BU

Ejemplo:
Tenant "Constructora ABC"
  ├── BU "Obras Civiles" → Módulos: [assets, purchases, rental]
  └── BU "Desarrollos" → Módulos: [projects, sales]
```

### 3. **MÓDULOS INDEPENDIENTES**

```
✅ El CORE nunca depende de módulos
✅ Módulos se activan/desactivan por BU
✅ Módulos reutilizables entre rubros
❌ NO meter lógica de rubro en el CORE
❌ NO hardcodear nombres de módulos

Regla de Oro:
Si parece "general" pero SOLO sirve para un rubro específico → NO VA EN EL CORE
```

---

## 🏗️ QUÉ VA EN EL CORE

### ✅ PERMITIDO

- **Autenticación y Autorización**: JWT, RBAC
- **Tenants y Business Units**: Gestión de contexto
- **Usuarios**: CRUD básico
- **Roles y Permisos**: Sistema dinámico
- **Motor de Módulos**: Enable/disable
- **Workflows Configurables**: Estados genéricos
- **Billing del SaaS**: Suscripciones de la plataforma
- **Auditoría**: Logs de acciones
- **Contratos (Interfaces)**: Para integraciones

### ❌ PROHIBIDO

- Lógica específica de rubros (construcción, ganadería, etc.)
- Implementaciones de integraciones (solo contratos)
- Estados hardcodeados de workflow
- Módulos de negocio específicos
- Referencias a canales concretos

---

## 📦 CONFIGURABILIDAD OBLIGATORIA

### 1. **NO Hardcodear Categorías de Negocio**

> **DISTINCIÓN CLAVE:** Los tipos genéricos del sistema (enums) son PERMITIDOS si aplican a múltiples rubros. Las categorías específicas de negocio NUNCA deben ser hardcodeadas.

#### ❌ INCORRECTO: Hardcodear categorías específicas de rubro

```typescript
enum SupplyCategory {
  LUBRICANTE = "LUBRICANTE",      // ← Específico de construcción
  FILTRO = "FILTRO",              // ← Específico de construcción
  TELA_ALGODON = "TELA_ALGODON"  // ← Específico de textilera
  CONCENTRADO_BOVINO = "CONCENTRADO_BOVINO"  // ← Específico de ganadería
}
```

#### ✅ CORRECTO: Tipos genéricos del sistema + Categorías configurables por usuario

```typescript
// Tipos GENÉRICOS del sistema (comportamiento transversal)
enum SupplyCategoryType {
  CONSUMABLE        // Sirve para: lubricantes (construcción), hilos (textilera), concentrado (ganadería)
  SPARE_PART        // Sirve para: repuestos de maquinaria, partes de vehículos, componentes textiles
  RAW_MATERIAL      // Sirve para: cemento (construcción), telas (textilera), harina (panadería)
  FINISHED_PRODUCT  // Sirve para: cualquier producto terminado listo para venta
  TOOL              // Sirve para: herramientas menores de cualquier industria
  OTHER             // Flexibilidad total para casos especiales
}

// Categorías CONFIGURABLES por el usuario
model SupplyCategory {
  id: uuid
  tenantId: string
  businessUnitId: string
  code: string        // Usuario define: "LUBRICANTE_MOTOR", "TELA_ALGODON", "CONCENTRADO_BOVINO"
  name: string        // Usuario define: "Lubricantes de Motor", "Telas de Algodón", "Concentrado Bovino"
  type: SupplyCategoryType  // Sistema: CONSUMABLE, RAW_MATERIAL, etc.
}
```

#### Ejemplos por industria:

**BU "Constructora":**

```typescript
{ code: "LUBRICANTE_MOTOR", name: "Lubricantes de Motor", type: "CONSUMABLE" }
{ code: "REPUESTO_RETRO", name: "Repuestos Retroexcavadora", type: "SPARE_PART" }
{ code: "CEMENTO", name: "Cemento Portland", type: "RAW_MATERIAL" }
```

**BU "Textilera":**

```typescript
{ code: "TELA_ALGODON", name: "Telas de Algodón", type: "RAW_MATERIAL" }
{ code: "HILO_COSER", name: "Hilos para Coser", type: "RAW_MATERIAL" }
{ code: "CAMISA_TERMINADA", name: "Camisas Terminadas", type: "FINISHED_PRODUCT" }
```

**BU "Ganadería":**

```typescript
{ code: "CONCENTRADO_BOVINO", name: "Concentrado para Bovinos", type: "CONSUMABLE" }
{ code: "VACUNA_AFTOSA", name: "Vacuna Fiebre Aftosa", type: "CONSUMABLE" }
```

**Regla de Oro:** Si el tipo define **comportamiento del sistema** (cómo se gestiona el inventario, alertas, etc.) y aplica a **múltiples rubros**, puede ser un enum. Si es **específico de un negocio**, debe ser configurable.

### 2. **NO Hardcodear Estados**

```typescript
// ❌ INCORRECTO
if (project.status === "IN_PROGRESS") { ... }

// ✅ CORRECTO
const workflow = await getWorkflow(businessUnitId, "PROJECT");
if (workflow.currentState === workflow.states.find(s => s.type === "IN_PROGRESS")) { ... }
```

### 3. **NO Hardcodear Permisos**

```typescript
// ❌ INCORRECTO
if (user.role === "ADMIN") { ... }

// ✅ CORRECTO
const hasPermission = await authService.checkPermission(userId, "projects.update");
```

---

## 🔄 WORKFLOWS DINÁMICOS

### Principios:

```
✅ Estados son configurables por BU
✅ Transiciones definidas por usuario
✅ Permisos por transición
❌ NO hardcodear "DRAFT", "ACTIVE", etc.
❌ NO asumir flujos lineales

Ejemplo:
BU "Obras Civiles" → Workflow "PROYECTO"
  Draft → Planning → In Progress → Review → Completed

BU "Agencia Creativa" → Workflow "PROYECTO"
  Briefing → Concept → Design → Client Review → Revision → Final
```

---

## 📱 CANALES E INTENCIONES

### Principio Fundamental:

> **El sistema reacciona a INTENCIONES, no a mensajes**

### Reglas Obligatorias:

```
✅ Canales son SOLO transportes (WhatsApp, Web, App)
✅ Canales traducen a eventos normalizados
✅ Motor de Intenciones ejecuta acciones
❌ NUNCA lógica de negocio en adapters
❌ NUNCA asumir un canal específico
❌ NUNCA acoplar módulos a canales

Flujo Correcto:
WhatsApp → Adapter normaliza → Motor de Intenciones → Módulo ejecuta
```

### Eventos Normalizados:

```typescript
interface NormalizedEvent {
  tenant: string;
  businessUnit: string;
  user: string;
  channel: "whatsapp" | "web" | "mobile" | "api";
  intent: string; // "UPDATE_PROJECT", "UPLOAD_IMAGE"
  payload: any;
  metadata: { timestamp: Date };
}
```

---

## 🔌 INTEGRACIONES

### Principios:

```
✅ CORE define contratos (interfaces)
✅ Implementaciones viven fuera del core
✅ Resolución por configuración
✅ Cada BU configura sus credenciales
❌ CORE nunca importa adapters
❌ NO hardcodear proveedores

Estructura:
core/contracts/payment.provider.ts    (Interfaz)
integrations/adapters/stripe.ts       (Implementación)
```

### Credenciales por Business Unit:

```typescript
// ✅ CORRECTO: Cada BU configura independiente
model IntegrationCredential {
  businessUnitId: string
  provider: IntegrationType
  credentials: Json  // Encriptado
  isActive: boolean
}

// BU "Obras" usa MercadoPago
// BU "Online" usa Stripe
```

---

## 🚫 PROHIBICIONES ABSOLUTAS

### 1. **Mezclar Tenants**

```typescript
// ❌ NUNCA
const users = await db.user.findMany();

// ✅ SIEMPRE
const users = await db.user.findMany({
  where: { tenantId },
});
```

### 2. **Mezclar Business Units**

```typescript
// ❌ NUNCA
const orders = await db.order.findMany({
  where: { tenantId },
});

// ✅ SIEMPRE
const orders = await db.order.findMany({
  where: { tenantId, businessUnitId },
});
```

### 3. **Hardcodear Roles**

```typescript
// ❌ NUNCA
if (user.role === "MANAGER") { ... }

// ✅ SIEMPRE
if (await hasPermission(user, "action.name")) { ... }
```

### 4. **Hardcodear Módulos**

```typescript
// ❌ NUNCA
if (businessUnit.hasProjects) { ... }

// ✅ SIEMPRE
const modules = await getEnabledModules(businessUnitId);
if (modules.includes("projects")) { ... }
```

### 5. **Lógica en Adapters**

```typescript
// ❌ NUNCA en WhatsAppAdapter
if (message.includes("proyecto")) {
  await projectService.update(...);
}

// ✅ Solo normalizar
return {
  channel: "whatsapp",
  intent: "PROJECT_UPDATE",
  payload: extractPayload(message)
};
```

---

## 🎯 CHECKLIST DE VALIDACIÓN

Antes de implementar cualquier funcionalidad, pregúntate:

- [ ] ¿Está aislado por tenant?
- [ ] ¿Está aislado por businessUnit?
- [ ] ¿Es configurable o está hardcodeado?
- [ ] ¿El CORE depende de este módulo? (❌)
- [ ] ¿Las categorías/estados son configurables?
- [ ] ¿Los permisos son dinámicos?
- [ ] ¿Las integraciones son intercambiables?
- [ ] ¿Funciona con múltiples canales?
- [ ] ¿Los workflows son configurables?
- [ ] ¿Es reutilizable entre rubros?

---

## 📐 JERARQUÍA DE DATOS

```
Platform (DivancoSaaS)
  └── Tenant (Cliente del SaaS)
      └── Business Unit (Rubro de negocio)
          ├── Modules (Activados para esta BU)
          ├── Users (Con roles específicos en esta BU)
          ├── Workflows (Estados configurables)
          ├── Categories (Definidas por usuario)
          └── Data (Aislada por BU)
```

### Reglas de Acceso:

```
SUPER_ADMIN → Todos los tenants (debugging)
PLATFORM_OWNER → Métricas comerciales (NO datos internos)
TENANT_ADMIN → Su tenant y sus BUs
BU_USER → Solo su BU con permisos específicos
```

---

## 🎨 FRONTEND

### Principios:

```
✅ UI se adapta a configuración del backend
✅ Componentes genéricos reutilizables
✅ Siempre responsive
✅ Estilo técnico profesional (AutoCAD 2014)
❌ NO asumir módulos específicos
❌ NO hardcodear opciones

Ejemplo:
// ✅ CORRECTO: Obtiene categorías del backend
const categories = await api.get('/supply-categories');

// ❌ INCORRECTO: Hardcodea categorías
const categories = ["LUBRICANTE", "FILTRO", "REPUESTO"];
```

---

## 🔍 AUDITORÍA OBLIGATORIA

### Toda acción debe registrar:

```typescript
{
  tenantId: string;
  businessUnitId: string;
  userId: string;
  channel: string;
  intent: string;
  entity: string;
  entityId: string;
  action: "create" | "update" | "delete";
  oldData?: any;
  newData?: any;
  metadata: {
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
  }
}
```

---

## 🚀 MOBILE OFFLINE-FIRST

### Principios:

```
✅ Backend NO asume conectividad constante
✅ Eventos se persisten localmente
✅ Cola de sincronización
✅ Resolución de conflictos por timestamp
❌ NO bloquear UI esperando red
❌ NO perder datos por desconexión
```

---

## 📝 REGLA FINAL

> **Si una funcionalidad parece general pero solo aplica a un rubro específico:**
>
> **NO VA EN EL CORE → Va en un MÓDULO**

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026  
**Prioridad**: CRÍTICA - Seguir estos principios es OBLIGATORIO
