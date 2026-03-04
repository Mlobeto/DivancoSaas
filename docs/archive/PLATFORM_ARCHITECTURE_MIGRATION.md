> ⚠️ **ESTADO DOCUMENTAL:** Histórico / Legacy de migración  
> Checklist de una migración puntual; puede no reflejar estructura final ni nomenclatura actual.  
> Usar documentación vigente en: [README.md](./README.md).

# 🏗️ Platform Architecture Migration Checklist

**Date:** February 15, 2026  
**Status:** Infrastructure Complete | Module Migration In Progress

---

## ✅ Phase 1: Infrastructure (COMPLETED)

### Types Created

- ✅ [web/src/product/types/core.types.ts](web/src/product/types/core.types.ts) - CoreModuleDefinition
- ✅ [web/src/product/types/vertical.types.ts](web/src/product/types/vertical.types.ts) - VerticalDefinition

### Registries Created

- ✅ [web/src/product/core-registry.ts](web/src/product/core-registry.ts) - Core module registry
- ✅ [web/src/product/vertical-registry.ts](web/src/product/vertical-registry.ts) - Vertical registry

### Infrastructure Updated

- ✅ [web/src/product/index.ts](web/src/product/index.ts) - Exports new types & registries
- ✅ [web/src/app/module-loader/loadPlatformModules.ts](web/src/app/module-loader/loadPlatformModules.ts) - New loader
- ✅ [web/src/app/router/AppRouter.tsx](web/src/app/router/AppRouter.tsx) - Uses verticalRegistry
- ✅ [web/src/product/navigation-builder.ts](web/src/product/navigation-builder.ts) - Uses verticalRegistry

---

## 🚧 Phase 2: Module Migration (IN PROGRESS)

### Step 1: Create Core Directory Structure

```
web/src/core/
├── inventory/
│   ├── module.ts          → inventoryCoreModule
│   ├── index.ts
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── types/
├── clients/
│   ├── module.ts          → clientsCoreModule
│   ├── index.ts
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── types/
├── purchases/
│   ├── module.ts          → purchasesCoreModule
│   ├── index.ts
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── types/
└── maintenance/          (FUTURE)
    └── ...
```

### Step 2: Convert Existing Modules to Core

Each existing module needs:

1. **Move files:**

   ```bash
   # Inventory
   mv web/src/modules/inventory web/src/core/inventory

   # Clients
   mv web/src/modules/clients web/src/core/clients

   # Purchases
   mv web/src/modules/purchases web/src/core/purchases
   ```

2. **Update module.ts:**

   ```typescript
   // OLD (web/src/modules/inventory/module.ts)
   export const inventoryModule: ModuleDefinition = {
     id: "inventory",
     name: "Inventario",
     // ...
   };

   // NEW (web/src/core/inventory/module.ts)
   import { CoreModuleDefinition } from "@/product";

   export const inventoryCoreModule: CoreModuleDefinition = {
     type: "core",
     category: "inventory",
     id: "inventory",
     name: "Inventario",
     // ... rest stays the same
   };
   ```

3. **Update index.ts:**

   ```typescript
   // Export core module
   export { inventoryCoreModule } from "./module";

   // Export everything else as before
   export * from "./types/...";
   export * from "./services/...";
   // etc.
   ```

### Step 3: Create Verticals Directory Structure

```
web/src/verticals/
└── rental/
    ├── vertical.ts       → rentalVertical (VerticalDefinition)
    ├── index.ts
    ├── pages/           (rental-specific pages)
    ├── components/      (rental-specific components)
    ├── services/        (rental orchestration logic)
    └── types/           (rental-specific types)
```

### Step 4: Create Rental Vertical

**web/src/verticals/rental/vertical.ts:**

```typescript
import { VerticalDefinition } from "@/product";
import { lazy } from "react";

// Lazy load rental-specific pages
const QuotationsListPage = lazy(() =>
  import("./pages/QuotationsListPage").then((m) => ({
    default: m.QuotationsListPage,
  })),
);
// ... other rental pages

export const rentalVertical: VerticalDefinition = {
  id: "rental",
  name: "Alquileres",
  description: "Gestión completa de alquileres y contratos",
  version: "1.0.0",
  industry: "equipment-rental",

  // Declare required core modules
  requiredCoreModules: [
    "inventory", // Need assets for rental
    "clients", // Need clients to rent to
    "purchases", // May need supplies
  ],

  // Rental-specific routes
  routes: [
    {
      path: "/rental/quotations",
      element: QuotationsListPage,
    },
    // ... more rental routes
  ],

  // Rental-specific navigation (takes priority)
  navigation: [
    {
      id: "rental",
      label: "Alquileres",
      icon: "rental",
      order: 10, // Higher priority than core
      children: [
        {
          id: "rental-quotations",
          label: "Cotizaciones",
          path: "/rental/quotations",
          order: 1,
        },
        // ...
      ],
    },
  ],
};
```

**web/src/verticals/rental/index.ts:**

```typescript
export { rentalVertical } from "./vertical";

// Export rental-specific exports
export * from "./pages/QuotationsListPage";
export * from "./pages/ContractsListPage";
// ... etc
```

---

## 📋 Migration Execution Plan

### Actions Required:

#### 1. Create Core Modules (Priority: HIGH)

