/**
 * QUOTATION CONTROLLER
 * Controller para gestión de cotizaciones
 */

import { Request, Response } from "express";
import { quotationService } from "../services/quotation.service";
import { quotationEmailService } from "../services/quotation-email.service";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import { permissionService } from "@core/services/permission.service";
import prisma from "@config/database";
import {
  approveQuotationAsAdmin,
  ensureClientReviewToken,
} from "../services/quotation-approval.service";

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
      const { businessUnitId, status, clientId, clientResponse } = req.query;

      const quotations = await quotationService.listQuotations({
        businessUnitId: businessUnitId as string,
        status: status as string,
        clientId: clientId as string,
        clientResponse: clientResponse as string,
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
      const {
        businessUnitId,
        clientId,
        validUntil,
        items,
        estimatedStartDate,
        estimatedEndDate,
        ...rest
      } = req.body;

      const { userId, tenantId } = req.context!;

      const quotation = await quotationService.createQuotation({
        tenantId,
        businessUnitId,
        clientId,
        validUntil: new Date(validUntil),
        estimatedStartDate: estimatedStartDate
          ? new Date(estimatedStartDate)
          : undefined,
        estimatedEndDate: estimatedEndDate
          ? new Date(estimatedEndDate)
          : undefined,
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
   * Actualizar cotización completa (cabecera + items)
   * PATCH /api/v1/rental/quotations/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { userId } = req.context!;

      const { validUntil, estimatedStartDate, estimatedEndDate, ...rest } =
        req.body;

      const quotation = await quotationService.updateQuotation(quotationId, {
        ...rest,
        validUntil: validUntil ? new Date(validUntil) : undefined,
        estimatedStartDate: estimatedStartDate
          ? new Date(estimatedStartDate)
          : undefined,
        estimatedEndDate: estimatedEndDate
          ? new Date(estimatedEndDate)
          : undefined,
        updatedBy: userId,
      });

      res.json({ success: true, data: quotation });
    } catch (error: any) {
      const status = error.message?.includes("no encontrada")
        ? 404
        : error.message?.includes("No se puede")
          ? 409
          : 400;
      res.status(status).json({ success: false, error: error.message });
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
   * Enviar cotización al cliente (o solicitar aprobación si no tiene permiso)
   * POST /api/v1/rental/quotations/:id/send
   */
  async send(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { userId, tenantId, businessUnitId } = req.context!;

      // Obtener permisos reales del usuario
      const userPermissions = await permissionService.getUserPermissions(
        userId,
        businessUnitId!,
      );

      // Agregar el rol global (req.user) y el rol de BU (req.context) como pseudo-permisos
      // para que sendOrRequestApproval pueda evaluar OWNER / SUPER_ADMIN / ADMIN correctamente
      const globalRole = (req as any).user?.role; // "OWNER" | "SUPER_ADMIN" | "USER"
      const buRole = req.context!.role; // nombre del rol en la BU (ej. "Administrador")

      for (const r of [globalRole, buRole]) {
        if (r && !userPermissions.includes(r)) {
          userPermissions.push(r);
        }
      }

      console.log(
        "[QuotationController.send] userPermissions:",
        userPermissions,
      );

      const result = await quotationService.sendOrRequestApproval(
        quotationId,
        userId,
        userPermissions,
      );

      res.json({
        success: true,
        data: result,
        message: result.sent
          ? "Cotización enviada al cliente exitosamente"
          : "Cotización enviada a aprobación. Se notificó a los aprobadores.",
      });
    } catch (error: any) {
      console.error("[QuotationController.send] Error:", error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Aprobar cotización pendiente y enviarla al cliente
   * POST /api/v1/rental/quotations/:id/approve
   * @deprecated Usar approve() que crea contrato automáticamente
   */
  async approveAndSendLegacy(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { userId } = req.context!;

      await quotationService.approveAndSend(quotationId, userId);

      res.json({
        success: true,
        message: "Cotización aprobada y enviada al cliente exitosamente",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Rechazar cotización pendiente (vuelve a borrador)
   * POST /api/v1/rental/quotations/:id/reject
   */
  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { userId } = req.context!;
      const { reason } = req.body;

      if (!reason) {
        res
          .status(400)
          .json({ success: false, error: "Se requiere un motivo de rechazo" });
        return;
      }

      await quotationService.rejectQuotation(quotationId, userId, reason);

      res.json({
        success: true,
        message: "Cotización rechazada. El creador fue notificado.",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Confirmar pago recibido por transferencia bancaria
   * POST /api/v1/rental/quotations/:id/confirm-payment
   */
  async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { userId } = req.context!;
      const { paymentReference, notes } = req.body;

      if (!paymentReference) {
        res.status(400).json({
          success: false,
          error: "Se requiere la referencia del pago",
        });
        return;
      }

      const result = await quotationService.confirmPayment(
        quotationId,
        userId,
        paymentReference,
        notes,
      );

      res.json({
        success: true,
        message: "Pago confirmado. Contrato creado y cuenta acreditada.",
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
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
  /**
   * POST /api/v1/rental/quotations/:id/approve
   * Aprobar cotización desde el panel admin → crea contrato automáticamente
   */
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const quotationId = Array.isArray(id) ? id[0] : id;
      const { userId, businessUnitId, role } = req.context!;
      const { creditApproval } = req.body || {};

      if (!businessUnitId) {
        res.status(400).json({
          success: false,
          error: "Business unit context is required",
        });
        return;
      }

      const quotation = await prisma.quotation.findUnique({
        where: { id: quotationId },
        select: {
          id: true,
          tenantId: true,
          businessUnitId: true,
          clientId: true,
          metadata: true,
        },
      });

      if (!quotation) {
        res.status(404).json({
          success: false,
          error: "Quotation not found",
        });
        return;
      }

      const userPermissions = await permissionService.getUserPermissions(
        userId,
        businessUnitId,
      );

      const globalRole = (req as any).user?.role;
      for (const pseudoPermission of [globalRole, role]) {
        if (pseudoPermission && !userPermissions.includes(pseudoPermission)) {
          userPermissions.push(pseudoPermission);
        }
      }

      const isOwnerOrSuperAdmin =
        userPermissions.includes("OWNER") ||
        userPermissions.includes("SUPER_ADMIN");

      const approvalReason = ((quotation.metadata as any) || {})
        .approvalReason as string | undefined;

      const hasGeneralApprovalPermission =
        userPermissions.includes("quotations:approve");
      const hasCreditLimitApprovalPermission = userPermissions.includes(
        "quotations:approve-credit-limit",
      );

      if (!isOwnerOrSuperAdmin) {
        if (approvalReason === "credit_limit_exceeded") {
          if (
            !hasGeneralApprovalPermission &&
            !hasCreditLimitApprovalPermission
          ) {
            res.status(403).json({
              success: false,
              error:
                "Insufficient permissions to approve quotations exceeding credit limits",
            });
            return;
          }
        } else if (!hasGeneralApprovalPermission) {
          res.status(403).json({
            success: false,
            error: "Insufficient permissions to approve quotations",
          });
          return;
        }
      }

      if (approvalReason === "credit_limit_exceeded") {
        if (!creditApproval) {
          res.status(400).json({
            success: false,
            error:
              "Credit approval input is required for quotations exceeding credit limits",
          });
          return;
        }

        const parsedAmount = Number(creditApproval.creditLimitAmount);
        const parsedDays = Number(creditApproval.creditLimitDays);

        if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
          res.status(400).json({
            success: false,
            error: "creditLimitAmount must be a valid non-negative number",
          });
          return;
        }

        if (!Number.isFinite(parsedDays) || parsedDays < 0) {
          res.status(400).json({
            success: false,
            error: "creditLimitDays must be a valid non-negative number",
          });
          return;
        }

        const approvalJustification = String(
          creditApproval.justification || "",
        ).trim();
        if (!approvalJustification) {
          res.status(400).json({
            success: false,
            error:
              "justification is required when approving a quotation that exceeded credit limits",
          });
          return;
        }

        await prisma.$transaction(async (tx) => {
          const existingProfile = await tx.rentalClientCreditProfile.findUnique(
            {
              where: {
                tenantId_businessUnitId_clientId: {
                  tenantId: quotation.tenantId,
                  businessUnitId: quotation.businessUnitId,
                  clientId: quotation.clientId,
                },
              },
            },
          );

          const updatedProfile = await tx.rentalClientCreditProfile.upsert({
            where: {
              tenantId_businessUnitId_clientId: {
                tenantId: quotation.tenantId,
                businessUnitId: quotation.businessUnitId,
                clientId: quotation.clientId,
              },
            },
            create: {
              tenantId: quotation.tenantId,
              businessUnitId: quotation.businessUnitId,
              clientId: quotation.clientId,
              creditLimitAmount: parsedAmount,
              creditLimitDays: parsedDays,
              requiresOwnerApprovalOnExceed:
                creditApproval.requiresOwnerApprovalOnExceed !== undefined
                  ? Boolean(creditApproval.requiresOwnerApprovalOnExceed)
                  : true,
              isActive:
                creditApproval.isActive !== undefined
                  ? Boolean(creditApproval.isActive)
                  : true,
              notes:
                creditApproval.notes !== undefined
                  ? String(creditApproval.notes)
                  : null,
              metadata: {
                source: "quotation_credit_approval",
                approvedQuotationId: quotationId,
                approvedBy: userId,
              },
              updatedBy: userId,
            },
            update: {
              creditLimitAmount: parsedAmount,
              creditLimitDays: parsedDays,
              requiresOwnerApprovalOnExceed:
                creditApproval.requiresOwnerApprovalOnExceed !== undefined
                  ? Boolean(creditApproval.requiresOwnerApprovalOnExceed)
                  : undefined,
              isActive:
                creditApproval.isActive !== undefined
                  ? Boolean(creditApproval.isActive)
                  : undefined,
              notes:
                creditApproval.notes !== undefined
                  ? String(creditApproval.notes)
                  : undefined,
              metadata: {
                source: "quotation_credit_approval",
                approvedQuotationId: quotationId,
                approvedBy: userId,
              },
              updatedBy: userId,
            },
          });

          const quotationMetadata = (quotation.metadata as any) || {};
          await tx.quotation.update({
            where: { id: quotationId },
            data: {
              metadata: {
                ...quotationMetadata,
                creditApproval: {
                  approvedBy: userId,
                  approvedAt: new Date().toISOString(),
                  justification: approvalJustification,
                  previousProfile: existingProfile
                    ? {
                        creditLimitAmount: Number(
                          existingProfile.creditLimitAmount,
                        ),
                        creditLimitDays: existingProfile.creditLimitDays,
                        requiresOwnerApprovalOnExceed:
                          existingProfile.requiresOwnerApprovalOnExceed,
                        isActive: existingProfile.isActive,
                        notes: existingProfile.notes,
                      }
                    : null,
                  newProfile: {
                    creditLimitAmount: Number(updatedProfile.creditLimitAmount),
                    creditLimitDays: updatedProfile.creditLimitDays,
                    requiresOwnerApprovalOnExceed:
                      updatedProfile.requiresOwnerApprovalOnExceed,
                    isActive: updatedProfile.isActive,
                    notes: updatedProfile.notes,
                  },
                },
              },
            },
          });
        });
      }

      const result = await approveQuotationAsAdmin(quotationId, userId);
      res.json({ success: true, ...result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/v1/rental/quotations/:id/send-review
   * Enviar link de revisión al cliente (genera token + envía email)
   */
  async sendForReview(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { customMessage, cc } = req.body;

      // Asegura que existe el clientReviewToken
      await ensureClientReviewToken(id);

      // Envía el email con el link de revisión
      await quotationEmailService.sendQuotationEmail(id, { customMessage, cc });

      res.json({
        success: true,
        message: "Enlace de revisión enviado al cliente",
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

export const quotationController = new QuotationController();
