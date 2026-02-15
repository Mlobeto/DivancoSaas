/**
 * Clients Module Definition
 *
 * This module handles client management (individuals and companies).
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { lazy, createElement } from "react";

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
   * Module routes
   */
  routes: [
    {
      path: "/clients",
      element: createElement(ClientsPage),
    },
    {
      path: "/clients/new",
      element: createElement(ClientWizardPage),
    },
    {
      path: "/clients/:id",
      element: createElement(ClientDetailPage),
    },
    {
      path: "/clients/:id/edit",
      element: createElement(ClientWizardPage),
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
