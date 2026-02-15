import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";

// Module System
import { loadModules } from "@/app/module-loader/loadModules";
import { createAppRouter } from "@/app/router/AppRouter";
import { createModuleContext } from "@/product";
import { useAuthStore } from "@/store/auth.store";

import "./index.css";

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
  const [modulesLoaded, setModulesLoaded] = useState(false);
  const [router, setRouter] = useState<ReturnType<
    typeof createAppRouter
  > | null>(null);
  const { tenant, businessUnit, role } = useAuthStore();

  // Load modules on mount (once)
  useEffect(() => {
    loadModules()
      .then(() => {
        console.log("[App] Modules loaded successfully");
        setModulesLoaded(true);
      })
      .catch((error) => {
        console.error("[App] Failed to load modules:", error);
        // Show error UI to user
      });
  }, []);

  // Create router when modules are loaded AND auth context changes
  useEffect(() => {
    if (!modulesLoaded) return;

    // Create module context
    // Note: router is created even without auth (public routes like /login exist)
    const permissions: string[] = role ? [role] : [];
    const context = createModuleContext(
      tenant?.id || "",
      businessUnit?.id || "",
      permissions,
    );

    // Create router with current context
    const newRouter = createAppRouter(context);
    setRouter(newRouter);

    console.log(
      "[App] Router created for context:",
      `tenant=${context.tenantId}, bu=${context.businessUnitId}`,
    );
  }, [modulesLoaded, tenant?.id, businessUnit?.id, role]);

  // Show loading state while modules load
  if (!modulesLoaded || !router) {
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
