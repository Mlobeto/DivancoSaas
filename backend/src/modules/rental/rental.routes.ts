/**
 * RENTAL MODULE ROUTES
 * Rutas para el módulo de alquiler/cotizaciones
 */

import { Router } from "express";
import multer from "multer";
import { quotationController } from "./controllers/quotation.controller";
import { contractController } from "./controllers/contract.controller";
import { templateController } from "./controllers/template.controller";
import { accountController } from "./controllers/account.controller";
import { usageReportController } from "./controllers/usage-report.controller";
import { rentalController } from "./controllers/rental.controller";
import { jobsController } from "./controllers/jobs.controller";
import { operatorController } from "./controllers/operator.controller";
import { authenticate, authorize } from "@core/middlewares/auth.middleware";

const router = Router();

// Aplicar autenticación a todas las rutas del módulo rental
router.use(authenticate);

// Configure multer for logo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
  fileFilter: (req, file, cb) => {
    // Allow common image formats
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/svg+xml",
      "image/webp",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, GIF, SVG, WEBP) are allowed"));
    }
  },
});

// ============================================
// CLIENT ACCOUNTS (Cuentas Compartidas)
// ============================================

// Crear cuenta de cliente
router.post(
  "/accounts",
  authorize("accounts:create"),
  accountController.create.bind(accountController),
);

// Obtener cuenta por ID
router.get(
  "/accounts/:id",
  authorize("accounts:read"),
  accountController.getById.bind(accountController),
);

// Obtener cuenta por clientId
router.get(
  "/accounts/client/:clientId",
  authorize("accounts:read"),
  accountController.getByClientId.bind(accountController),
);

// Recargar saldo
router.post(
  "/accounts/:id/reload",
  authorize("accounts:update"),
  accountController.reload.bind(accountController),
);

// Consultar saldo
router.get(
  "/accounts/:id/balance",
  authorize("accounts:read"),
  accountController.getBalance.bind(accountController),
);

// Historial de movimientos
router.get(
  "/accounts/:id/movements",
  authorize("accounts:read"),
  accountController.getMovements.bind(accountController),
);

// Estado de cuenta (PDF/JSON)
router.get(
  "/accounts/:id/statement",
  authorize("accounts:read"),
  accountController.getStatement.bind(accountController),
);

// ============================================
// CONTRACTS (Contratos de Renta)
// ============================================

// Listar contratos
router.get(
  "/contracts",
  authorize("contracts:read"),
  contractController.list.bind(contractController),
);

// Obtener contrato por ID
router.get(
  "/contracts/:id",
  authorize("contracts:read"),
  contractController.getById.bind(contractController),
);

// Crear contrato
router.post(
  "/contracts",
  authorize("contracts:create"),
  contractController.create.bind(contractController),
);

// Retirar asset
router.post(
  "/contracts/:id/withdraw",
  authorize("contracts:update"),
  contractController.withdraw.bind(contractController),
);

// Devolver asset
router.post(
  "/contracts/:id/return",
  authorize("contracts:update"),
  contractController.return.bind(contractController),
);

// Suspender contrato
router.patch(
  "/contracts/:id/suspend",
  authorize("contracts:update"),
  contractController.suspend.bind(contractController),
);

// Reactivar contrato
router.patch(
  "/contracts/:id/reactivate",
  authorize("contracts:update"),
  contractController.reactivate.bind(contractController),
);

// Completar contrato
router.patch(
  "/contracts/:id/complete",
  authorize("contracts:update"),
  contractController.complete.bind(contractController),
);

// Proyectar consumo
router.get(
  "/contracts/:id/projection",
  authorize("contracts:read"),
  contractController.getProjection.bind(contractController),
);

// ============================================
// USAGE REPORTS (Reportes Diarios - Mobile)
// ============================================

// Pre-validar reporte
router.post(
  "/usage-reports/validate",
  authorize("reports:create"),
  usageReportController.validate.bind(usageReportController),
);

