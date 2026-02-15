/**
 * Route Configuration - Purchases Module
 *
 * Dynamic route configuration for the purchases module.
 */

import { lazy } from "react";
import {
  ModuleRouteConfig,
  RouteProtection,
  RouteLayout,
} from "@/product/types/route.types";

//================================================================
// LAZY-LOADED PAGES (Code Splitting)
//================================================================

const PurchaseOrdersPage = lazy(() =>
  import("@/modules/purchases/pages/PurchaseOrdersPage").then((m) => ({
    default: m.PurchaseOrdersPage,
  })),
);

const SuppliersPage = lazy(() =>
  import("@/modules/purchases/pages/SuppliersPage").then((m) => ({
    default: m.SuppliersPage,
  })),
);

const SuppliesPage = lazy(() =>
  import("@/modules/purchases/pages/SuppliesPage").then((m) => ({
    default: m.SuppliesPage,
  })),
);

const SupplyFormPage = lazy(() =>
  import("@/modules/purchases/pages/SupplyFormPage").then((m) => ({
    default: m.SupplyFormPage,
  })),
);

const SupplyCategoriesPage = lazy(() =>
  import("@/modules/purchases/pages/SupplyCategoriesPage").then((m) => ({
    default: m.SupplyCategoriesPage,
  })),
);

const CategoryWizardPage = lazy(() =>
  import("@/modules/purchases/pages/CategoryWizardPage").then((m) => ({
    default: m.CategoryWizardPage,
  })),
);

//================================================================
// PURCHASES MODULE ROUTE CONFIGURATION
//================================================================

export const purchasesRoutes: ModuleRouteConfig = {
  moduleId: "purchases",
  basePath: "/purchases",

  // Default protection for all routes
  defaultProtection: RouteProtection.AUTHENTICATED,
  defaultLayout: RouteLayout.APP,

  // Module-level guard (optional)
  moduleGuard: (_context) => {
    return true;
  },

  routes: [
    //------------------------------------------------------------
    // PURCHASE ORDERS
    //------------------------------------------------------------
    {
      path: "",
      element: PurchaseOrdersPage,
      meta: {
        title: "Purchase Orders",
        breadcrumb: "Orders",
        icon: "shopping-cart",
      },
      chunkName: "purchase-orders",
    },

    //------------------------------------------------------------
    // SUPPLIERS
    //------------------------------------------------------------
    {
      path: "suppliers",
      element: SuppliersPage,
      meta: {
        title: "Suppliers",
        breadcrumb: "Suppliers",
        icon: "truck",
      },
      chunkName: "suppliers",
    },

    //------------------------------------------------------------
    // SUPPLIES
    //------------------------------------------------------------
    {
      path: "supplies",
      element: SuppliesPage,
      meta: {
        title: "Supplies",
        breadcrumb: "Supplies",
        icon: "box",
      },
      chunkName: "supplies-list",
    },
    {
      path: "supplies/new",
      element: SupplyFormPage,
      permissions: ["purchases:create", "OWNER", "ADMIN"],
      meta: {
        title: "New Supply",
        breadcrumb: "New",
      },
      chunkName: "supply-form",
    },
    {
      path: "supplies/:id/edit",
      element: SupplyFormPage,
      permissions: ["purchases:update", "OWNER", "ADMIN"],
      meta: {
        title: "Edit Supply",
        breadcrumb: "Edit",
      },
      chunkName: "supply-form",
    },

    //------------------------------------------------------------
    // SUPPLY CATEGORIES
    //------------------------------------------------------------
    {
      path: "categories",
      element: SupplyCategoriesPage,
      meta: {
        title: "Supply Categories",
        breadcrumb: "Categories",
        icon: "folder",
      },
      chunkName: "categories-list",
    },
    {
      path: "categories/wizard",
      element: CategoryWizardPage,
      permissions: ["purchases:admin", "OWNER"],
      protection: RouteProtection.OWNER,
      meta: {
        title: "Category Wizard",
        breadcrumb: "Wizard",
      },
      chunkName: "category-wizard",
    },
  ],
};
