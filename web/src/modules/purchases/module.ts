/**
 * Purchases Module Definition
 *
 * This module handles procurement: suppliers, purchase orders, and supplies.
 * Self-registers with the platform module system.
 */

import { ModuleDefinition } from "@/product";
import { lazy } from "react";
import { purchasesRoutes } from "./routes.config";

// Lazy load pages for code splitting
const PurchaseOrdersPage = lazy(() =>
  import("./pages/PurchaseOrdersPage").then((m) => ({
    default: m.PurchaseOrdersPage,
  })),
);
const SuppliersPage = lazy(() =>
  import("./pages/SuppliersPage").then((m) => ({ default: m.SuppliersPage })),
);
const SuppliesPage = lazy(() =>
  import("./pages/SuppliesPage").then((m) => ({ default: m.SuppliesPage })),
);
const SupplyFormPage = lazy(() =>
  import("./pages/SupplyFormPage").then((m) => ({ default: m.SupplyFormPage })),
);
const SupplyCategoriesPage = lazy(() =>
  import("./pages/SupplyCategoriesPage").then((m) => ({
    default: m.SupplyCategoriesPage,
  })),
);
const CategoryWizardPage = lazy(() =>
  import("./pages/CategoryWizardPage").then((m) => ({
    default: m.CategoryWizardPage,
  })),
);

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
   * NEW: Dynamic route configuration
   * Defines routes using the new dynamic router system
   */
  routeConfig: purchasesRoutes,

  /**
   * Module routes
   * @deprecated Use routeConfig instead. Kept for backward compatibility during migration.
   */
  routes: [
    // Purchase Orders
    {
      path: "/purchases",
      element: PurchaseOrdersPage,
    },

    // Suppliers
    {
      path: "/purchases/suppliers",
      element: SuppliersPage,
    },

    // Supplies
    {
      path: "/purchases/supplies",
      element: SuppliesPage,
    },
    {
      path: "/purchases/supplies/new",
      element: SupplyFormPage,
    },
    {
      path: "/purchases/supplies/:id/edit",
      element: SupplyFormPage,
    },

    // Supply Categories
    {
      path: "/purchases/categories",
      element: SupplyCategoriesPage,
    },
    {
      path: "/purchases/categories/wizard",
      element: CategoryWizardPage,
    },
  ],

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
