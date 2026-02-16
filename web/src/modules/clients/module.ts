/**
 * Clients Module Definition
 *
 * This module handles client management (individuals and companies).
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { clientsRoutes } from "./routes.config";

/**
 * Clients module definition
 */
export const clientsModule: ModuleDefinition = {
  id: "clients",
  name: "Clientes",
  description: "Gestión de clientes (personas y empresas)",
  version: "1.0.0",
  vertical: "general",

  /**
   * Dynamic route configuration
   */
  routeConfig: clientsRoutes,

  /**
   * Navigation structure
   */
  navigation: [
    {
      id: "clients",
      label: "Clientes",
      path: "/clients",
      icon: "clients",
      order: 30,
    },
  ],

  /**
   * Required permissions
   */
  permissions: ["clients:read"],

  /**
   * Module initialization
   */
  onInit: async () => {
    console.log("[Clients Module] Initialized");
  },

  /**
   * Module cleanup
   */
  onDestroy: () => {
    console.log("[Clients Module] Destroyed");
  },
};
