# 🎨 Frontend Architecture - DivancoSaaS

## 🏗️ Modular Architecture Overview

DivancoSaaS frontend follows a **Vertical-First Modular Architecture**, where business capabilities are organized by verticals (e.g., Rental, Inventory) containing self-contained modules.

### Key Architectural Changes

**Before (Flat):**

```
modules/
├── inventory/    (standalone)
├── clients/      (standalone)
├── purchases/    (standalone)
└── rental/       (standalone)
```

**After (Vertical-Based):**

```
verticals/
└── rental/
    ├── modules/
    │   ├── assets/       (inventory)
    │   ├── clients/
    │   ├── quotations/
    │   └── contracts/
    └── vertical.config.ts
```

### Dual Registry System

**Location:** `web/src/modules/`

```typescript
// Legacy (being phased out)
export const moduleRegistry = {
  assets: { name: "Assets", icon: Package, route: "/assets" },
  clients: { name: "Clients", icon: Users, route: "/clients" },
  // ...
};

// New (vertical-based)
export const verticalRegistry = {
  rental: {
    id: "rental",
    name: "Rental",
    description: "Equipment rental management",
    modules: [
      {
        id: "assets",
        name: "Assets",
        vertical: "rental",
        route: "/assets",
        icon: Package,
      },
      // ...
    ],
  },
};
```

---

## 📂 File Structure

```
web/
├── src/
│   ├── main.tsx                    # Entry point + Router setup
│   ├── index.css                   # Global Tailwind styles
│   │
│   ├── core/                       # Core framework
│   │   ├── components/             # Layout & global components
│   │   │   ├── Layout.tsx          # Main app shell + Navbar
│   │   │   └── ProtectedRoute.tsx  # Auth guard
│   │   │
│   │   ├── pages/                  # Core pages
│   │   │   ├── DashboardPage.tsx   # Main dashboard
│   │   │   ├── LoginPage.tsx       # Authentication (NEW: role-based redirect)
│   │   │   ├── SelectBusinessUnitPage.tsx
│   │   │   └── ModuleAssignmentManager.tsx # SUPER_ADMIN module mgmt
│   │   │
│   │   ├── services/               # Core services
│   │   │   ├── api.client.ts       # 🔒 Axios with auth interceptor
│   │   │   ├── auth.service.ts     # Login, register, JWT handling
│   │   │   └── dashboard.service.ts # Stats & metrics
│   │   │
│   │   └── types/                  # Core TypeScript types
│   │       └── api.types.ts        # User, Tenant, BusinessUnit
│   │
│   ├── shared/                     # Shared components
│   │   ├── components/             # Reusable UI components
│   │   │   ├── CSVImportUpload.tsx # CSV import wizard
│   │   │   ├── DataTable.tsx       # Generic table with filters
│   │   │   ├── FormField.tsx       # Form inputs
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── Modal.tsx
│   │   │
│   │   └── types/                  # Shared TypeScript types
│   │       └── api.types.ts
│   │
│   ├── lib/                        # Utilities
│   │   └── utils.ts                # Helper functions
│   │
│   ├── store/                      # State management
│   │   └── auth.store.ts           # 🔒 Zustand store (JWT + BU + role)
│   │
│   └── modules/                    # 🎯 Business modules
│       ├── index.ts                # Module registries (dual system)
│       ├── inventory/              # Assets management (legacy path)
│       ├── clients/                # Client management (legacy path)
│       ├── purchases/              # Procurement (legacy path)
│       └── rental/                 # Quotations & contracts (legacy path)
│       └── verticals/              # NEW: Vertical-based organization
│           └── rental/
│               ├── modules/
│               │   ├── assets/
│               │   ├── clients/
│               │   ├── quotations/
│               │   └── contracts/
│               └── vertical.config.ts
│
├── public/
│   └── templates/                  # CSV import templates
│       ├── import_assets_initial.csv
│       ├── import_categories.csv
│       └── import_supplies_initial.csv
│
└── index.html                      # App entry
```

---

## 🎯 Modules Structure (Standard Pattern)

Cada módulo sigue esta estructura:

