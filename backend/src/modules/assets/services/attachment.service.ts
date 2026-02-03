/**
 * Attachment Service
 *
 * Manages asset file attachments (photos, PDFs, etc)
 */

import { PrismaClient, AssetAttachment } from "@prisma/client";
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
}
