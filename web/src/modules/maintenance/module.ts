import { ModuleDefinition } from "@/product";
import { maintenanceRoutes } from "./routes.config";

export const maintenanceModule: ModuleDefinition = {
  id: "maintenance",
  name: "Mantenimiento",
  description: "Gestión de mantenimiento post-obra y preventivo de activos",
  version: "1.0.0",
  vertical: "rental",

  routeConfig: maintenanceRoutes,

  navigation: [
    {
      id: "maintenance",
      label: "Mantenimiento",
      icon: "wrench",
      order: 35,
      children: [
        {
          id: "maintenance-dashboard",
          label: "Taller",
          path: "/maintenance",
          order: 1,
        },
      ],
    },
  ],
};
