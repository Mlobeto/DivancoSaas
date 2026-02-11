/**
 * TEMPLATE CONTROLLER
 * Controller para gestión de plantillas de documentos
 */

import { Request, Response } from "express";
import { templateService } from "@shared/templates/template.service";

export class TemplateController {
  /**
   * Listar plantillas
   * GET /api/v1/templates
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { businessUnitId, type } = req.query;

      const templates = await templateService.listTemplates({
        businessUnitId: businessUnitId as string,
        type: type as string,
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Obtener plantilla por ID
   * GET /api/v1/templates/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = await templateService.getTemplateById(id as string);

      if (!template) {
        res.status(404).json({
          success: false,
          error: "Template not found",
        });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Crear plantilla
   * POST /api/v1/templates
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { businessUnitId, name, type, content, styles } = req.body;
      const userId = (req as any).user.id;

      const template = await templateService.createTemplate({
        tenantId: (req as any).user.tenantId,
        businessUnitId,
        name,
        type,
        content,
        styles: styles || undefined,
        variables: [],
      });

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Actualizar plantilla
   * PUT /api/v1/templates/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, content, styles, isActive } = req.body;

      const template = await templateService.updateTemplate(id as string, {
        name,
        content,
        styles,
        isActive,
      });

      res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Eliminar plantilla
   * DELETE /api/v1/templates/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await templateService.deleteTemplate(id as string);

      res.json({
        success: true,
        message: "Template deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const templateController = new TemplateController();
