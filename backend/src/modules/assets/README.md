# Assets Module - Rental Equipment Management

## 📋 Descripción

Módulo para gestión de activos (maquinaria, implementos, vehículos) en empresas de alquiler de equipos. Implementa los principios arquitectónicos de DivancoSaaS: **workflow-driven**, **event-sourced**, **multitenant-safe** y **sin estados hardcodeados**.

## 🏗️ Arquitectura

### Principios Cumplidos

✅ **Sin Enums Hardcodeados**: Todos los tipos (`assetType`, `source`, etc.) son strings libres  
✅ **Workflow-Driven**: Estados manejados por sistema de workflows externo  
✅ **Event Sourcing**: Todos los cambios se registran en `AssetEvent`  
✅ **Multitenant**: Aislamiento por `tenantId` + `businessUnitId`  
✅ **Hexagonal Architecture**: Separación clara de capas

### Estructura de Carpetas

```
src/modules/assets/
├── assets.module.ts          # Módulo principal (contrato + rutas)
├── assets.swagger.ts         # Documentación OpenAPI/Swagger
├── types/
│   └── asset.types.ts        # DTOs y tipos TypeScript
├── services/
│   ├── asset.service.ts      # Lógica de negocio de assets
│   ├── maintenance.service.ts
│   ├── usage.service.ts      # Tracking de horas/uso
│   └── attachment.service.ts # Manejo de archivos adjuntos
└── controllers/
    └── assets.controller.ts  # HTTP handlers
```

## 🗄️ Modelos de Datos

### Asset (Principal)

Representa un activo físico (máquina, implemento, vehículo).

```prisma
model Asset {
  id              String   @id @default(uuid())
  tenantId        String
  businessUnitId  String
  name            String
  assetType       String      // String libre: "excavator", "truck", etc
  acquisitionCost Decimal?
  origin          String?
  requiresOperator Boolean @default(false)
  requiresTracking Boolean @default(false)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  state              AssetState?
  maintenanceRecords MaintenanceRecord[]
  usages             AssetUsage[]
  events             AssetEvent[]
  attachments        AssetAttachment[]
}
```

**Campos clave:**

- `assetType`: String libre para tipos (no enum rígido)
- `requiresOperator`: Si requiere operador certificado
- `requiresTracking`: Si necesita tracking de horas/uso

### AssetState (Workflow)

Estado actual del asset, manejado por el sistema de workflows.

```prisma
model AssetState {
  id           String   @id @default(uuid())
  assetId      String   @unique
  workflowId   String   // Referencia al workflow que maneja estados
  currentState String   // Estado actual (workflow-driven)
  updatedAt    DateTime @updatedAt
}
```

**Estados sugeridos del workflow por defecto:**

- `available` - Disponible para alquiler
- `reserved` - Reservado
- `in-use` - En uso
- `maintenance` - En mantenimiento
- `out-of-service` - Fuera de servicio

### AssetEvent (Event Sourcing)

Registro de todos los eventos/cambios del asset.

```prisma
model AssetEvent {
  id             String   @id @default(uuid())
  tenantId       String
  businessUnitId String
  assetId        String
  eventType      String   // String libre: "created", "rented", "returned", etc
  payload        Json
  source         String   // String libre: "web", "mobile", "whatsapp", "system"
  createdAt      DateTime @default(now())
}
```

**Tipos de eventos comunes:**

- `asset.created` - Asset creado
- `asset.updated` - Asset actualizado
- `asset.state_changed` - Cambio de estado
- `maintenance.started` - Mantenimiento iniciado
- `maintenance.completed` - Mantenimiento completado
- `usage.recorded` - Uso registrado
- `attachment.added` - Archivo adjunto

### MaintenanceRecord

Registro de mantenimientos realizados al asset.

```prisma
model MaintenanceRecord {
  id          String    @id @default(uuid())
  assetId     String
  description String?
  startedAt   DateTime
  endedAt     DateTime?  // null = mantenimiento en curso
}
```

