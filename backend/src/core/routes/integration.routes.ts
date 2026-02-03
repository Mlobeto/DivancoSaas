/**
 * Integration Routes
 * Endpoints para gestionar configuraciones de integraciones externas
 */

import { Router, Request, Response } from "express";
import { integrationService } from "../services/integration.service";
import { authenticate } from "../middlewares/auth.middleware";
import { IntegrationType } from "@prisma/client";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Integrations
 *   description: Gestión de credenciales de integraciones externas por BusinessUnit
 */

/**
 * @swagger
 * /integrations/{businessUnitId}:
 *   get:
 *     summary: Lista todas las integraciones configuradas
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Lista de integraciones configuradas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       provider:
 *                         type: string
 *                         enum: [SENDGRID, META_WHATSAPP, TWILIO_SMS, STRIPE, MERCADOPAGO, WOMPI, AWS_S3, CLOUDINARY, SIIGO, FACTURAMA, GOOGLE_MAPS]
 *                       isActive:
 *                         type: boolean
 *                       lastValidated:
 *                         type: string
 *                         format: date-time
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.get(
  "/:businessUnitId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId is required",
        });
      }

      // TODO: Verificar que el usuario tenga permisos sobre esta BU

      const integrations =
        await integrationService.listIntegrations(businessUnitId);

      res.json({
        success: true,
        data: integrations,
      });
    } catch (error: any) {
      console.error("[IntegrationRoutes] Error listing integrations:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to list integrations",
      });
    }
  },
);

/**
 * @swagger
 * /integrations/{businessUnitId}:
 *   post:
 *     summary: Configura o actualiza credenciales de una integración
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - credentials
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [SENDGRID, META_WHATSAPP, TWILIO_SMS, STRIPE, MERCADOPAGO, WOMPI, AWS_S3, CLOUDINARY, SIIGO, FACTURAMA, GOOGLE_MAPS]
 *               credentials:
 *                 type: object
 *                 description: Credenciales específicas del proveedor (se encriptarán automáticamente)
 *           examples:
 *             whatsapp:
 *               summary: Meta WhatsApp
 *               value:
 *                 provider: META_WHATSAPP
 *                 credentials:
 *                   phoneNumberId: "123456789"
 *                   businessAccountId: "987654321"
 *                   accessToken: "EAAxxxxxxxxxx"
 *                   webhookVerifyToken: "mi-token-secreto"
 *                   apiVersion: "v18.0"
 *             sendgrid:
 *               summary: SendGrid Email
 *               value:
 *                 provider: SENDGRID
 *                 credentials:
 *                   apiKey: "SG.xxxxxxxxxxxxxxx"
 *                   fromEmail: "noreply@miempresa.com"
 *                   fromName: "Mi Empresa"
 *     responses:
 *       200:
 *         description: Integración configurada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.post(
  "/:businessUnitId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;
      const { provider, credentials } = req.body;

      // Validaciones
      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId is required",
        });
      }

      if (!provider || !credentials) {
        return res.status(400).json({
          success: false,
          error: "provider and credentials are required",
        });
      }

      if (!Object.values(IntegrationType).includes(provider)) {
        return res.status(400).json({
          success: false,
          error: `Invalid provider. Must be one of: ${Object.values(IntegrationType).join(", ")}`,
        });
      }

      // TODO: Verificar que el usuario tenga permisos de admin sobre esta BU

      await integrationService.upsertCredentials({
        businessUnitId,
        provider: provider as IntegrationType,
        credentials,
      });

      res.json({
        success: true,
        message: `${provider} integration configured successfully`,
      });
    } catch (error: any) {
      console.error(
        "[IntegrationRoutes] Error configuring integration:",
        error,
      );
      res.status(500).json({
        success: false,
        error: error.message || "Failed to configure integration",
      });
    }
  },
);

/**
 * @swagger
 * /integrations/{businessUnitId}/{provider}/toggle:
 *   put:
 *     summary: Activa o desactiva una integración
 *     tags: [Integrations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: provider
 *         required: true
 *         schema:
 *           type: string
 *           enum: [SENDGRID, META_WHATSAPP, TWILIO_SMS, STRIPE, MERCADOPAGO, WOMPI]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isActive
 *             properties:
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Estado actualizado
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 */
router.put(
  "/:businessUnitId/:provider/toggle",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId, provider } = req.params;
      const { isActive } = req.body;

      if (
        !businessUnitId ||
        !provider ||
        typeof businessUnitId !== "string" ||
        typeof provider !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error: "businessUnitId and provider are required",
        });
      }

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          error: "isActive must be a boolean",
        });
      }

      // TODO: Verificar permisos

      await integrationService.toggleIntegration(
        businessUnitId,
        provider as IntegrationType,
        isActive,
      );

      res.json({
        success: true,
        message: `Integration ${isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error: any) {
      console.error("[IntegrationRoutes] Error toggling integration:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to toggle integration",
      });
    }
  },
);

/**
 * DELETE /api/integrations/:businessUnitId/:provider
 * Elimina permanentemente las credenciales de una integración
 */
router.delete(
  "/:businessUnitId/:provider",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId, provider } = req.params;

      if (
        !businessUnitId ||
        !provider ||
        typeof businessUnitId !== "string" ||
        typeof provider !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error: "businessUnitId and provider are required",
        });
      }

      // TODO: Verificar permisos

      await integrationService.deleteCredentials(
        businessUnitId,
        provider as IntegrationType,
      );

      res.json({
        success: true,
        message: "Integration credentials deleted successfully",
      });
    } catch (error: any) {
      console.error("[IntegrationRoutes] Error deleting integration:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete integration",
      });
    }
  },
);

/**
 * POST /api/integrations/:businessUnitId/:provider/validate
 * Valida las credenciales haciendo una prueba real con el proveedor
 */
router.post(
  "/:businessUnitId/:provider/validate",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId, provider } = req.params;

      if (
        !businessUnitId ||
        !provider ||
        typeof businessUnitId !== "string" ||
        typeof provider !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error: "businessUnitId and provider are required",
        });
      }

      // TODO: Verificar permisos

      const isValid = await integrationService.validateCredentials(
        businessUnitId,
        provider as IntegrationType,
      );

      res.json({
        success: true,
        isValid,
        message: isValid
          ? "Credentials are valid"
          : "Credentials validation failed",
      });
    } catch (error: any) {
      console.error("[IntegrationRoutes] Error validating integration:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to validate integration",
      });
    }
  },
);

/**
 * GET /api/integrations/:businessUnitId/:provider/status
 * Verifica si una integración está configurada y activa
 */
router.get(
  "/:businessUnitId/:provider/status",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId, provider } = req.params;

      if (
        !businessUnitId ||
        !provider ||
        typeof businessUnitId !== "string" ||
        typeof provider !== "string"
      ) {
        return res.status(400).json({
          success: false,
          error: "businessUnitId and provider are required",
        });
      }

      const isConfigured = await integrationService.isConfigured(
        businessUnitId,
        provider as IntegrationType,
      );

      res.json({
        success: true,
        isConfigured,
        provider,
      });
    } catch (error: any) {
      console.error("[IntegrationRoutes] Error checking status:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check integration status",
      });
    }
  },
);

export default router;
