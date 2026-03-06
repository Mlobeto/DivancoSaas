import { Request, Response } from "express";
import { emailTemplateService } from "@core/services/email-template.service";

class EmailTemplateController {
  async list(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const businessUnitId = req.params.businessUnitId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      const templates = await emailTemplateService.list(
        tenantId,
        businessUnitId,
      );

      return res.json({
        success: true,
        data: templates,
      });
    } catch (error: any) {
      console.error(
        "[EmailTemplateController] Error listing templates:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: error.message || "Error listing email templates",
      });
    }
  }

  async get(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const businessUnitId = req.params.businessUnitId as string;
      const templateId = req.params.templateId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      const template = await emailTemplateService.getById(
        tenantId,
        businessUnitId,
        templateId,
      );

      if (!template) {
        return res.status(404).json({
          success: false,
          message: "Email template not found",
        });
      }

      return res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      console.error("[EmailTemplateController] Error getting template:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error getting email template",
      });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const userId = req.context?.userId;
      const businessUnitId = req.params.businessUnitId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      const template = await emailTemplateService.create({
        ...req.body,
        tenantId,
        businessUnitId,
        createdBy: userId,
      });

      return res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      console.error(
        "[EmailTemplateController] Error creating template:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: error.message || "Error creating email template",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const businessUnitId = req.params.businessUnitId as string;
      const templateId = req.params.templateId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      const template = await emailTemplateService.update(
        tenantId,
        businessUnitId,
        templateId,
        req.body,
      );

      return res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      if (error.message === "EMAIL_TEMPLATE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Email template not found",
        });
      }

      console.error(
        "[EmailTemplateController] Error updating template:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: error.message || "Error updating email template",
      });
    }
  }

  async setDefault(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const businessUnitId = req.params.businessUnitId as string;
      const templateId = req.params.templateId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      const template = await emailTemplateService.setDefault(
        tenantId,
        businessUnitId,
        templateId,
      );

      return res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      if (error.message === "EMAIL_TEMPLATE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Email template not found",
        });
      }

      console.error(
        "[EmailTemplateController] Error setting default template:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: error.message || "Error setting default email template",
      });
    }
  }

  async setActive(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const businessUnitId = req.params.businessUnitId as string;
      const templateId = req.params.templateId as string;
      const { isActive } = req.body as { isActive: boolean };

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      const template = await emailTemplateService.setActive(
        tenantId,
        businessUnitId,
        templateId,
        isActive,
      );

      return res.json({
        success: true,
        data: template,
      });
    } catch (error: any) {
      if (error.message === "EMAIL_TEMPLATE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Email template not found",
        });
      }

      if (error.message === "EMAIL_TEMPLATE_LAST_ACTIVE_CANNOT_DEACTIVATE") {
        return res.status(400).json({
          success: false,
          message:
            "No se puede desactivar la única plantilla activa de este tipo. Activa o crea otra plantilla primero.",
        });
      }

      console.error(
        "[EmailTemplateController] Error updating active status:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: error.message || "Error updating email template status",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      const tenantId = req.context?.tenantId;
      const businessUnitId = req.params.businessUnitId as string;
      const templateId = req.params.templateId as string;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: "Missing tenant context",
        });
      }

      await emailTemplateService.delete(tenantId, businessUnitId, templateId);

      return res.json({
        success: true,
        message: "Email template deleted",
      });
    } catch (error: any) {
      if (error.message === "EMAIL_TEMPLATE_NOT_FOUND") {
        return res.status(404).json({
          success: false,
          message: "Email template not found",
        });
      }

      if (error.message === "EMAIL_TEMPLATE_LAST_ACTIVE_CANNOT_DELETE") {
        return res.status(400).json({
          success: false,
          message:
            "No se puede eliminar la única plantilla activa de este tipo. Activa o crea otra plantilla primero.",
        });
      }

      console.error(
        "[EmailTemplateController] Error deleting template:",
        error,
      );
      return res.status(500).json({
        success: false,
        message: error.message || "Error deleting email template",
      });
    }
  }
}

export const emailTemplateController = new EmailTemplateController();
