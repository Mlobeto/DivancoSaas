/**
 * CONTRACT SERVICE
 * Gestión de contratos de alquiler con crédito compartido
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import { accountService } from "./account.service";
import { digitalSignatureResolver } from "@integrations/adapters/digital-signature/digital-signature.resolver";
import type { SignerInfo } from "@core/contracts/digital-signature.provider";
import { brandingService } from "@core/services/branding.service";
import {
  buildDocument,
  type BrandingConfig,
  type BusinessUnitInfo,
} from "@core/services/document-builder.service";
import { nowInBUTimezone } from "@core/utils/timezone-utils";

export interface CreateContractParams {
  tenantId: string;
  businessUnitId: string;
  clientId: string;
  quotationId?: string;
  startDate: Date;
  estimatedEndDate?: Date;
  estimatedTotal?: number;
  templateId?: string;
  pdfUrl?: string;
  notes?: string;
  metadata?: any;
  createdBy: string;
}

/**
 * Parámetros para crear un Master Contract (v7.0)
 * Los master contracts NO tienen items específicos inicialmente
 */
export interface CreateMasterContractParams {
  tenantId: string;
  businessUnitId: string;
  clientId: string;

  startDate: Date;
  estimatedEndDate?: Date;

  // Límites acordados (pueden ser diferentes a los de la cuenta)
  agreedCreditLimit?: number; // Si no se especifica, usa el de ClientAccount
  agreedTimeLimit?: number; // Si no se especifica, usa el de ClientAccount

  // Documentación
  templateId?: string;
  pdfUrl?: string;
  notes?: string;
  metadata?: any;

  createdBy: string;
}

export interface WithdrawAssetParams {
  contractId: string;
  assetId: string;
  expectedReturnDate?: Date;
  operatorId?: string;
  initialHourometer?: number;
  initialOdometer?: number;
  evidenceUrls?: string[];
  notes?: string;
  createdBy: string;
}

export interface ReturnAssetParams {
  rentalId: string;
  returnDate: Date;
  finalHourometer?: number;
  finalOdometer?: number;
  evidenceUrls?: string[];
  condition?: string;
  notes?: string;
  createdBy: string;
}