```
modules/[module-name]/
├── index.ts                        # Module exports
├── README.md                       # Module docs
│
├── pages/                          # Page components
│   ├── [Entity]ListPage.tsx       # List view with filters
│   ├── [Entity]CreatePage.tsx     # Create form
│   ├── [Entity]EditPage.tsx       # Edit form
│   └── [Entity]DetailPage.tsx     # Detail view
│
├── components/                     # Module-specific components
│   ├── [Entity]Form.tsx
│   ├── [Entity]Card.tsx
│   └── [Entity]Table.tsx
│
├── services/                       # API client services
│   └── [entity].service.ts        # CRUD + business operations
│
└── types/                          # TypeScript types
    └── [entity].types.ts
```

---

## 🔐 Authentication Flow (Updated)

### Hierarchical User System

```
┌─────────────────────────────────────────────────────────────┐
│              User Accesses Application                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
            ┌─────────────────────────┐
            │   LoginPage.tsx         │
            │   - Email & Password    │
            │   - Call auth.service   │
            └─────────┬───────────────┘
                      │
                      ▼
        ┌─────────────────────────────────┐
        │   AuthResponse Received         │
        │   {                             │
        │     user: { role: "..." },      │ ← NEW
        │     tenant: Tenant | null,      │
        │     businessUnits: BU[]         │
        │   }                             │
        └─────────┬───────────────────────┘
                  │
            ┌─────┴──────┐
            │            │
    ┌───────▼───────┐   ┌▼─────────────────┐
    │ SUPER_ADMIN   │   │ USER             │
    │ (Platform)    │   │ (Tenant)         │
    └───────┬───────┘   └┬─────────────────┘
            │            │
            │            ▼
            │   ┌────────────────────────────┐
            │   │ auth.store.ts (Zustand)    │
            │   │ - Save JWT token           │
            │   │ - Save user + role         │
            │   │ - Save tenant (if present) │
            │   │ - localStorage persistence │
            │   └────────┬───────────────────┘
            │            │
            │            ▼
            │   ┌────────────────────────────────┐
            │   │ SelectBusinessUnitPage.tsx     │
            │   │ - Show available BUs           │
            │   │ - User selects BU              │
            │   └────────┬───────────────────────┘
            │            │
            ▼            ▼
    ┌───────────────────────────────────────────┐
    │      navigate() - Role-based redirect     │
    │  SUPER_ADMIN → /admin/modules             │ ← NEW
    │  USER → /dashboard                        │
    └───────────────┬───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────┐
        │   ProtectedRoute.tsx                  │
        │   - Check token exists                │
        │   - Check BU selected (USER only)     │ ← NEW
        │   - Redirect to login if missing      │
        └───────────┬───────────────────────────┘
                    │
                    ▼
      ┌─────────────────────────────────────────┐
      │   Module pages accessible               │
      │   ✅ JWT auto-attached to requests      │
      │   ✅ BU context in API calls (USER)     │
      │   ✅ Cross-tenant access (SUPER_ADMIN)  │ ← NEW
      └─────────────────────────────────────────┘
```

### Auth Store (Zustand)

**Location:** `web/src/store/auth.store.ts`

```typescript
interface AuthState {
  user: User | null; // Contains role: "SUPER_ADMIN" | "USER"
  token: string | null;
  refreshToken: string | null;
  tenant: Tenant | null; // null for SUPER_ADMIN
  businessUnit: BusinessUnit | null;
  role: string | null; // Role within current BU (USER only)

  setAuth: (data: {
    user: User;
    tenant?: Tenant; // Optional for SUPER_ADMIN
    businessUnit?: BusinessUnit;
    role?: string;
  }) => void;

  // ...
}
```

### User Type Definitions

**Location:** `web/src/core/types/api.types.ts`

```typescript
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: "SUPER_ADMIN" | "USER"; // Global role
  tenantId?: string | null; // null for SUPER_ADMIN
}

export interface BusinessUnit {
  id: string;
  name: string;
  slug: string;
  role?: string; // OWNER, ADMIN, MANAGER, EMPLOYEE, VIEWER
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
  tenant: Tenant | null;
  businessUnits: BusinessUnit[];
}
```

---

## 🚀 Router Structure (Updated)

