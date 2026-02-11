/**
 * RENTAL MODULE ROUTES
 * Rutas para el módulo de alquiler/cotizaciones
 */

import { Router } from "express";
import { quotationController } from "./controllers/quotation.controller";
import { contractController } from "./controllers/contract.controller";
import { templateController } from "./controllers/template.controller";
// import { authMiddleware } from "@core/middlewares/auth.middleware";

const router = Router();

// ============================================
// QUOTATIONS
// ============================================

// Listar cotizaciones
router.get("/quotations", quotationController.list.bind(quotationController));

// Obtener cotización por ID
router.get(
  "/quotations/:id",
  quotationController.getById.bind(quotationController),
);

// Crear cotización
router.post(
  "/quotations",
  quotationController.create.bind(quotationController),
);

// Generar PDF
router.post(
  "/quotations/:id/generate-pdf",
  quotationController.generatePDF.bind(quotationController),
);

// Solicitar firma digital
router.post(
  "/quotations/:id/request-signature",
  quotationController.requestSignature.bind(quotationController),
);

// Crear contrato desde cotización
router.post(
  "/quotations/:id/create-contract",
  quotationController.createContract.bind(quotationController),
);

// ============================================
// CONTRACTS
// ============================================

// Listar contratos
router.get("/contracts", contractController.list.bind(contractController));

// Obtener contrato por ID
router.get(
  "/contracts/:id",
  contractController.getById.bind(contractController),
);

// ============================================
// TEMPLATES
// ============================================

// Listar plantillas
router.get("/templates", templateController.list.bind(templateController));

// Obtener plantilla por ID
router.get(
  "/templates/:id",
  templateController.getById.bind(templateController),
);

// Crear plantilla
router.post("/templates", templateController.create.bind(templateController));

// Actualizar plantilla
router.put(
  "/templates/:id",
  templateController.update.bind(templateController),
);

// Eliminar plantilla
router.delete(
  "/templates/:id",
  templateController.delete.bind(templateController),
);

// ============================================
// WEBHOOKS (sin autenticación)
// ============================================

router.post(
  "/webhooks/digital-signature/:provider",
  quotationController.handleSignatureWebhook.bind(quotationController),
);

export default router;
