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
│   │   ├── routes/                 # Core routes
│   │   │   ├── auth.routes.ts      # Login, register, JWT
│   │   │   ├── user.routes.ts      # User management
│   │   │   └── business-unit.routes.ts # BU management
│   │   ├── services/               # Core services
│   │   │   ├── auth.service.ts     # Authentication & roles
│   │   │   └── email.service.ts    # Email notifications
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
    ├── seed.ts                     # 🆕 Minimal seed (roles + demo data)
    └── migrations/                 # DB version control
```

---

## 🎯 Hierarchical User System

### Platform Owner (SUPER_ADMIN)

```typescript
{
  role: "SUPER_ADMIN",  // User.role field
  tenantId: null,       // No tenant association
  businessUnits: []     // No BU assignments
}
```

**Capabilities:**

- ✅ Cross-tenant access
- ✅ Manage platform subscriptions
- ✅ Assign modules to tenants/BUs
- ✅ View all tenants and their data
- ✅ Platform-level configuration

**API Access:**

- `GET /api/v1/admin/tenants` - List all tenants (🚧 Pending)
- `GET /api/v1/admin/tenants/:id/business-units` (🚧 Pending)
- `POST /api/v1/admin/module-assignments` (🚧 Pending)

### Tenant User (USER)

```typescript
{
  role: "USER",         // User.role field
  tenantId: "...",      // Belongs to one tenant
  businessUnits: [      // Multiple BU assignments
    {
      id: "bu-1",
      role: "OWNER"     // Role within this BU
    },
    {
      id: "bu-2",
      role: "MANAGER"
    }
  ]
}
```

**Roles within Business Units:**

- `OWNER` - Full control of BU
- `ADMIN` - Administrative access
- `MANAGER` - Operational management
- `EMPLOYEE` - Standard operations
- `VIEWER` - Read-only access

**Tenant Isolation:**

- ✅ All queries auto-filtered by tenantId
- ✅ Cannot access other tenant data
- ✅ BU selection required for operations

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
                │  - Extract userId      │
                │  - Check User.role     │ ← NEW: SUPER_ADMIN vs USER
                │  - Validate BU access  │
                └────────┬───────────────┘
                         │
                         ▼
           ┌─────────────────────────────┐
           │  context.middleware.ts      │
           │  - Skip for SUPER_ADMIN     │ ← NEW: Conditional injection
           │  - Inject tenantId (USER)   │
           │  - Inject businessUnitId    │
           └─────────┬───────────────────┘
                     │
                     ▼
       ┌─────────────────────────────────┐
       │   prisma-extensions.ts          │
       │  - Auto-filter by tenantId      │
       │  - Bypass for SUPER_ADMIN       │ ← NEW: Cross-tenant access
       │  - Throw TenantContextError     │
       │    if context missing (USER)    │
       └─────────┬───────────────────────┘
                 │
                 ▼
    ┌────────────────────────────────────┐
    │   Controller → Service → DB        │
    │   ✅ SUPER_ADMIN: Full access      │ ← NEW
    │   ✅ USER: Tenant-filtered         │
    │   ✅ Cross-tenant blocked          │
    └────────────────────────────────────┘
```

### Authentication Response (Updated)

```typescript
interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string | null; // null for SUPER_ADMIN
    role: "SUPER_ADMIN" | "USER"; // ← NEW: Global role
  };
  tenant: Tenant | null; // null for SUPER_ADMIN
  businessUnits: Array<{
    id: string;
    name: string;
    slug: string;
    role?: string; // ← NEW: OWNER, ADMIN, etc.
  }>;
}
```

---

## 🗄️ Database Seed Strategy

### Minimal Seed (seed.ts)

**Philosophy:** Frontend owns module definitions, backend only stores assignments.

**Seed Contents:**

```typescript
// 1. System Roles (5)
- OWNER, ADMIN, MANAGER, EMPLOYEE, VIEWER

// 2. Platform Owner
{
  email: "owner@divancosaas.com",
  password: "PlatformOwner123!",
  role: "SUPER_ADMIN",
  tenantId: null
}

// 3. Demo Tenant
{
  name: "Construcciones Demo S.A.",
  slug: "construcciones-demo",
  plan: "free"
}

// 4. Demo Business Unit
{
  name: "División Alquiler de Implementos",
  slug: "alquiler",
  tenantId: demo-tenant-id
}

// 5. Demo Tenant Admin
{
  email: "admin@construcciones-demo.com",
  password: "Admin123!",
  role: "USER",
  tenantId: demo-tenant-id,
  businessUnits: [{ id: demo-bu-id, role: "OWNER" }]
}
```

