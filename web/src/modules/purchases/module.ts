/**
 * Purchases Module Definition
 *
 * This module handles procurement: suppliers, purchase orders, and supplies.
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { purchasesRoutes } from "./routes.config";

/**
 * Purchases module definition
 */
export const purchasesModule: ModuleDefinition = {
  id: "purchases",
  name: "Compras",
  description: "Gestión de compras, proveedores y suministros",
  version: "1.0.0",
  vertical: "general",

  /**
   * Dynamic route configuration
   */
  routeConfig: purchasesRoutes,

  /**
   * Navigation structure
   */
  navigation: [
    {
      id: "purchases",
      label: "Compras",
      icon: "purchases",
      order: 35,
      children: [
        {
          id: "purchases-orders",
          label: "Órdenes de Compra",
          path: "/purchases",
          order: 1,
        },
        {
          id: "purchases-suppliers",
          label: "Proveedores",
          path: "/purchases/suppliers",
          order: 2,
        },
        {
          id: "purchases-supplies",
          label: "Suministros",
          path: "/purchases/supplies",
          order: 3,
        },
        {
          id: "purchases-categories",
          label: "Categorías",
          path: "/purchases/categories",
          order: 4,
        },
      ],
    },
  ],

  /**
   * Required permissions
   */
  permissions: ["purchases:read"],

  /**
   * Module initialization
   */
  onInit: async () => {
    console.log("[Purchases Module] Initialized");
  },

  /**
   * Module cleanup
   */
  onDestroy: () => {
    console.log("[Purchases Module] Destroyed");
  },
};
