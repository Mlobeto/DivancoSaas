/**
 * Rental Vertical Definition
 *
 * The rental vertical orchestrates equipment rental operations including
 * quotations, contracts, billing, and usage tracking.
 *
 * This vertical depends on core modules: inventory, clients, and purchases.
 */

import { VerticalDefinition } from "@/product";
import { rentalRoutes } from "./routes.config";

/**
 * Rental vertical definition for equipment rental industry
 */
export const rentalVertical: VerticalDefinition = {
  id: "rental",
  name: "Alquileres",
  description: "Vertical de alquiler de equipos y maquinaria",
  version: "1.0.0",
  industry: "equipment-rental",

  /**
   * Core modules required by this vertical
   */
  requiredCoreModules: ["inventory", "clients", "purchases"],

  /**
   * Optional core modules that enhance functionality
   */
  optionalCoreModules: ["maintenance"],

  /**
   * Dynamic route configuration
   */
  routeConfig: rentalRoutes,

  /**
   * Navigation structure
   * Will be prioritized over core module navigation
   */
  navigation: [
    {
      id: "rental",
      label: "Alquileres",
      icon: "rental",
      order: 40,
      children: [
        {
          id: "rental-quotations",
          label: "Cotizaciones",
          path: "/rental/quotations",
          order: 1,
        },
        {
          id: "rental-contracts",
          label: "Contratos",
          path: "/rental/contracts",
          order: 2,
        },
        {
          id: "rental-operators",
          label: "Operadores",
          path: "/rental/operators",
          order: 3,
        },
        {
          id: "rental-templates",
          label: "Plantillas",
          path: "/rental/templates",
          order: 4,
        },
        {
          id: "rental-accounts",
          label: "Cuentas",
          path: "/rental/accounts",
          order: 5,
        },
      ],
    },
  ],

  /**
   * Required permissions to access this vertical
   */
  permissions: ["rental:read"],

  /**
   * Dashboard component (optional)
   * Provides vertical-specific overview
   * TODO: Create RentalDashboard component
   */
  // dashboard: lazy(() =>
  //   import("@/modules/rental/components/RentalDashboard").then((m) => ({
  //     default: m.RentalDashboard,
  //   })),
  // ),

  /**
   * Vertical initialization (optional)
   */
  onInit: async () => {
    console.log("[Rental Vertical] Initialized");
    console.log(
      "[Rental Vertical] Required core modules: inventory, clients, purchases",
    );
  },

  /**
   * Vertical cleanup (optional)
   */
  onDestroy: async () => {
    console.log("[Rental Vertical] Destroyed");
  },
};
