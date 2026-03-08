/**
 * RENTAL MODULE ROUTES
 * Rutas para el módulo de alquiler/cotizaciones
 */

import { Router } from "express";
import multer from "multer";
import { quotationController } from "./controllers/quotation.controller";
import { contractController } from "./controllers/contract.controller";
import { contractClauseController } from "./controllers/contract-clause.controller";
import { contractTemplateController } from "./controllers/contract-template.controller";
import { templateController } from "./controllers/template.controller";
import { accountController } from "./controllers/account.controller";
import { usageReportController } from "./controllers/usage-report.controller";
import { rentalController } from "./controllers/rental.controller";
import { jobsController } from "./controllers/jobs.controller";
import { operatorController } from "./controllers/operator.controller";
import { contractAddendumController } from "./controllers/contract-addendum.controller";
import { limitChangeRequestController } from "./controllers/limit-change-request.controller";
import { contractClauseTemplateController } from "./controllers/contract-clause-template.controller";
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
// CONTRACT CLAUSES (Cláusulas Modulares)
// ============================================

// Listar cláusulas
router.get(
  "/clauses",
  authorize("contracts:read"),
  contractClauseController.list.bind(contractClauseController),
);

// Obtener cláusula por ID
router.get(
  "/clauses/:id",
  authorize("contracts:read"),
  contractClauseController.getById.bind(contractClauseController),
);

// Crear cláusula
router.post(
  "/clauses",
  authorize("contracts:create"),
  contractClauseController.create.bind(contractClauseController),
);

// Actualizar cláusula
router.patch(
  "/clauses/:id",
  authorize("contracts:update"),
  contractClauseController.update.bind(contractClauseController),
);

// Eliminar cláusula
router.delete(
  "/clauses/:id",
  authorize("contracts:delete"),
  contractClauseController.delete.bind(contractClauseController),
);

