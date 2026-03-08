/**
 * LIMIT CHANGE REQUEST CONTROLLER
 * Controller para gestión de solicitudes de ampliación de límites
 */

import { Request, Response } from "express";
import { limitChangeRequestService } from "../services/limit-change-request.service";
import {
  validateCreateLimitChangeRequest,
  validateReviewLimitChangeRequest,
  type CreateLimitChangeRequestDTO,
  type ReviewLimitChangeRequestDTO,
} from "../types/master-contract.types";

export class LimitChangeRequestController {
  /**
   * @swagger
   * /api/v1/rental/limit-requests:
   *   post:
   *     tags: [Limit Change Requests]
   *     summary: Crear solicitud de ampliación de límites
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - clientAccountId
   *               - reason
   *             properties:
   *               clientAccountId:
   *                 type: string
   *               requestedCreditLimit:
   *                 type: number
   *               requestedTimeLimit:
   *                 type: number
   *               reason:
   *                 type: string
   *               urgency:
   *                 type: string
   *                 enum: [low, normal, high, urgent]
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: Solicitud creada exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId, userId } = req.context || {};
      const body: CreateLimitChangeRequestDTO = req.body;

      if (!tenantId || !businessUnitId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing context" },
        });
        return;
      }

      // Validar DTO
      const validation = validateCreateLimitChangeRequest(body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validation.errors,
          },
        });
        return;
      }

      const request = await limitChangeRequestService.createRequest({
        tenantId,
        businessUnitId,
        clientAccountId: body.clientAccountId,
        requestedBy: userId,
        requestedCreditLimit: body.requestedCreditLimit,
        requestedTimeLimit: body.requestedTimeLimit,
        reason: body.reason,
        urgency: body.urgency,
        metadata: body.metadata,
      });

      res.status(201).json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CREATE_LIMIT_REQUEST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/limit-requests:
   *   get:
   *     tags: [Limit Change Requests]
   *     summary: Listar solicitudes de ampliación de límites
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, approved, rejected, cancelled]
   *       - in: query
   *         name: clientAccountId
   *         schema:
   *           type: string
   *       - in: query
   *         name: urgency
   *         schema:
   *           type: string
   *           enum: [low, normal, high, urgent]
   *     responses:
   *       200:
   *         description: Lista de solicitudes
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId } = req.context || {};
      const { status, clientAccountId, urgency } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const requests = await limitChangeRequestService.listRequests({
        tenantId,
        businessUnitId,
        clientAccountId: clientAccountId as string | undefined,
        status: status as
          | "pending"
          | "approved"
          | "rejected"
          | "cancelled"
          | undefined,
        urgency: urgency as string | undefined,
      });

      res.json({
        success: true,
        data: requests,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "LIST_LIMIT_REQUESTS_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/limit-requests/{requestId}:
   *   get:
   *     tags: [Limit Change Requests]
   *     summary: Obtener solicitud por ID
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Detalle de la solicitud
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;

      const request = await limitChangeRequestService.getRequestById(requestId);

      res.json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: {
          code: "LIMIT_REQUEST_NOT_FOUND",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/limit-requests/{requestId}/review:
   *   post:
   *     tags: [Limit Change Requests]
   *     summary: Revisar solicitud (aprobar/rechazar)
   *     parameters:
   *       - in: path
   *         name: requestId
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
   *               - status
   *             properties:
   *               status:
   *                 type: string
   *                 enum: [approved, rejected]
   *               approvedCreditLimit:
   *                 type: number
   *               approvedTimeLimit:
   *                 type: number
   *               reviewNotes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Solicitud revisada
   */
  async review(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const { requestId } = req.params;
      const body: ReviewLimitChangeRequestDTO = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      // Validar DTO
      const validation = validateReviewLimitChangeRequest(body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: validation.errors,
          },
        });
        return;
      }

      const request = await limitChangeRequestService.reviewRequest({
        requestId,
        reviewedBy: userId,
        status: body.status,
        approvedCreditLimit: body.approvedCreditLimit,
        approvedTimeLimit: body.approvedTimeLimit,
        reviewNotes: body.reviewNotes,
      });

      res.json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "REVIEW_LIMIT_REQUEST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/limit-requests/{requestId}/cancel:
   *   post:
   *     tags: [Limit Change Requests]
   *     summary: Cancelar solicitud propia
   *     parameters:
   *       - in: path
   *         name: requestId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Solicitud cancelada
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const { requestId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const request = await limitChangeRequestService.cancelRequest(
        requestId,
        userId,
      );

      res.json({
        success: true,
        data: request,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CANCEL_LIMIT_REQUEST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/limit-requests/stats:
   *   get:
   *     tags: [Limit Change Requests]
   *     summary: Obtener estadísticas de solicitudes
   *     responses:
   *       200:
   *         description: Estadísticas de solicitudes
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId } = req.context || {};

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const stats = await limitChangeRequestService.getRequestStats(
        tenantId,
        businessUnitId,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "GET_LIMIT_REQUEST_STATS_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const limitChangeRequestController = new LimitChangeRequestController();
