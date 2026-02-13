/**
 * RENTAL MODULE ROUTES
 * Rutas para el módulo de alquiler/cotizaciones
 */

import { Router } from "express";
import { quotationController } from "./controllers/quotation.controller";
import { contractController } from "./controllers/contract.controller";
import { templateController } from "./controllers/template.controller";
import { accountController } from "./controllers/account.controller";
import { usageReportController } from "./controllers/usage-report.controller";
import { rentalController } from "./controllers/rental.controller";
import { jobsController } from "./controllers/jobs.controller";
// import { authMiddleware } from "@core/middlewares/auth.middleware";

const router = Router();

// ============================================
// CLIENT ACCOUNTS (Cuentas Compartidas)
// ============================================

// Crear cuenta de cliente
router.post("/accounts", accountController.create.bind(accountController));

// Obtener cuenta por ID
router.get("/accounts/:id", accountController.getById.bind(accountController));

// Obtener cuenta por clientId
router.get(
  "/accounts/client/:clientId",
  accountController.getByClientId.bind(accountController),
);

// Recargar saldo
router.post(
  "/accounts/:id/reload",
  accountController.reload.bind(accountController),
);

// Consultar saldo
router.get(
  "/accounts/:id/balance",
  accountController.getBalance.bind(accountController),
);

// Historial de movimientos
router.get(
  "/accounts/:id/movements",
  accountController.getMovements.bind(accountController),
);

// Estado de cuenta (PDF/JSON)
router.get(
  "/accounts/:id/statement",
  accountController.getStatement.bind(accountController),
);

// ============================================
// CONTRACTS (Contratos de Renta)
// ============================================

// Listar contratos
router.get("/contracts", contractController.list.bind(contractController));

// Obtener contrato por ID
router.get(
  "/contracts/:id",
  contractController.getById.bind(contractController),
);

// Crear contrato
router.post("/contracts", contractController.create.bind(contractController));

// Retirar asset
router.post(
  "/contracts/:id/withdraw",
  contractController.withdraw.bind(contractController),
);

// Devolver asset
router.post(
  "/contracts/:id/return",
  contractController.return.bind(contractController),
);

// Suspender contrato
router.patch(
  "/contracts/:id/suspend",
  contractController.suspend.bind(contractController),
);

// Reactivar contrato
router.patch(
  "/contracts/:id/reactivate",
  contractController.reactivate.bind(contractController),
);

// Completar contrato
router.patch(
  "/contracts/:id/complete",
  contractController.complete.bind(contractController),
);

// Proyectar consumo
router.get(
  "/contracts/:id/projection",
  contractController.getProjection.bind(contractController),
);

// ============================================
// USAGE REPORTS (Reportes Diarios - Mobile)
// ============================================

// Pre-validar reporte
router.post(
  "/usage-reports/validate",
  usageReportController.validate.bind(usageReportController),
);

// Crear reporte de uso
router.post(
  "/usage-reports",
  usageReportController.create.bind(usageReportController),
);

// Listar reportes por rental
router.get(
  "/usage-reports/rental/:rentalId",
  usageReportController.listByRental.bind(usageReportController),
);

// Obtener reporte por ID
router.get(
  "/usage-reports/:id",
  usageReportController.getById.bind(usageReportController),
);

// Estadísticas de uso
router.get(
  "/usage-reports/stats/:rentalId",
  usageReportController.getStats.bind(usageReportController),
);

// ============================================
// RENTALS (Assets en Renta Activos)
// ============================================

// Listar rentals activos
router.get("/rentals", rentalController.list.bind(rentalController));

// Obtener rental por ID
router.get("/rentals/:id", rentalController.getById.bind(rentalController));

// Desglose de costos
router.get(
  "/rentals/:id/costs",
  rentalController.getCosts.bind(rentalController),
);

// ============================================
// CRON JOBS (Ejecución Manual - Testing/Admin)
// ============================================

// Cargo automático herramientas
router.post(
  "/jobs/process-tools",
  jobsController.processTools.bind(jobsController),
);

// Notificar reportes faltantes
router.post(
  "/jobs/notify-missing",
  jobsController.notifyMissing.bind(jobsController),
);

// Enviar estados de cuenta
router.post(
  "/jobs/send-statements",
  jobsController.sendStatements.bind(jobsController),
);

// Verificar alertas de saldo
router.post(
  "/jobs/check-alerts",
  jobsController.checkAlerts.bind(jobsController),
);

// ============================================
// QUOTATIONS (Sistema anterior - mantener)
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

// Actualizar precios de items (override manual)
router.patch(
  "/quotations/:id/update-prices",
  quotationController.updatePrices.bind(quotationController),
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
