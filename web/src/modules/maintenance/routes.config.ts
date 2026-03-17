import { lazy } from "react";
import {
  ModuleRouteConfig,
  RouteProtection,
  RouteLayout,
} from "@/product/types/route.types";

const MaintenanceDashboardPage = lazy(() =>
  import("@/modules/maintenance/pages/MaintenanceDashboardPage").then((m) => ({
    default: m.MaintenanceDashboardPage,
  })),
);

const MaintenanceDetailPage = lazy(() =>
  import("@/modules/maintenance/pages/MaintenanceDetailPage").then((m) => ({
    default: m.MaintenanceDetailPage,
  })),
);

export const maintenanceRoutes: ModuleRouteConfig = {
  moduleId: "maintenance",
  basePath: "/maintenance",

  defaultProtection: RouteProtection.AUTHENTICATED,
  defaultLayout: RouteLayout.APP,

  moduleGuard: (_context) => true,

  routes: [
    {
      path: "",
      element: MaintenanceDashboardPage,
      meta: {
        title: "Taller de Mantenimiento",
        breadcrumb: "Mantenimiento",
        icon: "wrench",
      },
      chunkName: "maintenance-dashboard",
    },
    {
      path: ":assetId",
      element: MaintenanceDetailPage,
      meta: {
        title: "Detalle de Mantenimiento",
        breadcrumb: "Detalle",
      },
      chunkName: "maintenance-detail",
    },
  ],
};