**What's NOT in seed anymore:**

- ❌ Module definitions (moved to frontend registries)
- ❌ Permission definitions (managed per role in BU)
- ❌ Hardcoded role-permission assignments

**Total:** ~200 lines (vs 2247 before)

---

## 📦 Module Management (NEW APPROACH)

### Frontend-First Architecture

**Philosophy:** Module definitions live in frontend registries. Backend provides data operations through tenant-isolated APIs.

### Module Registry (Frontend)

**Location:** `web/src/modules/`

**Dual Registry System:**

```typescript
// Legacy system (being phased out)
moduleRegistry = {
  assets: { name: "Assets", icon: Package, route: "/assets" },
  clients: { name: "Clients", icon: Users, route: "/clients" },
  // ...
};

// New system (vertical-based)
verticalRegistry = {
  rental: {
    id: "rental",
    name: "Rental",
    modules: [
      {
        id: "assets",
        name: "Assets",
        vertical: "rental",
        route: "/assets",
        // ...
      },
    ],
  },
};
```

### Module Assignment (Temporary)

**Storage:** `localStorage` (key: `module-assignments-${tenantId}`)

**Format:**

```json
{
  "rental": {
    "buId": "bu-123",
    "modules": ["assets", "clients", "rentals"]
  }
}
```

**TODO (Next Phase):**

- Implement subscription system (backend)
- Create `ModuleAssignment` table
- API endpoints for SUPER_ADMIN:
  - `GET /api/v1/admin/tenants`
  - `GET /api/v1/admin/tenants/:id/business-units`
  - `POST /api/v1/admin/module-assignments`

---

## 🔌 Current Backend Modules (API-Only)

Backend provides **data operations** for these modules. No module definitions in DB.

### 1️⃣ Assets Module

**Path:** `backend/src/modules/assets/`

**Features:**

- ✅ UNIT (individual tracking) + BULK (quantity inventory)
- ✅ Asset templates with custom fields
- ✅ States: AVAILABLE, RENTED, MAINTENANCE, OUT_OF_SERVICE, RESERVED
- ✅ Document management with expiration alerts
- ✅ Stock movements with audit trail
- ✅ CSV import

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

---

### 2️⃣ Clients Module

**Path:** `backend/src/modules/clients/`

**Features:**

- ✅ Individual and company clients
- ✅ Multiple contacts per client
- ✅ States: ACTIVE, INACTIVE, SUSPENDED
- ✅ Types: INDIVIDUAL, COMPANY

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

**Path:** `backend/src/modules/purchases/`

**Features:**

- ✅ Supplier management
- ✅ Purchase orders with line items
- ✅ Supply categories with wizard
- ✅ Supplies (BULK inventory)
- ✅ PO states: DRAFT, PENDING, APPROVED, RECEIVED, CANCELLED

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

**Path:** `backend/src/modules/rental/`

**Features:**

- ✅ Quotations with customizable templates
- ✅ PDF generation with Puppeteer
- ✅ Rental contracts
- ✅ Digital signatures (integration pending)
- ✅ States: DRAFT, SENT, APPROVED, REJECTED, EXPIRED

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

### Data Model

```prisma
model Tenant {
  id              String          @id @default(cuid())
  name            String
  slug            String          @unique
  status          TenantStatus    @default(ACTIVE)
  plan            String          @default("free")
  businessUnits   BusinessUnit[]
  users           User[]
  // ... 50+ related models
}

model User {
  id              String           @id @default(cuid())
  email           String           @unique
  role            UserRole         // SUPER_ADMIN or USER
  tenantId        String?          // null for SUPER_ADMIN
  tenant          Tenant?          @relation(...)
  businessUnits   UserBusinessUnit[]
}

model BusinessUnit {
  id              String    @id @default(cuid())
  code            String
  name            String
  tenantId        String
  tenant          Tenant    @relation(...)
  users           UserBusinessUnit[]
  // ... all business data
}
```