```typescript
// main.tsx
<BrowserRouter>
  <Routes>
    {/* Public routes */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />

    {/* Protected routes */}
    <Route element={<ProtectedRoute />}>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* SUPER_ADMIN routes */}
        <Route
          path="/admin/modules"
          element={<ModuleAssignmentManager />}
        />{" "}
        {/* ← NEW */}
        {/* Inventory module */}
        <Route path="/inventory" element={<AssetsListPage />} />
        <Route path="/inventory/create" element={<AssetCreatePage />} />
        <Route path="/inventory/:id" element={<AssetDetailPage />} />
        <Route path="/inventory/:id/edit" element={<AssetEditPage />} />
        <Route path="/inventory/templates" element={<AssetTemplatesPage />} />
        <Route
          path="/inventory/templates/create"
          element={<AssetTemplateCreatePage />}
        />
        <Route
          path="/inventory/templates/:id/edit"
          element={<AssetTemplateEditPage />}
        />

        {/* Clients module */}
        <Route path="/clients" element={<ClientsListPage />} />
        <Route path="/clients/create" element={<ClientCreatePage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/clients/:id/edit" element={<ClientEditPage />} />

        {/* Purchases module */}
        <Route path="/purchases" element={<PurchasesListPage />} />
        <Route path="/purchases/create" element={<PurchaseCreatePage />} />
        <Route path="/purchases/:id" element={<PurchaseDetailPage />} />
        <Route path="/purchases/:id/edit" element={<PurchaseEditPage />} />
        <Route path="/suppliers" element={<SuppliersListPage />} />
        <Route path="/supplies" element={<SuppliesListPage />} />

        {/* Rental module */}
        <Route path="/rental/quotations" element={<QuotationsListPage />} />
        <Route
          path="/rental/quotations/create"
          element={<QuotationCreatePage />}
        />
        <Route
          path="/rental/quotations/:id"
          element={<QuotationDetailPage />}
        />
        <Route path="/rental/contracts" element={<ContractsListPage />} />
        <Route path="/rental/contracts/:id" element={<ContractDetailPage />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

---

## 🔧 Module Assignment System

### Current Implementation (Temporary)

**Location:** `web/src/core/pages/ModuleAssignmentManager.tsx`

**Purpose:** SUPER_ADMIN interface to assign modules to tenant Business Units.

**Current Storage:** localStorage (key: `module-assignments-${tenantId}`)

**Access Control:**

```typescript
const isPlatformOwner = user?.role === "SUPER_ADMIN";

if (!isPlatformOwner) {
  return <AccessDeniedMessage />;
}