// Crear reporte de uso
router.post(
  "/usage-reports",
  authorize("reports:create"),
  usageReportController.create.bind(usageReportController),
);

// Listar reportes por rental
router.get(
  "/usage-reports/rental/:rentalId",
  authorize("reports:read"),
  usageReportController.listByRental.bind(usageReportController),
);

// Obtener reporte por ID
router.get(
  "/usage-reports/:id",
  authorize("reports:read"),
  usageReportController.getById.bind(usageReportController),
);

// Estadísticas de uso
router.get(
  "/usage-reports/stats/:rentalId",
  authorize("reports:read"),
  usageReportController.getStats.bind(usageReportController),
);

// ============================================
// RENTALS (Assets en Renta Activos)
// ============================================

// Listar rentals activos
router.get(
  "/rentals",
  authorize("rental:read"),
  rentalController.list.bind(rentalController),
);

// Obtener rental por ID
router.get(
  "/rentals/:id",
  authorize("rental:read"),
  rentalController.getById.bind(rentalController),
);

// Desglose de costos
router.get(
  "/rentals/:id/costs",
  authorize("rental:read"),
  rentalController.getCosts.bind(rentalController),
);

// ============================================
// CRON JOBS (Ejecución Manual - Testing/Admin)
// ============================================

// Cargo automático herramientas
router.post(
  "/jobs/process-tools",
  authorize("admin:system"),
  jobsController.processTools.bind(jobsController),
);

// Notificar reportes faltantes
router.post(
  "/jobs/notify-missing",
  authorize("admin:system"),
  jobsController.notifyMissing.bind(jobsController),
);

// Enviar estados de cuenta
router.post(
  "/jobs/send-statements",
  authorize("admin:system"),
  jobsController.sendStatements.bind(jobsController),
);

// Verificar alertas de saldo
router.post(
  "/jobs/check-alerts",
  authorize("admin:system"),
  jobsController.checkAlerts.bind(jobsController),
);

// ============================================
// QUOTATIONS (Sistema anterior - mantener)
// ============================================

// Listar cotizaciones
router.get(
  "/quotations",
  authorize("quotations:read"),
  quotationController.list.bind(quotationController),
);

// Obtener cotización por ID
router.get(
  "/quotations/:id",
  authorize("quotations:read"),
  quotationController.getById.bind(quotationController),
);

// Crear cotización
router.post(
  "/quotations",
  authorize("quotations:create"),
  quotationController.create.bind(quotationController),
);

// Actualizar precios de items (override manual)
router.patch(
  "/quotations/:id/update-prices",
  authorize("quotations:update"),
  quotationController.updatePrices.bind(quotationController),
);

// Generar PDF
router.post(
  "/quotations/:id/generate-pdf",
  authorize("quotations:read"),
  quotationController.generatePDF.bind(quotationController),
);

// Enviar cotización por email
router.post(
  "/quotations/:id/send-email",
  authorize("quotations:read"),
  quotationController.sendEmail.bind(quotationController),
);

// Solicitar firma digital
router.post(
  "/quotations/:id/request-signature",
  authorize("quotations:approve"),
  quotationController.requestSignature.bind(quotationController),
);

// Crear contrato desde cotización
router.post(
  "/quotations/:id/create-contract",
  authorize("quotations:approve"),
  quotationController.createContract.bind(quotationController),
);

// ============================================
// TEMPLATES
// ============================================

// ============================================
// TEMPLATES (Plantillas para PDFs)
// ============================================

// Listar plantillas
router.get(
  "/templates",
  authenticate,
  authorize("templates:read"),
  templateController.list.bind(templateController),
);

// Obtener plantilla por ID
router.get(
  "/templates/:id",
  authenticate,
  authorize("templates:read"),
  templateController.getById.bind(templateController),
);

// Crear plantilla
router.post(
  "/templates",
  authenticate,
  authorize("templates:create"),
  templateController.create.bind(templateController),
);

