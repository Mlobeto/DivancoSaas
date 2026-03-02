/**
 * CONTRACT CLAUSE CONTROLLER
 * API endpoints para gestión de cláusulas de contratos
 */

import { Request, Response } from "express";
import { contractClauseService } from "../services/contract-clause.service";

export class ContractClauseController {
  /**
   * @swagger
   * /api/v1/rental/clauses:
   *   post:
   *     tags: [Contract Clauses]
   *     summary: Crear cláusula de contrato
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - code
   *               - name
   *               - category
   *               - content
   *               - applicableAssetTypes
   *             properties:
   *               code:
   *                 type: string
   *                 example: "CLAUSE_HEAVY_MACHINERY"
   *               name:
   *                 type: string
   *                 example: "Responsabilidades Maquinaria Pesada"
   *               category:
   *                 type: string
   *                 example: "liability"
   *               content:
   *                 type: string
   *                 example: "<p>El ARRENDATARIO se compromete...</p>"
   *               order:
   *                 type: integer
   *                 example: 1
   *               applicableAssetTypes:
   *                 type: array
   *                 items:
   *                   type: string
   *                 example: ["excavadora", "bulldozer"]
   *               requiresOperator:
   *                 type: boolean
   *                 example: true
   *               minimumValue:
   *                 type: number
   *                 example: 100000
   *     responses:
   *       201:
   *         description: Cláusula creada exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId } = req.context || {};

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const clause = await contractClauseService.createClause({
        ...req.body,
        tenantId,
        businessUnitId,
      });

      res.status(201).json({
        success: true,
        data: clause,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CLAUSE_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clauses:
   *   get:
   *     tags: [Contract Clauses]
   *     summary: Listar cláusulas con filtros
   *     parameters:
   *       - in: query
   *         name: businessUnitId
   *         schema:
   *           type: string
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *     responses:
   *       200:
   *         description: Lista de cláusulas
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId: userBUId } = req.context || {};
      const { businessUnitId, category, isActive } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const clauses = await contractClauseService.listClauses({
        tenantId,
        businessUnitId: (businessUnitId as string) || userBUId,
        category: category as string,
        isActive: isActive !== undefined ? isActive === "true" : undefined,
      });

      res.json({
        success: true,
        data: clauses,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CLAUSES_LIST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clauses/{id}:
   *   get:
   *     tags: [Contract Clauses]
   *     summary: Obtener cláusula por ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Cláusula encontrada
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const clause = await contractClauseService.getClauseById(id);

      if (!clause) {
        res.status(404).json({
          success: false,
          error: {
            code: "CLAUSE_NOT_FOUND",
            message: `Clause with id '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: clause,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CLAUSE_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clauses/{id}:
   *   patch:
   *     tags: [Contract Clauses]
   *     summary: Actualizar cláusula
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
   *     responses:
   *       200:
   *         description: Cláusula actualizada
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const clause = await contractClauseService.updateClause(id, req.body);

      res.json({
        success: true,
        data: clause,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CLAUSE_UPDATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clauses/{id}:
   *   delete:
   *     tags: [Contract Clauses]
   *     summary: Eliminar cláusula
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Cláusula eliminada
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await contractClauseService.deleteClause(id);

      res.json({
        success: true,
        data: { id },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CLAUSE_DELETE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clauses/preview:
   *   post:
   *     tags: [Contract Clauses]
   *     summary: Preview de cláusulas aplicables para un contexto dado
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - assetTypes
   *               - contractValue
   *             properties:
   *               assetTypes:
   *                 type: array
   *                 items:
   *                   type: string
   *               hasOperatorAssets:
   *                 type: boolean
   *               contractValue:
   *                 type: number
   *     responses:
   *       200:
   *         description: Cláusulas aplicables
   */
  async preview(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const { assetTypes, hasOperatorAssets, contractValue } = req.body;

      const clauses = await contractClauseService.getApplicableClauses(
        tenantId,
        {
          assetTypes: assetTypes || [],
          hasOperatorAssets: hasOperatorAssets || false,
          contractValue: contractValue || 0,
        },
      );

      res.json({
        success: true,
        data: clauses,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CLAUSE_PREVIEW_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const contractClauseController = new ContractClauseController();