- [ ] Create `web/src/core/` directory
- [ ] Move & convert inventory module
  - [ ] Move files: `mv web/src/modules/inventory web/src/core/inventory`
  - [ ] Update module.ts to CoreModuleDefinition
  - [ ] Update imports in module.ts (change @/modules/_ to @/core/_)
  - [ ] Export as `inventoryCoreModule`
- [ ] Move & convert clients module
  - [ ] Move files
  - [ ] Update module.ts
  - [ ] Export as `clientsCoreModule`
- [ ] Move & convert purchases module
  - [ ] Move files
  - [ ] Update module.ts
  - [ ] Export as `purchasesCoreModule`

#### 2. Create Rental Vertical (Priority: HIGH)

- [ ] Create `web/src/verticals/` directory
- [ ] Move rental pages: `mv web/src/modules/rental web/src/verticals/rental`
- [ ] Create `vertical.ts` with VerticalDefinition
- [ ] Update rental imports (change @/modules/\* to proper core imports)
- [ ] Export as `rentalVertical`

#### 3. Update Vite Config (Priority: HIGH)

- [ ] Add path alias for `@/core/*`
- [ ] Add path alias for `@/verticals/*`

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/verticals": path.resolve(__dirname, "./src/verticals"),
      // ... existing aliases
    },
  },
});
```

#### 4. Update TypeScript Config (Priority: HIGH)

- [ ] Add paths for `@/core/*`
- [ ] Add paths for `@/verticals/*`

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/core/*": ["./src/core/*"],
      "@/verticals/*": ["./src/verticals/*"]
    }
  }
}
```

#### 5. Update Main.tsx (Priority: HIGH)

- [ ] Change import from `loadModules` to `loadPlatformModules`
- [ ] Update function call

```typescript
// main.tsx
import { loadPlatformModules } from "@/app/module-loader/loadPlatformModules";

// In App component
useEffect(() => {
  loadPlatformModules()
    .then(() => setModulesLoaded(true))
    .catch((error) => {
      console.error("[App] Failed to load platform:", error);
    });
}, []);
```

#### 6. Clean Up Old Files (Priority: LOW)

- [ ] Delete `web/src/modules/` directory (after verifying migration works)
- [ ] Delete `web/src/app/module-loader/loadModules.ts` (keep for rollback initially)
- [ ] Mark `module-registry.ts` as deprecated

---

## 🧪 Testing Checklist

After migration, verify:

- [ ] `npm run build` succeeds without errors
- [ ] All existing routes still work (no 404s)
- [ ] Navigation renders correctly
- [ ] Inventory pages load
- [ ] Clients pages load
- [ ] Purchases pages load
- [ ] Rental pages load
- [ ] Feature flags still work
- [ ] Lazy loading still works
- [ ] Console shows correct initialization:
  ```
  [PlatformLoader] Loading CORE modules...
  [CoreRegistry] Registered core module: inventory (inventory)
  [CoreRegistry] Registered core module: clients (clients)
  [CoreRegistry] Registered core module: purchases (purchases)
  [PlatformLoader] CORE modules loaded and locked
  [PlatformLoader] Loading VERTICAL modules...
  [VerticalRegistry] Registered vertical: rental (equipment-rental)
  [PlatformLoader] VERTICAL modules loaded and locked
  ```

---

## ⚠️ Risk Mitigation

### Rollback Plan

1. Keep old `loadModules.ts` temporarily
2. Keep old `module-registry.ts` temporarily
3. Create git branch: `git checkout -b feat/platform-architecture`
4. Commit infrastructure first: `git commit -m "feat: add platform architecture infrastructure"`
5. Commit migrations separately: `git commit -m "feat: migrate rental to vertical"`

### Breaking Change Prevention

- ✅ Route paths remain unchanged
- ✅ Component exports remain unchanged
- ✅ Service exports remain unchanged
- ✅ Type exports remain unchanged
- ✅ Only internal module definitions change

---

## 📊 Dependency Diagram

```
┌─────────────────────────────────────┐
│          Main Application           │
│         (main.tsx)                  │
└───────────┬─────────────────────────┘
            │
            ▼
┌───────────────────────────────────────┐
│      loadPlatformModules()            │
└───────┬───────────────┬───────────────┘
        │               │
        ▼               ▼
┌───────────────┐  ┌────────────────────┐
│ Core Registry │  │ Vertical Registry  │
└───────┬───────┘  └─────────┬──────────┘
        │                   │
        ▼                    ▼
┌───────────────┐  ┌─────────────────────┐
│ CORE MODULES  │──│  VERTICAL MODULES   │
│               │  │  (depends on core)  │
│ - inventory   │  │                     │
│ - clients     │  │  - rental          │
│ - purchases   │  │                     │
└───────────────┘  └─────────────────────┘
```

---

## 🎯 Success Criteria

Migration is successful when:

1. ✅ Infrastructure compiles without errors
2. [ ] All modules moved to correct directories
3. [ ] All imports updated correctly
4. [ ] Build succeeds: `npm run build`
5. [ ] All existing routes work
6. [ ] Navigation renders correctly
7. [ ] No console errors
8. [ ] Feature flags work
9. [ ] Lazy loading works
10. [ ] Core-Vertical separation enforced (lint rule in future)

---

**Next Step:** Execute "Create Core Modules" actions above.
