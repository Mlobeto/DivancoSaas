/**
 * Attachment Service
 *
 * Manages asset file attachments (photos, PDFs, documents with expiry)
 */

import {
  PrismaClient,
  AssetAttachment,
  AttachmentStatus,
} from "@prisma/client";
import { CreateAttachmentDTO, AttachmentFilters } from "../types/asset.types";

export class AttachmentService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create attachment
   */
  async createAttachment(
    tenantId: string,
    businessUnitId: string,
    data: CreateAttachmentDTO,
  ): Promise<AssetAttachment> {
    // Verify asset exists and belongs to tenant/BU
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: data.assetId,
        tenantId,
        businessUnitId,
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    const attachment = await this.prisma.assetAttachment.create({
      data: {
        assetId: data.assetId,
        type: data.type,
        url: data.url,
        source: data.source,
      },
    });

    // Emit attachment event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "attachment.added",
        source: data.source,
        payload: {
          attachmentId: attachment.id,
          type: attachment.type,
          url: attachment.url,
        },
      },
    });

    return attachment;
  }

  /**
   * Get attachment by ID
   */
  async getAttachmentById(
    tenantId: string,
    businessUnitId: string,
    attachmentId: string,
  ): Promise<AssetAttachment | null> {
    const attachment = await this.prisma.assetAttachment.findUnique({
      where: { id: attachmentId },
      include: { asset: true },
    });

    // Verify tenant/BU access
    if (
      attachment &&
      (attachment.asset.tenantId !== tenantId ||
        attachment.asset.businessUnitId !== businessUnitId)
    ) {
      return null;
    }

    return attachment;
  }

  /**
   * List attachments for an asset
   */
  async listAttachments(
    tenantId: string,
    businessUnitId: string,
    filters: AttachmentFilters,
  ): Promise<AssetAttachment[]> {
    // Verify asset exists and belongs to tenant/BU
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: filters.assetId,
        tenantId,
        businessUnitId,
      },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    return this.prisma.assetAttachment.findMany({
      where: {
        assetId: filters.assetId,
        ...(filters.type && { type: filters.type }),
        ...(filters.source && { source: filters.source }),
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Delete attachment
   */
  async deleteAttachment(
    tenantId: string,
    businessUnitId: string,
    attachmentId: string,
  ): Promise<void> {
    const attachment = await this.getAttachmentById(
      tenantId,
      businessUnitId,
      attachmentId,
    );

    if (!attachment) {
      throw new Error("Attachment not found");
    }

    await this.prisma.assetAttachment.delete({
      where: { id: attachmentId },
    });

    // Emit deletion event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: attachment.assetId,
        eventType: "attachment.deleted",
        source: "system",
        payload: { attachmentId },
      },
    });
  }

  /**
   * Create attachment with file upload metadata
   */
  async createAttachmentWithFile(
    tenantId: string,
    businessUnitId: string,
    assetId: string,
    fileData: {
      type: string;
      url: string;
      fileName: string;
      source: string;
      documentTypeId?: string;
      issueDate?: Date;
      expiryDate?: Date;
      alertDays?: number;
      notes?: string;
    },
  ): Promise<AssetAttachment> {
    // Verify asset exists
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, tenantId, businessUnitId },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // Determinar status inicial
    let status: AttachmentStatus = "ACTIVE";
    if (fileData.expiryDate) {
      const daysUntilExpiry = Math.ceil(
        (fileData.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );
      const alertThreshold = fileData.alertDays || 30;

      if (daysUntilExpiry < 0) {
        status = "EXPIRED";
      } else if (daysUntilExpiry <= alertThreshold) {
        status = "EXPIRING";
      }
    }

    const attachment = await this.prisma.assetAttachment.create({
      data: {
        assetId,
        type: fileData.type,
        url: fileData.url,
        fileName: fileData.fileName,
        source: fileData.source,
        documentTypeId: fileData.documentTypeId,
        issueDate: fileData.issueDate,
        expiryDate: fileData.expiryDate,
        alertDays: fileData.alertDays,
        status,
        notes: fileData.notes,
      },
      include: {
        documentType: true,
      },
    });

    // Emit event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId,
        eventType: fileData.documentTypeId
          ? "document.uploaded"
          : "attachment.added",
        source: fileData.source,
        payload: {
          attachmentId: attachment.id,
          type: attachment.type,
          fileName: attachment.fileName,
          hasExpiry: !!fileData.expiryDate,
          status,
        },
      },
    });

    return attachment;
  }

  /**
   * Update document status (called by cron job)
   */
  async updateDocumentStatus(attachmentId: string): Promise<AssetAttachment> {
    const attachment = await this.prisma.assetAttachment.findUnique({
      where: { id: attachmentId },
      include: { asset: true },
    });

    if (!attachment || !attachment.expiryDate) {
      throw new Error("Document not found or has no expiry date");
    }

    const daysUntilExpiry = Math.ceil(
      (attachment.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    const alertThreshold = attachment.alertDays || 30;

    let newStatus: AttachmentStatus = "ACTIVE";
    if (daysUntilExpiry < 0) {
      newStatus = "EXPIRED";
    } else if (daysUntilExpiry <= alertThreshold) {
      newStatus = "EXPIRING";
    }

    // Solo actualizar si cambió el status
    if (newStatus !== attachment.status) {
      return this.prisma.assetAttachment.update({
        where: { id: attachmentId },
        data: { status: newStatus },
      });
    }

    return attachment;
  }

  /**
   * Get expiring or expired documents
   */
  async getExpiringDocuments(
    tenantId: string,
    businessUnitId: string,
    daysAhead: number = 30,
  ): Promise<AssetAttachment[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    return this.prisma.assetAttachment.findMany({
      where: {
        asset: {
          tenantId,
          businessUnitId,
        },
        expiryDate: {
          lte: futureDate,
          gte: new Date(), // No incluir ya vencidos
        },
        status: {
          in: ["ACTIVE", "EXPIRING"],
        },
      },
      include: {
        asset: true,
        documentType: true,
      },
      orderBy: {
        expiryDate: "asc",
      },
    });
  }

  /**
   * Archive document (when replacing with new version)
   */
  async archiveDocument(
    tenantId: string,
    businessUnitId: string,
    attachmentId: string,
  ): Promise<AssetAttachment> {
    const attachment = await this.getAttachmentById(
      tenantId,
      businessUnitId,
      attachmentId,
    );

    if (!attachment) {
      throw new Error("Attachment not found");
    }

    return this.prisma.assetAttachment.update({
      where: { id: attachmentId },
      data: { status: "ARCHIVED" },
    });
  }
}