if (isPlatformOwner && !tenant) {
  return <InfoMessage about="Multi-tenant selector pending" />;
}
```

**Future Implementation:**

- Backend API endpoints:
  - `GET /api/v1/admin/tenants` - List all tenants
  - `GET /api/v1/admin/tenants/:id/business-units` - List tenant BUs
  - `POST /api/v1/admin/module-assignments` - Assign modules to BU
- Database-backed module assignments
- Subscription-based access control

---

## 📦 Current Modules (Frontend-Defined)

Modules are **defined in frontend registries**, not in database. Backend provides data APIs only.

### 1️⃣ Assets Module (Inventory)

**Path:** `modules/inventory/`

**Responsabilidad:** Gestión visual de activos (maquinaria, herramientas, equipos)

**Pages:**

- `AssetsListPage.tsx` - Lista de activos con filtros
- `AssetCreatePage.tsx` - Crear activo (UNIT o BULK)
- `AssetDetailPage.tsx` - Ver detalles + historial
- `AssetEditPage.tsx` - Editar activo
- `AssetTemplatesPage.tsx` - Gestión de plantillas
- `AssetTemplateCreatePage.tsx` - Crear plantilla
- `AssetTemplateEditPage.tsx` - Editar plantilla

**Components:**

- `AssetForm.tsx` - Formulario de activo con validación
- `AssetCard.tsx` - Card para grid view
- `AssetStatusBadge.tsx` - Badge de estado con colores
- `AssetDocumentsSection.tsx` - Listado de documentos
- `StockLevelIndicator.tsx` - Indicador de stock BULK

**Services:**

- `assets.service.ts` - CRUD de activos
- `asset-templates.service.ts` - Gestión de plantillas

**Features:**

- ✅ Vista de lista con búsqueda y filtros
- ✅ Crear/editar activos UNIT y BULK
- ✅ Sistema de plantillas con campos personalizados
- ✅ Cambio de estado con modal
- ✅ Subir documentos (Azure Blob)
- ✅ Importación CSV masiva
- ✅ Historial de eventos

---

### 2️⃣ Clients Module

**Path:** `modules/clients/`

**Responsabilidad:** Gestión visual de clientes

**Pages:**

- `ClientsListPage.tsx` - Lista de clientes
- `ClientCreatePage.tsx` - Formulario de creación
- `ClientDetailPage.tsx` - Vista detallada con contactos
- `ClientEditPage.tsx` - Formulario de edición

**Components:**

- `ClientForm.tsx` - Formulario completo
- `ClientCard.tsx` - Card resumen
- `ClientContactsList.tsx` - Listado de contactos

**Services:**

- `clients.service.ts` - CRUD de clientes

**Features:**

- ✅ Crear clientes INDIVIDUAL y COMPANY
- ✅ Gestionar múltiples contactos
- ✅ Filtros por tipo y estado
- ✅ Búsqueda por nombre/email/teléfono

---

### 3️⃣ Purchases Module

**Path:** `modules/purchases/`

**Responsabilidad:** Gestión de compras y suministros

**Pages:**

- `PurchasesListPage.tsx` - Órdenes de compra
- `PurchaseCreatePage.tsx` - Nueva OC
- `PurchaseDetailPage.tsx` - Detalle de OC
- `PurchaseEditPage.tsx` - Editar OC
- `SuppliersListPage.tsx` - Lista de proveedores
- `SuppliesListPage.tsx` - Lista de suministros

**Components:**

- `PurchaseOrderForm.tsx` - Formulario de OC
- `PurchaseOrderItemsTable.tsx` - Tabla de ítems
- `SupplierForm.tsx` - Formulario de proveedor
- `SupplyCategoryWizard.tsx` - Wizard de categorías

**Services:**

- `purchase-orders.service.ts` - Gestión de OC
- `suppliers.service.ts` - Gestión de proveedores
- `supplies.service.ts` - Gestión de suministros
- `supply-categories.service.ts` - Gestión de categorías

**Features:**

- ✅ Crear OC con múltiples ítems
- ✅ Gestión de proveedores
- ✅ Sistema de categorías con wizard
- ✅ Importación CSV de suministros
- ✅ Estados de OC: DRAFT → APPROVED → RECEIVED

---

### 4️⃣ Rental Module

**Path:** `modules/rental/`

**Responsabilidad:** Cotizaciones y contratos de alquiler

**Pages:**

- `QuotationsListPage.tsx` - Lista de cotizaciones
- `QuotationCreatePage.tsx` - Nueva cotización
- `QuotationDetailPage.tsx` - Ver cotización + PDF
- `ContractsListPage.tsx` - Lista de contratos
- `ContractDetailPage.tsx` - Ver contrato + términos

**Components:**

- `QuotationForm.tsx` - Formulario de cotización
- `QuotationItemsTable.tsx` - Tabla de ítems cotizados
- `QuotationPDFViewer.tsx` - Preview del PDF
- `ContractForm.tsx` - Formulario de contrato
- `SignatureSection.tsx` - Sección de firmas

**Services:**

- `quotations.service.ts` - Gestión de cotizaciones
- `quotation-templates.service.ts` - Plantillas
- `contracts.service.ts` - Gestión de contratos

**Features:**

- ✅ Crear cotizaciones con plantillas personalizables
- ✅ Generar PDF de cotización
- ✅ Convertir cotización en contrato
- ✅ Gestión de estados: DRAFT → SENT → APPROVED
- ✅ Firma digital (pendiente integración)

---

## 🎨 Component Library (Shared)

### CSVImportUpload.tsx

Componente de importación CSV reutilizable con:

- ✅ Drag & drop de archivos CSV
- ✅ Validación de formato
- ✅ Preview de datos
- ✅ Mapeo de columnas
- ✅ Manejo de errores por fila
- ✅ Progress bar

**Usado en:**

- Importar activos desde plantillas
- Importar suministros
- Importar categorías

---

### DataTable.tsx

Tabla genérica con:

- ✅ Paginación
- ✅ Búsqueda global
- ✅ Filtros por columna
- ✅ Ordenamiento
- ✅ Selección múltiple
- ✅ Acciones bulk

**Usado en:**

- Todas las páginas de lista (assets, clients, purchases, etc.)

---

### FormField.tsx

Input wrapper con:

- ✅ Label automático
- ✅ Mensajes de error
- ✅ Validación en tiempo real
- ✅ Tipos: text, email, number, select, textarea, date

---

### Modal.tsx

Modal reutilizable con:

- ✅ Overlay con blur
- ✅ Animaciones de entrada/salida
- ✅ Cierre con ESC o click fuera
- ✅ Header, body, footer customizables

---

## 🔒 API Client Configuration

```typescript
// api.client.ts
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Auto-attach JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Handle 401 (logout)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

