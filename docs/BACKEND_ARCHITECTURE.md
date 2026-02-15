# 🏗️ Backend Architecture - DivancoSaaS

## 📂 Estructura General

```
backend/
├── src/
│   ├── index.ts                    # Entry point
│   ├── app.ts                      # Express app setup
│   │
│   ├── bootstrap/                  # Startup logic
│   │   └── database.bootstrap.ts   # Prisma connection
│   │
│   ├── config/                     # Configuration
│   │   ├── prisma-extensions.ts    # 🔒 Tenant isolation middleware
│   │   ├── tenant-model-registry.ts # Model enforcement (59 tenant-scoped)
│   │   ├── cors.config.ts
│   │   ├── multer.config.ts
│   │   └── swagger.config.ts
│   │
│   ├── core/                       # Core framework
│   │   ├── interfaces/             # Base interfaces
│   │   ├── middlewares/            # Global middlewares
│   │   │   ├── auth.middleware.ts  # 🔒 JWT + BU validation
│   │   │   ├── context.middleware.ts # 🔒 Tenant context injection
│   │   │   └── error.middleware.ts
│   │   └── types/                  # Shared types
│   │
│   ├── shared/                     # Shared utilities
│   │   └── context/
│   │       └── request-context.ts  # 🔒 AsyncLocalStorage for tenant
│   │
│   ├── integrations/               # External services
│   │   ├── azure-blob/            # File storage
│   │   ├── mercadopago/           # Payments
│   │   └── puppeteer/             # PDF generation
│   │
│   └── modules/                    # 🎯 Business modules
│       ├── assets/                 # Inventory management
│       ├── clients/                # Client management
│       ├── purchases/              # Procurement
│       └── rental/                 # Quotations & contracts
│
└── prisma/
    ├── schema.prisma               # Database schema
    └── migrations/                 # DB version control
```

---

## 🎯 Modules Structure (Standard Pattern)

Cada módulo sigue esta estructura:

```
modules/[module-name]/
├── [module].module.ts              # Module registration
├── [module].swagger.ts             # API documentation
├── README.md                       # Module docs
│
├── controllers/                    # HTTP handlers
│   ├── [entity].controller.ts
│   └── [entity]-item.controller.ts
│
├── services/                       # Business logic
│   ├── [entity].service.ts
│   └── [entity]-item.service.ts
│
├── types/                          # TypeScript types
│   └── [entity].types.ts
│
└── routes/                         # Route definitions
    └── [entity].routes.ts
```

---

## 🔐 Multi-Tenant Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      HTTP Request                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   auth.middleware.ts   │
                │  - Verify JWT token    │
                │  - Extract user info   │
                │  - Validate BU owner   │
                └────────┬───────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │  context.middleware.ts      │
           │  - Inject tenantId into     │
           │    AsyncLocalStorage        │
           │  - Inject businessUnitId    │
           └─────────┬───────────────────┘
                     │
                     ▼
       ┌─────────────────────────────────┐
       │   prisma-extensions.ts          │
       │   - Auto-filter by tenantId     │
       │   - Throw TenantContextError    │
       │     if context missing          │
       └─────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │   Controller → Service → DB        │
    │   ✅ All queries filtered          │
    │   ✅ Cross-tenant access blocked   │
    └────────────────────────────────────┘
```

---

## 📦 Current Modules

### 1️⃣ Assets Module

**Path:** `modules/assets/`

**Responsabilidad:** Gestión de activos (maquinaria, herramientas, equipos)

**Features:**

- ✅ Sistema UNIT (tracking individual) + BULK (inventario por cantidad)
- ✅ Plantillas de activos con campos personalizados
- ✅ Estados: AVAILABLE, RENTED, MAINTENANCE, OUT_OF_SERVICE, RESERVED
- ✅ Documentación de activos con alertas de vencimiento
- ✅ Tipos de documentos configurables
- ✅ Stock movements con audit trail completo
- ✅ Importación CSV

**API Routes:**

```
GET    /api/v1/assets
POST   /api/v1/assets
GET    /api/v1/assets/:id
PATCH  /api/v1/assets/:id
DELETE /api/v1/assets/:id
POST   /api/v1/assets/:id/state
GET    /api/v1/assets/:id/events
```

**Controllers:**

- `assets.controller.ts` - CRUD de activos
- `asset-templates.controller.ts` - Plantillas
- `document-types.controller.ts` - Tipos de docs
- `stock-level.controller.ts` - Inventario BULK
- `alerts.controller.ts` - Alertas de vencimiento

---

### 2️⃣ Clients Module

**Path:** `modules/clients/`

**Responsabilidad:** Gestión de clientes (personas y empresas)

**Features:**

- ✅ Clientes individuales y empresas
- ✅ Múltiples contactos por cliente
- ✅ Estados: ACTIVE, INACTIVE, SUSPENDED
- ✅ Tipos: INDIVIDUAL, COMPANY

**API Routes:**

```
GET    /api/v1/clients
POST   /api/v1/clients
GET    /api/v1/clients/:id
PUT    /api/v1/clients/:id
DELETE /api/v1/clients/:id
```

---

### 3️⃣ Purchases Module

**Path:** `modules/purchases/`

**Responsabilidad:** Compras, proveedores y suministros

**Features:**

- ✅ Gestión de proveedores
- ✅ Órdenes de compra con ítems
- ✅ Categorías de suministros con wizard
- ✅ Suministros (BULK inventory)
- ✅ Estados de OC: DRAFT, PENDING, APPROVED, RECEIVED, CANCELLED

**API Routes:**

```
# Suppliers
GET    /api/v1/suppliers
POST   /api/v1/suppliers
GET    /api/v1/suppliers/:id
PUT    /api/v1/suppliers/:id
DELETE /api/v1/suppliers/:id

