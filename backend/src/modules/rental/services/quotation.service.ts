/**
 * QUOTATION SERVICE
 * Servicio para gestión de cotizaciones con firma digital
 */

import prisma from "@config/database";
import { templateService } from "@shared/templates/template.service";
import { digitalSignatureResolver } from "@integrations/adapters/digital-signature/digital-signature.resolver";
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import {
  SignerInfo,
  SignatureRequest,
} from "@core/contracts/digital-signature.provider";
import { Decimal } from "@prisma/client/runtime/library";

export interface CreateQuotationParams {
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  assignedUserId?: string;
  validUntil: Date;
  items: QuotationItemInput[];
  taxRate?: number;
  currency?: string;
  notes?: string;
  termsAndConditions?: string;
  createdBy: string;
}

export interface QuotationItemInput {
  assetId?: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  rentalDays?: number;
  rentalStartDate?: Date;
  rentalEndDate?: Date;
}

export class QuotationService {
  /**
   * Crear cotización
   */
  async createQuotation(params: CreateQuotationParams) {
    // 1. Calcular totales
    const subtotal = params.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );
    const taxRate = params.taxRate || 0;
    const taxAmount = subtotal * (taxRate / 100);
    const totalAmount = subtotal + taxAmount;

    // 2. Generar código único
    const code = await this.generateQuotationCode(
      params.tenantId,
      params.businessUnitId,
    );

    // 3. Crear cotización
    const quotation = await prisma.quotation.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        code,
        clientId: params.clientId,
        assignedUserId: params.assignedUserId,
        status: "draft",
        subtotal: new Decimal(subtotal),
        taxRate: new Decimal(taxRate),
        taxAmount: new Decimal(taxAmount),
        totalAmount: new Decimal(totalAmount),
        currency: params.currency || "USD",
        validUntil: params.validUntil,
        notes: params.notes,
        termsAndConditions: params.termsAndConditions,
        createdBy: params.createdBy,
        items: {
          create: params.items.map((item, index) => ({
            assetId: item.assetId,
            productId: item.productId,
            description: item.description,
            quantity: item.quantity,
            unitPrice: new Decimal(item.unitPrice),
            total: new Decimal(item.quantity * item.unitPrice),
            rentalDays: item.rentalDays,
            rentalStartDate: item.rentalStartDate,
            rentalEndDate: item.rentalEndDate,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
        client: true,
        assignedUser: true,
      },
    });

    return quotation;
  }

  /**
   * Generar PDF de cotización
   */
  async generateQuotationPDF(quotationId: string): Promise<string> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: {
        items: true,
        client: true,
        businessUnit: true,
      },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    // Obtener plantilla activa
    const template = await templateService.getActiveTemplateByType(
      quotation.businessUnitId,
      "quotation",
    );

    if (!template) {
      throw new Error(
        `No active quotation template found for BU ${quotation.businessUnitId}`,
      );
    }

