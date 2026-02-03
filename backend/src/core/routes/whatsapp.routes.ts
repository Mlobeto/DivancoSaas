/**
 * WhatsApp Routes
 * Endpoints para enviar mensajes y gestionar webhooks de WhatsApp
 */

import { Router, Request, Response } from "express";
import { whatsappService } from "../services/whatsapp.service";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: Envío de mensajes y gestión de webhooks de WhatsApp Business
 */

/**
 * @swagger
 * /whatsapp/send/text:
 *   post:
 *     summary: Envía un mensaje de texto por WhatsApp
 *     description: Envía un mensaje de texto simple. Solo funciona dentro de la ventana de 24 horas después de que el usuario contactó al negocio.
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - message
 *               - businessUnitId
 *             properties:
 *               to:
 *                 type: string
 *                 description: Número de teléfono en formato internacional
 *                 example: "+573001234567"
 *               message:
 *                 type: string
 *                 description: Texto del mensaje
 *                 example: "Hola, tu pedido está en camino"
 *               businessUnitId:
 *                 type: string
 *                 description: ID de la Business Unit
 *     responses:
 *       200:
 *         description: Mensaje enviado exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autenticado
 *       500:
 *         description: Error al enviar mensaje
 */
router.post("/send/text", authenticate, async (req: Request, res: Response) => {
  try {
    const { to, message, businessUnitId } = req.body;
    const tenantId = (req as any).user?.tenantId;

    if (!to || !message || !businessUnitId) {
      return res.status(400).json({
        success: false,
        error: "to, message, and businessUnitId are required",
      });
    }

    // TODO: Verificar permisos del usuario sobre la BU

    await whatsappService.sendText({
      to,
      message,
      tenantId,
      businessUnitId,
    });

    res.json({
      success: true,
      message: "WhatsApp message sent successfully",
    });
  } catch (error: any) {
    console.error("[WhatsAppRoutes] Error sending text:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to send WhatsApp message",
    });
  }
});

/**
 * @swagger
 * /whatsapp/send/template:
 *   post:
 *     summary: Envía un mensaje usando una plantilla aprobada por Meta
 *     description: Las plantillas deben estar previamente creadas y aprobadas en Meta Business Manager. Permiten enviar mensajes fuera de la ventana de 24 horas.
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - templateName
 *               - language
 *               - businessUnitId
 *             properties:
 *               to:
 *                 type: string
 *                 example: "+573001234567"
 *               templateName:
 *                 type: string
 *                 description: Nombre de la plantilla aprobada en Meta
 *                 example: "welcome_message"
 *               language:
 *                 type: string
 *                 description: Código de idioma
 *                 example: "es_MX"
 *               businessUnitId:
 *                 type: string
 *               components:
 *                 type: array
 *                 description: Parámetros de la plantilla (opcional)
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Plantilla enviada exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al enviar plantilla
 */
router.post(
  "/send/template",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { to, templateName, language, components, businessUnitId } =
        req.body;
      const tenantId = (req as any).user?.tenantId;

      if (!to || !templateName || !language || !businessUnitId) {
        return res.status(400).json({
          success: false,
          error: "to, templateName, language, and businessUnitId are required",
        });
      }

      await whatsappService.sendTemplate({
        to,
        templateName,
        language,
        components,
        tenantId,
        businessUnitId,
      });

      res.json({
        success: true,
        message: "WhatsApp template sent successfully",
      });
    } catch (error: any) {
      console.error("[WhatsAppRoutes] Error sending template:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send WhatsApp template",
      });
    }
  },
);

/**
 * @swagger
 * /whatsapp/send/media:
 *   post:
 *     summary: Envía un archivo multimedia por WhatsApp
 *     description: Soporta imágenes, documentos, audio y video
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - mediaType
 *               - mediaUrl
 *               - businessUnitId
 *             properties:
 *               to:
 *                 type: string
 *                 example: "+573001234567"
 *               mediaType:
 *                 type: string
 *                 enum: [image, document, audio, video]
 *               mediaUrl:
 *                 type: string
 *                 description: URL pública del archivo
 *                 example: "https://ejemplo.com/archivo.pdf"
 *               caption:
 *                 type: string
 *                 description: Texto descriptivo (para imágenes y videos)
 *                 example: "Adjunto el documento solicitado"
 *               filename:
 *                 type: string
 *                 description: Nombre del archivo (para documentos)
 *                 example: "factura_123.pdf"
 *               businessUnitId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Archivo enviado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error al enviar archivo
 */
