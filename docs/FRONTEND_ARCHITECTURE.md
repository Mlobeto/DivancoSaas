# 🎨 Frontend Architecture - DivancoSaaS

## 📂 Estructura General

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
│   │   │   ├── LoginPage.tsx       # Authentication
│   │   │   └── SelectBusinessUnitPage.tsx
│   │   │
│   │   └── services/               # Core services
│   │       ├── api.client.ts       # 🔒 Axios with auth interceptor
│   │       ├── auth.service.ts     # Login, register, JWT handling
│   │       └── dashboard.service.ts # Stats & metrics
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
│   │   └── authStore.ts            # 🔒 Zustand store (JWT + BU)
│   │
│   └── modules/                    # 🎯 Business modules
│       ├── inventory/              # Assets management
│       ├── clients/                # Client management
│       ├── purchases/              # Procurement
│       └── rental/                 # Quotations & contracts
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

## 🔐 Authentication Flow

```
┌────────────────────────────────────────────────────────┐
│              User Access Application                   │
└─────────────────────┬──────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   LoginPage.tsx        │
         │   - Email & Password   │
         │   - Call auth.service  │
         └────────┬───────────────┘
                  │
                  ▼
     ┌────────────────────────────────┐
     │   authStore.ts (Zustand)       │
     │   - Save JWT token             │
     │   - Save user info             │
     │   - localStorage persistence   │
     └────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  SelectBusinessUnitPage.tsx             │
│  - Show available BUs for tenant        │
│  - User selects BU                      │
│  - Store BU in authStore                │
└─────────────┬───────────────────────────┘
              │
              ▼
    ┌─────────────────────────────────────┐
    │   ProtectedRoute.tsx                │
    │   - Check token exists              │
    │   - Check BU selected               │
    │   - Redirect to login if missing    │
    └─────────┬───────────────────────────┘
              │
              ▼
   ┌──────────────────────────────────────┐
   │   All module pages accessible        │
   │   ✅ JWT auto-attached to requests   │
   │   ✅ BU context in every API call    │
   └──────────────────────────────────────┘
```

---

## 🚀 Router Structure

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

        {/* Inventory module */}
        <Route path="/inventory" element={<AssetsListPage />} />
        <Route path="/inventory/create" element={<AssetCreatePage />} />
        <Route path="/inventory/:id" element={<AssetDetailPage />} />
        <Route path="/inventory/:id/edit" element={<AssetEditPage />} />
        <Route path="/inventory/templates" element={<AssetTemplatesPage />} />
        <Route path="/inventory/templates/create" element={<AssetTemplateCreatePage />} />
        <Route path="/inventory/templates/:id/edit" element={<AssetTemplateEditPage />} />

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
        <Route path="/rental/quotations/create" element={<QuotationCreatePage />} />
        <Route path="/rental/quotations/:id" element={<QuotationDetailPage />} />
        <Route path="/rental/contracts" element={<ContractsListPage />} />
        <Route path="/rental/contracts/:id" element={<ContractDetailPage />} />
      </Route>
    </Route>
  </Routes>
</BrowserRouter>
```

---

## 📦 Current Modules

### 1️⃣ Inventory Module

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

### AuthStore (Zustand)

```typescript
interface AuthState {
  token: string | null;
  user: User | null;
  businessUnit: BusinessUnit | null;

  // Actions
  setAuth: (token: string, user: User) => void;
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

- Token JWT → localStorage
- User info → localStorage
- Selected BU → localStorage

**Auto-logout on:**

- 401 response from API
- Token expiration
- Manual logout

---

## 📱 Navigation Structure

```
┌─────────────────────────────────────────────────┐
│              Navbar (Layout.tsx)                │
│  Logo | Dashboard | Inventario | Compras |     │
│       Clientes | Alquileres | [User Menu]      │
└─────────────────────────────────────────────────┘
│
├─ Dashboard
│   └─ Resumen de stats (activos, clientes, etc.)
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

---

## 🚀 Build & Deployment

- **Platform:** Vercel
- **Build Tool:** Vite 6.4.1
- **Package Manager:** npm
- **Node Version:** 20.x

**Build Command:**

```bash
vite build
```

**Output:**

```
web/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   └── index-[hash].css
└── templates/
```

**Environment Variables:**

```
VITE_API_URL=https://backend.railway.app/api/v1
VITE_APP_NAME=DivancoSaaS
```

---

## 🛠️ Key Technologies

- **Framework:** React 19 + TypeScript 5.7
- **Router:** React Router DOM 7
- **State:** Zustand 5.0 (auth store)
- **HTTP Client:** Axios 1.7.9
- **Forms:** React Hook Form
- **Validation:** Zod schemas
- **Styling:** Tailwind CSS 4.1
- **Build:** Vite 6.4.1
- **Icons:** Lucide React
- **Notifications:** React Hot Toast
- **Date Handling:** date-fns

---

## 📊 Module-to-Backend Mapping

| Frontend Module | Backend Module | Alignment |
| --------------- | -------------- | --------- |
| `inventory/`    | `assets/`      | ✅ 100%   |
| `clients/`      | `clients/`     | ✅ 100%   |
| `purchases/`    | `purchases/`   | ✅ 100%   |
| `rental/`       | `rental/`      | ✅ 100%   |

**Convención de nombres:**

- Frontend usa nombres ES: "Inventario", "Alquileres", "Compras"
- Backend usa nombres EN: "assets", "rental", "purchases"
- Rutas API en inglés, UI en español

---

## 🎯 User Flow Examples

### Creating an Asset

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
7. → Redirect to /inventory/:id
```

### Creating a Quotation

```
1. Click "Alquileres" → "Cotizaciones"
2. Click "Nueva Cotización"
3. Select client
4. Select template
5. Add items:
   - Search asset
   - Set quantity
   - Set price
6. Review totals
7. Click "Guardar"
8. → Generate PDF and redirect
```

---

**Última actualización:** Febrero 2026  
**Versión:** 1.0 - Estructura post-reorganización
