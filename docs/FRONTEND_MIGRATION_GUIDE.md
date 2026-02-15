# 🚀 Frontend Architecture Migration Guide

## Overview

This guide will walk you through migrating from hardcoded routes/navigation to the new **modular, self-registering architecture**.

**Goal:** Enable dynamic module loading with feature flags, without breaking existing functionality.

**Estimated Time:** 2-4 hours

---

## ✅ Prerequisites

- [ ] All changes committed to git (create backup branch recommended)
- [ ] Backend API is stable and accessible
- [ ] Node modules are up to date (`npm install`)
- [ ] Development server is not running

---

## 📋 Migration Steps

### STEP 1: Verify New Structure

All new files should now exist. Verify by checking:

```bash
# Check product layer
ls web/src/product/

# Check app layer
ls web/src/app/

# Check module definitions
ls web/src/modules/*/module.ts
```

**Expected output:**

```
product/
  ├── types/module.types.ts
  ├── feature-flags.ts
  ├── module-registry.ts
  ├── navigation-builder.ts
  └── index.ts

app/
  ├── module-loader/loadModules.ts
  ├── router/AppRouter.tsx
  ├── navigation/DynamicNavigation.tsx
  └── index.ts

modules/
  ├── inventory/module.ts
  ├── clients/module.ts
  ├── purchases/module.ts
  └── rental/module.ts
```

---

### STEP 2: Update vite.config.ts

Add path alias for `@/app` and `@/product`:

**File:** `web/vite.config.ts`

```typescript
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/app": path.resolve(__dirname, "./src/app"),
      "@/product": path.resolve(__dirname, "./src/product"),
      "@/core": path.resolve(__dirname, "./src/core"),
      "@/modules": path.resolve(__dirname, "./src/modules"),
      "@/shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  // ... rest of config
});
```

---

### STEP 3: Update tsconfig.json

Add path mappings for TypeScript:

**File:** `web/tsconfig.json`

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./src/app/*"],
      "@/product/*": ["./src/product/*"],
      "@/core/*": ["./src/core/*"],
      "@/modules/*": ["./src/modules/*"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

---

### STEP 4: Refactor main.tsx (Critical)

This is the main entry point that needs to be updated.

#### BEFORE (current):

**File:** `web/src/main.tsx`

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'

// Core pages
import LoginPage from './core/pages/LoginPage'
import DashboardPage from './core/pages/DashboardPage'
// ... many hardcoded imports

// Modules
import { AssetsListPage } from './modules/inventory'
// ... many more imports

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* ... 50+ hardcoded routes */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
```

#### AFTER (new architecture):

**File:** `web/src/main.tsx`

```typescript
import { StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import './index.css'

import { loadModules } from '@/app'
import { createAppRouter } from '@/app'
import LoadingSpinner from '@/shared/components/LoadingSpinner'

// Loading fallback
const AppLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner />
    <p className="ml-4 text-gray-600">Loading application...</p>
  </div>
);

