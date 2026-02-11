/**
 * QUOTATION CONTROLLER
 * Controller para gestión de cotizaciones
 */

import { Request, Response } from "express";
import { quotationService } from "../services/quotation.service";

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

      res.json({
        success: true,
        data: quotations,
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

      res.json({
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
