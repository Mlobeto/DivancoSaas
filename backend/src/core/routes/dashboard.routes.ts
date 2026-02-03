/**
 * DASHBOARD ROUTES
 *
 * Endpoints para estadísticas y métricas del dashboard
 */

import { Router, Request, Response } from "express";
import { authenticate } from "@core/middlewares/auth.middleware";
import {
  getTenantStats,
  getBusinessUnitStats,
  getRecentActivity,
  getModuleMetrics,
} from "@core/services/dashboard.service";

const router = Router();

/**
 * @swagger
 * /api/v1/dashboard/tenant/stats:
 *   get:
 *     summary: Obtener estadísticas generales del tenant
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas del tenant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     totalBusinessUnits:
 *                       type: number
 *                     activeModules:
 *                       type: number
 *                 recentActivity:
 *                   type: object
 *                   properties:
 *                     eventCount:
 *                       type: number
 *                     pendingEvents:
 *                       type: number
 *                     failedEvents:
 *                       type: number
 */
router.get(
  "/tenant/stats",
  authenticate,
  async (req: Request, res: Response) => {
    const tenantId = req.context!.tenantId;

    const stats = await getTenantStats(tenantId);

    res.json(stats);
  },
);

/**
 * @swagger
 * /api/v1/dashboard/business-unit/{businessUnitId}/stats:
 *   get:
 *     summary: Obtener estadísticas de una Business Unit
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Business Unit
 *     responses:
 *       200:
 *         description: Estadísticas del Business Unit
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 overview:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     totalBusinessUnits:
 *                       type: number
 *                     activeModules:
 *                       type: number
 *                 equipment:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     available:
 *                       type: number
 *                     rented:
 *                       type: number
 *                     maintenance:
 *                       type: number
 *                     outOfService:
 *                       type: number
 *                 recentActivity:
 *                   type: object
 *                   properties:
 *                     eventCount:
 *                       type: number
 *                     pendingEvents:
 *                       type: number
 *                     failedEvents:
 *                       type: number
 */
router.get(
  "/business-unit/:businessUnitId/stats",
  authenticate,
  async (req: Request, res: Response) => {
    const { businessUnitId } = req.params;

    const stats = await getBusinessUnitStats(businessUnitId as string);

    res.json(stats);
  },
);

/**
 * @swagger
 * /api/v1/dashboard/activity:
 *   get:
 *     summary: Obtener actividad reciente del tenant
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de eventos recientes a retornar
 *     responses:
 *       200:
 *         description: Lista de eventos recientes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   intent:
 *                     type: string
 *                   status:
 *                     type: string
 *                   channel:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   processedAt:
 *                     type: string
 *                     format: date-time
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       email:
 *                         type: string
 *                       fullName:
 *                         type: string
 *                   businessUnit:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 */
router.get("/activity", authenticate, async (req: Request, res: Response) => {
  const tenantId = req.context!.tenantId;
  const limit = parseInt(req.query.limit as string) || 10;

  const activity = await getRecentActivity(tenantId, limit);

  res.json(activity);
});

/**
 * @swagger
 * /api/v1/dashboard/business-unit/{businessUnitId}/modules:
 *   get:
 *     summary: Obtener módulos habilitados en un Business Unit
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del Business Unit
 *     responses:
 *       200:
 *         description: Lista de módulos habilitados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   displayName:
 *                     type: string
 *                   category:
 *                     type: string
 *                   isEnabled:
 *                     type: boolean
 */
router.get(
  "/business-unit/:businessUnitId/modules",
  authenticate,
  async (req: Request, res: Response) => {
    const { businessUnitId } = req.params;

    const modules = await getModuleMetrics(businessUnitId as string);

    res.json(modules);
  },
);

export default router;
