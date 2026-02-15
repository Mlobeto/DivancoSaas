# Dynamic Router Migration Guide

## 📋 Overview

This document details the complete migration from hardcoded static routes to a 100% dynamic routing system based on module and vertical registries.

### Current State (Before Migration)

```
❌ Routes hardcoded in AppRouter.tsx
❌ Static imports cause large initial bundle
❌ No module-level route configuration
❌ Limited protection/permission system
❌ Difficult to add new routes
❌ No feature flag integration
```

### Target State (After Migration)

```
✅ Routes defined in module/vertical configs
✅ Automatic lazy loading with code splitting
✅ Fine-grained permissions per route
✅ Protection levels (PUBLIC, AUTHENTICATED, ADMIN, OWNER)
✅ Feature flag support
✅ Route metadata (titles, breadcrumbs, icons)
✅ Easy to add new routes (just update config)
```

---

## 🏗️ Architecture

### Component Hierarchy

```
main.tsx
  └─ App Component
      └─ Router (from createAppRouter)
          ├─ Public Routes
          │   ├─ /login
          │   └─ /register
          │
          └─ Protected Routes (ProtectedRoute wrapper)
              ├─ Core Routes
              │   ├─ /dashboard
              │   └─ /
              │
              ├─ Admin Routes (SUPER_ADMIN only)
              │   └─ /admin/modules
              │
              └─ Dynamic Routes (from registries)
                  ├─ Module Routes (inventory, clients, purchases)
                  └─ Vertical Routes (rental)
```

### Data Flow

```
Module/Vertical Definition
  └─ routeConfig: ModuleRouteConfig | VerticalRouteConfig
      └─ DynamicRouteDefinition[]
          └─ RouteBuilder.buildRoute()
              └─ BuiltRoute (React Router RouteObject)
                  └─ createBrowserRouter()
```

---

## 📦 New File Structure

### Created Files

```
web/src/
├── product/
│   ├── types/
│   │   └── route.types.ts          # Route type system (NEW)
│   ├── route-builder.ts            # Route building logic (NEW)
│   └── index.ts                    # Export route-builder (UPDATE)
│
├── app/
│   └── router/
│       └── AppRouter.v2.tsx        # New dynamic router (NEW)
│
├── modules/
│   └── [module]/
│       └── routes.config.ts        # Module route config (NEW per module)
│
└── verticals/
    └── [vertical]/
        └── routes.config.ts        # Vertical route config (NEW per vertical)
```

### Files to Update

```
web/src/
├── product/
│   ├── types/
│   │   ├── module.types.ts         # Add routeConfig field (UPDATE)
│   │   └── vertical.types.ts       # Add routeConfig field (UPDATE)
│   └── index.ts                    # Export new types (UPDATE)
│
├── main.tsx                        # Switch to AppRouter v2 (UPDATE later)
│
└── modules/
    └── [module]/
        └── module.ts               # Add routeConfig reference (UPDATE per module)
```

---

## 🔧 Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

**Status:** All foundation files created

**Files:**

- ✅ `product/types/route.types.ts` - Complete type system
- ✅ `product/route-builder.ts` - Route building logic
- ✅ `app/router/AppRouter.v2.tsx` - New router skeleton

**Example configs created:**

- ✅ `modules/inventory/routes.config.ts` - Inventory example
- ✅ `verticals/rental/routes.config.ts` - Rental example

---

### Phase 2: Type Updates (CURRENT PHASE)

**Goal:** Update existing type definitions to support new route system

#### Step 2.1: Update ModuleDefinition Type

**File:** `web/src/product/types/module.types.ts`

**Add field:**

```typescript
import type { ModuleRouteConfig } from "./route.types";

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;

  // Legacy routes (keep for compatibility)
  routes: ModuleRoute[];

  // NEW: Dynamic route configuration
  routeConfig?: ModuleRouteConfig;

  navigation: NavigationItem[];
  permissions?: string[];
  isEnabled?: (context: ModuleContext) => boolean;
  onInit?: () => void | Promise<void>;
  onDestroy?: () => void;
  dependencies?: string[];
  version?: string;
  vertical?: string;
}
```

#### Step 2.2: Update VerticalDefinition Type

**File:** `web/src/product/types/vertical.types.ts`

**Add field:**

