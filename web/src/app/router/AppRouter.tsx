/**
 * Dynamic App Router
 *
 * Builds React Router configuration dynamically from registered modules.
 * IMPORTANT: Router is created ONCE after login, not on every render.
 */

import {
  createBrowserRouter,
  Navigate,
  RouteObject,
  Outlet,
} from "react-router-dom";
import { Suspense } from "react";
import { moduleRegistry, type ModuleContext } from "@/product";

// Import core components
import { Layout } from "@/core/components/Layout";
import { ProtectedRoute } from "@/core/components/ProtectedRoute";
import { LoginPage } from "@/core/pages/LoginPage";
import { RegisterPage } from "@/core/pages/RegisterPage";
import { DashboardPage } from "@/core/pages/DashboardPage";
// import { SelectBusinessUnitPage } from "@/core/pages/SelectBusinessUnitPage"; // TODO: Create this page

/**
 * Build dynamic routes from registered modules
 * @param context - Module context with tenant, businessUnit, permissions
 */
export function buildRoutes(context: ModuleContext): RouteObject[] {
  // Get enabled modules for this context
  const moduleRoutes = moduleRegistry.getRoutes(context);

  console.log(
    `[AppRouter] Building routes for ${moduleRoutes.length} module routes`,
  );

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
        {
          element: (
            <Layout>
              <Suspense fallback={<div>Loading...</div>}>
                <Outlet />
              </Suspense>
            </Layout>
          ),
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
            // Dynamic module routes (all lazy-loaded)
            ...moduleRoutes,
            // 404 fallback (future)
            // {
            //   path: '*',
            //   element: <NotFoundPage />,
            // },
          ],
        },
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
