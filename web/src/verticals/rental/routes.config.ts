/**
 * Route Configuration Example - Rental Vertical
 *
 * Demonstrates vertical-specific route configuration.
 * Verticals can define their own routes that depend on core modules.
 */

import { lazy } from "react";
import {
  VerticalRouteConfig,
  RouteProtection,
  RouteLayout,
} from "@/product/types/route.types";

//================================================================
// LAZY-LOADED PAGES
//================================================================

const QuotationsListPage = lazy(() =>
  import("@/modules/rental/pages/QuotationsListPage").then((m) => ({
    default: m.QuotationsListPage,
  })),
);

const QuotationFormPage = lazy(() =>
  import("@/modules/rental/pages/QuotationFormPage").then((m) => ({
    default: m.QuotationFormPage,
  })),
);

const ContractsListPage = lazy(() =>
  import("@/modules/rental/pages/ContractsListPage").then((m) => ({
    default: m.ContractsListPage,
  })),
);

const QuotationTemplatesPage = lazy(() =>
  import("@/modules/rental/pages/QuotationTemplatesPage").then((m) => ({
    default: m.QuotationTemplatesPage,
  })),
);

const TemplateFormPage = lazy(() =>
  import("@/modules/rental/pages/TemplateFormPage").then((m) => ({
    default: m.TemplateFormPage,
  })),
);

const TemplatePreviewPage = lazy(() =>
  import("@/modules/rental/pages/TemplatePreviewPage").then((m) => ({
    default: m.TemplatePreviewPage,
  })),
);

const AccountsListPage = lazy(() =>
  import("@/modules/rental/pages/AccountsListPage").then((m) => ({
    default: m.AccountsListPage,
  })),
);

//================================================================
// RENTAL VERTICAL ROUTE CONFIGURATION
//================================================================

export const rentalRoutes: VerticalRouteConfig = {
  verticalId: "rental",
  basePath: "/rental",

  // Vertical-level guard removed - individual routes handle permissions
  // verticalGuard: (context) => {
  //   return context.permissions.includes("rental:read");
  // },

  routes: [
    //------------------------------------------------------------
    // QUOTATIONS
    //------------------------------------------------------------
    {
      path: "quotations",
      element: QuotationsListPage,
      protection: RouteProtection.AUTHENTICATED,
      layout: RouteLayout.APP,
      meta: {
        title: "Quotations",
        breadcrumb: "Quotations",
        icon: "file-text",
      },
      chunkName: "quotations-list",
    },
    {
      path: "quotations/new",
      element: QuotationFormPage,
      permissions: ["rental:quotation:create", "OWNER", "ADMIN", "MANAGER"],
      meta: {
        title: "New Quotation",
        breadcrumb: "New",
      },
      chunkName: "quotations-create",
    },
    {
      path: "quotations/:id/edit",
      element: QuotationFormPage,
      permissions: ["rental:quotation:update", "OWNER", "ADMIN", "MANAGER"],
      meta: {
        title: "Edit Quotation",
        breadcrumb: "Edit",
      },
      chunkName: "quotations-edit",
    },

    //------------------------------------------------------------
    // CONTRACTS
    //------------------------------------------------------------
    {
      path: "contracts",
      element: ContractsListPage,
      meta: {
        title: "Contracts",
        breadcrumb: "Contracts",
        icon: "file-contract",
      },
      chunkName: "contracts-list",
    },
    {
      path: "contracts/:id",
      element: ContractsListPage,
      meta: {
        title: "Contract Details",
        breadcrumb: "Details",
      },
      chunkName: "contracts-detail",
    },

    //------------------------------------------------------------
    // TEMPLATES
    //------------------------------------------------------------
    {
      path: "templates",
      element: QuotationTemplatesPage,
      meta: {
        title: "Quotation Templates",
        breadcrumb: "Templates",
        icon: "layout-template",
      },
      chunkName: "templates-list",
    },
    {
      path: "templates/new",
      element: TemplateFormPage,
      protection: RouteProtection.OWNER,
      permissions: ["rental:template:create", "OWNER"],
      meta: {
        title: "New Template",
        breadcrumb: "New",
      },
      chunkName: "templates-create",
    },
    {
      path: "templates/:id/edit",
      element: TemplateFormPage,
      protection: RouteProtection.OWNER,
      permissions: ["rental:template:update", "OWNER"],
      meta: {
        title: "Edit Template",
        breadcrumb: "Edit",
      },
      chunkName: "templates-edit",
    },
    {
      path: "templates/:id/preview",
      element: TemplatePreviewPage,
      meta: {
        title: "Template Preview",
        breadcrumb: "Preview",
      },
      chunkName: "templates-preview",
    },

    //------------------------------------------------------------
    // ACCOUNTS (BILLING)
    //------------------------------------------------------------
    {
      path: "accounts",
      element: AccountsListPage,
      permissions: ["rental:billing:read", "OWNER", "ADMIN"],
      meta: {
        title: "Billing Accounts",
        breadcrumb: "Accounts",
        icon: "wallet",
      },
      chunkName: "accounts-list",
    },
  ],
};

//================================================================
// USAGE IN VERTICAL DEFINITION
//================================================================

/**
 * The vertical definition in rental.vertical.ts would import this:
 *
 * import { rentalRoutes } from "./routes.config";
 *
 * export const rentalVertical: VerticalDefinition = {
 *   id: "rental",
 *   name: "Alquileres",
 *   requiredCoreModules: ["inventory", "clients", "purchases"],
 *
 *   // Legacy routes (to be deprecated)
 *   routes: [...],
 *
 *   // New route config (compatible)
 *   routeConfig: rentalRoutes,
 *
 *   // ...
 * };
 *
 * Migration approach:
 * 1. Keep old `routes` for compatibility
 * 2. Add new `routeConfig` field
 * 3. Update AppRouter to prefer `routeConfig` if present
 * 4. Once all migrated, remove `routes` field
 */