```typescript
import type { VerticalRouteConfig } from "./route.types";

export interface VerticalDefinition {
  id: string;
  name: string;
  description?: string;
  version?: string;
  industry:
    | "construction"
    | "equipment-rental"
    | "fleet"
    | "healthcare"
    | "other";

  requiredCoreModules: string[];
  optionalCoreModules?: string[];

  // Legacy routes (keep for compatibility)
  routes: ModuleRoute[];

  // NEW: Dynamic route configuration
  routeConfig?: VerticalRouteConfig;

  navigation: NavigationItem[];
  dashboard?: ComponentType;
  permissions?: string[];
  isEnabled?: (context: ModuleContext) => boolean;
  onInit?: () => Promise<void>;
  onDestroy?: () => Promise<void>;
  configSchema?: Record<string, any>;
}
```

#### Step 2.3: Export New Types

**File:** `web/src/product/index.ts`

**Add exports:**

```typescript
// Route types
export type {
  DynamicRouteDefinition,
  RouteProtection,
  RouteLayout,
  RouteElement,
  RouteMeta,
  GuardContext,
  ModuleRouteConfig,
  VerticalRouteConfig,
  BuiltRoute,
  RouteBuilderOptions,
  RouteTree,
} from "./types/route.types";

export { RouteProtection, RouteLayout } from "./types/route.types";

// Route builder
export {
  RouteBuilder,
  buildDynamicRoutes,
  getRouteStats,
} from "./route-builder";
```

---

### Phase 3: Registry Integration

**Goal:** Update registries to extract route configs

#### Step 3.1: Update ModuleRegistry

**File:** `web/src/product/module-registry.ts`

**Add method:**

```typescript
import type { ModuleRouteConfig } from "./types/route.types";

class ModuleRegistry {
  // ... existing code ...

  /**
   * Get route configurations from all registered modules
   * NEW: Supports both legacy routes and new routeConfig
   */
  getRouteConfigs(context: ModuleContext): ModuleRouteConfig[] {
    const configs: ModuleRouteConfig[] = [];

    for (const [moduleId, module] of this.modules) {
      // Skip if module is not enabled
      if (module.isEnabled && !module.isEnabled(context)) {
        continue;
      }

      // Check permissions
      if (module.permissions && module.permissions.length > 0) {
        const hasPermission = module.permissions.some((permission) =>
          context.permissions.includes(permission),
        );
        if (!hasPermission) {
          continue;
        }
      }

      // Prefer new routeConfig if available
      if (module.routeConfig) {
        configs.push(module.routeConfig);
      } else if (module.routes && module.routes.length > 0) {
        // Fallback: Convert legacy routes to new format
        console.warn(
          `[ModuleRegistry] Module '${moduleId}' using legacy routes. Please migrate to routeConfig.`,
        );

        // Create temporary config from legacy routes
        configs.push({
          moduleId: module.id,
          basePath: "", // Legacy routes had paths hardcoded
          routes: module.routes.map((r) => ({
            path: r.path || "",
            element: r.element,
            children: r.children,
            index: r.index,
          })),
        });
      }
    }

    return configs;
  }
}
```

#### Step 3.2: Update VerticalRegistry

**File:** `web/src/product/vertical-registry.ts`

**Add method:**

```typescript
import type { VerticalRouteConfig } from "./types/route.types";

class VerticalRegistry {
  // ... existing code ...

  /**
   * Get route configuration from active vertical
   * NEW: Supports both legacy routes and new routeConfig
   */
  getRouteConfig(context: ModuleContext): VerticalRouteConfig | null {
    const vertical = this.getActiveVertical(context);

    if (!vertical) {
      return null;
    }

    // Prefer new routeConfig if available
    if (vertical.routeConfig) {
      return vertical.routeConfig;
    }

    // Fallback: Convert legacy routes to new format
    if (vertical.routes && vertical.routes.length > 0) {
      console.warn(
        `[VerticalRegistry] Vertical '${vertical.id}' using legacy routes. Please migrate to routeConfig.`,
      );

      return {
        verticalId: vertical.id,
        routes: vertical.routes.map((r) => ({
          path: r.path || "",
          element: r.element,
          children: r.children,
          index: r.index,
        })),
      };
    }

    return null;
  }
}
```

---

### Phase 4: Complete AppRouter V2

**Goal:** Integrate registries into AppRouter V2

#### Step 4.1: Connect Registries

**File:** `web/src/app/router/AppRouter.v2.tsx`

