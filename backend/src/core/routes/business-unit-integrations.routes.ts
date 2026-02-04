/**
 * BUSINESS UNIT INTEGRATIONS ROUTES
 * Endpoints para configurar integraciones de email, WhatsApp, SMS, etc. por BusinessUnit
 */

import { Router, Request, Response } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import { BusinessUnitIntegrationService } from "@core/services/business-unit-integration.service";
import { z } from "zod";

const router = Router();
const integrationService = new BusinessUnitIntegrationService();

router.use(authenticate);

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const configureEmailIntegrationSchema = z.object({
  provider: z.enum(["sendgrid", "azure-communication-services"]),
  credentials: z.object({
    apiKey: z.string().optional(),
    connectionString: z.string().optional(),
  }),
  config: z.object({
    defaultFrom: z.string().email(),
    defaultFromName: z.string().optional(),
  }),
});

const configureSMSIntegrationSchema = z.object({
  provider: z.enum(["twilio", "aws-sns"]),
  credentials: z.object({
    accountSid: z.string().optional(),
    authToken: z.string().optional(),
    apiKey: z.string().optional(),
  }),
  config: z.object({
    fromNumber: z.string(),
  }),
});

const configureWhatsAppIntegrationSchema = z.object({
  provider: z.enum(["meta-whatsapp"]),
  credentials: z.object({
    accessToken: z.string(),
    phoneNumberId: z.string(),
  }),
  config: z.object({
    businessAccountId: z.string().optional(),
    webhookVerifyToken: z.string().optional(),
  }),
});

// ============================================================================
// ENDPOINTS
// ============================================================================

/**
 * @openapi
 * /business-units/{businessUnitId}/integrations/email:
 *   post:
 *     tags: [Business Unit Integrations]
 *     summary: Configurar integración de Email para una Business Unit
 *     description: |
 *       Configura el proveedor de email que usará esta Business Unit para enviar correos transaccionales.
 *       Cada Business Unit puede tener su propio proveedor y credenciales independientes.
 *
 *       **Proveedores soportados:**
 *       - `sendgrid` - SendGrid Email API
 *       - `azure-communication-services` - Azure Communication Services Email
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [provider, credentials, config]
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [sendgrid, azure-communication-services]
 *                 example: azure-communication-services
 *               credentials:
 *                 type: object
 *                 description: Credenciales específicas del proveedor
 *                 properties:
 *                   apiKey:
 *                     type: string
 *                     description: API Key de SendGrid (requerido si provider = sendgrid)
 *                     example: SG.xxxxxxxxxxxxxxxxx
 *                   connectionString:
 *                     type: string
 *                     description: Connection String de Azure (requerido si provider = azure-communication-services)
 *                     example: endpoint=https://xxx.communication.azure.com/;accesskey=xxx
 *               config:
 *                 type: object
 *                 required: [defaultFrom]
 *                 properties:
 *                   defaultFrom:
 *                     type: string
 *                     format: email
 *                     description: Email remitente por defecto
 *                     example: noreply@divanco.com
 *                   defaultFromName:
 *                     type: string
 *                     description: Nombre del remitente
 *                     example: Grupo Divanco
 *           examples:
 *             sendgrid:
 *               summary: Configurar SendGrid
 *               value:
 *                 provider: sendgrid
 *                 credentials:
 *                   apiKey: SG.xxxxxxxxxxxxxxxxx
 *                 config:
 *                   defaultFrom: noreply@miempresa.com
 *                   defaultFromName: Mi Empresa
 *             azure:
 *               summary: Configurar Azure Communication Services
 *               value:
 *                 provider: azure-communication-services
 *                 credentials:
 *                   connectionString: endpoint=https://xxx.communication.azure.com/;accesskey=xxx
 *                 config:
 *                   defaultFrom: noreply@divanco.com
 *                   defaultFromName: Grupo Divanco
 *     responses:
 *       200:
 *         description: Integración configurada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Email integration configured successfully" }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     businessUnitId: { type: string, format: uuid }
 *                     type: { type: string, example: "email" }
 *                     provider: { type: string, example: "azure-communication-services" }
 *                     isActive: { type: boolean, example: true }
 *                     createdAt: { type: string, format: date-time }
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error del servidor
 */