// Preview de cláusulas aplicables
router.post(
  "/clauses/preview",
  authorize("contracts:read"),
  contractClauseController.preview.bind(contractClauseController),
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

// Payment Proof - Subir comprobante (multipart)
router.post(
  "/contracts/:id/payment-proof",
  authorize("contracts:update"),
  upload.single("file"),
  contractController.uploadPaymentProof.bind(contractController),
);

// Payment Proof - Marcar como pago local/efectivo
router.post(
  "/contracts/:id/payment-proof/local",
  authorize("contracts:update"),
  contractController.markLocalPayment.bind(contractController),
);

// Payment Proof - Obtener información
router.get(
  "/contracts/:id/payment-proof",
  authorize("contracts:read"),
  contractController.getPaymentProof.bind(contractController),
);

// Payment Proof - Verificar (admin)
router.post(
  "/contracts/:id/payment-proof/verify",
  authorize("contracts:update"),
  contractController.verifyPaymentProof.bind(contractController),
);

// ============================================
// DIGITAL SIGNATURE (SignNow)
// ============================================

// Solicitar firma digital
router.post(
  "/contracts/:id/request-signature",
  authorize("contracts:update"),
  contractController.requestSignature.bind(contractController),
);

// Obtener estado de firma
router.get(
  "/contracts/:id/signature-status",
  authorize("contracts:read"),
  contractController.getSignatureStatus.bind(contractController),
);

// Descargar PDF del contrato
router.get(
  "/contracts/:id/pdf",
  authorize("contracts:read"),
  contractController.downloadPdf.bind(contractController),
);

// Descargar PDF firmado del contrato
router.get(
  "/contracts/:id/signed-pdf",
  authorize("contracts:read"),
  contractController.downloadSignedPdf.bind(contractController),
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

// Actualizar cotización completa (solo en status no paid/cancelled)
router.patch(
  "/quotations/:id",
  authorize("quotations:update"),
  quotationController.update.bind(quotationController),
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

// Enviar link de revisión al cliente (nuevo flujo: approve/request-changes)
router.post(
  "/quotations/:id/send-review",
  authorize("quotations:read"),
  quotationController.sendForReview.bind(quotationController),
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

// Enviar cotización al cliente (o solicitar aprobación si no tiene permiso)
router.post(
  "/quotations/:id/send",
  authorize("quotations:create"), // cualquier creador puede intentar enviar
  quotationController.send.bind(quotationController),
);

// Aprobar cotización pendiente (requiere quotations:approve)
router.post(
  "/quotations/:id/approve",
  authorize("quotations:approve", "quotations:approve-credit-limit"),
  quotationController.approve.bind(quotationController),
);

// Rechazar cotización pendiente (requiere quotations:approve)
router.post(
  "/quotations/:id/reject",
  authorize("quotations:approve"),
  quotationController.reject.bind(quotationController),
);

// Confirmar pago recibido por transferencia (requiere quotations:confirm-payment)
router.post(
  "/quotations/:id/confirm-payment",
  authorize("quotations:confirm-payment"),
  quotationController.confirmPayment.bind(quotationController),
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
// CONTRACT TEMPLATES V2.0 (Sistema Modular)
// ============================================

// Renderizar contrato desde template v2.0
router.post(
  "/contracts/templates/render",
  authorize("contracts:read"),
  contractTemplateController.renderContract.bind(contractTemplateController),
);

// Crear template v2.0
router.post(
  "/contracts/templates",
  authorize("templates:create"),
  contractTemplateController.createTemplate.bind(contractTemplateController),
);

// Migrar template legacy a v2.0
router.post(
  "/contracts/templates/:id/migrate-v2",
  authorize("templates:update"),
  contractTemplateController.migrateToV2.bind(contractTemplateController),
);

// Preview de sección
router.post(
  "/contracts/templates/preview-section",
  authorize("contracts:read"),
  contractTemplateController.previewSection.bind(contractTemplateController),
);

// Obtener metadata del template
router.get(
  "/contracts/templates/:id/metadata",
  authorize("templates:read"),
  contractTemplateController.getTemplateMetadata.bind(
    contractTemplateController,
  ),
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
  authorize("mobile:access"),
  operatorController.getMyProfile.bind(operatorController),
);

// Crear reporte diario (Mobile)
router.post(
  "/operators/my/daily-reports",
  authorize("mobile:access"),
  operatorController.createDailyReport.bind(operatorController),
);

// Obtener mis reportes
router.get(
  "/operators/my/daily-reports",
  authorize("mobile:access"),
  operatorController.getMyDailyReports.bind(operatorController),
);

// Crear viático (Mobile)
router.post(
  "/operators/my/expenses",
  authorize("mobile:access"),
  operatorController.createExpense.bind(operatorController),
);

// Obtener mis viáticos
router.get(
  "/operators/my/expenses",
  authorize("mobile:access"),
  operatorController.getMyExpenses.bind(operatorController),
);

// ============================================
// MASTER CONTRACT SYSTEM (v7.0)
// ============================================

// -------- CONTRACT ADDENDUMS --------

// Crear addendum para contrato master
router.post(
  "/contracts/:contractId/addendums",
  authorize("contracts:update"),
  contractAddendumController.create.bind(contractAddendumController),
);

// Listar addendums de un contrato
router.get(
  "/contracts/:contractId/addendums",
  authorize("contracts:read"),
  contractAddendumController.list.bind(contractAddendumController),
);

// Obtener addendum por ID
router.get(
  "/addendums/:addendumId",
  authorize("contracts:read"),
  contractAddendumController.getById.bind(contractAddendumController),
);

// Actualizar addendum
router.patch(
  "/addendums/:addendumId",
  authorize("contracts:update"),
  contractAddendumController.update.bind(contractAddendumController),
);

// Completar addendum
router.post(
  "/addendums/:addendumId/complete",
  authorize("contracts:update"),
  contractAddendumController.complete.bind(contractAddendumController),
);

// Cancelar addendum
router.post(
  "/addendums/:addendumId/cancel",
  authorize("contracts:update"),
  contractAddendumController.cancel.bind(contractAddendumController),
);

// -------- LIMIT CHANGE REQUESTS --------

// Crear solicitud de ampliación de límites
router.post(
  "/limit-requests",
  authorize("accounts:update"),
  limitChangeRequestController.create.bind(limitChangeRequestController),
);

// Listar solicitudes
router.get(
  "/limit-requests",
  authorize("accounts:read"),
  limitChangeRequestController.list.bind(limitChangeRequestController),
);

// Obtener solicitud por ID
router.get(
  "/limit-requests/:requestId",
  authorize("accounts:read"),
  limitChangeRequestController.getById.bind(limitChangeRequestController),
);

// Revisar solicitud (aprobar/rechazar)
router.post(
  "/limit-requests/:requestId/review",
  authorize("admin"),
  limitChangeRequestController.review.bind(limitChangeRequestController),
);

// Cancelar solicitud
router.post(
  "/limit-requests/:requestId/cancel",
  authorize("accounts:update"),
  limitChangeRequestController.cancel.bind(limitChangeRequestController),
);

// Estadísticas de solicitudes
router.get(
  "/limit-requests/stats",
  authorize("accounts:read"),
  limitChangeRequestController.getStats.bind(limitChangeRequestController),
);

// -------- CONTRACT CLAUSE TEMPLATES --------

// Crear plantilla de cláusula
router.post(
  "/clause-templates",
  authorize("contracts:create"),
  contractClauseTemplateController.create.bind(
    contractClauseTemplateController,
  ),
);

// Listar plantillas
router.get(
  "/clause-templates",
  authorize("contracts:read"),
  contractClauseTemplateController.list.bind(contractClauseTemplateController),
);

// Obtener plantilla por ID
router.get(
  "/clause-templates/:templateId",
  authorize("contracts:read"),
  contractClauseTemplateController.getById.bind(
    contractClauseTemplateController,
  ),
);

// Actualizar plantilla
router.patch(
  "/clause-templates/:templateId",
  authorize("contracts:update"),
  contractClauseTemplateController.update.bind(
    contractClauseTemplateController,
  ),
);

// Eliminar plantilla
router.delete(
  "/clause-templates/:templateId",
  authorize("admin"),
  contractClauseTemplateController.delete.bind(
    contractClauseTemplateController,
  ),
);

// Duplicar plantilla
router.post(
  "/clause-templates/:templateId/duplicate",
  authorize("contracts:create"),
  contractClauseTemplateController.duplicate.bind(
    contractClauseTemplateController,
  ),
);

// Interpolar variables en plantilla
router.post(
  "/clause-templates/interpolate",
  authorize("contracts:read"),
  contractClauseTemplateController.interpolate.bind(
    contractClauseTemplateController,
  ),
);

// Reordenar plantillas
router.post(
  "/clause-templates/reorder",
  authorize("contracts:update"),
  contractClauseTemplateController.reorder.bind(
    contractClauseTemplateController,
  ),
);

// ============================================
// WEBHOOKS (sin autenticación)
// ============================================

router.post(
  "/webhooks/digital-signature/:provider",
  quotationController.handleSignatureWebhook.bind(quotationController),
);

export default router;