**Update buildAllRoutes:**

```typescript
import { moduleRegistry, verticalRegistry } from "@/product";

export function buildAllRoutes(context: ModuleContext): RouteObject[] {
  console.log("[AppRouter V2] Building dynamic routes...");

  const guardContext = buildGuardContext(context);

  // Create route builder
  const builder = new RouteBuilder({
    includePublic: true,
    includeAdmin: guardContext.user?.role === "SUPER_ADMIN",
    context: guardContext,
    debug: import.meta.env.DEV,
  });

  // Transform core routes to BuiltRoutes
  const transformRoute = (route: DynamicRouteDefinition) =>
    builder["buildRoute"](route, {});

  const builtPublicRoutes = publicRoutes.map(transformRoute).filter(Boolean);
  const builtCoreRoutes = coreProtectedRoutes
    .map(transformRoute)
    .filter(Boolean);
  const builtAdminRoutes = adminRoutes.map(transformRoute).filter(Boolean);

  // ========================================
  // NEW: Get routes from registries
  // ========================================

  // Get module route configs (inventory, clients, purchases)
  const moduleConfigs = moduleRegistry.getRouteConfigs(context);
  const builtModuleRoutes = builder.buildFromModules(moduleConfigs);

  // Get vertical route config (rental)
  const verticalConfig = verticalRegistry.getRouteConfig(context);
  const builtVerticalRoutes = verticalConfig
    ? builder.buildFromVertical(verticalConfig)
    : [];

  // Combine all dynamic routes
  const allDynamicRoutes = [...builtModuleRoutes, ...builtVerticalRoutes];

  console.log(
    `[AppRouter V2] Built ${allDynamicRoutes.length} dynamic routes (${builtModuleRoutes.length} module, ${builtVerticalRoutes.length} vertical)`,
  );

  // ========================================
  // Combine all routes
  // ========================================

  const allRoutes: RouteObject[] = [
    // Public routes (no wrapper)
    ...builtPublicRoutes,

    // Protected routes (wrapped in ProtectedRoute)
    {
      element: createElement(ProtectedRoute),
      children: [
        // Core routes
        ...builtCoreRoutes,

        // Admin routes
        ...builtAdminRoutes,

        // Dynamic module/vertical routes
        ...allDynamicRoutes,
      ],
    },
  ];

  // Log statistics
  if (import.meta.env.DEV) {
    const stats = getRouteStats(allDynamicRoutes);
    console.log("[AppRouter V2] Route statistics:", stats);
  }

  return allRoutes;
}
```

---

### Phase 5: Module Migration

**Goal:** Create route configs for all modules

#### Template for Each Module

**File:** `web/src/modules/[module]/routes.config.ts`

```typescript
import { lazy } from "react";
import {
  ModuleRouteConfig,
  RouteProtection,
  RouteLayout,
} from "@/product/types/route.types";

// Lazy load pages
const SomePage = lazy(() =>
  import("./pages/SomePage").then((m) => ({ default: m.SomePage })),
);

export const [module]Routes: ModuleRouteConfig = {
  moduleId: "[module-id]",
  basePath: "/[module]",
  defaultProtection: RouteProtection.AUTHENTICATED,
  defaultLayout: RouteLayout.APP,

  routes: [
    {
      path: "",
      element: SomePage,
      meta: { title: "Title" },
      chunkName: "module-page",
    },
    // ... more routes
  ],
};
```

#### Step 5.1: Migrate Inventory Module

**File:** `web/src/modules/inventory/routes.config.ts` (Already created ✅)

**Update module definition:**

**File:** `web/src/modules/inventory/module.ts`

```typescript
import { inventoryRoutes } from "./routes.config";

export const inventoryModule: ModuleDefinition = {
  id: "inventory",
  name: "Inventory",

  // Keep legacy routes temporarily
  routes: [ ... ],

  // NEW: Add route config
  routeConfig: inventoryRoutes,

  // ... rest unchanged
};
```

#### Step 5.2: Migrate Clients Module

**Create:** `web/src/modules/clients/routes.config.ts`

