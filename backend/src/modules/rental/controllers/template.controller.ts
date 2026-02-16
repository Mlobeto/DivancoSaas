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
      if (!(req as any).context) {
        res.status(401).json({
          success: false,
          error: "No authentication context",
        });
        return;
      }

      const { businessUnitId } = (req as any).context;
      const { type } = req.query;

      const templates = await templateService.listTemplates({
        businessUnitId: businessUnitId,
        type: type as string,
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error("Error listing templates:", error);
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

      // Validar que existe el contexto en el request
      if (!req.context) {
        res.status(401).json({
          success: false,
          error: "Usuario no autenticado",
        });
        return;
      }

      const { userId, tenantId } = req.context;

      // Validar campos requeridos
      if (!businessUnitId || !name || !type || !content) {
        res.status(400).json({
          success: false,
          error:
            "Faltan campos requeridos: businessUnitId, name, type, content",
        });
        return;
      }

      const template = await templateService.createTemplate({
        tenantId,
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
      console.error("Error creating template:", error);
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

  /**
   * @deprecated Upload logo is deprecated. Use BrandingService instead.
   * Logos are now managed per BusinessUnit, not per Template.
   * Use PUT /api/v1/branding/:businessUnitId to update logos.
   */
  async uploadLogo(req: Request, res: Response): Promise<void> {
    res.status(410).json({
      success: false,
      error:
        "Logo upload for templates is deprecated. Use BrandingService to manage logos per BusinessUnit.",
      message:
        "Please use PUT /api/v1/branding/:businessUnitId to update the logo for your Business Unit.",
    });
  }
}

export const templateController = new TemplateController();
