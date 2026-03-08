/**
 * CONTRACT CLAUSE TEMPLATE CONTROLLER
 * Controller para gestión de plantillas de cláusulas reutilizables
 */

import { Request, Response } from "express";
import { contractClauseTemplateService } from "../services/contract-clause-template.service";
import {
  validateCreateClauseTemplate,
  type CreateClauseTemplateDTO,
  type UpdateClauseTemplateDTO,
  type InterpolateClauseDTO,
} from "../types/master-contract.types";

export class ContractClauseTemplateController {
  /**
   * @swagger
   * /api/v1/rental/clause-templates:
   *   post:
   *     tags: [Contract Clause Templates]
   *     summary: Crear plantilla de cláusula
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - content
   *               - category
   *             properties:
   *               businessUnitId:
   *                 type: string
   *               name:
   *                 type: string
   *               content:
   *                 type: string
   *               category:
   *                 type: string
   *               isDefault:
   *                 type: boolean
   *               displayOrder:
   *                 type: number
   *               applicableAssetTypes:
   *                 type: array
   *                 items:
   *                   type: string
   *               metadata:
   *                 type: object
   *     responses:
   *       201:
   *         description: Plantilla creada exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const body: CreateClauseTemplateDTO = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Validar DTO
      const validation = validateCreateClauseTemplate(body);
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

      const template = await contractClauseTemplateService.createTemplate({
        tenantId,
        businessUnitId: body.businessUnitId,
        name: body.name,
        content: body.content,
        category: body.category,
        isDefault: body.isDefault,
        displayOrder: body.displayOrder,
        applicableAssetTypes: body.applicableAssetTypes,
        metadata: body.metadata,
      });

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "CREATE_CLAUSE_TEMPLATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates:
   *   get:
   *     tags: [Contract Clause Templates]
   *     summary: Listar plantillas de cláusulas
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
   *         name: isDefault
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *       - in: query
   *         name: assetType
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de plantillas
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { businessUnitId, category, isDefault, isActive, assetType } =
        req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const templates = await contractClauseTemplateService.listTemplates({
        tenantId,
        businessUnitId: businessUnitId as string | undefined,
        category: category as string | undefined,
        isDefault:
          isDefault === "true"
            ? true
            : isDefault === "false"
              ? false
              : undefined,
        isActive:
          isActive === "true" ? true : isActive === "false" ? false : undefined,
        assetType: assetType as string | undefined,
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "LIST_CLAUSE_TEMPLATES_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates/{templateId}:
   *   get:
   *     tags: [Contract Clause Templates]
   *     summary: Obtener plantilla por ID
   *     parameters:
   *       - in: path
   *         name: templateId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Detalle de la plantilla
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      const template =
        await contractClauseTemplateService.getTemplateById(templateId);

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(404).json({
        success: false,
        error: {
          code: "CLAUSE_TEMPLATE_NOT_FOUND",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates/{templateId}:
   *   patch:
   *     tags: [Contract Clause Templates]
   *     summary: Actualizar plantilla
   *     parameters:
   *       - in: path
   *         name: templateId
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
   *               name:
   *                 type: string
   *               content:
   *                 type: string
   *               category:
   *                 type: string
   *               isDefault:
   *                 type: boolean
   *               displayOrder:
   *                 type: number
   *               applicableAssetTypes:
   *                 type: array
   *                 items:
   *                   type: string
   *               isActive:
   *                 type: boolean
   *               metadata:
   *                 type: object
   *     responses:
   *       200:
   *         description: Plantilla actualizada
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const body: UpdateClauseTemplateDTO = req.body;

      const template = await contractClauseTemplateService.updateTemplate({
        templateId,
        name: body.name,
        content: body.content,
        category: body.category,
        isDefault: body.isDefault,
        displayOrder: body.displayOrder,
        applicableAssetTypes: body.applicableAssetTypes,
        isActive: body.isActive,
        metadata: body.metadata,
      });

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "UPDATE_CLAUSE_TEMPLATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates/{templateId}:
   *   delete:
   *     tags: [Contract Clause Templates]
   *     summary: Eliminar plantilla
   *     parameters:
   *       - in: path
   *         name: templateId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Plantilla eliminada
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;

      await contractClauseTemplateService.deleteTemplate(templateId);

      res.json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DELETE_CLAUSE_TEMPLATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates/{templateId}/duplicate:
   *   post:
   *     tags: [Contract Clause Templates]
   *     summary: Duplicar plantilla
   *     parameters:
   *       - in: path
   *         name: templateId
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
   *               - newName
   *             properties:
   *               newName:
   *                 type: string
   *     responses:
   *       201:
   *         description: Plantilla duplicada
   */
  async duplicate(req: Request, res: Response): Promise<void> {
    try {
      const { templateId } = req.params;
      const { newName } = req.body;

      if (!newName || typeof newName !== "string") {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "newName is required and must be a string",
          },
        });
        return;
      }

      const template = await contractClauseTemplateService.duplicateTemplate(
        templateId,
        newName,
      );

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DUPLICATE_CLAUSE_TEMPLATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates/interpolate:
   *   post:
   *     tags: [Contract Clause Templates]
   *     summary: Interpolar variables en plantilla
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - templateId
   *               - variables
   *             properties:
   *               templateId:
   *                 type: string
   *               variables:
   *                 type: object
   *                 additionalProperties:
   *                   type: string
   *     responses:
   *       200:
   *         description: Contenido interpolado
   */
  async interpolate(req: Request, res: Response): Promise<void> {
    try {
      const body: InterpolateClauseDTO = req.body;

      if (!body.templateId || !body.variables) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "templateId and variables are required",
          },
        });
        return;
      }

      const template = await contractClauseTemplateService.getTemplateById(
        body.templateId,
      );

      const interpolated = contractClauseTemplateService.interpolateClause({
        content: template.content,
        variables: body.variables,
      });

      res.json({
        success: true,
        data: {
          original: template.content,
          interpolated,
          variables: body.variables,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "INTERPOLATE_CLAUSE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/clause-templates/reorder:
   *   post:
   *     tags: [Contract Clause Templates]
   *     summary: Reordenar plantillas
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - templateIds
   *             properties:
   *               businessUnitId:
   *                 type: string
   *               templateIds:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Plantillas reordenadas
   */
  async reorder(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { businessUnitId, templateIds } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "templateIds must be a non-empty array",
          },
        });
        return;
      }

      await contractClauseTemplateService.reorderTemplates({
        tenantId,
        businessUnitId,
        templateIds,
      });

      res.json({
        success: true,
        message: "Templates reordered successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "REORDER_CLAUSE_TEMPLATES_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const contractClauseTemplateController =
  new ContractClauseTemplateController();