---

## 🎨 Styling & UI Framework

- **CSS Framework:** Tailwind CSS 4.1
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Forms:** React Hook Form + Zod validation
- **Date Picker:** React DatePicker
- **Charts:** Recharts (para dashboard)

**Tema personalizado:**

```javascript
// tailwind.config.js
{
  theme: {
    extend: {
      colors: {
        primary: {...},   // Brand color
        secondary: {...}, // Accent color
        danger: {...},    // Error states
        success: {...},   // Success states
        warning: {...},   // Warning states
      }
    }
  }
}
```

---

## 🔐 State Management

### AuthStore (Zustand with Persistence)

**Location:** `web/src/store/auth.store.ts`

```typescript
interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null; // Contains role: "SUPER_ADMIN" | "USER"
  tenant: Tenant | null; // null for SUPER_ADMIN
  businessUnit: BusinessUnit | null;
  role: string | null; // Role within current BU (USER only)

  // Actions
  setAuth: (data: {
    user: User;
    tenant?: Tenant; // Optional for SUPER_ADMIN
    businessUnit?: BusinessUnit;
    role?: string;
  }) => void;
  setBusinessUnit: (bu: BusinessUnit) => void;
  clearAuth: () => void;
}

// Persistent storage
persist(
  (set, get) => ({...}),
  { name: 'auth-storage' }
)
```

**Storage:**

- JWT token → localStorage
- Refresh token → localStorage
- User info (including role) → localStorage
- Selected tenant → localStorage (null for SUPER_ADMIN)
- Selected BU → localStorage

**Auto-logout on:**

- 401 response from API
- Token expiration
- Manual logout

---

## 📱 Navigation Structure

### For Tenant Users (USER)

```
┌─────────────────────────────────────────────────┐
│              Navbar (Layout.tsx)                │
│  Logo | Dashboard | Inventario | Compras |     │
│       Clientes | Alquileres | [User Menu]      │
└─────────────────────────────────────────────────┘
│
├─ Dashboard
│   └─ Business metrics and stats
│
├─ Inventario ▼
│   ├─ Plantillas → /inventory/templates
│   └─ Activos → /inventory
│
├─ Compras ▼
│   ├─ Órdenes de Compra → /purchases
│   ├─ Proveedores → /suppliers
│   └─ Suministros → /supplies
│
├─ Clientes → /clients
│
└─ Alquileres ▼
    ├─ Cotizaciones → /rental/quotations
    └─ Contratos → /rental/contracts
```

### For Platform Owner (SUPER_ADMIN)

```
┌─────────────────────────────────────────────────┐
│              Navbar (Layout.tsx)                │
│  Logo | Dashboard | 🔧 Gestión de Módulos |    │
│                                    [User Menu]  │
└─────────────────────────────────────────────────┘
│
├─ Dashboard
│   └─ Platform-wide stats
│
└─ Gestión de Módulos → /admin/modules
    └─ Assign modules to tenant BUs (TODO: multi-tenant selector)
```

---

## 🚀 Build & Deployment

### Development

```bash
npm run dev  # Start Vite dev server on port 5173
```

### Production Build

```bash
npm run build  # Output: web/dist/
```

**Output Structure:**

```
web/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── templates/
    └── (CSV templates)
```

### Deployment

- **Platform:** Vercel (recommended) or static hosting
- **Build Tool:** Vite 6.4.1
- **Node Version:** 20.x

**Environment Variables:**

```bash
VITE_API_URL=https://backend.railway.app/api/v1
VITE_APP_NAME=DivancoSaaS
```

---

## 🛠️ Technology Stack

### Core

- **Framework:** React 19.0.0
- **Language:** TypeScript 5.7.2
- **Build Tool:** Vite 6.4.1
- **Router:** React Router DOM 7.1.1

