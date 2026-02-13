/**
 * CONTRACT CONTROLLER
 * Controller para gestión de contratos de renta
 */

import { Request, Response } from "express";
import { quotationService } from "../services/quotation.service";
import { contractService } from "../services/contract.service";
import { autoChargeService } from "../services/auto-charge.service";

export class ContractController {
  /**
   * @swagger
   * /api/v1/rental/contracts:
   *   get:
   *     tags: [Contracts]
   *     summary: Listar contratos con filtros
   *     parameters:
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [active, suspended, completed, cancelled]
   *       - in: query
   *         name: clientId
   *         schema:
   *           type: string
   *       - in: query
   *         name: businessUnitId
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 20
   *     responses:
   *       200:
   *         description: Lista de contratos
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId: userBUId } = req.context || {};
      const {
        status,
        clientId,
        businessUnitId,
        page = 1,
        limit = 20,
      } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const contracts = await contractService.listContracts({
        tenantId,
        businessUnitId: (businessUnitId as string) || userBUId,
        status: status as string,
        clientId: clientId as string,
      });

      res.json({
        success: true,
        data: contracts,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CONTRACTS_LIST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}:
   *   get:
   *     tags: [Contracts]
   *     summary: Obtener contrato con detalles completos
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contrato encontrado
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const contract = await contractService.getContractById(id as string);

      if (!contract) {
        res.status(404).json({
          success: false,
          error: {
            code: "CONTRACT_NOT_FOUND",
            message: `Contract with id '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CONTRACT_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts:
   *   post:
   *     tags: [Contracts]
   *     summary: Crear contrato de renta
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - quotationId
   *               - clientId
   *               - startDate
   *             properties:
   *               quotationId:
   *                 type: string
   *               clientId:
   *                 type: string
   *               startDate:
   *                 type: string
   *                 format: date
   *               estimatedEndDate:
   *                 type: string
   *                 format: date
   *               initialCredit:
   *                 type: number
   *               alertAmount:
   *                 type: number
   *               statementFrequency:
   *                 type: string
   *                 enum: [weekly, biweekly, monthly, manual]
   *     responses:
   *       201:
   *         description: Contrato creado exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId, userId } = req.context || {};

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing context" },
        });
        return;
      }
      const data = req.body;

      const result = await contractService.createContract({
        ...data,
        tenantId,
        businessUnitId,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "CONTRACT_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/withdraw:
   *   post:
   *     tags: [Contracts]
   *     summary: Retirar asset (MACHINERY o TOOL)
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - assetId
   *               - expectedReturnDate
   *             properties:
   *               assetId:
   *                 type: string
   *               expectedReturnDate:
   *                 type: string
   *                 format: date
   *               initialHourometer:
   *                 type: number
   *               initialOdometer:
   *                 type: number
   *               evidenceUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Asset retirado exitosamente
   */
  async withdraw(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.context || {};
      const data = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await contractService.withdrawAsset({
        contractId: id as string,
        ...data,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode =
        error.code === "INSUFFICIENT_BALANCE"
          ? 409
          : error.code === "ASSET_NOT_AVAILABLE"
            ? 403
            : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || "WITHDRAWAL_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/return:
   *   post:
   *     tags: [Contracts]
   *     summary: Devolver asset
   *     parameters:
   *       - in: path
   *         name: id
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
   *               - rentalId
   *             properties:
   *               rentalId:
   *                 type: string
   *               returnCondition:
   *                 type: string
   *                 enum: [good, damaged, maintenance_required]
   *               finalHourometer:
   *                 type: number
   *               finalOdometer:
   *                 type: number
   *               evidenceUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Asset devuelto exitosamente
   */
  async return(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.context || {};
      const data = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await contractService.returnAsset({
        rentalId: id as string,
        ...data,
        createdBy: userId,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "RETURN_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/suspend:
   *   patch:
   *     tags: [Contracts]
   *     summary: Suspender contrato (detiene cargos automáticos)
   *     parameters:
   *       - in: path
   *         name: id
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
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Contrato suspendido
   */
  async suspend(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, notes } = req.body;

      const contract = await contractService.suspendContract(
        id as string,
        reason,
        notes,
      );

      res.json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "SUSPEND_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/reactivate:
   *   patch:
   *     tags: [Contracts]
   *     summary: Reactivar contrato suspendido
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Contrato reactivado
   */
  async reactivate(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const contract = await contractService.reactivateContract(
        id as string,
        userId,
      );

      res.json({
        success: true,
        data: contract,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "REACTIVATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/complete:
   *   patch:
   *     tags: [Contracts]
   *     summary: Completar contrato (debe NO tener assets activos)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               actualEndDate:
   *                 type: string
   *                 format: date-time
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Contrato completado
   *       400:
   *         description: Contrato tiene assets activos
   */
  async complete(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const { id } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await contractService.completeContract(
        id as string,
        userId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode = error.code === "ACTIVE_RENTALS_EXIST" ? 400 : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || "COMPLETE_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/contracts/{id}/projection:
   *   get:
   *     tags: [Contracts]
   *     summary: Proyectar consumo futuro
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: days
   *         schema:
   *           type: integer
   *           default: 30
   *     responses:
   *       200:
   *         description: Proyección de consumo
   */
  async getProjection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { days = 30 } = req.query;

      const projection = await autoChargeService.projectConsumption(
        id as string,
        parseInt(days as string),
      );

      res.json({
        success: true,
        data: projection,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "PROJECTION_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const contractController = new ContractController();