```typescript
import { lazy } from "react";
import {
  ModuleRouteConfig,
  RouteProtection,
} from "@/product/types/route.types";

const ClientsListPage = lazy(() =>
  import("./pages/ClientsListPage").then((m) => ({
    default: m.ClientsListPage,
  })),
);

const ClientDetailPage = lazy(() =>
  import("./pages/ClientDetailPage").then((m) => ({
    default: m.ClientDetailPage,
  })),
);

const ClientFormPage = lazy(() =>
  import("./pages/ClientFormPage").then((m) => ({ default: m.ClientFormPage })),
);

export const clientsRoutes: ModuleRouteConfig = {
  moduleId: "clients",
  basePath: "/clients",
  defaultProtection: RouteProtection.AUTHENTICATED,

  routes: [
    {
      path: "",
      element: ClientsListPage,
      meta: { title: "Clients", icon: "users" },
    },
    {
      path: "new",
      element: ClientFormPage,
      permissions: ["clients:create", "OWNER", "ADMIN"],
      meta: { title: "New Client" },
    },
    {
      path: ":id",
      element: ClientDetailPage,
      meta: { title: "Client Details" },
    },
    {
      path: ":id/edit",
      element: ClientFormPage,
      permissions: ["clients:update", "OWNER", "ADMIN"],
      meta: { title: "Edit Client" },
    },
  ],
};
```

**Update:** `web/src/modules/clients/module.ts`

```typescript
import { clientsRoutes } from "./routes.config";

export const clientsModule: ModuleDefinition = {
  id: "clients",
  name: "Clients",
  routes: [ ... ], // Keep legacy
  routeConfig: clientsRoutes, // NEW
  // ... rest
};
```

#### Step 5.3: Migrate Purchases Module

**Create:** `web/src/modules/purchases/routes.config.ts`

(Similar pattern to clients)

#### Step 5.4: Migrate Rental Vertical

**File:** `web/src/verticals/rental/routes.config.ts` (Already created ✅)

**Update:** `web/src/verticals/rental/rental.vertical.ts`

```typescript
import { rentalRoutes } from "./routes.config";

export const rentalVertical: VerticalDefinition = {
  id: "rental",
  name: "Alquileres",

  // Keep legacy routes temporarily
  routes: [ ... ],

  // NEW: Add route config
  routeConfig: rentalRoutes,

  // ... rest unchanged
};
```

---

### Phase 6: Switch to New Router

**Goal:** Use AppRouter V2 instead of legacy AppRouter

#### Step 6.1: Test in Parallel

**Option A: A/B Testing**

Add feature flag to switch between routers:

```typescript
// main.tsx
const useNewRouter = localStorage.getItem("use-v2-router") === "true";

const newRouter = useNewRouter
  ? await import("@/app/router/AppRouter.v2")
  : await import("@/app/router/AppRouter");

// Test by setting: localStorage.setItem("use-v2-router", "true")
```

**Option B: Direct Switch (Recommended)**

Once all modules migrated, simply update import:

```typescript
// main.tsx
- import { createAppRouter } from "@/app/router/AppRouter";
+ import { createAppRouter } from "@/app/router/AppRouter.v2";
```

#### Step 6.2: Verify All Routes Work

**Manual Testing Checklist:**

```
✅ Public Routes
  ✅ /login
  ✅ /register

✅ Core Routes
  ✅ /dashboard
  ✅ / (redirects to dashboard)

✅ Admin Routes (test as SUPER_ADMIN)
  ✅ /admin/modules

✅ Module Routes (test as USER)
  ✅ Inventory: /inventory, /inventory/create, /inventory/:id, etc.
  ✅ Clients: /clients, /clients/new, /clients/:id, etc.
  ✅ Purchases: /purchases, /suppliers, /supplies, etc.

✅ Vertical Routes
  ✅ Rental: /rental/quotations, /rental/contracts, etc.

✅ Protection Works
  ✅ Unauthenticated users redirect to /login
  ✅ USER cannot access /admin/*
  ✅ SUPER_ADMIN can access /admin/*
  ✅ Permission checks work per route
```

#### Step 6.3: Monitor Console

**Expected logs:**

```
[AppRouter V2] Building dynamic routes...
[AppRouter V2] Context: tenant=xxx, bu=yyy
[RouteBuilder] Building routes for module: inventory
[RouteBuilder] Building routes for module: clients
[RouteBuilder] Building routes for module: purchases
[RouteBuilder] Building routes for vertical: rental
[AppRouter V2] Built 47 dynamic routes (35 module, 12 vertical)
[AppRouter V2] Route statistics: {
  total: 47,
  byProtection: { authenticated: 42, owner: 5 },
  byLayout: { app: 47 },
  bySource: { inventory: 15, clients: 8, purchases: 12, rental: 12 },
  lazy: 47,
  withGuards: 3
}
[AppRouter V2] Creating router...
```

