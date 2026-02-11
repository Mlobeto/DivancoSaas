import { Router } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { ClientsController } from "../controllers/clients.controller";

const router = Router();

// Todas las rutas de clientes requieren autenticación y contexto de BU
router.use(authenticate);

router.get("/clients", ClientsController.listClients);
router.post("/clients", ClientsController.createClient);
router.get("/clients/:clientId", ClientsController.getClientById);
router.put("/clients/:clientId", ClientsController.updateClient);

router.get("/clients/:clientId/summary", ClientsController.getClientSummary);

router.get(
  "/clients/:clientId/risk-profile",
  ClientsController.getClientRiskProfile,
);

router.get(
  "/clients/:clientId/account-movements",
  ClientsController.listAccountMovements,
);

router.post(
  "/clients/:clientId/account-movements",
  ClientsController.createAccountMovement,
);

router.get("/config/current", ClientsController.getCurrentConfig);

router.put("/config/current", ClientsController.updateCurrentConfig);

export default router;
