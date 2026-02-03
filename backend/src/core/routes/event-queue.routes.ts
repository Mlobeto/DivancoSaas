/**
 * Event Queue Routes
 * Endpoints para gestionar la cola de eventos offline
 */

import { Router, Request, Response } from "express";
import { eventQueueService } from "../services/event-queue.service";
import { authenticate } from "../middlewares/auth.middleware";
import { ChannelType, EventStatus } from "@prisma/client";
import { z } from "zod";

const router = Router();

const listEventsQuerySchema = z.object({
  businessUnitId: z.string().uuid().optional(),
  status: z.nativeEnum(EventStatus).optional(),
  channel: z.nativeEnum(ChannelType).optional(),
  intent: z.string().optional(),
  search: z.string().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Listar eventos de la cola (paginado + filtrado)
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED] }
 *       - in: query
 *         name: channel
 *         schema: { type: string, enum: [WHATSAPP, WEB, MOBILE, API] }
 *       - in: query
 *         name: intent
 *         schema: { type: string }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 50 }
 *     responses:
 *       200:
 *         description: Lista paginada
 */
router.get("/", authenticate, async (req: Request, res: Response) => {
  try {
    const tenantId = req.context!.tenantId;
    const q = listEventsQuerySchema.parse(req.query);

    const result = await eventQueueService.listEvents(tenantId, {
      businessUnitId: q.businessUnitId,
      status: q.status,
      channel: q.channel,
      intent: q.intent,
      search: q.search,
      from: q.from,
      to: q.to,
      page: q.page,
      limit: q.limit,
    });

    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/events/enqueue:
 *   post:
 *     summary: Encolar un evento para procesamiento asíncrono
 *     description: Usado principalmente por mobile para eventos offline
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tenantId
 *               - businessUnitId
 *               - userId
 *               - channel
 *               - intent
 *               - payload
 *             properties:
 *               tenantId:
 *                 type: string
 *               businessUnitId:
 *                 type: string
 *               userId:
 *                 type: string
 *               channel:
 *                 type: string
 *                 enum: [WHATSAPP, WEB, MOBILE, API]
 *               intent:
 *                 type: string
 *               payload:
 *                 type: object
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Evento encolado exitosamente
 */
router.post("/enqueue", authenticate, async (req: Request, res: Response) => {
  try {
    const {
      tenantId,
      businessUnitId,
      userId,
      channel,
      intent,
      payload,
      metadata,
    } = req.body;

    if (
      !tenantId ||
      !businessUnitId ||
      !userId ||
      !channel ||
      !intent ||
      !payload
    ) {
      return res.status(400).json({
        error:
          "tenantId, businessUnitId, userId, channel, intent y payload son requeridos",
      });
    }

    if (!Object.values(ChannelType).includes(channel)) {
      return res.status(400).json({
        error: `Canal inválido. Debe ser uno de: ${Object.values(ChannelType).join(", ")}`,
      });
    }

    const event = await eventQueueService.enqueue(
      tenantId,
      businessUnitId,
      userId,
      channel as ChannelType,
      intent,
      payload,
      metadata,
    );

    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/events/process:
 *   post:
 *     summary: Procesar eventos pendientes en la cola
 *     description: Procesa un lote de eventos pendientes
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: number
 *                 description: Número máximo de eventos a procesar
 *                 default: 10
 *     responses:
 *       200:
 *         description: Eventos procesados
 */
router.post("/process", authenticate, async (req: Request, res: Response) => {
  try {
    const { limit } = req.body;

    const results = await eventQueueService.dequeue(limit || 10);

    res.json({
      processed: results.length,
      results,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/events/process-all:
 *   post:
 *     summary: Procesar todos los eventos pendientes
 *     description: Procesa todos los eventos en la cola (para jobs programados)
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Procesamiento completo
 */
router.post(
  "/process-all",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const result = await eventQueueService.processQueue();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/events/retry-failed:
 *   post:
 *     summary: Reintentar eventos fallidos
 *     description: Marca eventos fallidos como pendientes para reintento
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: number
 *                 default: 10
 *     responses:
 *       200:
 *         description: Eventos reintentados
 */
router.post(
  "/retry-failed",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { limit } = req.body;

      const result = await eventQueueService.retryFailed(limit || 10);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/events/cancel/{eventId}:
 *   post:
 *     summary: Cancelar un evento encolado
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Evento cancelado
 */
router.post(
  "/cancel/:eventId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      if (typeof eventId !== "string") {
        return res.status(400).json({ error: "eventId inválido" });
      }

      const event = await eventQueueService.cancel(eventId);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/events/status/{eventId}:
 *   get:
 *     summary: Obtener estado de un evento
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estado del evento
 */
router.get(
  "/status/:eventId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      if (typeof eventId !== "string") {
        return res.status(400).json({ error: "eventId inválido" });
      }

      const event = await eventQueueService.getEventStatus(eventId);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
);

/**
 * @swagger
 * /api/v1/events/stats:
 *   get:
 *     summary: Obtener estadísticas de la cola
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: businessUnitId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Estadísticas de la cola
 */
router.get("/stats", authenticate, async (req: Request, res: Response) => {
  try {
    const { businessUnitId } = req.query;

    const stats = await eventQueueService.getStats(
      businessUnitId as string | undefined,
    );

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/v1/events/cleanup:
 *   post:
 *     summary: Limpiar eventos antiguos completados
 *     tags: [Event Queue]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               daysOld:
 *                 type: number
 *                 description: Días de antigüedad
 *                 default: 30
 *     responses:
 *       200:
 *         description: Eventos eliminados
 */
router.post("/cleanup", authenticate, async (req: Request, res: Response) => {
  try {
    const { daysOld } = req.body;

    const result = await eventQueueService.cleanOldEvents(daysOld || 30);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