---

### Phase 7: Cleanup

**Goal:** Remove legacy code

#### Step 7.1: Remove Old Routes from Definitions

**For each module/vertical:**

```typescript
export const someModule: ModuleDefinition = {
  id: "...",
  name: "...",

  // REMOVE legacy routes field
  - routes: [ ... ],

  // Keep only new routeConfig
  routeConfig: someRoutes,

  // ... rest
};
```

#### Step 7.2: Remove Old AppRouter

```bash
# Backup old router
mv web/src/app/router/AppRouter.tsx web/src/app/router/AppRouter.legacy.tsx

# Rename new router
mv web/src/app/router/AppRouter.v2.tsx web/src/app/router/AppRouter.tsx
```

#### Step 7.3: Update Type Definitions

Remove legacy route fields:

```typescript
// module.types.ts
export interface ModuleDefinition {
  // ...
  - routes: ModuleRoute[]; // REMOVE
  routeConfig: ModuleRouteConfig; // Make required (remove ?)
  // ...
}
```

#### Step 7.4: Remove Legacy Route Transform Code

**Remove from registries:**

```typescript
// module-registry.ts
class ModuleRegistry {
  // REMOVE transformRoute method
  // REMOVE getRoutes method
  // Keep only getRouteConfigs
}
```

---

## 🔍 Verification TODOs

### Before Going to Production

- [ ] All modules have `routeConfig` defined
- [ ] All verticals have `routeConfig` defined
- [ ] No console warnings about "using legacy routes"
- [ ] All routes working in dev mode
- [ ] All routes working in production build
- [ ] Bundle sizes reasonable (check chunk sizes)
- [ ] Lazy loading working (network tab shows chunks)
- [ ] Protection levels enforced correctly
- [ ] Permission checks working
- [ ] Feature flags working
- [ ] Route metadata available (titles, breadcrumbs)
- [ ] No 404s from removed legacy routes
- [ ] Navigation menu still works
- [ ] Deep links work (refresh on any route)

### Performance Checks

```bash
# Build and analyze
npm run build
npx vite-bundle-visualizer

# Look for:
# - Initial bundle < 300KB
# - Each module chunk < 100KB
# - No duplicate code in chunks
# - Lazy routes load on navigation
```

---

## 🚨 Rollback Plan

If issues occur after deploying new router:

### Quick Rollback

**Step 1:** Revert main.tsx import

```typescript
// main.tsx
- import { createAppRouter } from "@/app/router/AppRouter";
+ import { createAppRouter } from "@/app/router/AppRouter.legacy";
```

**Step 2:** Deploy

Old router still has all legacy routes, everything works as before.

### Gradual Rollback

If specific modules have issues:

**Step 1:** Comment out routeConfig

```typescript
// module.ts
export const someModule: ModuleDefinition = {
  routes: [ ... ], // Legacy routes still here
  // routeConfig: someRoutes, // Disable new system
};
```

**Step 2:** Registry falls back to legacy routes automatically

---

## 📚 Reference Examples

### Complete Module Example

See: `web/src/modules/inventory/routes.config.ts`

### Complete Vertical Example

See: `web/src/verticals/rental/routes.config.ts`

### Type Reference

See: `web/src/product/types/route.types.ts`

### Route Builder Reference

See: `web/src/product/route-builder.ts`

---

## 🎯 Success Criteria

Migration is complete when:

1. ✅ No routes hardcoded in AppRouter (except core)
2. ✅ All modules use `routeConfig` field
3. ✅ All verticals use `routeConfig` field
4. ✅ No "legacy routes" warnings in console
5. ✅ Bundle properly split (many small chunks)
6. ✅ All routes lazy-loaded
7. ✅ Protection/permissions working
8. ✅ Feature flags working
9. ✅ Route metadata available
10. ✅ Documentation updated

---

## 📞 Support

Questions? Issues?

1. Check this migration guide
2. Check example files (inventory, rental)
3. Check type definitions (route.types.ts)
4. Check route builder code (route-builder.ts)
5. Review console logs (route stats, warnings)

---

**Last Updated:** February 2026  
**Version:** 1.0  
**Status:** Phase 1 Complete, Ready for Phase 2
