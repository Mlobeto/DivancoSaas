import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";

export interface AssetDocumentType {
  id: string;
  businessUnitId: string;
  code: string;
  name: string;
  description?: string;
  requiresExpiry: boolean;
  defaultAlertDays: number;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
  // Stats (only when requested with ?stats=true)
  attachmentCount?: number;
  expiringCount?: number;
}

export interface CreateDocumentTypeData {
  code: string;
  name: string;
  description?: string;
  requiresExpiry: boolean;
  defaultAlertDays?: number;
  color?: string;
  icon?: string;
}

export type UpdateDocumentTypeData = Partial<
  Omit<CreateDocumentTypeData, "code">
>;

export interface DocumentTypeFilters {
  requiresExpiry?: boolean;
  search?: string;
  stats?: boolean;
}

export const documentTypesService = {
  /**
   * List all document types for current Business Unit
   */
  async list(filters: DocumentTypeFilters = {}): Promise<AssetDocumentType[]> {
    const response = await api.get<ApiResponse<AssetDocumentType[]>>(
      "/modules/assets/document-types",
      { params: filters },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch document types",
      );
    }

    return response.data.data!;
  },

  /**
   * Get document type by ID
   */
  async getById(id: string): Promise<AssetDocumentType> {
    const response = await api.get<ApiResponse<AssetDocumentType>>(
      `/modules/assets/document-types/${id}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Document type not found",
      );
    }

    return response.data.data!;
  },

  /**
   * Create new document type
   */
  async create(data: CreateDocumentTypeData): Promise<AssetDocumentType> {
    const response = await api.post<ApiResponse<AssetDocumentType>>(
      "/modules/assets/document-types",
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to create document type",
      );
    }

    return response.data.data!;
  },

  /**
   * Update document type
   */
  async update(
    id: string,
    data: UpdateDocumentTypeData,
  ): Promise<AssetDocumentType> {
    const response = await api.patch<ApiResponse<AssetDocumentType>>(
      `/modules/assets/document-types/${id}`,
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to update document type",
      );
    }

    return response.data.data!;
  },

  /**
   * Delete document type
   */
  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(
      `/modules/assets/document-types/${id}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to delete document type",
      );
    }
  },

  /**
   * Get document types with usage statistics
   */
  async listWithStats(): Promise<AssetDocumentType[]> {
    return this.list({ stats: true });
  },
};
