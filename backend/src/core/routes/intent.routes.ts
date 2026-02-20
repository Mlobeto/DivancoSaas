/**
 * Intent Engine Routes
 * Endpoints para probar y monitorear el motor de intenciones
 */

import { Router, Request, Response } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { intentEngine } from "../services/intent-engine.service";
import { NormalizedEvent } from "../types/events";

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
 * /api/v1/intents/process:
 *   post:
 *     summary: Procesa una intención directamente (testing/debugging)
 *     tags: [Intents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessUnitId
 *               - intent
 *               - payload
 *             properties:
 *               businessUnitId:
 *                 type: string
 *               intent:
 *                 type: string
 *                 example: "UPLOAD_IMAGE"
 *               payload:
 *                 type: object
 *               channel:
 *                 type: string
 *                 enum: [web, mobile, whatsapp, api]
 *                 default: web
 *     responses:
 *       200:
 *         description: Intención procesada
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.post(
  "/process",
  authenticate as any,
  (async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, intent, payload, channel = "web" } = req.body;

      if (!businessUnitId || !intent || !payload) {
        return res.status(400).json({
          error: "businessUnitId, intent, and payload are required",
        });
      }

      if (!req.user || !req.user.tenantId || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Crear evento normalizado
      const event: NormalizedEvent = {
        tenant: req.user.tenantId,
        businessUnit: businessUnitId,
        user: req.user.userId,
        channel,
        intent,
        payload,
        metadata: {
          timestamp: new Date(),
          ipAddress: req.ip,
          userAgent: req.get("user-agent"),
        },
      };

      // Procesar intención
      const result = await intentEngine.process(event);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      console.error("[IntentRoutes] Error processing intent:", error);
      res.status(500).json({ error: error.message });
    }
  }) as any,
);

/**
 * @swagger
 * /api/v1/intents/stats:
 *   get:
 *     summary: Obtiene estadísticas de procesamiento de intenciones
 *     tags: [Intents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [web, mobile, whatsapp, api]
 *       - in: query
 *         name: intent
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas de intenciones
 */
router.get(
  "/stats",
  authenticate as any,
  (async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId, from, to, channel, intent } = req.query;

      if (typeof businessUnitId !== "string") {
        return res.status(400).json({ error: "businessUnitId is required" });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const options: any = {};
      if (from) options.from = new Date(from as string);
      if (to) options.to = new Date(to as string);
      if (channel) options.channel = channel;
      if (intent) options.intent = intent;

      const stats = await intentEngine.getStats(businessUnitId, options);

      res.json({ stats });
    } catch (error: any) {
      console.error("[IntentRoutes] Error getting stats:", error);
      res.status(500).json({ error: error.message });
    }
  }) as any,
);

export { router as intentRouter };
