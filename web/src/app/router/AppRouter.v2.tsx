/**
 * Dynamic App Router V2 - Full Dynamic Routing System
 *
 * 100% dynamic router that generates all routes from registries.
 * NO hardcoded route declarations (except core system routes).
 *
 * Architecture:
 * - Core routes (login, dashboard) defined here
 * - Module routes from moduleRegistry
 * - Vertical routes from verticalRegistry
 * - All business routes lazy-loaded
 * - Protection levels applied automatically
 */

import {
  createBrowserRouter,
  Navigate,
  type RouteObject,
} from "react-router-dom";
import { createElement, lazy } from "react";
import { RouteBuilder, getRouteStats } from "@/product/route-builder";
import {
  DynamicRouteDefinition,
  RouteProtection,
  RouteLayout,
  GuardContext,
  BuiltRoute,
} from "@/product/types/route.types";
import type { ModuleContext } from "@/product";
import { moduleRegistry, verticalRegistry } from "@/product";
import { useAuthStore } from "@/store/auth.store";

//================================================================
// CORE COMPONENTS (Lazy Loaded)
//================================================================

const ProtectedRoute = lazy(() =>
  import("@/core/components/ProtectedRoute").then((m) => ({
    default: m.ProtectedRoute,
  })),
);

const LoginPage = lazy(() =>
  import("@/core/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);

const RegisterPage = lazy(() =>
  import("@/core/pages/RegisterPage").then((m) => ({
    default: m.RegisterPage,
  })),
);

const DashboardPage = lazy(() =>
  import("@/core/pages/DashboardPage").then((m) => ({
    default: m.DashboardPage,
  })),
);

const TenantListPage = lazy(() =>
  import("@/core/pages/admin").then((m) => ({ default: m.TenantListPage })),
);

const TenantFormPage = lazy(() =>
  import("@/core/pages/admin").then((m) => ({ default: m.TenantFormPage })),
);

//================================================================
// CORE ROUTE DEFINITIONS
//================================================================
// These are the only hardcoded routes. Everything else is dynamic.

/**
 * Public routes (no authentication required)
 */
const publicRoutes: DynamicRouteDefinition[] = [
  {
    path: "/login",
    element: LoginPage,
    protection: RouteProtection.PUBLIC,
    layout: RouteLayout.AUTH,
    meta: {
      title: "Login",
    },
  },
  {
    path: "/register",
    element: RegisterPage,
    protection: RouteProtection.PUBLIC,
    layout: RouteLayout.AUTH,
    meta: {
      title: "Register",
    },
  },
];

/**
 * Core protected routes (require authentication)
 */
const coreProtectedRoutes: DynamicRouteDefinition[] = [
  {
    path: "/",
    element: createElement(Navigate, { to: "/dashboard", replace: true }),
    protection: RouteProtection.AUTHENTICATED,
  },
  {
    path: "/dashboard",
    element: DashboardPage,
    protection: RouteProtection.AUTHENTICATED,
    layout: RouteLayout.APP,
    meta: {
      title: "Dashboard",
      icon: "home",
    },
  },
];

/**
 * Admin routes (SUPER_ADMIN only)
 */
const adminRoutes: DynamicRouteDefinition[] = [
  {
    path: "/admin/tenants",
    element: TenantListPage,
    protection: RouteProtection.ADMIN,
    layout: RouteLayout.APP,
    permissions: ["SUPER_ADMIN"],
    guard: (context) => {
      return context.user?.role === "SUPER_ADMIN";
    },
    meta: {
      title: "Tenants",
      icon: "building-2",
    },
  },
  {
    path: "/admin/tenants/new",
    element: TenantFormPage,
    protection: RouteProtection.ADMIN,
    layout: RouteLayout.APP,
    permissions: ["SUPER_ADMIN"],
    guard: (context) => {
      return context.user?.role === "SUPER_ADMIN";
    },
    meta: {
      title: "Nuevo Tenant",
    },
  },
  {
    path: "/admin/tenants/:id/edit",
    element: TenantFormPage,
    protection: RouteProtection.ADMIN,
    layout: RouteLayout.APP,
    permissions: ["SUPER_ADMIN"],
    guard: (context) => {
      return context.user?.role === "SUPER_ADMIN";
    },
    meta: {
      title: "Editar Tenant",
    },
  },
];

/**
 * Developer routes (DEVELOPER role - read-only system tools)
 */
const developerRoutes: DynamicRouteDefinition[] = [
  {
    path: "/dev/logs",
    element: createElement("div", null, "System Logs (TODO)"),
    protection: RouteProtection.ADMIN,
    permissions: ["DEVELOPER", "SUPER_ADMIN"],
    guard: (context) => {
      return (
        context.user?.role === "DEVELOPER" ||
        context.user?.role === "SUPER_ADMIN"
      );
    },
    meta: {
      title: "System Logs",
      icon: "file-text",
    },
  },
  {
    path: "/dev/metrics",
    element: createElement("div", null, "System Metrics (TODO)"),
    protection: RouteProtection.ADMIN,
    permissions: ["DEVELOPER", "SUPER_ADMIN"],
    guard: (context) => {
      return (
        context.user?.role === "DEVELOPER" ||
        context.user?.role === "SUPER_ADMIN"
      );
    },
    meta: {
      title: "Metrics",
      icon: "bar-chart",
    },
  },
  {
    path: "/dev/architecture",
    element: createElement("div", null, "System Architecture (TODO)"),
    protection: RouteProtection.ADMIN,
    permissions: ["DEVELOPER", "SUPER_ADMIN"],
    guard: (context) => {
      return (
        context.user?.role === "DEVELOPER" ||
        context.user?.role === "SUPER_ADMIN"
      );
    },
    meta: {
      title: "Architecture",
      icon: "layers",
    },
  },
];

//================================================================
// DYNAMIC ROUTE BUILDING FUNCTIONS
//================================================================

/**
 * Build guard context from module context and auth store
 */
function buildGuardContext(moduleContext: ModuleContext): GuardContext {
  const authState = useAuthStore.getState();

  return {
    user: authState.user
      ? {
          id: authState.user.id,
          email: authState.user.email,
          role: authState.user.role,
        }
      : null,
    tenant: authState.tenant
      ? {
          id: authState.tenant.id,
          name: authState.tenant.name,
        }
      : null,
    businessUnit: authState.businessUnit
      ? {
          id: authState.businessUnit.id,
          name: authState.businessUnit.name,
          role: authState.role || undefined,
        }
      : null,
    permissions: moduleContext.permissions,
    featureFlags: moduleContext.featureFlags,
    path: window.location.pathname,
    query: Object.fromEntries(new URLSearchParams(window.location.search)),
  };
}

/**
 * Build all routes dynamically
 */
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

  // Type guard for filtering nulls
  const isNotNull = <T,>(value: T | null): value is T => value !== null;

  const builtPublicRoutes = publicRoutes.map(transformRoute).filter(isNotNull);
  const builtCoreRoutes = coreProtectedRoutes
    .map(transformRoute)
    .filter(isNotNull);
  const builtAdminRoutes = adminRoutes.map(transformRoute).filter(isNotNull);
  const builtDeveloperRoutes = developerRoutes
    .map(transformRoute)
    .filter(isNotNull);

  // ========================================
  // Get routes from registries
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

  if (import.meta.env.DEV) {
    console.log(
      `[AppRouter V2] Built ${allDynamicRoutes.length} dynamic routes (${builtModuleRoutes.length} module, ${builtVerticalRoutes.length} vertical)`,
    );
  }

  // Combine all routes
  // Cast BuiltRoute to RouteObject for type compatibility
  const allRoutes: RouteObject[] = [
    // Public routes (no wrapper)
    ...(builtPublicRoutes as RouteObject[]),

    // Protected routes (wrapped in ProtectedRoute)
    {
      element: createElement(ProtectedRoute),
      children: [
        // Core routes
        ...(builtCoreRoutes as RouteObject[]),

        // Admin routes (SUPER_ADMIN only)
        ...(builtAdminRoutes as RouteObject[]),

        // Developer routes (DEVELOPER + SUPER_ADMIN)
        ...(builtDeveloperRoutes as RouteObject[]),

        // Dynamic module/vertical routes
        ...(allDynamicRoutes as RouteObject[]),

        // 404 fallback (future)
        // {
        //   path: "*",
        //   element: createElement(NotFoundPage),
        // },
      ],
    },
  ];

  // Log statistics
  if (import.meta.env.DEV) {
    const statsRoutes = [
      ...builtCoreRoutes,
      ...allDynamicRoutes,
    ] as BuiltRoute[];
    const stats = getRouteStats(statsRoutes);
    console.log("[AppRouter V2] Route statistics:", stats);
    console.log(
      `[AppRouter V2] Total routes: ${allRoutes.length} (${builtPublicRoutes.length} public, ${builtCoreRoutes.length} protected, ${builtAdminRoutes.length} admin, ${builtDeveloperRoutes.length} dev, ${builtModuleRoutes.length} module, ${builtVerticalRoutes.length} vertical)`,
    );
  }

  return allRoutes;
}

/**
 * Create router instance (called from main.tsx)
 */
export function createAppRouter(context: ModuleContext) {
  console.log("[AppRouter V2] Creating router...");
  console.log(
    `[AppRouter V2] Context: tenant=${context.tenantId}, bu=${context.businessUnitId}`,
  );

  const routes = buildAllRoutes(context);
  return createBrowserRouter(routes);
}

//================================================================
// MIGRATION STRATEGY
//================================================================

/**
 * PHASE 1: Foundation (Current)
 * - New route types defined (route.types.ts) ✅
 * - Route builder implemented (route-builder.ts) ✅
 * - New AppRouter V2 created (this file) ✅
 * - Core routes moved to DynamicRouteDefinition format ✅
 *
 * PHASE 2: Module Integration (Next)
 * - Update ModuleDefinition to include routeConfig field
 * - Update VerticalDefinition to include routeConfig field
 * - Extract routes from registries in buildAllRoutes()
 * - Test that both old and new routes work
 *
 * PHASE 3: Module Migration
 * - Create routes.config.ts for each module
 * - Migrate inventory module
 * - Migrate clients module
 * - Migrate purchases module
 * - Migrate rental vertical
 *
 * PHASE 4: Cleanup
 * - Remove old route fields from definitions
 * - Remove old route building code
 * - Update documentation
 *
 * PHASE 5: Optimization
 * - Add route preloading hints
 * - Implement route-based code splitting analytics
 * - Add route caching if needed
 */

/**
 * COEXISTENCE APPROACH
 *
 * During migration, both systems work:
 *
 * Old system (legacy):
 * - Routes in AppRouter.tsx (current)
 * - Direct imports of page components
 * - verticalRegistry.getRoutes()
 *
 * New system (dynamic):
 * - Routes in module/routes.config.ts
 * - Lazy imports with proper chunking
 * - buildDynamicRoutes() from registries
 *
 * The new AppRouter V2 can render both:
 * - If module has routeConfig, use dynamic system
 * - If module only has old routes, use legacy system
 * - Once all migrated, remove legacy code
 */