router.post(
  "/send/media",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { to, mediaType, mediaUrl, caption, filename, businessUnitId } =
        req.body;
      const tenantId = (req as any).user?.tenantId;

      if (!to || !mediaType || !mediaUrl || !businessUnitId) {
        return res.status(400).json({
          success: false,
          error: "to, mediaType, mediaUrl, and businessUnitId are required",
        });
      }

      if (!["image", "document", "audio", "video"].includes(mediaType)) {
        return res.status(400).json({
          success: false,
          error: "mediaType must be: image, document, audio, or video",
        });
      }

      await whatsappService.sendMedia({
        to,
        mediaType,
        mediaUrl,
        caption,
        filename,
        tenantId,
        businessUnitId,
      });

      res.json({
        success: true,
        message: "WhatsApp media sent successfully",
      });
    } catch (error: any) {
      console.error("[WhatsAppRoutes] Error sending media:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to send WhatsApp media",
      });
    }
  },
);

/**
 * @swagger
 * /whatsapp/webhook/{businessUnitId}:
 *   get:
 *     summary: Verifica el webhook de Meta (configuración inicial)
 *     description: Meta hace una petición GET para verificar el webhook. Este endpoint debe estar públicamente accesible.
 *     tags: [WhatsApp]
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.mode
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.verify_token
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: hub.challenge
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Verificación exitosa (retorna el challenge)
 *       403:
 *         description: Token de verificación inválido
 *   post:
 *     summary: Recibe webhooks de Meta con mensajes y estados
 *     description: Meta envía notificaciones de mensajes recibidos y cambios de estado. Este endpoint debe estar públicamente accesible.
 *     tags: [WhatsApp]
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
 *             description: Payload de Meta (estructura compleja)
 *     responses:
 *       200:
 *         description: Webhook procesado (siempre retorna 200)
 */
router.get("/webhook/:businessUnitId", async (req: Request, res: Response) => {
  try {
    const { businessUnitId } = req.params;
    const mode = req.query["hub.mode"] as string;
    const token = req.query["hub.verify_token"] as string;
    const challenge = req.query["hub.challenge"] as string;

    if (!businessUnitId || typeof businessUnitId !== "string") {
      return res.status(400).json({
        success: false,
        error: "businessUnitId is required",
      });
    }

    console.log("[WhatsAppWebhook] Verification request:", {
      businessUnitId,
      mode,
      token: token ? "***" : undefined,
    });

    if (!mode || !token || !challenge) {
      return res.status(400).json({
        success: false,
        error: "Missing required query parameters",
      });
    }

    const result = await whatsappService.verifyWebhook(
      mode,
      token,
      challenge,
      businessUnitId,
    );

    if (result) {
      // Meta requiere que retornemos el challenge tal cual
      res.status(200).send(result);
    } else {
      res.status(403).json({
        success: false,
        error: "Webhook verification failed",
      });
    }
  } catch (error: any) {
    console.error("[WhatsAppWebhook] Verification error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Webhook verification error",
    });
  }
});

/**
 * POST /api/whatsapp/webhook/:businessUnitId
 * Recibe webhooks de Meta con mensajes entrantes y cambios de estado
 */
router.post("/webhook/:businessUnitId", async (req: Request, res: Response) => {
  try {
    const { businessUnitId } = req.params;
    const payload = req.body;

    if (!businessUnitId || typeof businessUnitId !== "string") {
      return res.status(400).json({
        success: false,
        error: "businessUnitId is required",
      });
    }

    console.log("[WhatsAppWebhook] Incoming webhook:", {
      businessUnitId,
      payload: JSON.stringify(payload, null, 2),
    });

    // Procesar el webhook de forma asíncrona (no bloqueante)
    whatsappService.processWebhook(payload, businessUnitId).catch((error) => {
      console.error("[WhatsAppWebhook] Processing error:", error);
    });

    // Meta requiere una respuesta 200 inmediata
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("[WhatsAppWebhook] Error:", error);
    // Aún así retornar 200 para que Meta no reintente
    res.status(200).json({ success: true });
  }
});

/**
 * @swagger
 * /whatsapp/status/{businessUnitId}:
 *   get:
 *     summary: Verifica si WhatsApp está configurado
 *     description: Consulta si una BusinessUnit tiene WhatsApp configurado y activo
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado de configuración
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 isConfigured:
 *                   type: boolean
 *       401:
 *         description: No autenticado
 */
router.get(
  "/status/:businessUnitId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { businessUnitId } = req.params;
      const tenantId = (req as any).user?.tenantId;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({
          success: false,
          error: "businessUnitId is required",
        });
      }

      const isConfigured = await whatsappService.isConfigured(
        tenantId,
        businessUnitId,
      );

      res.json({
        success: true,
        isConfigured,
      });
    } catch (error: any) {
      console.error("[WhatsAppRoutes] Error checking status:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to check WhatsApp status",
      });
    }
  },
);

export default router;
