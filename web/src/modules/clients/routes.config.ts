/**
 * Route Configuration - Clients Module
 *
 * Dynamic route configuration for the clients module.
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

const ClientsPage = lazy(() =>
  import("@/modules/clients/pages/ClientsPage").then((m) => ({
    default: m.ClientsPage,
  })),
);

const ClientDetailPage = lazy(() =>
  import("@/modules/clients/pages/ClientDetailPage").then((m) => ({
    default: m.ClientDetailPage,
  })),
);

const ClientWizardPage = lazy(() =>
  import("@/modules/clients/pages/ClientWizardPage").then((m) => ({
    default: m.ClientWizardPage,
  })),
);

//================================================================
// CLIENTS MODULE ROUTE CONFIGURATION
//================================================================

export const clientsRoutes: ModuleRouteConfig = {
  moduleId: "clients",
  basePath: "/clients",

  // Default protection for all routes
  defaultProtection: RouteProtection.AUTHENTICATED,
  defaultLayout: RouteLayout.APP,

  // Module-level guard (optional)
  moduleGuard: (_context) => {
    return true;
  },

  routes: [
    //------------------------------------------------------------
    // CLIENTS LIST
    //------------------------------------------------------------
    {
      path: "",
      element: ClientsPage,
      meta: {
        title: "Clients",
        breadcrumb: "Clients",
        icon: "users",
      },
      chunkName: "clients-list",
    },

    //------------------------------------------------------------
    // CREATE CLIENT
    //------------------------------------------------------------
    {
      path: "new",
      element: ClientWizardPage,
      permissions: ["clients:create", "OWNER", "ADMIN"],
      meta: {
        title: "New Client",
        breadcrumb: "New",
      },
      chunkName: "client-wizard",
    },

    //------------------------------------------------------------
    // CLIENT DETAIL
    //------------------------------------------------------------
    {
      path: ":id",
      element: ClientDetailPage,
      meta: {
        title: "Client Details",
        breadcrumb: "Details",
      },
      chunkName: "client-detail",
    },

    //------------------------------------------------------------
    // EDIT CLIENT
    //------------------------------------------------------------
    {
      path: ":id/edit",
      element: ClientWizardPage,
      permissions: ["clients:update", "OWNER", "ADMIN"],
      meta: {
        title: "Edit Client",
        breadcrumb: "Edit",
      },
      chunkName: "client-wizard",
    },
  ],
};
