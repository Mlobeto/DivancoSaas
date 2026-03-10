/**
 * CONTRACT ADDENDUM CONTROLLER
 * Controller para gestión de addendums de contratos master
 */

import { Request, Response } from "express";
import { contractAddendumService } from "../services/contract-addendum.service";
import {
  validateCreateAddendum,
  type CreateAddendumDTO,
  type UpdateAddendumDTO,
  type CompleteAddendumDTO,
} from "../types/master-contract.types";

export class ContractAddendumController {
  /**
   * @swagger
   * /api/v1/rental/contracts/{contractId}/addendums:
   *   post:
   *     tags: [Contract Addendums]
   *     summary: Crear addendum para contrato master
   *     parameters:
   *       - in: path
   *         name: contractId
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
   *               - items
   *             properties:
   *               items:
   *                 type: array
   *                 items:
   *                   type: object
   *                   required:
   *                     - assetId
   *                     - quantity
   *                   properties:
   *                     assetId:
   *                       type: string
   *                     quantity:
   *                       type: number
   *                     expectedReturnDate:
   *                       type: string
   *                       format: date-time
   *                     estimatedDailyRate:
   *                       type: number
   *                     estimatedHourlyRate:
   *                       type: number
   *                     operatorId:
   *                       type: string
   *                     initialHourometer:
   *                       type: number
   *                     initialOdometer:
   *                       type: number
   *                     notes:
   *                       type: string
   *               notes:
   *                 type: string
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: Addendum creado exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId, userId } = req.context || {};
      const { contractId } = req.params;
      const body: CreateAddendumDTO = { ...req.body, contractId };

      if (!tenantId || !businessUnitId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing context" },
        });
        return;
      }

      // Validar DTO
      const validation = validateCreateAddendum(body);
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

      const addendum = await contractAddendumService.createAddendum({
        tenantId,
        businessUnitId,
        contractId,
        items: body.items.map((item) => ({
          assetId: item.assetId,
          quantity: item.quantity,
          startDate: new Date(),
          estimatedEndDate: item.expectedReturnDate
            ? new Date(item.expectedReturnDate)
            : undefined,
          dailyRate: item.estimatedDailyRate,
          hourlyRate: item.estimatedHourlyRate,
          estimatedCost:
            item.estimatedDailyRate || item.estimatedHourlyRate || 0,
        })),
        notes: body.notes,
        metadata: body.metadata,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: addendum,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CREATE_ADDENDUM_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{contractId}/addendums:
   *   get:
   *     tags: [Contract Addendums]
   *     summary: Listar addendums de un contrato
   *     parameters:
   *       - in: path
   *         name: contractId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, completed, cancelled]
   *     responses:
   *       200:
   *         description: Lista de addendums
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { contractId } = req.params;
      const { status } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const addendums =
        await contractAddendumService.listAddendumsByContract(contractId);

      res.json({
        success: true,
        data: addendums,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "LIST_ADDENDUMS_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/addendums/{addendumId}:
   *   get:
   *     tags: [Contract Addendums]
   *     summary: Obtener addendum por ID
   *     parameters:
   *       - in: path
   *         name: addendumId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Detalle del addendum
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { addendumId } = req.params;

      const addendum =
        await contractAddendumService.getAddendumById(addendumId);

      res.json({
        success: true,
        data: addendum,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: {
          code: "ADDENDUM_NOT_FOUND",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/addendums/{addendumId}:
   *   patch:
   *     tags: [Contract Addendums]
   *     summary: Actualizar addendum
   *     parameters:
   *       - in: path
   *         name: addendumId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Addendum actualizado
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { addendumId } = req.params;
      const body: UpdateAddendumDTO = req.body;

      const addendum = await contractAddendumService.updateAddendum(
        addendumId,
        {
          notes: body.notes,
          metadata: body.metadata,
        },
      );

      res.json({
        success: true,
        data: addendum,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "UPDATE_ADDENDUM_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/addendums/{addendumId}/complete:
   *   post:
   *     tags: [Contract Addendums]
   *     summary: Completar addendum (calcular monto real y actualizar contrato)
   *     parameters:
   *       - in: path
   *         name: addendumId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               actualAmount:
   *                 type: number
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Addendum completado
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const { addendumId } = req.params;
      const body: CompleteAddendumDTO = req.body;

      const addendum = await contractAddendumService.completeAddendum({
        addendumId,
        actualCost: body.actualAmount || 0,
        notes: body.notes,
      });

      res.json({
        success: true,
        data: addendum,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "COMPLETE_ADDENDUM_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/addendums/{addendumId}/cancel:
   *   post:
   *     tags: [Contract Addendums]
   *     summary: Cancelar addendum
   *     parameters:
   *       - in: path
   *         name: addendumId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               reason:
   *                 type: string
   *     responses:
   *       200:
   *         description: Addendum cancelado
   */
  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const { addendumId } = req.params;
      const { reason } = req.body;

      const addendum = await contractAddendumService.cancelAddendum(
        addendumId,
        reason,
      );

      res.json({
        success: true,
        data: addendum,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CANCEL_ADDENDUM_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/addendums/{addendumId}/confirm-preparation:
   *   post:
   *     tags: [Contract Addendums]
   *     summary: Confirmar preparación del addendum (mantenimiento)
   *     parameters:
   *       - in: path
   *         name: addendumId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Addendum marcado como listo para enviar
   */
  async confirmPreparation(req: Request, res: Response): Promise<void> {
    try {
      const { addendumId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      const addendum = await contractAddendumService.confirmPreparation(
        addendumId,
        userId,
        notes,
      );

      res.json({
        success: true,
        data: addendum,
        message: "Preparación confirmada. El addendum está listo para enviar.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CONFIRM_PREPARATION_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/addendums/{addendumId}/confirm-delivery:
   *   post:
   *     tags: [Contract Addendums]
   *     summary: Confirmar entrega del addendum al cliente
   *     parameters:
   *       - in: path
   *         name: addendumId
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Entrega confirmada, cargos diarios iniciados
   */
  async confirmDelivery(req: Request, res: Response): Promise<void> {
    try {
      const { addendumId } = req.params;
      const { notes } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "User not authenticated",
          },
        });
        return;
      }

      const addendum = await contractAddendumService.confirmDelivery(
        addendumId,
        userId,
        notes,
      );

      res.json({
        success: true,
        data: addendum,
        message: "Entrega confirmada. Los cargos diarios han comenzado.",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CONFIRM_DELIVERY_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const contractAddendumController = new ContractAddendumController();