// Initialize app
async function initializeApp() {
  console.log('[App] Initializing...');

  try {
    // Load all modules
    await loadModules();

    // Create router with dynamic routes
    const router = createAppRouter();

    // Render app
    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <Suspense fallback={<AppLoader />}>
          <RouterProvider router={router} />
        </Suspense>
      </StrictMode>
    );

    console.log('[App] Initialized successfully');
  } catch (error) {
    console.error('[App] Failed to initialize:', error);

    // Show error UI
    createRoot(document.getElementById('root')!).render(
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Error loading application
          </h1>
          <p className="text-gray-600">
            Please refresh the page or contact support.
          </p>
          <pre className="mt-4 text-sm text-left bg-gray-100 p-4 rounded">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}

// Start app
initializeApp();
```

**Key changes:**

- ✅ No hardcoded route imports
- ✅ Dynamic module loading
- ✅ Lazy loading with Suspense
- ✅ Error boundary for initialization

---

### STEP 5: Update Layout.tsx (Navigation)

Replace hardcoded navigation with dynamic rendering.

#### BEFORE:

**File:** `web/src/core/components/Layout.tsx`

```typescript
// Hardcoded navigation
<nav>
  <Link to="/dashboard">Dashboard</Link>
  <Link to="/inventory">Inventario</Link>
  <Link to="/clients">Clientes</Link>
  {/* ... etc */}
</nav>
```

#### AFTER:

**File:** `web/src/core/components/Layout.tsx`

```typescript
import DynamicNavigation from '@/app/navigation/DynamicNavigation';

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="logo">
          {/* Your logo here */}
        </div>

        {/* Replace hardcoded nav with dynamic */}
        <DynamicNavigation />

        <div className="user-menu">
          {/* User menu here */}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
```

---

### STEP 6: Add Lazy Loading Wrapper (Optional but Recommended)

Wrap each page with Suspense for better loading experience.

**File:** `web/src/shared/components/PageLoader.tsx`

```typescript
import { Suspense, ReactNode } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface PageLoaderProps {
  children: ReactNode;
}

export default function PageLoader({ children }: PageLoaderProps) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
```

Then wrap routes in module definitions:

```typescript
routes: [
  {
    path: '/inventory',
    element: (
      <PageLoader>
        <AssetsListPage />
      </PageLoader>
    ),
  },
]
```

---

### STEP 7: Test Core Functionality

Start the dev server and test:

```bash
cd web
npm run dev
```

**Test checklist:**

- [ ] App loads without errors
- [ ] Login page accessible
- [ ] Dashboard loads after login
- [ ] Navigation sidebar renders dynamically
- [ ] All modules appear in navigation
- [ ] Each module's main page loads
- [ ] Deep links work (e.g., `/inventory/templates`)
- [ ] 404 redirects work
- [ ] Browser back/forward buttons work
- [ ] Console shows module initialization logs

**Expected console output:**

```
[ModuleLoader] Loading modules...
[ModuleRegistry] Registered module: inventory
[ModuleRegistry] Registered module: clients
[ModuleRegistry] Registered module: purchases
[ModuleRegistry] Registered module: rental
[ModuleLoader] Loaded 4/4 modules
[ModuleRegistry] Initializing modules...
[Inventory Module] Initialized
[Clients Module] Initialized
[Purchases Module] Initialized
[Rental Module] Initialized
[ModuleRegistry] Initialized 4 modules
[AppRouter] Building routes for 27 module routes
[App] Initialized successfully
```

---

### STEP 8: Verify Backward Compatibility

Test all existing URLs still work:

```bash
# Inventory
http://localhost:5173/inventory
http://localhost:5173/inventory/templates
http://localhost:5173/inventory/new

# Clients
http://localhost:5173/clients
http://localhost:5173/clients/new

# Purchases
http://localhost:5173/purchases
http://localhost:5173/purchases/suppliers

# Rental
http://localhost:5173/rental/quotations
http://localhost:5173/rental/contracts
```

All should load without 404 errors.

---

### STEP 9: Configure Feature Flags (Optional)

Test disabling a module via feature flags.

**File:** `web/src/product/feature-flags.ts`

```typescript
export const defaultFeatureFlags: FeatureFlags = {
  "module.inventory": true,
  "module.clients": true,
  "module.purchases": false, // Disable purchases module
  "module.rental": true,
  // ...
};
```

Restart app and verify:

- [ ] Purchases doesn't appear in navigation
- [ ] `/purchases` redirects to 404
- [ ] Other modules still work

**Revert the change** after testing.

---

### STEP 10: Clean Up (Optional)

If everything works, you can now remove old code:

1. **Remove unused imports from old main.tsx** (backup first)
2. **Remove hardcoded navigation from Layout.tsx** (already done in Step 5)
3. **Document the new architecture** for your team

---

## 🚨 Troubleshooting

### Problem: "Cannot find module '@/product'"

**Solution:**

- Verify vite.config.ts has path aliases
- Restart dev server: `Ctrl+C`, then `npm run dev`
- Clear Vite cache: `rm -rf node_modules/.vite`

---

### Problem: "Suspense boundary not yet ready"

**Solution:**

- Ensure all lazy imports use `lazy()` from React
- Wrap RouterProvider in `<Suspense>` with fallback

---

### Problem: Navigation not rendering

**Solution:**

- Check console for module registration errors
- Verify `loadModules()` completes successfully
- Ensure user has permissions (check `authStore`)

---

### Problem: Routes return 404

**Solution:**

- Check `buildRoutes()` output in console
- Verify module routes array is not empty
- Ensure `createAppRouter()` is called AFTER `loadModules()`

---

### Problem: TypeScript errors on module imports

**Solution:**

- Update tsconfig.json with path mappings (Step 3)
- Restart TS server in VSCode: Ctrl+Shift+P → "Restart TS Server"
- Run `npm run type-check` to see errors

---

## 🎯 Rollback Plan

If migration fails, rollback is simple:

1. **Restore main.tsx from backup**
2. **Restore Layout.tsx from backup**
3. **Keep new architecture files** (for next attempt)

The new files don't interfere with old code, so partial migration is safe.

---

## 📊 Success Criteria

Migration is complete when:

- ✅ All existing functionality works
- ✅ No console errors
- ✅ All URLs backward compatible
- ✅ Navigation renders dynamically
- ✅ Modules can be disabled via feature flags
- ✅ Dev build time improved (lazy loading)
- ✅ Production build successful

---

## 🔜 Next Steps

After successful migration:

1. **Load feature flags from backend** (implement API call in `feature-flags.ts`)
2. **Add module permissions** by role
3. **Create vertical-specific modules** (construction, events, etc.)
4. **Implement module marketplace** (enable/disable per tenant)
5. **Add telemetry** (track module usage)

---

## 📚 Reference

- **Module Definition:** `web/src/product/types/module.types.ts`
- **Feature Flags:** `web/src/product/feature-flags.ts`
- **Module Registry:** `web/src/product/module-registry.ts`
- **App Router:** `web/src/app/router/AppRouter.tsx`
- **Example Module:** `web/src/modules/rental/module.ts`

---

**Questions or issues?** Check the risk analysis document for common pitfalls.

**Last updated:** February 14, 2026
