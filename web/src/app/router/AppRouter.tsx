/**
 * Dynamic App Router - Platform Architecture
 *
 * Builds React Router configuration from PLATFORM architecture:
 * - Gets active VERTICAL for tenant
 * - Includes required CORE module routes
 * - Merges vertical-specific routes
 *
 * IMPORTANT: Router is created ONCE after login, not on every render.
 */

import {
  createBrowserRouter,
  Navigate,
  RouteObject,
  Outlet,
} from "react-router-dom";
import { Suspense } from "react";
import { verticalRegistry, type ModuleContext } from "@/product";

// Import core components
import { Layout } from "@/core/components/Layout";
import { ProtectedRoute } from "@/core/components/ProtectedRoute";
import { LoginPage } from "@/core/pages/LoginPage";
import { RegisterPage } from "@/core/pages/RegisterPage";
import { DashboardPage } from "@/core/pages/DashboardPage";
import { ModuleAssignmentManager } from "@/core/pages/ModuleAssignmentManager";
// import { SelectBusinessUnitPage } from "@/core/pages/SelectBusinessUnitPage"; // TODO: Create this page

/**
 * Build dynamic routes from active vertical and its required core modules
 * @param context - Module context with tenant, businessUnit, permissions
 */
export function buildRoutes(context: ModuleContext): RouteObject[] {
  // Get routes from active vertical (includes required core module routes)
  const platformRoutes = verticalRegistry.getRoutes(context);

  console.log(
    `[AppRouter] Building routes: ${platformRoutes.length} total (core + vertical)`,
  );

  // Get active vertical info for logging
  const activeVertical = verticalRegistry.getActiveVerticalInfo(context);
  if (activeVertical) {
    console.log(
      `[AppRouter] Active vertical: ${activeVertical.verticalId} (${activeVertical.industry})`,
    );
    console.log(
      `[AppRouter] Using core modules: ${activeVertical.enabledCoreModules.join(", ")}`,
    );
  } else {
    console.warn("[AppRouter] No active vertical found for tenant");
  }

  return [
    // Public routes (no auth required)
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
    // TODO: Uncomment when SelectBusinessUnitPage is created
    // {
    //   path: "/select-business-unit",
    //   element: <SelectBusinessUnitPage />,
    // },

    // Protected routes (auth required)
    {
      element: <ProtectedRoute />,
      children: [
        // Root redirect to dashboard
        {
          path: "/",
          element: <Navigate to="/dashboard" replace />,
        },
        // Dashboard
        {
          path: "/dashboard",
          element: <DashboardPage />,
        },
        // Admin: Module Assignment (OWNER only)
        {
          path: "/admin/modules",
          element: <ModuleAssignmentManager />,
        },
        // Dynamic platform routes (core + vertical, all lazy-loaded)
        // Note: Each page handles its own Layout wrapper
        ...platformRoutes,
        // 404 fallback (future)
        // {
        //   path: '*',
        //   element: <NotFoundPage />,
        // },
      ],
    },
  ];
}

/**
 * Create router instance
 * @param context - Module context (tenant, businessUnit, permissions)
 */
export function createAppRouter(context: ModuleContext) {
  const routes = buildRoutes(context);

  console.log(
    `[AppRouter] Creating router for tenant=${context.tenantId}, bu=${context.businessUnitId}`,
  );

  return createBrowserRouter(routes);
}
