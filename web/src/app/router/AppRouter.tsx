/**
 * Dynamic App Router
 *
 * Builds React Router configuration dynamically from registered modules.
 * This replaces the hardcoded routes in main.tsx.
 */

import {
  createBrowserRouter,
  Navigate,
  RouteObject,
  Outlet,
} from "react-router-dom";
import { moduleRegistry, createModuleContext } from "@/product";
import { useAuthStore } from "@/store/auth.store";

// Import core components
import { Layout } from "@/core/components/Layout";
import { ProtectedRoute } from "@/core/components/ProtectedRoute";
import { LoginPage } from "@/core/pages/LoginPage";
import { RegisterPage } from "@/core/pages/RegisterPage";
import { DashboardPage } from "@/core/pages/DashboardPage";
// import { SelectBusinessUnitPage } from "@/core/pages/SelectBusinessUnitPage"; // TODO: Create this page

/**
 * Get module context from current auth state
 */
function getModuleContext() {
  const { tenant, businessUnit, role } = useAuthStore.getState();

  // TODO: Derive permissions from role or fetch from backend
  const permissions: string[] = role ? [role] : [];

  return createModuleContext(
    tenant?.id || "",
    businessUnit?.id || "",
    permissions,
  );
}

/**
 * Build dynamic routes from registered modules
 */
export function buildRoutes(): RouteObject[] {
  // Get enabled modules for current context
  const context = getModuleContext();
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
              <Outlet />
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
            // Dynamic module routes
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
 */
export function createAppRouter() {
  const routes = buildRoutes();
  return createBrowserRouter(routes);
}

/**
 * Rebuild router (called when modules are reloaded or context changes)
 */
export function rebuildRouter() {
  console.log("[AppRouter] Rebuilding router...");
  return createAppRouter();
}
