/**
 * Inventory Module Definition
 *
 * This module handles assets (machinery, equipment, tools) management.
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { lazy } from "react";

// Lazy load pages for code splitting
const AssetsListPage = lazy(() =>
  import("./pages/AssetsListPage").then((m) => ({ default: m.AssetsListPage })),
);
const AssetFormPage = lazy(() =>
  import("./pages/AssetFormPage").then((m) => ({ default: m.AssetFormPage })),
);
const AssetTemplatesPage = lazy(() =>
  import("./pages/AssetTemplatesPage").then((m) => ({
    default: m.AssetTemplatesPage,
  })),
);
const TemplateWizardPage = lazy(() =>
  import("./pages/TemplateWizardPage").then((m) => ({
    default: m.TemplateWizardPage,
  })),
);
const DocumentTypesPage = lazy(() =>
  import("./pages/DocumentTypesPage").then((m) => ({
    default: m.DocumentTypesPage,
  })),
);
const AlertsDashboardPage = lazy(() =>
  import("./pages/AlertsDashboardPage").then((m) => ({
    default: m.AlertsDashboardPage,
  })),
);

/**
 * Inventory module definition
 */
export const inventoryModule: ModuleDefinition = {
  id: "inventory",
  name: "Inventario",
  description: "Gestión de activos (maquinaria, herramientas, equipos)",
  version: "1.0.0",
  vertical: "general",

  /**
   * Module routes
   */
  routes: [
    // Assets
    {
      path: "/inventory",
      element: AssetsListPage,
    },
    {
      path: "/inventory/new",
      element: AssetFormPage,
    },
    {
      path: "/inventory/:id/edit",
      element: AssetFormPage,
    },

    // Templates
    {
      path: "/inventory/templates",
      element: AssetTemplatesPage,
    },
    {
      path: "/inventory/templates/new",
      element: TemplateWizardPage,
    },
    {
      path: "/inventory/templates/:id/edit",
      element: TemplateWizardPage,
    },

    // Document Types
    {
      path: "/inventory/document-types",
      element: DocumentTypesPage,
    },

    // Alerts
    {
      path: "/inventory/alerts",
      element: AlertsDashboardPage,
    },
  ],

  /**
   * Navigation structure
   */
  navigation: [
    {
      id: "inventory",
      label: "Inventario",
      icon: "inventory",
      order: 20,
      children: [
        {
          id: "inventory-assets",
          label: "Activos",
          path: "/inventory",
          order: 1,
        },
        {
          id: "inventory-templates",
          label: "Plantillas",
          path: "/inventory/templates",
          order: 2,
        },
        {
          id: "inventory-alerts",
          label: "Alertas",
          path: "/inventory/alerts",
          order: 3,
          badge: () => {
            // TODO: Get actual alert count from store or API
            return null;
          },
        },
        {
          id: "inventory-document-types",
          label: "Tipos de Documento",
          path: "/inventory/document-types",
          order: 4,
        },
      ],
    },
  ],

  /**
   * Required permissions
   */
  permissions: ["assets:read"],

  /**
   * Module initialization
   */
  onInit: async () => {
    console.log("[Inventory Module] Initialized");
  },

  /**
   * Module cleanup
   */
  onDestroy: () => {
    console.log("[Inventory Module] Destroyed");
  },
};