router.post(
  "/:businessUnitId/integrations/email",
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId must be a string",
        });
      }

      const validation = configureEmailIntegrationSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: "Validation error",
          details: validation.error.issues,
        });
      }

      const { provider, credentials, config } = validation.data;

      const integration = await integrationService.configureEmailIntegration(
        businessUnitId,
        provider,
        credentials,
        config,
      );

      res.json({
        success: true,
        message: "Email integration configured successfully",
        data: integration,
      });
    } catch (error: any) {
      console.error("[BU Integrations] Error configuring email:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to configure email integration",
      });
    }
  },
);

/**
 * @openapi
 * /business-units/{businessUnitId}/integrations/email:
 *   get:
 *     tags: [Business Unit Integrations]
 *     summary: Obtener integración de Email configurada
 *     description: Devuelve la configuración actual de email para esta Business Unit (sin credenciales sensibles)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Configuración de email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     provider: { type: string, example: "azure-communication-services" }
 *                     isActive: { type: boolean, example: true }
 *                     config:
 *                       type: object
 *                       properties:
 *                         defaultFrom: { type: string, example: "noreply@divanco.com" }
 *                         defaultFromName: { type: string, example: "Grupo Divanco" }
 *       404:
 *         description: No hay integración configurada
 *       401:
 *         description: No autenticado
 */
router.get(
  "/:businessUnitId/integrations/email",
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId must be a string",
        });
      }

      const integration =
        await integrationService.getEmailIntegration(businessUnitId);

      if (!integration) {
        return res.status(404).json({
          success: false,
          error: "No email integration configured for this Business Unit",
        });
      }

      res.json({
        success: true,
        data: {
          provider: integration.provider,
          isActive: integration.isActive,
          config: integration.config,
          createdAt: integration.createdAt,
          updatedAt: integration.updatedAt,
        },
      });
    } catch (error: any) {
      console.error("[BU Integrations] Error getting email config:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get email integration",
      });
    }
  },
);

/**
 * @openapi
 * /business-units/{businessUnitId}/integrations/email:
 *   delete:
 *     tags: [Business Unit Integrations]
 *     summary: Eliminar integración de Email
 *     description: Desactiva y elimina la integración de email configurada. Los emails volverán a usar el fallback global si está disponible.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Integración eliminada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string, example: "Email integration deleted successfully" }
 *       404:
 *         description: No hay integración configurada
 *       401:
 *         description: No autenticado
 */
router.delete(
  "/:businessUnitId/integrations/email",
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId must be a string",
        });
      }

      await integrationService.deleteEmailIntegration(businessUnitId);

      res.json({
        success: true,
        message: "Email integration deleted successfully",
      });
    } catch (error: any) {
      console.error("[BU Integrations] Error deleting email config:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to delete email integration",
      });
    }
  },
);

/**
 * @openapi
 * /business-units/{businessUnitId}/integrations:
 *   get:
 *     tags: [Business Unit Integrations]
 *     summary: Listar todas las integraciones configuradas
 *     description: Devuelve todas las integraciones activas para esta Business Unit (email, SMS, WhatsApp, etc.)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Lista de integraciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type: { type: string, enum: [email, sms, whatsapp, invoice, shipping] }
 *                       provider: { type: string }
 *                       isActive: { type: boolean }
 *                       createdAt: { type: string, format: date-time }
 *       401:
 *         description: No autenticado
 */
router.get(
  "/:businessUnitId/integrations",
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId must be a string",
        });
      }

      const integrations =
        await integrationService.listAllIntegrations(businessUnitId);

      res.json({
        success: true,
        data: integrations,
      });
    } catch (error: any) {
      console.error("[BU Integrations] Error listing integrations:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to list integrations",
      });
    }
  },
);

export default router;
