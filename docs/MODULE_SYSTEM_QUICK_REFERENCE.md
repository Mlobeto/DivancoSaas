# 🚀 Quick Reference - Module System

## 📖 Creating a New Module (5 Minutes)

### Step 1: Create Module Definition

**File:** `web/src/modules/[your-module]/module.ts`

```typescript
import { ModuleDefinition } from '@/product';
import { lazy } from 'react';

// Lazy load your pages
const MainPage = lazy(() => import('./pages/MainPage'));
const CreatePage = lazy(() => import('./pages/CreatePage'));

export const yourModule: ModuleDefinition = {
  id: 'your-module',
  name: 'Your Module Name',
  description: 'What this module does',
  version: '1.0.0',

  routes: [
    { path: '/your-module', element: <MainPage /> },
    { path: '/your-module/new', element: <CreatePage /> },
  ],

  navigation: [
    {
      id: 'your-module',
      label: 'Your Module',
      path: '/your-module',
      icon: 'your-icon',
      order: 50,
    },
  ],

  permissions: ['your-module:read'],

  onInit: async () => console.log('[Your Module] Initialized'),
};
```

### Step 2: Export from Index

**File:** `web/src/modules/[your-module]/index.ts`

```typescript
// Module Definition (add this at the top)
export { yourModule } from "./module";

// ... rest of exports
```

### Step 3: Register Module

**File:** `web/src/app/module-loader/loadModules.ts`

```typescript
const [
  { rentalModule },
  { inventoryModule },
  { clientsModule },
  { purchasesModule },
  { yourModule }, // ← Add here
] = await Promise.all([
  import("@/modules/rental"),
  import("@/modules/inventory"),
  import("@/modules/clients"),
  import("@/modules/purchases"),
  import("@/modules/[your-module]"), // ← And here
]);

moduleRegistry.registerAll([
  inventoryModule,
  clientsModule,
  purchasesModule,
  rentalModule,
  yourModule, // ← And here
]);
```

### Step 4: Add Feature Flag (Optional)

**File:** `web/src/product/feature-flags.ts`

```typescript
export interface FeatureFlags {
  "module.your-module": boolean; // ← Add this
  // ... rest
}

export const defaultFeatureFlags: FeatureFlags = {
  "module.your-module": true, // ← Enable by default
  // ... rest
};
```

### Step 5: Test

```bash
npm run dev
# Check console for: [Your Module] Initialized
# Verify navigation shows your module
# Test routes work
```

**Done!** 🎉

---

## 🔍 Common Patterns

### Navigation with Submenu

```typescript
navigation: [
  {
    id: 'parent',
    label: 'Parent',
    icon: 'icon-name',
    order: 30,
    children: [
      { id: 'child1', label: 'Child 1', path: '/parent/child1', order: 1 },
      { id: 'child2', label: 'Child 2', path: '/parent/child2', order: 2 },
    ],
  },
],
```

### Nested Routes

```typescript
routes: [
  { path: '/module', element: <ListPage /> },
  { path: '/module/:id', element: <DetailPage /> },
  { path: '/module/:id/edit', element: <EditPage /> },
  { path: '/module/new', element: <CreatePage /> },
],
```

### Conditional Module

```typescript
isEnabled: (context) => {
  // Only show for specific tenants
  return context.tenantId === 'special-tenant-id';
},
```

### With Permissions

```typescript
permissions: ['module:read', 'module:write'],

navigation: [
  {
    id: 'nav-item',
    label: 'Item',
    path: '/path',
    permissions: ['module:write'], // Only if user can write
  },
],
```

### With Badge (Notifications)

```typescript
navigation: [
  {
    id: 'nav-item',
    label: 'Item',
    path: '/path',
    badge: () => {
      // Return count or null
      const count = useNotificationsStore.getState().unreadCount;
      return count > 0 ? count : null;
    },
  },
],
```

---

## 🎨 Available Icons

Add to `DynamicNavigation.tsx`:

```typescript
const iconMap: Record<string, React.ReactNode> = {
  'dashboard': <LayoutDashboard />,
  'inventory': <Package />,
  'clients': <Users />,
  'purchases': <ShoppingCart />,
  'rental': <FileText />,
  'your-icon': <YourIcon />, // ← Add here
};
```

---

## 🧪 Testing Your Module

### Check Registration

```typescript
import { moduleRegistry } from "@/product";

// In browser console:
moduleRegistry.getStats();
// Should show your module in moduleIds array
```

### Check Routes

