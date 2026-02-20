/**
 * Inventory Module Definition
 *
 * This module handles assets (machinery, equipment, tools) management.
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { inventoryRoutes } from "./routes.config";

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
   * Dynamic route configuration
   */
  routeConfig: inventoryRoutes,

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
   * Required permissions (removed - handled at route level)
   */
  // permissions: ["inventory:read"],

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