// Actualizar plantilla
router.put(
  "/templates/:id",
  authenticate,
  authorize("templates:update"),
  templateController.update.bind(templateController),
);

// Eliminar plantilla
router.delete(
  "/templates/:id",
  authenticate,
  authorize("templates:delete"),
  templateController.delete.bind(templateController),
);

// @deprecated Upload logo for template - USE BRANDING API INSTEAD
// Use PUT /api/v1/branding/:businessUnitId to manage logos per BusinessUnit
router.post(
  "/templates/:id/logo",
  authenticate,
  authorize("templates:update"),
  upload.single("logo"),
  templateController.uploadLogo.bind(templateController),
);

// ============================================
// OPERATORS (Perfiles de Operarios)
// ============================================

// --- ADMIN: Operator Profiles ---

// Crear perfil de operario
router.post(
  "/operators",
  authorize("operators:create"),
  operatorController.create.bind(operatorController),
);

// Listar operarios
router.get(
  "/operators",
  authorize("operators:read"),
  operatorController.list.bind(operatorController),
);

// Obtener perfil por ID
router.get(
  "/operators/:id",
  authorize("operators:read"),
  operatorController.getById.bind(operatorController),
);

// Actualizar perfil
router.patch(
  "/operators/:id",
  authorize("operators:update"),
  operatorController.update.bind(operatorController),
);

// Eliminar perfil
router.delete(
  "/operators/:id",
  authorize("operators:delete"),
  operatorController.delete.bind(operatorController),
);

// --- ADMIN: Documents ---

// Agregar documento al operario
router.post(
  "/operators/:id/documents",
  authorize("operators:update"),
  operatorController.addDocument.bind(operatorController),
);

// Actualizar documento (Admin verifica/aprueba)
router.patch(
  "/operators/documents/:documentId",
  authorize("operators:update"),
  operatorController.updateDocument.bind(operatorController),
);

// Eliminar documento
router.delete(
  "/operators/documents/:documentId",
  authorize("operators:update"),
  operatorController.deleteDocument.bind(operatorController),
);

// --- ADMIN: Assignments ---

// Crear asignación
router.post(
  "/operators/:id/assignments",
  authorize("operators:assign"),
  operatorController.createAssignment.bind(operatorController),
);

// Obtener asignaciones de operario
router.get(
  "/operators/:id/assignments",
  authorize("operators:read"),
  operatorController.getAssignments.bind(operatorController),
);

// Actualizar asignación
router.patch(
  "/operators/assignments/:assignmentId",
  authorize("operators:assign"),
  operatorController.updateAssignment.bind(operatorController),
);

// --- ADMIN: Expense Approval ---

// Aprobar/Rechazar viático
router.post(
  "/operators/expenses/:expenseId/approve",
  authorize("operators:approve_expenses"),
  operatorController.approveExpense.bind(operatorController),
);

// --- MOBILE: Operator Self-Service ---

// Obtener mi perfil (Mobile)
router.get(
  "/operators/my/profile",
  operatorController.getMyProfile.bind(operatorController),
);

// Crear reporte diario (Mobile)
router.post(
  "/operators/my/daily-reports",
  operatorController.createDailyReport.bind(operatorController),
);

// Obtener mis reportes
router.get(
  "/operators/my/daily-reports",
  operatorController.getMyDailyReports.bind(operatorController),
);

// Crear viático (Mobile)
router.post(
  "/operators/my/expenses",
  operatorController.createExpense.bind(operatorController),
);

// Obtener mis viáticos
router.get(
  "/operators/my/expenses",
  operatorController.getMyExpenses.bind(operatorController),
);

// ============================================
// WEBHOOKS (sin autenticación)
// ============================================

router.post(
  "/webhooks/digital-signature/:provider",
  quotationController.handleSignatureWebhook.bind(quotationController),
);

export default router;
