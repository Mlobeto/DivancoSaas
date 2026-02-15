/**
 * Rental Module Definition
 *
 * This module handles quotations, contracts, and rental operations.
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { lazy, createElement } from "react";

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
 */
export const rentalModule: ModuleDefinition = {
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
      element: createElement(QuotationsListPage),
    },
    {
      path: "/rental/quotations/new",
      element: createElement(QuotationFormPage),
    },
    {
      path: "/rental/quotations/:id/edit",
      element: createElement(QuotationFormPage),
    },

    // Contracts
    {
      path: "/rental/contracts",
      element: createElement(ContractsListPage),
    },
    {
      path: "/rental/contracts/:id",
      element: createElement(ContractsListPage),
    },

    // Templates
    {
      path: "/rental/templates",
      element: createElement(QuotationTemplatesPage),
    },
    {
      path: "/rental/templates/new",
      element: createElement(TemplateFormPage),
    },
    {
      path: "/rental/templates/:id/edit",
      element: createElement(TemplateFormPage),
    },
    {
      path: "/rental/templates/:id/preview",
      element: createElement(TemplatePreviewPage),
    },

    // Accounts (billing)
    {
      path: "/rental/accounts",
      element: createElement(AccountsListPage),
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
