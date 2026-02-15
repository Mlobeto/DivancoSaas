import { StrictMode, useEffect, useState, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

// Module System
import { loadModules } from "@/app/module-loader/loadModules";
import { loadPlatformModules } from "@/app/module-loader/loadPlatformModules";
import { createAppRouter } from "@/app/router/AppRouter.v2"; // Using new dynamic router
import { createModuleContext } from "@/product";
import { useAuthStore } from "@/store/auth.store";

import "./index.css";

// ============================================================
// Global module loading state
// ============================================================
let modulesLoadingPromise: Promise<void> | null = null;
let modulesLoaded = false;

/**
 * Load modules once globally (outside React lifecycle)
 * This prevents double-loading in StrictMode development
 */
function loadModulesOnce(): Promise<void> {
  if (modulesLoaded) {
    return Promise.resolve();
  }

  if (modulesLoadingPromise) {
    return modulesLoadingPromise;
  }

  modulesLoadingPromise = Promise.all([
    loadModules(), // OLD: modules in @/modules (except rental)
    loadPlatformModules(), // NEW: verticals in @/verticals
  ])
    .then(() => {
      console.log("[App] All modules loaded successfully");
      modulesLoaded = true;
    })
    .catch((error) => {
      console.error("[App] Failed to load modules:", error);
      modulesLoadingPromise = null; // Reset to allow retry
      throw error;
    });

  return modulesLoadingPromise;
}

// Configure TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * App Component
 *
 * Handles:
 * 1. Module loading on mount
 * 2. Router creation after auth context is available
 * 3. Router re-creation when tenant/BU changes
 */
function App() {
  const [modulesReady, setModulesReady] = useState(false);
  const { tenant, businessUnit, role } = useAuthStore();

  // Load modules on mount (uses global cache to prevent double-loading)
  useEffect(() => {
    loadModulesOnce()
      .then(() => {
        setModulesReady(true);
      })
      .catch((error) => {
        console.error("[App] Module loading failed:", error);
        // Keep modulesReady as false to show error state
      });
  }, []);

  // Create module context - memoized to prevent unnecessary recalculations
  // Note: context is created even without auth (public routes like /login exist)
  const context = useMemo(() => {
    const permissions: string[] = role ? [role] : [];
    return createModuleContext(
      tenant?.id || "",
      businessUnit?.id || "",
      permissions,
    );
  }, [tenant?.id, businessUnit?.id, role]);

  // Create router - memoized to only recreate when modules load or context changes
  const router = useMemo(() => {
    if (!modulesReady) return null;

    console.log(
      "[App] Router created for context:",
      `tenant=${context.tenantId}, bu=${context.businessUnitId}`,
    );

    return createAppRouter(context);
  }, [modulesReady, context]);

  // Show loading state while modules load
  if (!modulesReady || !router) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

// Render app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
