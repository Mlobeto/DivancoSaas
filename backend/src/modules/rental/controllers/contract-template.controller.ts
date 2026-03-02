/**
 * CONTRACT TEMPLATE CONTROLLER V2.0
 * Endpoints para gestión de templates modulares de contratos
 * con renderizado dinámico y soporte de payment proof
 */

import { Request, Response } from "express";
import { contractTemplateService } from "../services/contract-template.service";
import type { TemplateV2 } from "../services/contract-template.service";

export class ContractTemplateController {
  /**
   * Renderizar contrato desde template v2.0
   * POST /api/v1/contracts/templates/render
   * 
   * Body: {
   *   contractId: string,
   *   templateId: string,
   *   variables?: Record<string, any>
   * }
   */
  async renderContract(req: Request, res: Response): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          success: false,
          error: "No authentication context",
        });
        return;
      }

      const { tenantId } = req.context;
      const { contractId, templateId, variables } = req.body;

      if (!contractId || !templateId) {
        res.status(400).json({
          success: false,
          error: "contractId and templateId are required",
        });
        return;
      }

      const html = await contractTemplateService.renderContract({
        contractId,
        templateId,
        tenantId,
        variables,
      });

      res.json({
        success: true,
        data: {
          html,
          contractId,
          templateId,
        },
      });
    } catch (error: any) {
      console.error("Error rendering contract:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Crear template v2.0
   * POST /api/v1/contracts/templates
   * 
   * Body: {
   *   name: string,
   *   description?: string,
   *   businessUnitId?: string,
   *   template: TemplateV2,
   *   requiresSignature?: boolean,
   *   requiresPaymentProof?: boolean,
   *   allowLocalPayment?: boolean
   * }
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          success: false,
          error: "No authentication context",
        });
        return;
      }

      const { tenantId } = req.context;
      const {
        name,
        businessUnitId,
        template,
        requiresSignature,
        requiresPaymentProof,
        allowLocalPayment,
      } = req.body;

      if (!name || !template) {
        res.status(400).json({
          success: false,
          error: "name and template are required",
        });
        return;
      }

      // Validar estructura del template
      if (!template.version || !Array.isArray(template.sections)) {
        res.status(400).json({
          success: false,
          error:
            "Invalid template structure. Expected { version, sections[] }",
        });
        return;
      }

      const newTemplate = await contractTemplateService.createTemplate(
        tenantId,
        name,
        template as TemplateV2,
        {
          businessUnitId,
          requiresSignature,
          requiresPaymentProof,
          allowLocalPayment,
        },
      );

      res.status(201).json({
        success: true,
        data: newTemplate,
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
   * Migrar template legacy a v2.0
   * POST /api/v1/contracts/templates/:id/migrate-v2
   */
  async migrateToV2(req: Request, res: Response): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          success: false,
          error: "No authentication context",
        });
        return;
      }

      const { tenantId } = req.context;
      const { id } = req.params;

      const updatedTemplate = await contractTemplateService.migrateTemplateToV2(
        id,
        tenantId,
      );

      res.json({
        success: true,
        data: updatedTemplate,
        message: "Template migrated to v2.0 successfully",
      });
    } catch (error: any) {
      console.error("Error migrating template:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Preview de una sección de template
   * POST /api/v1/contracts/templates/preview-section
   * 
   * Body: {
   *   section: TemplateSection,
   *   contractId: string
   * }
   */
  async previewSection(req: Request, res: Response): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          success: false,
          error: "No authentication context",
        });
        return;
      }

      const { tenantId } = req.context;
      const { section, contractId } = req.body;

      if (!section || !contractId) {
        res.status(400).json({
          success: false,
          error: "section and contractId are required",
        });
        return;
      }

      // Para preview, crear un template temporal con solo esa sección
      const tempTemplate: TemplateV2 = {
        version: "2.0",
        sections: [section],
      };

      const tempTemplateRecord =
        await contractTemplateService.createTemplate(
          tenantId,
          `__TEMP_PREVIEW_${Date.now()}`,
          tempTemplate,
        );

      const html = await contractTemplateService.renderContract({
        contractId,
        templateId: tempTemplateRecord.id,
        tenantId,
      });

      // Eliminar template temporal
      // TODO: Agregar método deleteTemplate al servicio

      res.json({
        success: true,
        data: {
          html,
          section,
        },
      });
    } catch (error: any) {
      console.error("Error previewing section:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Obtener metadata de un template v2.0 (sin renderizar)
   * GET /api/v1/contracts/templates/:id/metadata
   */
  async getTemplateMetadata(req: Request, res: Response): Promise<void> {
    try {
      if (!req.context) {
        res.status(401).json({
          success: false,
          error: "No authentication context",
        });
        return;
      }

      const { tenantId } = req.context;
      const { id } = req.params;

      const template = await prisma.template.findUnique({
        where: { id, tenantId },
        select: {
          id: true,
          name: true,
          version: true,
          requiresSignature: true,
          requiresPaymentProof: true,
          allowLocalPayment: true,
          content: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!template) {
        res.status(404).json({
          success: false,
          error: "Template not found",
        });
        return;
      }

      const templateJson = template.content as unknown as TemplateV2;
      const sectionsSummary = templateJson.sections?.map((s) => ({
        id: s.id,
        type: s.type,
        title: s.title,
        order: s.order,
        isRequired: s.isRequired,
      }));

      res.json({
        success: true,
        data: {
          ...template,
          sectionsSummary,
        },
      });
    } catch (error: any) {
      console.error("Error getting template metadata:", error);
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const contractTemplateController = new ContractTemplateController();

// Import prisma for metadata endpoint
import prisma from "@config/database";