export class ContractService {
  /**
   * Crear contrato de alquiler
   */
  async createContract(params: CreateContractParams) {
    // 1. Verificar o crear ClientAccount
    let clientAccount = await prisma.clientAccount.findUnique({
      where: { clientId: params.clientId },
    });

    if (!clientAccount) {
      // Crear cuenta si no existe
      clientAccount = await accountService.createAccount({
        tenantId: params.tenantId,
        clientId: params.clientId,
        initialBalance: 0,
        alertAmount: 100000, // Default $100k
        statementFrequency: "monthly",
      });
    }

    // 2. Generar código único
    const code = await this.generateContractCode(
      params.tenantId,
      params.businessUnitId,
    );

    // 3. Crear contrato
    const contract = await prisma.rentalContract.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientId: params.clientId,
        clientAccountId: clientAccount.id,
        quotationId: params.quotationId,
        code,
        contractType: "specific", // Explicit contract type (v7.0)
        status: "active",
        startDate: params.startDate,
        estimatedEndDate: params.estimatedEndDate,
        estimatedTotal: params.estimatedTotal
          ? new Decimal(params.estimatedTotal)
          : undefined,
        templateId: params.templateId,
        pdfUrl: params.pdfUrl,
        notes: params.notes,
        metadata: params.metadata,
        createdBy: params.createdBy,
      },
      include: {
        client: true,
        clientAccount: true,
        quotation: {
          include: {
            items: true,
          },
        },
      },
    });

    return contract;
  }

  /**
   * Crear Master Contract (v7.0)
   * Contratos sin items específicos, que usan addendums para entregas
   */
  async createMasterContract(params: CreateMasterContractParams) {
    // 1. Verificar o crear ClientAccount
    let clientAccount = await prisma.clientAccount.findUnique({
      where: { clientId: params.clientId },
    });

    if (!clientAccount) {
      // Crear cuenta si no existe
      clientAccount = await accountService.createAccount({
        tenantId: params.tenantId,
        clientId: params.clientId,
        initialBalance: 0,
        alertAmount: 100000, // Default $100k
        statementFrequency: "monthly",
      });
    }

    // 2. Generar código único
    const code = await this.generateContractCode(
      params.tenantId,
      params.businessUnitId,
    );

    // 3. Determinar límites acordados
    const agreedCreditLimit =
      params.agreedCreditLimit || clientAccount.creditLimit.toNumber();
    const agreedTimeLimit = params.agreedTimeLimit || clientAccount.timeLimit;

    // 4. Crear master contract
    const contract = await prisma.rentalContract.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientId: params.clientId,
        clientAccountId: clientAccount.id,
        code,

        // Master contract específicos
        contractType: "master",
        agreedAmount: agreedCreditLimit
          ? new Decimal(agreedCreditLimit)
          : clientAccount.creditLimit,
        agreedPeriod: agreedTimeLimit,
        totalActiveDays: 0,

        status: "active",
        startDate: params.startDate,
        estimatedEndDate: params.estimatedEndDate,
        templateId: params.templateId,
        pdfUrl: params.pdfUrl,
        notes: params.notes,
        metadata: params.metadata,
        createdBy: params.createdBy,
      },
      include: {
        client: true,
        clientAccount: true,
      },
    });

    return contract;
  }

  /**
   * Retirar asset (iniciar alquiler)
   */
  async withdrawAsset(params: WithdrawAssetParams) {
    // 1. Validar contrato
    const contract = await prisma.rentalContract.findUnique({
      where: { id: params.contractId },
      include: {
        clientAccount: true,
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.status !== "active") {
      throw new Error(`Contract status is ${contract.status}, must be active`);
    }

    // 2. Validar asset (incluir rentalProfile para multi-vertical)
    const asset = await prisma.asset.findUnique({
      where: { id: params.assetId },
      include: {
        rentalProfile: true, // Extensión opcional para vertical rental
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // Determinar trackingType con fallback
    const trackingType =
      asset.rentalProfile?.trackingType || asset.trackingType;
    if (!trackingType) {
      throw new Error("Asset must have trackingType configured");
    }

    // 3. Validar balance (opcional, warning)
    const balance = Number(contract.clientAccount.balance);
    if (balance <= 0) {
      console.warn(
        `Warning: Client ${contract.clientId} has zero or negative balance`,
      );
    }

    // 4. Crear AssetRental con fallback a valores legacy
    const rental = await prisma.assetRental.create({
      data: {
        contractId: params.contractId,
        assetId: params.assetId,
        withdrawalDate: await nowInBUTimezone(contract.businessUnitId),
        expectedReturnDate: params.expectedReturnDate,
        trackingType: trackingType,

        // Para MACHINERY - usar rentalProfile con fallback
        hourlyRate: asset.rentalProfile?.pricePerHour || asset.pricePerHour,
        operatorCostType:
          asset.rentalProfile?.operatorCostType || asset.operatorCostType,
        operatorCostRate:
          asset.rentalProfile?.operatorCostRate || asset.operatorCostRate,
        initialHourometer: params.initialHourometer
          ? new Decimal(params.initialHourometer)
          : undefined,
        currentHourometer: params.initialHourometer
          ? new Decimal(params.initialHourometer)
          : undefined,
        initialOdometer: params.initialOdometer
          ? new Decimal(params.initialOdometer)
          : undefined,
        currentOdometer: params.initialOdometer
          ? new Decimal(params.initialOdometer)
          : undefined,

        // Para TOOL - usar rentalProfile con fallback
        dailyRate: asset.rentalProfile?.pricePerDay || asset.pricePerDay,

        withdrawalEvidence: params.evidenceUrls || [],
        notes: params.notes,
        createdBy: params.createdBy,
      },
      include: {
        asset: true,
        contract: true,
      },
    });

    // 5. Registrar movimiento (NO se descuenta en retiro)
    await accountService.createMovement({
      accountId: contract.clientAccountId,
      contractId: params.contractId,
      movementType: "WITHDRAWAL_START",
      amount: 0, // NO se descuenta al retirar
      description: `Retiro de ${asset.name} (${asset.code}) - Inicio de tracking`,
      assetRentalId: rental.id,
      evidenceUrls: params.evidenceUrls,
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return rental;
  }

  /**
   * Devolver asset (finalizar alquiler)
   */
  async returnAsset(params: ReturnAssetParams) {
    // 1. Validar rental
    const rental = await prisma.assetRental.findUnique({
      where: { id: params.rentalId },
      include: {
        asset: true,
        contract: {
          include: {
            clientAccount: true,
          },
        },
      },
    });

    if (!rental) {
      throw new Error("Rental not found");
    }

    if (rental.actualReturnDate) {
      throw new Error("Asset already returned");
    }

    // 2. Actualizar AssetRental
    const updatedRental = await prisma.assetRental.update({
      where: { id: params.rentalId },
      data: {
        actualReturnDate: params.returnDate,
        returnEvidence: params.evidenceUrls || [],
        notes: rental.notes
          ? `${rental.notes}\n\nDevolución: ${params.notes || ""}`
          : params.notes,

        // Actualizar métricas finales si aplica
        currentHourometer: params.finalHourometer
          ? new Decimal(params.finalHourometer)
          : rental.currentHourometer,
        currentOdometer: params.finalOdometer
          ? new Decimal(params.finalOdometer)
          : rental.currentOdometer,
      },
    });

    // 3. Registrar movimiento (NO se descuenta en devolución, ya se descontó día a día)
    await accountService.createMovement({
      accountId: rental.contract.clientAccountId,
      contractId: rental.contractId,
      movementType: "RETURN_END",
      amount: 0, // NO se descuenta al devolver
      description: `Devolución de ${rental.asset.name} (${rental.asset.code}) - Fin de tracking. Total: $${rental.totalCost}`,
      assetRentalId: rental.id,
      evidenceUrls: params.evidenceUrls,
      metadata: {
        condition: params.condition,
        totalHoursUsed: rental.totalHoursUsed,
        totalKmUsed: rental.totalKmUsed,
        totalCost: rental.totalCost,
      },
      notes: params.notes,
      createdBy: params.createdBy,
    });

    return updatedRental;
  }

  /**
   * Obtener contrato por ID
   */
  async getContractById(contractId: string) {
    return prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        clientAccount: true,
        quotation: {
          include: {
            items: true,
          },
        },
        activeRentals: {
          where: {
            actualReturnDate: null, // Assets actualmente en uso
          },
          include: {
            asset: true,
            usageReports: {
              orderBy: { createdAt: "desc" },
              take: 5,
            },
          },
        },
        movements: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });
  }

  /**
   * Listar contratos
   */
  async listContracts(filters: {
    tenantId: string;
    businessUnitId?: string;
    clientId?: string;
    status?: string;
  }) {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.businessUnitId) where.businessUnitId = filters.businessUnitId;
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;

    return prisma.rentalContract.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        client: true,
        clientAccount: true,
        activeRentals: {
          where: {
            actualReturnDate: null,
          },
          include: {
            asset: true,
          },
        },
      },
    });
  }

  /**
   * Finalizar contrato
   */
  async completeContract(contractId: string, createdBy: string) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        activeRentals: {
          where: {
            actualReturnDate: null,
          },
        },
      },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (contract.activeRentals.length > 0) {
      throw new Error(
        `Cannot complete contract: ${contract.activeRentals.length} assets still in use`,
      );
    }

    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "completed",
        actualEndDate: await nowInBUTimezone(contract.businessUnitId),
      },
    });
  }

  /**
   * Suspender contrato
   */
  async suspendContract(contractId: string, reason: string, createdBy: string) {
    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "suspended",
        notes: `Suspendido: ${reason}`,
      },
    });
  }

  /**
   * Reactivar contrato
   */
  async reactivateContract(contractId: string, createdBy: string) {
    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        status: "active",
      },
    });
  }

  /**
   * Generar código único de contrato
   */
  private async generateContractCode(
    tenantId: string,
    businessUnitId: string,
  ): Promise<string> {
    const year = (await nowInBUTimezone(businessUnitId)).getFullYear();
    const lastContract = await prisma.rentalContract.findFirst({
      where: {
        tenantId,
        businessUnitId,
        code: {
          startsWith: `CON-${year}-`,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let sequence = 1;
    if (lastContract) {
      const match = lastContract.code.match(/CON-\d{4}-(\d+)/);
      if (match) {
        sequence = parseInt(match[1]) + 1;
      }
    }

    return `CON-${year}-${sequence.toString().padStart(3, "0")}`;
  }

  /**
   * Subir o registrar comprobante de pago
   */
  async uploadPaymentProof(
    contractId: string,
    data: {
      paymentType: string | null;
      paymentProofUrl: string | null;
      paymentDetails: any;
    },
  ) {
    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        paymentType: data.paymentType,
        paymentProofUrl: data.paymentProofUrl,
        paymentDetails: data.paymentDetails,
      },
      include: {
        client: true,
        quotation: true,
      },
    });
  }

  /**
   * Verificar comprobante de pago (admin)
   */
  async verifyPaymentProof(
    contractId: string,
    verifiedBy: string,
    notes?: string,
  ) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
    });

    if (!contract) {
      throw new Error("Contract not found");
    }

    if (!contract.paymentProofUrl && !contract.paymentType) {
      throw new Error("No payment proof to verify");
    }

    // Agregar nota de verificación a paymentDetails
    const updatedDetails = {
      ...(contract.paymentDetails as any),
      verificationNotes: notes,
      verifiedAt: new Date(),
    };

    return prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        paymentVerifiedBy: verifiedBy,
        paymentVerifiedAt: new Date(),
        paymentDetails: updatedDetails,
      },
      include: {
        client: true,
        quotation: true,
      },
    });
  }

  /**
   * Solicitar firma digital del contrato (SignNow)
   */
  async requestSignature(contractId: string, signers: SignerInfo[]) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        businessUnit: true,
        tenant: true,
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (!contract.pdfUrl) {
      throw new Error("PDF must be generated before requesting signature");
    }

    // Verificar que el pago esté verificado si es requerido
    if (contract.paymentType && !contract.paymentVerifiedBy) {
      throw new Error(
        "Payment proof must be verified before requesting signature",
      );
    }

    // Resolver proveedor de firma digital
    const signatureProvider = await digitalSignatureResolver.resolveProvider(
      contract.businessUnitId,
    );

    // Crear solicitud de firma
    const request = await signatureProvider.createSignatureRequest({
      tenantId: contract.tenantId,
      businessUnitId: contract.businessUnitId,
      documentName: `Contrato ${contract.code}`,
      documentUrl: contract.pdfUrl,
      signers,
      message: `Por favor firme el contrato ${contract.code}`,
      expiresInDays: 30,
      metadata: {
        contractId: contract.id,
        clientId: contract.clientId,
      },
    });

    // Actualizar contrato
    await prisma.rentalContract.update({
      where: { id: contractId },
      data: {
        signatureRequestId: request.id,
        signatureStatus: "pending",
        signatureProvider: signatureProvider.name,
      },
    });

    return request;
  }

  /**
   * Obtener estado de firma digital
   */
  async getSignatureStatus(contractId: string) {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      select: {
        signatureRequestId: true,
        signatureStatus: true,
        signatureProvider: true,
        businessUnitId: true,
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    if (!contract.signatureRequestId) {
      return {
        status: "none",
        signers: [],
      };
    }

    // Resolver proveedor
    const signatureProvider = await digitalSignatureResolver.resolveProvider(
      contract.businessUnitId,
    );

    // Obtener estado desde el proveedor
    const statusInfo = await signatureProvider.getSignatureStatus(
      contract.signatureRequestId,
    );

    return {
      status: statusInfo.status,
      signers: statusInfo.signers,
      signedAt: statusInfo.signedAt,
      signedDocumentUrl: statusInfo.signedDocumentUrl,
    };
  }

  /**
   * Procesar webhook de firma completada
   */
  async handleSignatureCompleted(
    signatureRequestId: string,
    signedDocumentBuffer: Buffer,
  ): Promise<void> {
    const contract = await prisma.rentalContract.findFirst({
      where: { signatureRequestId },
    });

    if (!contract) {
      throw new Error(
        `Contract with signature request ${signatureRequestId} not found`,
      );
    }

    // Subir documento firmado a Azure Blob Storage
    const { azureBlobStorageService } =
      await import("@shared/storage/azure-blob-storage.service");

    const fileName = `contracts/${contract.code}-signed-${Date.now()}.pdf`;
    const uploadResult = await azureBlobStorageService.uploadFile({
      file: signedDocumentBuffer,
      fileName,
      contentType: "application/pdf",
      folder: "contracts",
      tenantId: contract.tenantId,
      businessUnitId: contract.businessUnitId,
    });

    // Actualizar contrato
    await prisma.rentalContract.update({
      where: { id: contract.id },
      data: {
        signatureStatus: "signed",
        signedPdfUrl: uploadResult.url,
      },
    });
  }

  /**
   * Obtener PDF del contrato (usando template v2.0 si está disponible)
   */
  async getContractPdf(contractId: string): Promise<Buffer> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        client: true,
        tenant: true,
        businessUnit: true,
        quotation: {
          include: {
            items: {
              include: { asset: true },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    // Si tiene templateId, intentar usar contract-template.service
    if (contract.templateId) {
      try {
        const { contractTemplateService } =
          await import("./contract-template.service");

        // Renderizar y generar PDF desde template v2.0
        const html = await contractTemplateService.renderContract({
          templateId: contract.templateId,
          contractId,
          tenantId: contract.tenantId,
        });

        const branding = await brandingService.getOrCreateDefault(
          contract.businessUnitId,
        );

        const brandingConfig: BrandingConfig = {
          logoUrl: branding.logoUrl || undefined,
          primaryColor: branding.primaryColor,
          secondaryColor: branding.secondaryColor,
          fontFamily: branding.fontFamily,
          contactInfo: branding.contactInfo,
          headerConfig: branding.headerConfig,
          footerConfig: branding.footerConfig,
        };

        const contactInfo = branding.contactInfo || {};
        const businessUnitInfo: BusinessUnitInfo = {
          name: contract.businessUnit.name,
          taxId: (contract.businessUnit.settings as any)?.taxId,
          email: contactInfo.email,
          phone: contactInfo.phone,
          address: contactInfo.address,
          website: contactInfo.website,
        };

        const styleBlocks = html.match(/<style[\s\S]*?<\/style>/gi) || [];
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
        const bodyContent = bodyMatch ? bodyMatch[1] : html;
        const contentWithStyles = `${styleBlocks.join("\n")}${bodyContent}`;

        const brandedHtml = buildDocument(
          brandingConfig,
          businessUnitInfo,
          contentWithStyles,
          "contract",
          `Contrato ${contract.code}`,
        );

        // Generar PDF
        const { pdfGeneratorService } =
          await import("@core/services/pdf-generator.service");
        return pdfGeneratorService.generatePDF(brandedHtml, { format: "A4" });
      } catch (error) {
        console.warn(
          "Failed to use contract template service, falling back to legacy:",
          error,
        );
      }
    }

    // Fallback: usar templateService legacy
    const { templateService } =
      await import("@shared/templates/template.service");
    return templateService
      .generateContractPDF(contractId)
      .then((result) => result.pdfBuffer);
  }
}

export const contractService = new ContractService();
