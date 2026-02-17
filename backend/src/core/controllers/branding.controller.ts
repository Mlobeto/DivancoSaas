/**
 * Branding Controller
 * Handles Business Unit branding configuration and PDF generation
 */

import { Request, Response } from "express";
import sharp from "sharp";
import { brandingService } from "../services/branding.service";
import { pdfGeneratorService } from "../services/pdf-generator.service";
import { azureBlobStorageService } from "../../shared/storage/azure-blob-storage.service";
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
   * POST /api/branding/:businessUnitId/upload-logo
   * Upload logo for business unit branding
   */
  async uploadLogo(req: Request, res: Response) {
    try {
      const businessUnitId = req.params.businessUnitId as string;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "No file provided",
        });
      }

      // Validate file type (only images)
      const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/svg+xml",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Only JPG, PNG, SVG, and WebP are allowed",
        });
      }

      // Validate file size (max 2MB)
      const maxSize = 2 * 1024 * 1024; // 2MB
      if (file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: "File size exceeds 2MB limit",
        });
      }

      // Get tenant and business unit context from request
      const user = (req as any).user;
      if (!user || !user.tenantId) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      // Process image with Sharp (resize and optimize)
      // Skip SVG files as they are vector-based
      let processedBuffer = file.buffer;
      let finalContentType = file.mimetype;
      let finalFileName = file.originalname;

      if (file.mimetype !== "image/svg+xml") {
        try {
          // Resize to max 600px width while maintaining aspect ratio
          // Convert to PNG for transparency support or JPEG for photos
          const isTransparent =
            file.mimetype === "image/png" || file.mimetype === "image/webp";

          if (isTransparent) {
            // Use PNG for images with potential transparency
            processedBuffer = await sharp(file.buffer)
              .resize({ width: 600, fit: "inside", withoutEnlargement: true })
              .png({ quality: 90, compressionLevel: 9 })
              .toBuffer();

            finalContentType = "image/png";
            finalFileName = file.originalname.replace(
              /\.(jpe?g|webp)$/i,
              ".png",
            );
          } else {
            // Use JPEG for photos (better compression)
            processedBuffer = await sharp(file.buffer)
              .resize({ width: 600, fit: "inside", withoutEnlargement: true })
              .jpeg({ quality: 90, progressive: true })
              .toBuffer();

            finalContentType = "image/jpeg";
            finalFileName = file.originalname.replace(/\.(png|webp)$/i, ".jpg");
          }

          console.log(
            `[BrandingController] Image processed: ${file.size} bytes → ${processedBuffer.length} bytes (${((1 - processedBuffer.length / file.size) * 100).toFixed(1)}% reduction)`,
          );
        } catch (sharpError: any) {
          console.error(
            "[BrandingController] Error processing image with Sharp:",
            sharpError,
          );
          // If Sharp fails, use original file
          processedBuffer = file.buffer;
          finalContentType = file.mimetype;
          finalFileName = file.originalname;
        }
      }

      // Upload to Azure Blob Storage with correct structure
      // Container: templates
      // Path: tenant/{tenantId}/business-unit/{businessUnitId}/branding/logos/{filename}
      const uploadResult = await azureBlobStorageService.uploadFile({
        file: processedBuffer,
        fileName: finalFileName,
        contentType: finalContentType,
        folder: "branding/logos",
        tenantId: user.tenantId,
        businessUnitId: businessUnitId,
        containerName: "templates", // Use templates container for branding assets
      });

      // Update branding with new logo URL
      // Generate SAS URL with 1 year expiration for logos (they are semi-permanent)
      const sasUrl = await azureBlobStorageService.generateSasUrl(
        uploadResult.containerName,
        uploadResult.blobName,
        525600, // 1 year in minutes (365 * 24 * 60)
      );

      const branding = await brandingService.update(businessUnitId, {
        logoUrl: sasUrl,
      });

      return res.json({
        success: true,
        data: {
          logoUrl: sasUrl,
          blobName: uploadResult.blobName,
          size: uploadResult.size,
          originalSize: file.size,
          optimized: file.mimetype !== "image/svg+xml",
        },
      });
    } catch (error: any) {
      console.error("[BrandingController] Error uploading logo:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error uploading logo",
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
