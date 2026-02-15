/**
 * Rental Vertical Definition
 *
 * The rental vertical orchestrates equipment rental operations including
 * quotations, contracts, billing, and usage tracking.
 *
 * This vertical depends on core modules: inventory, clients, and purchases.
 */

import { VerticalDefinition } from "@/product";
import { lazy } from "react";
import { rentalRoutes } from "./routes.config";

// Lazy load pages for code splitting (from modules/rental temporarily)
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

/**
 * Rental vertical definition for equipment rental industry
 */
export const rentalVertical: VerticalDefinition = {
  id: "rental",
  name: "Alquileres",
  description: "Vertical de alquiler de equipos y maquinaria",
  version: "1.0.0",
  industry: "equipment-rental",

  /**
   * Core modules required by this vertical
   */
  requiredCoreModules: ["inventory", "clients", "purchases"],

  /**
   * Optional core modules that enhance functionality
   */
  optionalCoreModules: ["maintenance"],

  /**
   * NEW: Dynamic route configuration
   * Defines routes using the new dynamic router system
   */
  routeConfig: rentalRoutes,

  /**
   * Vertical-specific routes
   * These will be merged with core module routes
   * @deprecated Use routeConfig instead. Kept for backward compatibility during migration.
   */
  routes: [
    // Quotations
    {
      path: "/rental/quotations",
      element: QuotationsListPage,
    },
    {
      path: "/rental/quotations/new",
      element: QuotationFormPage,
    },
    {
      path: "/rental/quotations/:id/edit",
      element: QuotationFormPage,
    },

    // Contracts
    {
      path: "/rental/contracts",
      element: ContractsListPage,
    },
    {
      path: "/rental/contracts/:id",
      element: ContractsListPage,
    },

    // Templates
    {
      path: "/rental/templates",
      element: QuotationTemplatesPage,
    },
    {
      path: "/rental/templates/new",
      element: TemplateFormPage,
    },
    {
      path: "/rental/templates/:id/edit",
      element: TemplateFormPage,
    },
    {
      path: "/rental/templates/:id/preview",
      element: TemplatePreviewPage,
    },

    // Accounts (billing)
    {
      path: "/rental/accounts",
      element: AccountsListPage,
    },
  ],

  /**
   * Navigation structure
   * Will be prioritized over core module navigation
   */
  navigation: [
    {
      id: "rental",
      label: "Alquileres",
      icon: "rental",
      order: 40,
      children: [
        {
          id: "rental-quotations",
          label: "Cotizaciones",
          path: "/rental/quotations",
          order: 1,
        },
        {
          id: "rental-contracts",
          label: "Contratos",
          path: "/rental/contracts",
          order: 2,
        },
        {
          id: "rental-templates",
          label: "Plantillas",
          path: "/rental/templates",
          order: 3,
        },
        {
          id: "rental-accounts",
          label: "Cuentas",
          path: "/rental/accounts",
          order: 4,
        },
      ],
    },
  ],

  /**
   * Required permissions to access this vertical
   */
  permissions: ["rental:read"],

  /**
   * Dashboard component (optional)
   * Provides vertical-specific overview
   * TODO: Create RentalDashboard component
   */
  // dashboard: lazy(() =>
  //   import("@/modules/rental/components/RentalDashboard").then((m) => ({
  //     default: m.RentalDashboard,
  //   })),
  // ),

  /**
   * Vertical initialization (optional)
   */
  onInit: async () => {
    console.log("[Rental Vertical] Initialized");
    console.log(
      "[Rental Vertical] Required core modules: inventory, clients, purchases",
    );
  },

  /**
   * Vertical cleanup (optional)
   */
  onDestroy: async () => {
    console.log("[Rental Vertical] Destroyed");
  },
};
