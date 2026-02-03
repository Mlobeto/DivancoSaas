/**
 * Channel Configuration Routes
 * Endpoints para gestionar configuración de canales por Business Unit
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { channelConfigService } from "../services/channel-config.service";

interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    userId: string;
    role: string;
  };
}

const router = Router();

/**
 * @swagger
 * /api/v1/channels/config/{businessUnitId}:
 *   get:
 *     summary: Obtiene configuración de todos los canales de una BU
 *     tags: [Channels]
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
 *         description: Configuración de canales
 */
router.get(
  "/config/:businessUnitId",
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId } = req.params;

      if (!businessUnitId || typeof businessUnitId !== "string") {
        return res.status(400).json({ error: "businessUnitId is required" });
      }

      const configs =
        await channelConfigService.getAllChannelConfigs(businessUnitId);

      res.json({ configs });
    } catch (error: any) {
      console.error("[ChannelRoutes] Error getting configs:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/channels/config/{businessUnitId}/{channel}:
 *   get:
 *     summary: Obtiene configuración de un canal específico
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WHATSAPP, WEB, MOBILE, API]
 *     responses:
 *       200:
 *         description: Configuración del canal
 */
router.get(
  "/config/:businessUnitId/:channel",
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, channel } = req.params;

      if (
        !businessUnitId ||
        !channel ||
        typeof businessUnitId !== "string" ||
        typeof channel !== "string"
      ) {
        return res
          .status(400)
          .json({ error: "businessUnitId and channel are required" });
      }

      const config = await channelConfigService.getChannelConfig(
        businessUnitId,
        channel as any,
      );

      if (!config) {
        return res.status(404).json({ error: "Channel config not found" });
      }

      res.json(config);
    } catch (error: any) {
      console.error("[ChannelRoutes] Error getting config:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/channels/config/{businessUnitId}/{channel}:
 *   put:
 *     summary: Crea o actualiza configuración de un canal
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WHATSAPP, WEB, MOBILE, API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enabled:
 *                 type: boolean
 *               allowedIntents:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["*"]
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Configuración actualizada
 */
router.put(
  "/config/:businessUnitId/:channel",
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, channel } = req.params;
      const { enabled, allowedIntents, config } = req.body;

      if (
        !businessUnitId ||
        !channel ||
        typeof businessUnitId !== "string" ||
        typeof channel !== "string"
      ) {
        return res
          .status(400)
          .json({ error: "businessUnitId and channel are required" });
      }

      const updated = await channelConfigService.upsertChannelConfig(
        businessUnitId,
        channel as any,
        {
          enabled,
          allowedIntents,
          config,
        },
      );

      res.json(updated);
    } catch (error: any) {
      console.error("[ChannelRoutes] Error updating config:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/channels/config/{businessUnitId}/{channel}/toggle:
 *   patch:
 *     summary: Habilita o deshabilita un canal
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *           enum: [WHATSAPP, WEB, MOBILE, API]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - enabled
 *             properties:
 *               enabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Canal actualizado
 */
router.patch(
  "/config/:businessUnitId/:channel/toggle",
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, channel } = req.params;
      const { enabled } = req.body;

      if (
        !businessUnitId ||
        !channel ||
        typeof businessUnitId !== "string" ||
        typeof channel !== "string"
      ) {
        return res
          .status(400)
          .json({ error: "businessUnitId and channel are required" });
      }

      if (typeof enabled !== "boolean") {
        return res.status(400).json({ error: "enabled must be a boolean" });
      }

      await channelConfigService.toggleChannel(
        businessUnitId,
        channel as any,
        enabled,
      );

      res.json({ success: true, message: "Channel toggled successfully" });
    } catch (error: any) {
      console.error("[ChannelRoutes] Error toggling channel:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/channels/config/{businessUnitId}/{channel}/intents:
 *   post:
 *     summary: Agrega una intención permitida al canal
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channel
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
 *               - intent
 *             properties:
 *               intent:
 *                 type: string
 *                 example: "UPLOAD_IMAGE"
 *     responses:
 *       200:
 *         description: Intención agregada
 */
router.post(
  "/config/:businessUnitId/:channel/intents",
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, channel } = req.params;
      const { intent } = req.body;

      if (
        !businessUnitId ||
        !channel ||
        !intent ||
        typeof businessUnitId !== "string" ||
        typeof channel !== "string"
      ) {
        return res.status(400).json({
          error: "businessUnitId, channel, and intent are required",
        });
      }

      await channelConfigService.addAllowedIntent(
        businessUnitId,
        channel as any,
        intent,
      );

      res.json({ success: true, message: "Intent added successfully" });
    } catch (error: any) {
      console.error("[ChannelRoutes] Error adding intent:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/channels/config/{businessUnitId}/{channel}/intents/{intent}:
 *   delete:
 *     summary: Remueve una intención permitida del canal
 *     tags: [Channels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: channel
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: intent
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Intención removida
 */
router.delete(
  "/config/:businessUnitId/:channel/intents/:intent",
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, channel, intent } = req.params;

      if (
        !businessUnitId ||
        !channel ||
        !intent ||
        typeof businessUnitId !== "string" ||
        typeof channel !== "string" ||
        typeof intent !== "string"
      ) {
        return res.status(400).json({
          error: "businessUnitId, channel, and intent are required",
        });
      }

      await channelConfigService.removeAllowedIntent(
        businessUnitId,
        channel as any,
        intent,
      );

      res.json({ success: true, message: "Intent removed successfully" });
    } catch (error: any) {
      console.error("[ChannelRoutes] Error removing intent:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

export { router as channelRouter };
