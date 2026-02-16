/**
 * LEGACY - DO NOT USE
 *
 * Rental Module Definition (DEPRECATED)
 *
 * This file is kept for historical reference only.
 * Rental is now implemented as a VERTICAL in @/verticals/rental
 *
 * The rental vertical orchestrates inventory, clients, and purchases modules
 * to provide complete rental management functionality.
 *
 * @deprecated Use @/verticals/rental instead
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { lazy } from "react";

// Lazy load pages for code splitting
const QuotationsListPage = lazy(() =>
  import("./pages/QuotationsListPage").then((m) => ({
    default: m.QuotationsListPage,
  })),
);
const QuotationFormPage = lazy(() =>
  import("./pages/QuotationFormPage").then((m) => ({
    default: m.QuotationFormPage,
  })),
);
const ContractsListPage = lazy(() =>
  import("./pages/ContractsListPage").then((m) => ({
    default: m.ContractsListPage,
  })),
);
const QuotationTemplatesPage = lazy(() =>
  import("./pages/QuotationTemplatesPage").then((m) => ({
    default: m.QuotationTemplatesPage,
  })),
);
const TemplateFormPage = lazy(() =>
  import("./pages/TemplateFormPage").then((m) => ({
    default: m.TemplateFormPage,
  })),
);
const TemplatePreviewPage = lazy(() =>
  import("./pages/TemplatePreviewPage").then((m) => ({
    default: m.TemplatePreviewPage,
  })),
);
const AccountsListPage = lazy(() =>
  import("./pages/AccountsListPage").then((m) => ({
    default: m.AccountsListPage,
  })),
);

/**
 * Rental module definition
 * @deprecated This module is deprecated. Use @/verticals/rental instead.
 */
export const rentalModule = {
  id: "rental",
  name: "Alquileres",
  description: "Gestión de cotizaciones, contratos y alquileres",
  version: "1.0.0",
  vertical: "general",

  /**
   * Module routes
   * These will be automatically registered with React Router
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
   * This will be automatically rendered in the sidebar
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
   * Required permissions to access this module
   */
  permissions: ["rental:read"],

  /**
   * Module initialization (optional)
   */
  onInit: async () => {
    console.log("[Rental Module] Initialized");
    // You can preload data, register event listeners, etc.
  },

  /**
   * Module cleanup (optional)
   */
  onDestroy: () => {
    console.log("[Rental Module] Destroyed");
    // Clean up event listeners, timers, etc.
  },
};