### Enforcement Strategy

**59 tenant-scoped models** (automatic filtering):

- Asset, Client, Supplier, Supply, PurchaseOrder
- Quotation, Contract, Role, Permission
- StockMovement, AssetTemplate, DocumentType
- ... and 46 more

**12 BU-scoped models** (optional filtering):

- Scoped by BusinessUnit within tenant

**4 global models** (no filtering):

- Tenant, BusinessUnit, SystemConfig, AuditLog

### Prisma Middleware

```typescript
// Auto-injected on every query (USER only):
{
  where: {
    tenantId: getTenantId(), // from AsyncLocalStorage
    ...originalWhere
  }
}

// SUPER_ADMIN bypasses tenant filtering
```

---

## 🚀 Deployment & Environment

### Current Setup

- **Platform:** Azure App Service (Docker + ACR)
- **Database:** PostgreSQL
- **Storage:** Azure Blob Storage
- **Runtime:** Node.js 20 + tsx
- **Process Manager:** PM2 (production)

### Environment Variables

```bash
# Core
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://...

# Authentication
JWT_SECRET=...
JWT_REFRESH_SECRET=...

# Storage
AZURE_STORAGE_CONNECTION_STRING=...
AZURE_STORAGE_CONTAINER_NAME=uploads

# Payment Integration
MERCADOPAGO_ACCESS_TOKEN=...

# Email (optional)
SMTP_HOST=...
SMTP_PORT=587
```

### Puppeteer Configuration

```dockerfile
# Dockerfile (Azure App Service)
FROM node:20-slim

# Instalar dependencias del sistema para Chromium/Playwright
RUN apt-get update && apt-get install -y \
  ca-certificates \
  fonts-liberation \
  fonts-noto-color-emoji \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && \
  rm -rf /var/lib/apt/lists/*
```

---

## 📊 Database Schema Summary

### Core Tables

- **Multi-tenancy:** 2 tables (Tenant, BusinessUnit)
- **Users & Auth:** 4 tables (User, UserBusinessUnit, Role, RefreshToken)
- **Module Data:** ~75 tables across 4 modules

### Tenant Isolation Stats

- **59 models:** Tenant-scoped (automatic filtering)
- **12 models:** BU-scoped (filtered within tenant)
- **4 models:** Global (no filtering)
- **Total:** ~80 tables

---

## 🛠️ Technology Stack

### Core

- **Framework:** Express.js 4.21.2
- **Language:** TypeScript 5.3.3
- **Runtime:** Node.js 20+

### Data Layer

- **ORM:** Prisma 6.19.2
- **Database:** PostgreSQL 14+
- **Caching:** (planned)

### Security & Auth

- **Authentication:** JWT (jsonwebtoken 9.0.2)
- **Password Hashing:** bcryptjs 2.4.3
- **Validation:** Zod 3.22.4

### Integrations

- **File Storage:** Azure Blob Storage
- **PDF Generation:** Puppeteer 23.11.1
- **Payments:** Mercado Pago SDK
- **Email:** (planned)

### Development

- **API Documentation:** Swagger/OpenAPI
- **Testing:** Jest (unit tests)
- **Code Quality:** ESLint, Prettier

---

## 🎯 Current Status & Roadmap

### ✅ Completed

- Multi-tenant architecture with Prisma middleware
- Hierarchical user system (SUPER_ADMIN vs USER)
- 4 functional modules (Assets, Clients, Purchases, Rental)
- JWT authentication with refresh tokens
- Azure Blob Storage integration
- PDF generation with Puppeteer
- Minimal database seed (200 lines)

### 🚧 In Progress

- Module assignment system (currently localStorage)
- SUPER_ADMIN admin panel
- Subscription management

### 📋 Planned

- Admin endpoints for SUPER_ADMIN:
  - `GET /api/v1/admin/tenants`
  - `GET /api/v1/admin/tenants/:id/business-units`
  - `POST /api/v1/admin/module-assignments`
- Database-backed module assignments
- Billing & subscription system
- Email notifications
- Advanced RBAC (role-permission matrix)
- API rate limiting

---

**Last Updated:** February 2026  
**Version:** 2.0 - Frontend-First Module Management
