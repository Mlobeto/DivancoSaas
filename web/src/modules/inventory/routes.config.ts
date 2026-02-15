/**
 * Route Configuration Example - Inventory Module
 *
 * This demonstrates how to define routes for the new dynamic router system.
 * This is a migration example showing how to convert legacy routes.
 */

import { lazy } from "react";
import {
  ModuleRouteConfig,
  RouteProtection,
  RouteLayout,
} from "@/product/types/route.types";

//================================================================
// LAZY-LOADED PAGES (Code Splitting)
//================================================================
// All pages should be lazy loaded to keep initial bundle small

const AssetsListPage = lazy(() =>
  import("@/modules/inventory/pages/AssetsListPage").then((m) => ({
    default: m.AssetsListPage,
  })),
);

const AssetFormPage = lazy(() =>
  import("@/modules/inventory/pages/AssetFormPage").then((m) => ({
    default: m.AssetFormPage,
  })),
);

const AssetTemplatesPage = lazy(() =>
  import("@/modules/inventory/pages/AssetTemplatesPage").then((m) => ({
    default: m.AssetTemplatesPage,
  })),
);

const TemplateWizardPage = lazy(() =>
  import("@/modules/inventory/pages/TemplateWizardPage").then((m) => ({
    default: m.TemplateWizardPage,
  })),
);

const DocumentTypesPage = lazy(() =>
  import("@/modules/inventory/pages/DocumentTypesPage").then((m) => ({
    default: m.DocumentTypesPage,
  })),
);

const AlertsDashboardPage = lazy(() =>
  import("@/modules/inventory/pages/AlertsDashboardPage").then((m) => ({
    default: m.AlertsDashboardPage,
  })),
);

//================================================================
// INVENTORY MODULE ROUTE CONFIGURATION
//================================================================

export const inventoryRoutes: ModuleRouteConfig = {
  moduleId: "inventory",
  basePath: "/inventory",

  // Default protection for all routes (can be overridden per route)
  defaultProtection: RouteProtection.AUTHENTICATED,
  defaultLayout: RouteLayout.APP,

  // Module-level guard (optional)
  moduleGuard: (_context) => {
    // Example: Check if inventory module is enabled for tenant
    // return context.featureFlags?.["inventory.enabled"] !== false;
    return true;
  },

  routes: [
    //------------------------------------------------------------
    // ASSETS ROUTES
    //------------------------------------------------------------
    {
      path: "",
      element: AssetsListPage,
      meta: {
        title: "Assets",
        breadcrumb: "Assets",
        icon: "package",
      },
      chunkName: "assets-list",
    },
    {
      path: "new",
      element: AssetFormPage,
      permissions: ["inventory:create", "OWNER", "ADMIN"],
      meta: {
        title: "New Asset",
        breadcrumb: "New",
      },
      chunkName: "asset-form",
    },
    {
      path: ":id/edit",
      element: AssetFormPage,
      permissions: ["inventory:update", "OWNER", "ADMIN"],
      meta: {
        title: "Edit Asset",
        breadcrumb: "Edit",
      },
      chunkName: "asset-form",
    },

    //------------------------------------------------------------
    // TEMPLATES ROUTES
    //------------------------------------------------------------
    {
      path: "templates",
      element: AssetTemplatesPage,
      meta: {
        title: "Asset Templates",
        breadcrumb: "Templates",
        icon: "file-template",
      },
      chunkName: "templates-list",
    },
    {
      path: "templates/new",
      element: TemplateWizardPage,
      permissions: ["inventory:admin", "OWNER"],
      protection: RouteProtection.OWNER,
      meta: {
        title: "Create Template",
        breadcrumb: "New Template",
      },
      chunkName: "template-wizard",
    },
    {
      path: "templates/:id/edit",
      element: TemplateWizardPage,
      permissions: ["inventory:admin", "OWNER"],
      protection: RouteProtection.OWNER,
      meta: {
        title: "Edit Template",
        breadcrumb: "Edit Template",
      },
      chunkName: "template-wizard",
    },

    //------------------------------------------------------------
    // DOCUMENT TYPES
    //------------------------------------------------------------
    {
      path: "document-types",
      element: DocumentTypesPage,
      permissions: ["inventory:admin", "OWNER"],
      protection: RouteProtection.OWNER,
      meta: {
        title: "Document Types",
        breadcrumb: "Document Types",
        icon: "file-text",
      },
      chunkName: "document-types",
    },

    //------------------------------------------------------------
    // ALERTS DASHBOARD
    //------------------------------------------------------------
    {
      path: "alerts",
      element: AlertsDashboardPage,
      meta: {
        title: "Alerts",
        breadcrumb: "Alerts",
        icon: "bell",
      },
      chunkName: "alerts",
    },
  ],
};

//================================================================
// MIGRATION NOTES
//================================================================

/**
 * BEFORE (Legacy - Static Routes in AppRouter):
 *
 * <Route path="/inventory" element={<AssetsListPage />} />
 * <Route path="/inventory/create" element={<AssetCreatePage />} />
 * <Route path="/inventory/:id" element={<AssetDetailPage />} />
 * <Route path="/inventory/:id/edit" element={<AssetEditPage />} />
 * ...
 *
 * Problems:
 * - Routes hardcoded in AppRouter
 * - No lazy loading (all imports static)
 * - No module-level configuration
 * - No protection levels beyond basic auth
 * - No feature flag support
 * - No route metadata
 */

/**
 * AFTER (Dynamic Routes):
 *
 * // Module exports route configuration
 * export const inventoryRoutes: ModuleRouteConfig = { ... }
 *
 * // Router builds routes automatically
 * const routes = buildDynamicRoutes([inventoryRoutes], []);
 *
 * Benefits:
 * - ✅ Routes defined alongside module
 * - ✅ Automatic lazy loading with code splitting
 * - ✅ Module-level guards and defaults
 * - ✅ Fine-grained permissions per route
 * - ✅ Feature flag integration
 * - ✅ Route metadata for breadcrumbs/titles
 * - ✅ Protection levels (PUBLIC, AUTHENTICATED, ADMIN, OWNER)
 */

/**
 * MIGRATION STRATEGY:
 *
 * Phase 1: Create route configs (like this file)
 * Phase 2: Update AppRouter to use buildDynamicRoutes()
 * Phase 3: Remove hardcoded routes from AppRouter
 * Phase 4: Test all routes work correctly
 * Phase 5: Remove old static imports
 *
 * Both systems can coexist during migration:
 * - New routes use dynamic system
 * - Old routes stay in AppRouter temporarily
 * - Once all modules migrated, remove legacy system
 */
