/**
 * Branding Controller
 * Handles Business Unit branding configuration and PDF generation
 */

import { Request, Response } from "express";
import { brandingService } from "../services/branding.service";
import { pdfGeneratorService } from "../services/pdf-generator.service";
import {
  buildDocument,
  buildQuotationContent,
  buildContractContent,
  buildReceiptContent,
} from "../services/document-builder.service";
import type {
  BrandingConfig,
  BusinessUnitInfo,
} from "../services/document-builder.service";
import type { DocumentFormat, DocumentType } from "../types/branding.types";

class BrandingController {
  /**
   * GET /api/branding/:businessUnitId
   * Get branding configuration for a business unit
   */
  async getBranding(req: Request, res: Response) {
    try {
      const businessUnitId = req.params.businessUnitId as string;

      const branding = await brandingService.getOrCreateDefault(businessUnitId);

      return res.json({
        success: true,
        data: branding,
      });
    } catch (error: any) {
      console.error("[BrandingController] Error getting branding:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error getting branding",
      });
    }
  }

  /**
   * POST /api/branding
   * Create branding configuration
   */
  async createBranding(req: Request, res: Response) {
    try {
      const data = req.body;

      const branding = await brandingService.create(data);

      return res.status(201).json({
        success: true,
        data: branding,
      });
    } catch (error: any) {
      console.error("[BrandingController] Error creating branding:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error creating branding",
      });
    }
  }

  /**
   * PUT /api/branding/:businessUnitId
   * Update branding configuration
   */
  async updateBranding(req: Request, res: Response) {
    try {
      const businessUnitId = req.params.businessUnitId as string;
      const data = req.body;

      const branding = await brandingService.update(businessUnitId, data);

      return res.json({
        success: true,
        data: branding,
      });
    } catch (error: any) {
      console.error("[BrandingController] Error updating branding:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error updating branding",
      });
    }
  }

  /**
   * DELETE /api/branding/:businessUnitId
   * Delete branding configuration
   */
  async deleteBranding(req: Request, res: Response) {
    try {
      const businessUnitId = req.params.businessUnitId as string;

      await brandingService.delete(businessUnitId);

      return res.json({
        success: true,
        message: "Branding deleted successfully",
      });
    } catch (error: any) {
      console.error("[BrandingController] Error deleting branding:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error deleting branding",
      });
    }
  }

  /**
   * POST /api/branding/:businessUnitId/preview
   * Generate preview PDF with current branding
   */
  async generatePreview(req: Request, res: Response) {
    try {
      const businessUnitId = req.params.businessUnitId as string;
      const {
        documentType = "quotation",
        format = "A4",
        sampleData,
      } = req.body as {
        documentType?: DocumentType;
        format?: DocumentFormat;
        sampleData?: any;
      };

      // Get branding
      const branding = await brandingService.getOrCreateDefault(businessUnitId);

      // Build branding config
      const brandingConfig: BrandingConfig = {
        logoUrl: branding.logoUrl || undefined,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
        headerConfig: branding.headerConfig,
        footerConfig: branding.footerConfig,
      };

      // Build business unit info
      const businessUnitInfo: BusinessUnitInfo = {
        name: branding.businessUnit.name,
        taxId: (branding.businessUnit.settings as any)?.taxId,
        email: (branding.businessUnit.settings as any)?.email,
        phone: (branding.businessUnit.settings as any)?.phone,
        address: (branding.businessUnit.settings as any)?.address,
        website: (branding.businessUnit.settings as any)?.website,
      };

      // Generate content based on document type
      let content: string;
      const data = sampleData || this.getSampleData(documentType);

      switch (documentType) {
        case "quotation":
          content = buildQuotationContent(data);
          break;
        case "contract":
          content = buildContractContent(data);
          break;
        case "receipt":
          content = buildReceiptContent(data);
          break;
        default:
          content = `<h2>Preview Document</h2><p>Type: ${documentType}</p>`;
      }

      // Build complete HTML
      const html = buildDocument(
        brandingConfig,
        businessUnitInfo,
        content,
        documentType,
        `Preview - ${documentType}`,
      );

      // Generate PDF
      const pdfBuffer = await pdfGeneratorService.generateTestPDF(html, format);

      // Return PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="preview-${documentType}.pdf"`,
      );
      return res.send(pdfBuffer);
    } catch (error: any) {
      console.error("[BrandingController] Error generating preview:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error generating preview",
      });
    }
  }

  /**
   * POST /api/branding/:businessUnitId/test-html
   * Get HTML for testing (without generating PDF)
   */
  async getTestHTML(req: Request, res: Response) {
    try {
      const businessUnitId = req.params.businessUnitId as string;
      const { documentType = "quotation", sampleData } = req.body;

      // Get branding
      const branding = await brandingService.getOrCreateDefault(businessUnitId);

      // Build branding config
      const brandingConfig: BrandingConfig = {
        logoUrl: branding.logoUrl || undefined,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        fontFamily: branding.fontFamily,
        headerConfig: branding.headerConfig,
        footerConfig: branding.footerConfig,
      };

      // Build business unit info
      const businessUnitInfo: BusinessUnitInfo = {
        name: branding.businessUnit.name,
        taxId: (branding.businessUnit.settings as any)?.taxId,
        email: (branding.businessUnit.settings as any)?.email,
        phone: (branding.businessUnit.settings as any)?.phone,
        address: (branding.businessUnit.settings as any)?.address,
        website: (branding.businessUnit.settings as any)?.website,
      };

      // Generate content
      let content: string;
      const data = sampleData || this.getSampleData(documentType);

      switch (documentType) {
        case "quotation":
          content = buildQuotationContent(data);
          break;
        case "contract":
          content = buildContractContent(data);
          break;
        case "receipt":
          content = buildReceiptContent(data);
          break;
        default:
          content = `<h2>Test Document</h2><p>Type: ${documentType}</p>`;
      }

      // Build complete HTML
      const html = buildDocument(
        brandingConfig,
        businessUnitInfo,
        content,
        documentType,
        `Test - ${documentType}`,
      );

      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (error: any) {
      console.error("[BrandingController] Error getting test HTML:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error getting test HTML",
      });
    }
  }

  /**
   * Get sample data for different document types
   */
  private getSampleData(documentType: DocumentType): any {
    switch (documentType) {
      case "quotation":
        return {
          code: "COT-2026-001",
          clientName: "Cliente Ejemplo S.A.",
          date: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          currency: "USD",
          total: 5250.0,
          items: [
            {
              description: "Excavadora CAT 320",
              quantity: 1,
              unitPrice: 3000.0,
              total: 3000.0,
            },
            {
              description: "Retroexcavadora JCB",
              quantity: 1,
              unitPrice: 2250.0,
              total: 2250.0,
            },
          ],
        };

      case "contract":
        return {
          code: "CON-2026-001",
          parties: "Empresa XYZ y Cliente ABC",
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          currency: "USD",
          amount: 120000.0,
          terms:
            "Las partes acuerdan los siguientes términos y condiciones para el arrendamiento de maquinaria...",
        };

      case "receipt":
        return {
          receiptNumber: "REC-2026-001",
          date: new Date(),
          clientName: "Juan Pérez",
          currency: "USD",
          total: 150.0,
          items: [
            { description: "Pago mensual - Equipo A", amount: 100.0 },
            { description: "Cargo por servicio", amount: 50.0 },
          ],
        };

      default:
        return {};
    }
  }
}

export const brandingController = new BrandingController();