### AssetUsage (Tracking de Uso)

Registro diario de horas trabajadas/standby.

```prisma
model AssetUsage {
  id               String   @id @default(uuid())
  assetId          String
  date             DateTime
  hoursUsed        Decimal   // Horas productivas
  standbyHours     Decimal?  // Horas standby (para facturación)
  reportedByUserId String?   // Quién reportó el uso
  source           String    // "APP", "WHATSAPP", "API", "SYSTEM"
  notes            String?
  createdAt        DateTime @default(now())
}
```

**Casos de uso:**

- Reportes operativos diarios
- Cálculo de facturación por hora
- Tracking de horómetro
- Reportes via WhatsApp

### AssetAttachment

Archivos adjuntos (fotos, PDFs, reportes).

```prisma
model AssetAttachment {
  id        String   @id @default(uuid())
  assetId   String
  type      String   // "PHOTO", "PDF", "VIDEO", etc
  url       String   // URL del archivo en storage
  source    String   // "WHATSAPP", "APP", "SYSTEM"
  createdAt DateTime @default(now())
}
```

## 🔌 API Endpoints

Base URL: `/api/v1/modules/assets`

### Assets

| Método | Endpoint             | Descripción                  |
| ------ | -------------------- | ---------------------------- |
| POST   | `/assets`            | Crear nuevo asset            |
| GET    | `/assets`            | Listar assets (con filtros)  |
| GET    | `/assets/:id`        | Obtener asset por ID         |
| PATCH  | `/assets/:id`        | Actualizar asset             |
| DELETE | `/assets/:id`        | Eliminar asset               |
| POST   | `/assets/:id/state`  | Actualizar estado (workflow) |
| GET    | `/assets/:id/events` | Historial de eventos         |

### Maintenance

| Método | Endpoint                  | Descripción                     |
| ------ | ------------------------- | ------------------------------- |
| POST   | `/maintenance`            | Crear registro de mantenimiento |
| GET    | `/maintenance/active`     | Mantenimientos activos          |
| GET    | `/maintenance/:id`        | Obtener mantenimiento           |
| PATCH  | `/maintenance/:id`        | Actualizar mantenimiento        |
| GET    | `/assets/:id/maintenance` | Mantenimientos de un asset      |

### Usage (Uso/Horas)

| Método | Endpoint                    | Descripción                 |
| ------ | --------------------------- | --------------------------- |
| POST   | `/usage`                    | Registrar uso/horas         |
| GET    | `/usage`                    | Listar registros de uso     |
| GET    | `/usage/:id`                | Obtener registro específico |
| DELETE | `/usage/:id`                | Eliminar registro           |
| GET    | `/assets/:id/usage/summary` | Resumen de uso del asset    |

### Attachments

| Método | Endpoint           | Descripción                   |
| ------ | ------------------ | ----------------------------- |
| POST   | `/attachments`     | Crear adjunto                 |
| GET    | `/attachments`     | Listar adjuntos (por assetId) |
| GET    | `/attachments/:id` | Obtener adjunto               |
| DELETE | `/attachments/:id` | Eliminar adjunto              |

## 🔐 Seguridad y Contexto

Todos los endpoints requieren:

- **Bearer Token JWT** (autenticación)
- **Context con `tenantId`** (multitenant)
- **Context con `businessUnitId`** (aislamiento por unidad de negocio)

Si `businessUnitId` no está presente en el context, el endpoint retorna `400 Bad Request`.

## 📊 Casos de Uso

### 1. Crear Asset y Configurar Workflow

```typescript
// 1. Crear asset
POST /api/v1/modules/assets/assets
{
  "name": "Excavadora CAT 320",
  "assetType": "excavator",
  "acquisitionCost": 150000,
  "requiresOperator": true,
  "requiresTracking": true
}

// 2. Asignar workflow y estado inicial
POST /api/v1/modules/assets/assets/{assetId}/state
{
  "workflowId": "uuid-del-workflow",
  "currentState": "available"
}
```