### State & Data

- **State Management:** Zustand 5.0.2 (with persist middleware)
- **HTTP Client:** Axios 1.7.9
- **Forms:** React Hook Form 7.54.2
- **Validation:** Zod 3.24.1

### UI & Styling

- **CSS Framework:** Tailwind CSS 4.1.7
- **Icons:** Lucide React 0.469.0
- **Notifications:** React Hot Toast 2.4.1
- **Date Picker:** React DatePicker 7.5.0
- **Charts:** Recharts (for dashboard)

### Utilities

- **Date Handling:** date-fns 4.1.0
- **Class Names:** clsx + tailwind-merge
- **File Upload:** Custom implementation with Azure Blob

---

## 📊 Module-to-Backend Mapping

| Frontend Module | Backend Module | Vertical | Status  |
| --------------- | -------------- | -------- | ------- |
| `inventory/`    | `assets/`      | rental   | ✅ 100% |
| `clients/`      | `clients/`     | rental   | ✅ 100% |
| `purchases/`    | `purchases/`   | rental   | ✅ 100% |
| `rental/`       | `rental/`      | rental   | ✅ 100% |

**Naming Conventions:**

- Frontend UI uses Spanish: "Inventario", "Alquileres", "Compras"
- Backend API uses English: "assets", "rental", "purchases"
- API routes in English, UI labels in Spanish

---

## 🎯 User Flow Examples

### Platform Owner Login Flow

```
1. Navigate to /login
2. Enter: owner@divancosaas.com / PlatformOwner123!
3. Backend returns:
   {
     user: { role: "SUPER_ADMIN" },
     tenant: null,
     businessUnits: []
   }
4. Auto-redirect to /admin/modules
5. View module assignment interface
   (Currently shows message: "Multi-tenant selector pending")
```

### Tenant Admin Login Flow

```
1. Navigate to /login
2. Enter: admin@construcciones-demo.com / Admin123!
3. Backend returns:
   {
     user: { role: "USER" },
     tenant: { name: "Construcciones Demo S.A." },
     businessUnits: [{ id: "...", name: "División Alquiler", role: "OWNER" }]
   }
4. Auto-redirect to /dashboard
5. Access all assigned modules
```

### Creating an Asset (Tenant User)

```
1. Click "Inventario" → "Activos"
2. Click "Crear Activo"
3. Select template (optional)
4. Fill form:
   - Name, description, code
   - Asset type (UNIT/BULK)
   - Initial state
   - Purchase info (optional)
5. Upload documents (optional)
6. Click "Guardar"
7. → API: POST /api/v1/assets (auto-scoped to tenant)
8. → Redirect to /inventory/:id
```

### Creating a Quotation (Tenant User)

```
1. Click "Alquileres" → "Cotizaciones"
2. Click "Nueva Cotización"
3. Select client (from tenant's clients)
4. Select template
5. Add items:
   - Search asset (from tenant's assets)
   - Set quantity
   - Set price
6. Review totals
7. Click "Guardar"
8. → API: POST /api/v1/quotations (auto-scoped to tenant)
9. → Generate PDF and redirect to /rental/quotations/:id
```

---

## 🎯 Current Status & Roadmap

### ✅ Completed

- React 19 + TypeScript + Vite setup
- Multi-route architecture with protected routes
- Hierarchical authentication (SUPER_ADMIN vs USER)
- Role-based navigation and redirects
- Zustand state management with persistence
- 4 functional modules (Assets, Clients, Purchases, Rental)
- Module registry system (dual: legacy + vertical)
- Azure Blob Storage integration
- CSV import/export functionality
- Responsive UI with Tailwind

### 🚧 In Progress

- ModuleAssignmentManager (SUPER_ADMIN interface)
- Multi-tenant selector for Platform Owner
- Vertical-based module organization

### 📋 Planned

- Tenant/BU selector for SUPER_ADMIN
- Database-backed module assignments
- Improved dashboard with real-time metrics
- Role-based UI hiding (show/hide features by BU role)
- Dark mode support
- Mobile-responsive improvements
- Internationalization (i18n)
- Advanced filtering and search
- Bulk operations UI

---

**Last Updated:** February 2026  
**Version:** 2.0 - Frontend-First Module Management
