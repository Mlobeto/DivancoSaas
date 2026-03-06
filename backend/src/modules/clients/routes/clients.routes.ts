import { Router } from "express";
import { authenticate, authorize } from "@core/middlewares/auth.middleware";
import { ClientsController } from "../controllers/clients.controller";

const router = Router();

// Todas las rutas de clientes requieren autenticación y contexto de BU
router.use(authenticate);

router.get(
  "/clients",
  authorize("clients:read"),
  ClientsController.listClients,
);
router.post(
  "/clients",
  authorize("clients:create"),
  ClientsController.createClient,
);
router.get(
  "/global-search",
  authorize("clients:read"),
  ClientsController.searchGlobalClients,
);
router.post(
  "/clients/:clientId/link",
  authorize("clients:create"),
  ClientsController.linkClient,
);
router.get(
  "/clients/:clientId",
  authorize("clients:read"),
  ClientsController.getClientById,
);
router.put(
  "/clients/:clientId",
  authorize("clients:update"),
  ClientsController.updateClient,
);
router.delete(
  "/clients/:clientId",
  authorize("clients:update"),
  ClientsController.deleteClient,
);

router.get(
  "/clients/:clientId/summary",
  authorize("clients:read"),
  ClientsController.getClientSummary,
);

router.get(
  "/clients/:clientId/risk-profile",
  authorize("clients:read"),
  ClientsController.getClientRiskProfile,
);

router.get(
  "/clients/:clientId/account-movements",
  authorize("clients:read"),
  ClientsController.listAccountMovements,
);

router.post(
  "/clients/:clientId/account-movements",
  authorize("billing:manage"),
  ClientsController.createAccountMovement,
);

router.get(
  "/clients/:clientId/rental-credit-profile",
  authorize("clients:read"),
  ClientsController.getRentalCreditProfile,
);

router.put(
  "/clients/:clientId/rental-credit-profile",
  authorize("clients:update-credit-limit"),
  ClientsController.updateRentalCreditProfile,
);

router.get(
  "/config/current",
  authorize("settings:manage"),
  ClientsController.getCurrentConfig,
);

router.put(
  "/config/current",
  authorize("settings:manage"),
  ClientsController.updateCurrentConfig,
);

export default router;
