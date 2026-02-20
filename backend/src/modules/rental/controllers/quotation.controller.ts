/**
 * QUOTATION CONTROLLER
 * Controller para gestión de cotizaciones
 */

import { Request, Response } from "express";
import { quotationService } from "../services/quotation.service";
import { quotationEmailService } from "../services/quotation-email.service";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";

/**
 * Helper: Generar SAS URL para pdfUrl si existe
 */
async function enrichQuotationWithSasUrl(quotation: any): Promise<any> {
  if (!quotation) return quotation;

  // Si existe pdfUrl, generar SAS URL temporal (7 días)
  if (quotation.pdfUrl) {
    try {
      const url = new URL(quotation.pdfUrl);
      const pathParts = url.pathname.split("/").filter((p) => p);
      const containerName = pathParts[0];
      const blobName = pathParts.slice(1).join("/");

      quotation.pdfUrl = await azureBlobStorageService.generateSasUrl(
        containerName,
        blobName,
        60 * 24 * 7, // 7 días
      );
    } catch (error) {
      console.error("Error generating SAS URL for pdfUrl:", error);
      // Mantener URL original si falla
    }
  }

  // Si existe signedPdfUrl, generar SAS URL temporal
  if (quotation.signedPdfUrl) {
    try {
      const url = new URL(quotation.signedPdfUrl);
      const pathParts = url.pathname.split("/").filter((p) => p);
      const containerName = pathParts[0];
      const blobName = pathParts.slice(1).join("/");

      quotation.signedPdfUrl = await azureBlobStorageService.generateSasUrl(
        containerName,
        blobName,
        60 * 24 * 7, // 7 días
      );
    } catch (error) {
      console.error("Error generating SAS URL for signedPdfUrl:", error);
      // Mantener URL original si falla
    }
  }

  return quotation;
}

export class QuotationController {
  /**
   * Listar cotizaciones
   * GET /api/v1/rental/quotations
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { businessUnitId, status, clientId } = req.query;

      const quotations = await quotationService.listQuotations({
        businessUnitId: businessUnitId as string,
        status: status as string,
        clientId: clientId as string,
      });

      // Enriquecer con SAS URLs
      const enrichedQuotations = await Promise.all(
        quotations.map((q) => enrichQuotationWithSasUrl(q)),
      );

      res.json({
        success: true,
        data: enrichedQuotations,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Obtener cotización por ID
   * GET /api/v1/rental/quotations/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;

      const quotation = await quotationService.getQuotationById(quotationId);

      if (!quotation) {
        res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
        return;
      }

      // Enriquecer con SAS URL
      const enrichedQuotation = await enrichQuotationWithSasUrl(quotation);

      res.json({
        success: true,
        data: enrichedQuotation,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Crear cotización
   * POST /api/v1/rental/quotations
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { businessUnitId, clientId, validUntil, items, ...rest } = req.body;
      const userId = (req as any).user.id;

      const quotation = await quotationService.createQuotation({
        tenantId: (req as any).user.tenantId,
        businessUnitId,
        clientId,
        validUntil: new Date(validUntil),
        items,
        createdBy: userId,
        ...rest,
      });

      res.status(201).json({
        success: true,
        data: quotation,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Actualizar precios de items (override manual)
   * PATCH /api/v1/rental/quotations/:id/update-prices
   */
  async updatePrices(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { itemUpdates } = req.body;

      if (!Array.isArray(itemUpdates)) {
        res.status(400).json({
          success: false,
          error: "itemUpdates must be an array",
        });
        return;
      }

      const quotation = await quotationService.updateQuotationItemPrices(
        quotationId,
        itemUpdates,
      );

      res.json({
        success: true,
        data: quotation,
        message: "Prices updated successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Generar PDF
   * POST /api/v1/rental/quotations/:id/generate-pdf
   */
  async generatePDF(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const pdfUrl = await quotationService.generateQuotationPDF(quotationId);

      res.json({
        success: true,
        data: { pdfUrl },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Enviar cotización por email
   * POST /api/v1/rental/quotations/:id/send-email
   */
  async sendEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { customMessage, cc } = req.body;

      await quotationEmailService.sendQuotationEmail(quotationId, {
        customMessage,
        cc,
      });

      res.json({
        success: true,
        message: "Quotation sent successfully via email",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Solicitar firma digital
   * POST /api/v1/rental/quotations/:id/request-signature
   */
  async requestSignature(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { signers } = req.body;

      const signatureRequest = await quotationService.requestSignature(
        quotationId,
        signers,
      );

      res.json({
        success: true,
        data: signatureRequest,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Webhook de firma completada
   * POST /api/v1/rental/webhooks/digital-signature/:provider
   */
  async handleSignatureWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { provider } = req.params;
      const providerName = Array.isArray(provider) ? provider[0] : provider;
      const signature = req.headers["x-signature"] as string;
      const rawPayload = req.body;

      // Obtener el provider correcto
      const digitalSignatureResolver =
        await import("@integrations/adapters/digital-signature/digital-signature.resolver");
      const providerInstance =
        digitalSignatureResolver.digitalSignatureResolver.getProviderByName(
          providerName,
        );

      if (!providerInstance) {
        res.status(400).json({
          success: false,
          error: `Unknown provider: ${provider}`,
        });
        return;
      }

      // Parsear y validar webhook
      const event = await providerInstance.parseWebhook(
        rawPayload,
        signature || "",
      );

      if (!event) {
        res.status(400).json({
          success: false,
          error: "Invalid webhook payload",
        });
        return;
      }

      // Procesar eventos de firma completada
      if (event.eventType === "document.signed" || event.status === "signed") {
        // Descargar documento firmado
        const signedDocument = await providerInstance.downloadSignedDocument(
          event.requestId,
        );

        // Actualizar cotización con documento firmado
        await quotationService.handleSignatureCompleted(
          event.requestId,
          signedDocument,
        );
      }

      // Responder a SignNow/DocuSign
      res.json({ success: true, received: event.eventType });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }

  /**
   * Crear contrato desde cotización
   * POST /api/v1/rental/quotations/:id/create-contract
   */
  async createContract(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const result =
        await quotationService.createContractFromQuotation(quotationId);

      res.json({
        success: true,
        message: result.hasRentalAssets
          ? "Contrato creado exitosamente. Activos asociados al contrato de alquiler."
          : "Contrato creado exitosamente.",
        data: {
          quotationContract: result.quotationContract,
          rentalContract: result.rentalContract, // Puede ser null si no tiene activos
          hasRentalAssets: result.hasRentalAssets,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }
}

export const quotationController = new QuotationController();
