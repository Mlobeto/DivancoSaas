/**
 * AssetDocumentType Service
 *
 * Manages configurable document types per Business Unit
 * Examples: SOAT, Insurance, Technical Inspection, Certifications, Permits
 */

import { PrismaClient, AssetDocumentType } from "@prisma/client";

export interface CreateDocumentTypeDTO {
  code: string;
  name: string;
  description?: string;
  requiresExpiry: boolean;
  defaultAlertDays?: number;
  color?: string;
  icon?: string;
}

export interface UpdateDocumentTypeDTO {
  name?: string;
  description?: string;
  requiresExpiry?: boolean;
  defaultAlertDays?: number;
  color?: string;
  icon?: string;
}

export class DocumentTypeService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Create a new document type for a Business Unit
   */
  async createDocumentType(
    tenantId: string,
    businessUnitId: string,
    data: CreateDocumentTypeDTO,
  ): Promise<AssetDocumentType> {
    // Verify code is unique within BU
    const existing = await this.prisma.assetDocumentType.findFirst({
      where: {
        businessUnitId,
        code: data.code,
      },
    });

    if (existing) {
      throw new Error(
        `Document type with code "${data.code}" already exists in this Business Unit`,
      );
    }

    return this.prisma.assetDocumentType.create({
      data: {
        businessUnitId,
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        requiresExpiry: data.requiresExpiry,
        defaultAlertDays: data.defaultAlertDays || 30,
        color: data.color,
        icon: data.icon,
      },
    });
  }

  /**
   * List all document types for a Business Unit
   */
  async listDocumentTypes(
    tenantId: string,
    businessUnitId: string,
    filters?: {
      requiresExpiry?: boolean;
      search?: string;
    },
  ): Promise<AssetDocumentType[]> {
    return this.prisma.assetDocumentType.findMany({
      where: {
        businessUnitId,
        requiresExpiry: filters?.requiresExpiry,
        OR: filters?.search
          ? [
              { name: { contains: filters.search, mode: "insensitive" } },
              { code: { contains: filters.search, mode: "insensitive" } },
              {
                description: { contains: filters.search, mode: "insensitive" },
              },
            ]
          : undefined,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  /**
   * Get document type by ID
   */
  async getDocumentTypeById(
    tenantId: string,
    businessUnitId: string,
    documentTypeId: string,
  ): Promise<AssetDocumentType | null> {
    return this.prisma.assetDocumentType.findFirst({
      where: {
        id: documentTypeId,
        businessUnitId,
      },
    });
  }

  /**
   * Update document type
   */
  async updateDocumentType(
    tenantId: string,
    businessUnitId: string,
    documentTypeId: string,
    data: UpdateDocumentTypeDTO,
  ): Promise<AssetDocumentType> {
    const documentType = await this.getDocumentTypeById(
      tenantId,
      businessUnitId,
      documentTypeId,
    );

    if (!documentType) {
      throw new Error("Document type not found");
    }

    return this.prisma.assetDocumentType.update({
      where: { id: documentTypeId },
      data,
    });
  }

  /**
   * Delete document type (soft delete by checking usage)
   */
  async deleteDocumentType(
    tenantId: string,
    businessUnitId: string,
    documentTypeId: string,
  ): Promise<void> {
    const documentType = await this.getDocumentTypeById(
      tenantId,
      businessUnitId,
      documentTypeId,
    );

    if (!documentType) {
      throw new Error("Document type not found");
    }

    // Check if document type is in use
    const attachments = await this.prisma.assetAttachment.findFirst({
      where: {
        documentTypeId,
      },
    });

    if (attachments) {
      throw new Error(
        "Cannot delete document type because it is currently in use by attachments",
      );
    }

    await this.prisma.assetDocumentType.delete({
      where: { id: documentTypeId },
    });
  }

  /**
   * Get document types with usage statistics
   */
  async getDocumentTypeStats(
    tenantId: string,
    businessUnitId: string,
  ): Promise<
    Array<
      AssetDocumentType & { attachmentCount: number; expiringCount: number }
    >
  > {
    const documentTypes = await this.listDocumentTypes(
      tenantId,
      businessUnitId,
    );

    const stats = await Promise.all(
      documentTypes.map(async (docType) => {
        const attachmentCount = await this.prisma.assetAttachment.count({
          where: {
            documentTypeId: docType.id,
          },
        });

        const expiringCount = await this.prisma.assetAttachment.count({
          where: {
            documentTypeId: docType.id,
            status: "EXPIRING",
          },
        });

        return {
          ...docType,
          attachmentCount,
          expiringCount,
        };
      }),
    );

    return stats;
  }
}