```typescript
import { moduleRegistry, createModuleContext } from "@/product";
import { useAuthStore } from "@/store/authStore";

const { user, businessUnit } = useAuthStore.getState();
const context = createModuleContext(
  user.tenantId,
  businessUnit.id,
  user.permissions,
);
const routes = moduleRegistry.getRoutes(context);

console.log(routes); // Should include your routes
```

### Check Navigation

```typescript
import { navigationBuilder, createModuleContext } from "@/product";

const navigation = navigationBuilder.buildNavigation(context);
console.log(navigation); // Should include your nav items
```

---

## 🐛 Troubleshooting

### Module Not Showing

1. Check console for registration errors
2. Verify module exported from `index.ts`
3. Verify module imported in `loadModules.ts`
4. Check feature flag enabled
5. Check user has required permissions

### Routes Not Working

1. Verify path starts with `/`
2. Check for route conflicts (duplicate paths)
3. Ensure lazy import path is correct
4. Check component is exported

### Navigation Not Rendering

1. Verify `navigation` array is not empty
2. Check `order` property for sorting
3. Ensure user has permissions
4. Check icon name exists in iconMap

### TypeScript Errors

1. Restart TS server: Ctrl+Shift+P → "Restart TS Server"
2. Check imports use correct paths (`@/modules/...`)
3. Verify `ModuleDefinition` type is imported
4. Run `npm run type-check`

---

## 📚 Type Reference

### ModuleDefinition

```typescript
interface ModuleDefinition {
  id: string; // unique-id
  name: string; // Display Name
  description?: string; // Optional description
  version?: string; // e.g., '1.0.0'
  vertical?: string; // e.g., 'construction'
  routes: RouteObject[]; // React Router routes
  navigation: NavigationItem[]; // Nav menu items
  permissions?: string[]; // Required perms
  isEnabled?: (context) => boolean; // Conditional enable
  onInit?: () => void | Promise<void>; // Lifecycle hook
  onDestroy?: () => void; // Cleanup hook
  dependencies?: string[]; // Other module IDs
}
```

### NavigationItem

```typescript
interface NavigationItem {
  id: string; // unique-id
  label: string; // Display text
  path?: string; // Route path
  icon?: string; // Icon name
  order?: number; // Sort order (lower = first)
  children?: NavigationItem[]; // Submenu items
  permissions?: string[]; // Required perms
  badge?: () => string | number | null; // Notification badge
}
```

---

## 🔧 Utility Functions

### Get Current Module Context

```typescript
import { createModuleContext } from "@/product";
import { useAuthStore } from "@/store/authStore";

const { user, businessUnit } = useAuthStore.getState();
const context = createModuleContext(
  user.tenantId,
  businessUnit.id,
  user.permissions,
);
```

### Check Feature Flag

```typescript
import { featureFlagService } from "@/product";

if (featureFlagService.isModuleEnabled("your-module")) {
  // Module is enabled
}
```

### Get Module by ID

```typescript
import { moduleRegistry } from "@/product";

const module = moduleRegistry.getModule("your-module");
console.log(module?.name);
```

---

## 📦 File Templates

### Minimal Module

```typescript
import { ModuleDefinition } from '@/product';
import { lazy } from 'react';

const MainPage = lazy(() => import('./pages/MainPage'));

export const minimalModule: ModuleDefinition = {
  id: 'minimal',
  name: 'Minimal',
  routes: [{ path: '/minimal', element: <MainPage /> }],
  navigation: [{ id: 'minimal', label: 'Minimal', path: '/minimal' }],
};
```

### Full Module Example

See: `web/src/modules/rental/module.ts`

---

## 🎯 Best Practices

✅ **DO:**

- Use `lazy()` for all page imports
- Add `order` to navigation items
- Include `onInit` for logging
- Test with feature flag disabled
- Document required permissions

❌ **DON'T:**

- Import from other modules directly
- Hardcode tenant/user data
- Skip error handling in `onInit`
- Forget to export module from index
- Use very low order numbers (conflicts)

---

## 📊 Module Checklist

When creating a module, verify:

- [ ] `module.ts` file created
- [ ] Module exported from `index.ts`
- [ ] Module imported in `loadModules.ts`
- [ ] Module registered in `registerAll()`
- [ ] Feature flag added (optional)
- [ ] All routes have valid paths
- [ ] All pages are lazy loaded
- [ ] Navigation items have unique IDs
- [ ] Icon added to iconMap (if new)
- [ ] Permissions documented
- [ ] Module tested in browser
- [ ] Console shows initialization log

---

**Quick Start:** Copy `modules/rental/module.ts` as template! 🚀