### 2. Registrar Uso Diario (desde App Móvil)

```typescript
POST /api/v1/modules/assets/usage
{
  "assetId": "uuid-del-asset",
  "date": "2026-02-03",
  "hoursUsed": 8.5,
  "standbyHours": 2.0,
  "reportedByUserId": "uuid-del-operador",
  "source": "APP",
  "notes": "Trabajo en obra Proyecto X"
}
```

### 3. Reportar Mantenimiento

```typescript
// Iniciar mantenimiento
POST /api/v1/modules/assets/maintenance
{
  "assetId": "uuid-del-asset",
  "description": "Cambio de aceite y filtros",
  "startedAt": "2026-02-03T08:00:00Z"
}

// Completar mantenimiento
PATCH /api/v1/modules/assets/maintenance/{maintenanceId}
{
  "endedAt": "2026-02-03T12:00:00Z"
}
```

### 4. Adjuntar Foto desde WhatsApp

```typescript
POST /api/v1/modules/assets/attachments
{
  "assetId": "uuid-del-asset",
  "type": "PHOTO",
  "url": "https://storage.azure.com/...",
  "source": "WHATSAPP"
}
```

## 🔄 Integración con Workflows

El módulo NO maneja transiciones de estado internamente. Delega eso al sistema de workflows:

```typescript
// El módulo solo actualiza el estado, no valida transiciones
await assetService.updateAssetState(
  tenantId,
  businessUnitId,
  assetId,
  workflowId,
  newState,
);

// El sistema de workflows es responsable de:
// - Validar si la transición es permitida
// - Verificar permisos del usuario
// - Ejecutar acciones automáticas
```

## 📝 Event Sourcing

Todos los cambios importantes se registran como eventos:

```typescript
// Evento creado automáticamente al actualizar asset
{
  "eventType": "asset.updated",
  "source": "system",
  "payload": {
    "assetId": "uuid",
    "changes": { "name": "Nuevo nombre" }
  }
}

// Consultar historial de eventos
GET /api/v1/modules/assets/assets/{assetId}/events?limit=50
```

## 🧪 Testing

### Endpoints de Prueba (Postman/Insomnia)

1. Crear tenant + businessUnit (core)
2. Login y obtener token (core)
3. Crear asset con token
4. Listar assets
5. Registrar uso
6. Ver eventos del asset

## 🚀 Próximos Pasos (Roadmap)

Ver [CHECKLIST.md](./CHECKLIST.md) para estado completo de funcionalidades.

### Fase 1 - MVP (✅ Completado)

- ✅ CRUD de Assets
- ✅ Tracking de uso/horas
- ✅ Registros de mantenimiento
- ✅ Attachments básicos
- ✅ Event sourcing
- ✅ Integración con workflows

### Fase 2 - Siguiente Sprint

- ⏳ Contratos de alquiler (AssetContract)
- ⏳ Facturación por uso/horas
- ⏳ Notificaciones de mantenimiento preventivo
- ⏳ Dashboard de disponibilidad
- ⏳ Reportes operativos

### Fase 3 - Futuro

- ⏳ Geolocalización de assets
- ⏳ Integración con IoT/sensores
- ⏳ Mantenimiento predictivo (ML)
- ⏳ Firma digital de reportes

## 🤝 Contribución

Al agregar funcionalidad al módulo:

1. **NO hardcodear enums** - usar strings libres
2. **Emitir eventos** para cambios importantes
3. **Respetar multitenancy** - siempre filtrar por `tenantId` + `businessUnitId`
4. **Documentar en Swagger** - actualizar `assets.swagger.ts`
5. **Mantener tests actualizados**

## 📚 Referencias

- [ARQUITECTURA.md](../../../docs/ARQUITECTURA.md) - Principios arquitectónicos
- [MODULE_CONTRACT.md](../../README.md) - Contrato de módulos
- [Swagger Docs](https://divancosaas-production.up.railway.app/api-docs/) - API en vivo