    // Preparar datos para renderizado
    const templateData = {
      quotationCode: quotation.code,
      quotationDate: quotation.quotationDate,
      validUntil: quotation.validUntil,
      clientName: quotation.client.name,
      clientEmail: quotation.client.email,
      clientPhone: quotation.client.phone,
      items: quotation.items.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        total: Number(item.total),
      })),
      subtotal: Number(quotation.subtotal),
      taxRate: Number(quotation.taxRate),
      taxAmount: Number(quotation.taxAmount),
      totalAmount: Number(quotation.totalAmount),
      currency: quotation.currency,
      notes: quotation.notes,
      termsAndConditions: quotation.termsAndConditions,
      logoUrl: template.logoUrl,
    };

    // Generar PDF
    const pdfBuffer = await templateService.renderAndGeneratePDF({
      templateId: template.id,
      data: templateData,
    });

    // Subir a Azure Blob Storage
    const uploadResult = await azureBlobStorageService.uploadFile({
      file: pdfBuffer,
      fileName: `${quotation.code}.pdf`,
      contentType: "application/pdf",
      folder: "quotations",
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
    });

    // Actualizar cotización con URL del PDF
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        pdfUrl: uploadResult.url,
        templateId: template.id,
      },
    });

    return uploadResult.url;
  }

  /**
   * Solicitar firma digital
   */
  async requestSignature(
    quotationId: string,
    signers: SignerInfo[],
  ): Promise<SignatureRequest> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { client: true },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    if (!quotation.pdfUrl) {
      throw new Error("PDF must be generated before requesting signature");
    }

    // Resolver proveedor de firma digital
    const signatureProvider = await digitalSignatureResolver.resolveProvider(
      quotation.businessUnitId,
    );

    // Crear solicitud de firma
    const request = await signatureProvider.createSignatureRequest({
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
      documentName: `Cotización ${quotation.code}`,
      documentUrl: quotation.pdfUrl,
      signers,
      message: `Por favor firme la cotización ${quotation.code}`,
      expiresInDays: 15,
      metadata: {
        quotationId: quotation.id,
        clientId: quotation.clientId,
      },
    });

    // Actualizar cotización
    await prisma.quotation.update({
      where: { id: quotationId },
      data: {
        signatureRequestId: request.id,
        signatureStatus: "pending",
        signatureProvider: signatureProvider.name,
        status: "signature_pending",
      },
    });

    return request;
  }

  /**
   * Procesar webhook de firma completada
   */
  async handleSignatureCompleted(
    signatureRequestId: string,
    signedDocumentBuffer: Buffer,
  ): Promise<void> {
    const quotation = await prisma.quotation.findFirst({
      where: { signatureRequestId },
    });

    if (!quotation) {
      throw new Error(
        `Quotation with signature request ${signatureRequestId} not found`,
      );
    }

    // Subir documento firmado a Azure Blob Storage
    const uploadResult = await azureBlobStorageService.uploadFile({
      file: signedDocumentBuffer,
      fileName: `${quotation.code}-signed.pdf`,
      contentType: "application/pdf",
      folder: "quotations/signed",
      tenantId: quotation.tenantId,
      businessUnitId: quotation.businessUnitId,
    });

    // Actualizar cotización
    await prisma.quotation.update({
      where: { id: quotation.id },
      data: {
        signatureStatus: "signed",
        signedPdfUrl: uploadResult.url,
        signedAt: new Date(),
        status: "signed",
      },
    });

    // TODO: Notificar al vendedor por email usando Sistema de Intenciones
  }

  /**
   * Transformar cotización en contrato después del pago
   */
  async createContractFromQuotation(quotationId: string): Promise<any> {
    const quotation = await prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { items: true },
    });

    if (!quotation) {
      throw new Error(`Quotation ${quotationId} not found`);
    }

    if (quotation.signatureStatus !== "signed") {
      throw new Error("Quotation must be signed before creating contract");
    }

    if (quotation.paymentStatus !== "paid") {
      throw new Error("Quotation must be paid before creating contract");
    }

    // Generar código de contrato
    const contractCode = await this.generateContractCode(
      quotation.tenantId,
      quotation.businessUnitId,
    );

    // Calcular fechas del contrato
    const startDate = quotation.items[0]?.rentalStartDate || new Date();
    const endDate =
      quotation.items[0]?.rentalEndDate ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // TODO: Generar PDF de contrato con plantilla específica

    const contract = await prisma.quotationContract.create({
      data: {
        tenantId: quotation.tenantId,
        businessUnitId: quotation.businessUnitId,
        quotationId: quotation.id,
        code: contractCode,
        status: "active",
        startDate,
        endDate,
        pdfUrl: `https://storage.divancosaas.com/${quotation.tenantId}/contracts/${contractCode}.pdf`,
        signedPdfUrl: quotation.signedPdfUrl!,
        totalAmount: quotation.totalAmount,
        currency: quotation.currency,
      },
    });

    // Actualizar estado de cotización
    await prisma.quotation.update({
      where: { id: quotationId },
      data: { status: "contract_created" },
    });

    return contract;
  }

  /**
   * Listar cotizaciones con filtros
   */
  async listQuotations(filters: {
    businessUnitId: string;
    status?: string;
    clientId?: string;
  }): Promise<any[]> {
    const where: any = {
      businessUnitId: filters.businessUnitId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    return await prisma.quotation.findMany({
      where,
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Obtener cotización por ID
   */
  async getQuotationById(id: string): Promise<any> {
    return await prisma.quotation.findUnique({
      where: { id },
      include: {
        items: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Listar contratos con filtros
   */
  async listContracts(filters: {
    businessUnitId: string;
    status?: string;
    quotationId?: string;
  }): Promise<any[]> {
    const where: any = {
      businessUnitId: filters.businessUnitId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.quotationId) {
      where.quotationId = filters.quotationId;
    }

    return await prisma.quotationContract.findMany({
      where,
      include: {
        quotation: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  /**
   * Obtener contrato por ID
   */
  async getContractById(id: string): Promise<any> {
    return await prisma.quotationContract.findUnique({
      where: { id },
      include: {
        quotation: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            items: true,
          },
        },
        businessUnit: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private async generateQuotationCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.quotation.count({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: `QU-${year}-`,
        },
      },
    });
    return `QU-${year}-${String(count + 1).padStart(3, "0")}`;
  }

  private async generateContractCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.quotationContract.count({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: `CON-${year}-`,
        },
      },
    });
    return `CON-${year}-${String(count + 1).padStart(3, "0")}`;
  }
}

export const quotationService = new QuotationService();
