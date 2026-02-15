/**
 * Clients Module Definition
 *
 * This module handles client management (individuals and companies).
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { lazy } from "react";
import { clientsRoutes } from "./routes.config";

// Lazy load pages for code splitting
const ClientsPage = lazy(() =>
  import("./pages/ClientsPage").then((m) => ({ default: m.ClientsPage })),
);
const ClientDetailPage = lazy(() =>
  import("./pages/ClientDetailPage").then((m) => ({
    default: m.ClientDetailPage,
  })),
);
const ClientWizardPage = lazy(() =>
  import("./pages/ClientWizardPage").then((m) => ({
    default: m.ClientWizardPage,
  })),
);

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
   * NEW: Dynamic route configuration
   * Defines routes using the new dynamic router system
   */
  routeConfig: clientsRoutes,

  /**
   * Module routes
   * @deprecated Use routeConfig instead. Kept for backward compatibility during migration.
   */
  routes: [
    {
      path: "/clients",
      element: ClientsPage,
    },
    {
      path: "/clients/new",
      element: ClientWizardPage,
    },
    {
      path: "/clients/:id",
      element: ClientDetailPage,
    },
    {
      path: "/clients/:id/edit",
      element: ClientWizardPage,
    },
  ],

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