# Purchase Orders
GET    /api/v1/purchase-orders
POST   /api/v1/purchase-orders
GET    /api/v1/purchase-orders/:id
PUT    /api/v1/purchase-orders/:id
DELETE /api/v1/purchase-orders/:id

# Supply Categories
GET    /api/v1/supply-categories
POST   /api/v1/supply-categories
GET    /api/v1/supply-categories/:id
PUT    /api/v1/supply-categories/:id
DELETE /api/v1/supply-categories/:id

# Supplies
GET    /api/v1/supplies
POST   /api/v1/supplies
GET    /api/v1/supplies/:id
PUT    /api/v1/supplies/:id
DELETE /api/v1/supplies/:id
```

---

### 4️⃣ Rental Module

**Path:** `modules/rental/`

**Responsabilidad:** Cotizaciones y contratos de alquiler

**Features:**

- ✅ Cotizaciones con plantillas personalizables
- ✅ Generación de PDFs con Puppeteer
- ✅ Contratos de alquiler
- ✅ Firmas digitales (integración pendiente)
- ✅ Estados: DRAFT, SENT, APPROVED, REJECTED, EXPIRED

**API Routes:**

```
# Quotations
GET    /api/v1/quotations
POST   /api/v1/quotations
GET    /api/v1/quotations/:id
PUT    /api/v1/quotations/:id
DELETE /api/v1/quotations/:id
GET    /api/v1/quotations/:id/pdf

# Templates
GET    /api/v1/quotation-templates
POST   /api/v1/quotation-templates
GET    /api/v1/quotation-templates/:id
PUT    /api/v1/quotation-templates/:id
DELETE /api/v1/quotation-templates/:id

# Contracts
GET    /api/v1/rental-contracts
POST   /api/v1/rental-contracts
GET    /api/v1/rental-contracts/:id
PUT    /api/v1/rental-contracts/:id
```

---

## 🔒 Tenant Isolation Implementation

### Modelo de Datos

```prisma
model Tenant {
  id              String          @id @default(cuid())
  name            String
  status          TenantStatus    @default(ACTIVE)
  businessUnits   BusinessUnit[]
  // ... 50+ related models
}

model BusinessUnit {
  id              String    @id @default(cuid())
  code            String
  name            String
  tenantId        String
  tenant          Tenant    @relation(...)
  // ... all business data
}
```

### Enforcement Strategy

**59 modelos tenant-scoped** (filtrado automático):

- Asset, Client, Supplier, Supply, PurchaseOrder
- Quotation, Contract, User, Role, Permission
- StockMovement, AssetTemplate, DocumentType
- ... y 46 más

**12 modelos BU-scoped** (filtrado opcional):

- Scoped por BusinessUnit dentro del tenant

**4 modelos globales** (sin filtrado):

- Tenant, BusinessUnit, SystemConfig, AuditLog

### Prisma Middleware

```typescript
// Auto-injected on every query:
{
  where: {
    tenantId: getTenantId(), // from AsyncLocalStorage
    ...originalWhere
  }
}
```

---

## 🚀 Deployment

- **Platform:** Railway
- **Database:** PostgreSQL (Supabase/Neon)
- **Storage:** Azure Blob Storage
- **Runtime:** Node.js 20 + tsx

**Environment Variables:**

```
DATABASE_URL=postgresql://...
JWT_SECRET=...
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER_NAME=uploads
MERCADOPAGO_ACCESS_TOKEN=...
```

---

## 📊 Database Schema Summary

- **Tenants:** Multi-tenancy root
- **Business Units:** Organization structure within tenant
- **Assets:** 59 tables (templates, documents, stock, events)
- **Clients:** 4 tables (clients, contacts)
- **Purchases:** 8 tables (suppliers, orders, supplies, categories)
- **Rental:** 10 tables (quotations, templates, contracts, items)

**Total:** ~80 tables con tenant isolation

---

## 🛠️ Key Technologies

- **Framework:** Express.js + TypeScript
- **ORM:** Prisma 6.19.2
- **Authentication:** JWT (jsonwebtoken)
- **Validation:** Zod schemas
- **File Upload:** Multer + Azure Blob
- **PDF Generation:** Puppeteer
- **Documentation:** Swagger/OpenAPI
- **Testing:** Jest (unit tests)

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0 - Multi-tenant hardening completo
