import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";

export interface Asset {
  id: string;
  tenantId: string;
  businessUnitId: string;
  templateId?: string;
  code: string;
  name: string;
  assetType: string;
  acquisitionCost?: number;
  origin?: string;
  currentLocation?: string;
  imageUrl?: string;
  customData?: any;
  requiresOperator: boolean;
  requiresTracking: boolean;
  requiresClinic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetData {
  templateId?: string;
  code: string;
  name: string;
  assetType: string;
  acquisitionCost?: number;
  origin?: string;
  currentLocation?: string;
  customData?: any;
  requiresOperator?: boolean;
  requiresTracking?: boolean;
  requiresClinic?: boolean;
}

export type UpdateAssetData = Partial<CreateAssetData>;

export interface AssetAttachment {
  id: string;
  assetId: string;
  documentTypeId?: string;
  type: string;
  url: string;
  fileName: string;
  source: string;
  issueDate?: string;
  expiryDate?: string;
  alertDays?: number;
  status: "ACTIVE" | "EXPIRING" | "EXPIRED" | "ARCHIVED";
  notes?: string;
  lastAlertSent?: string;
  createdAt: string;
}

export interface UploadAssetImageResponse {
  asset: Asset;
  imageUrl: string;
}

export interface UploadAttachmentsResponse {
  data: AssetAttachment[];
  message: string;
}

export interface UploadAttachmentsData {
  files: File[];
  documentTypeId?: string;
  issueDate?: string;
  expiryDate?: string;
  alertDays?: number;
  notes?: string;
  source?: string;
}

export const assetsService = {
  /**
   * List assets
   */
  async list(): Promise<Asset[]> {
    const response = await api.get<ApiResponse<Asset[]>>(
      "/modules/assets/assets",
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to fetch assets");
    }

    return response.data.data!;
  },

  /**
   * Get next available code for asset type
   */
  async getNextCode(assetType: string): Promise<string> {
    const response = await api.get<ApiResponse<{ code: string }>>(
      `/modules/assets/assets/next-code?assetType=${assetType}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch next code",
      );
    }

    return response.data.data!.code;
  },

  /**
   * Get asset by ID
   */
  async getById(id: string): Promise<Asset> {
    const response = await api.get<ApiResponse<Asset>>(
      `/modules/assets/assets/${id}`,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Asset not found");
    }

    return response.data.data!;
  },

  /**
   * Create new asset
   */
  async create(data: CreateAssetData): Promise<Asset> {
    const response = await api.post<ApiResponse<Asset>>(
      "/modules/assets/assets",
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to create asset");
    }

    return response.data.data!;
  },

  /**
   * Update asset
   */
  async update(id: string, data: UpdateAssetData): Promise<Asset> {
    const response = await api.patch<ApiResponse<Asset>>(
      `/modules/assets/assets/${id}`,
      data,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to update asset");
    }

    return response.data.data!;
  },

  /**
   * Upload main image for asset
   */
  async uploadMainImage(
    assetId: string,
    file: File,
  ): Promise<UploadAssetImageResponse> {
    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post<ApiResponse<UploadAssetImageResponse>>(
      `/modules/assets/assets/${assetId}/image`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to upload image");
    }

    return response.data.data!;
  },

  /**
   * Delete main image from asset
   */
  async deleteMainImage(assetId: string): Promise<Asset> {
    const response = await api.delete<ApiResponse<Asset>>(
      `/modules/assets/assets/${assetId}/image`,
    );

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to delete image");
    }

    return response.data.data!;
  },

  /**
   * Upload multiple attachments (documents/photos)
   */
  async uploadAttachments(
    assetId: string,
    data: UploadAttachmentsData,
  ): Promise<AssetAttachment[]> {
    const formData = new FormData();

    // Append files
    data.files.forEach((file) => {
      formData.append("files", file);
    });

    // Append metadata
    if (data.documentTypeId) {
      formData.append("documentTypeId", data.documentTypeId);
    }
    if (data.issueDate) {
      formData.append("issueDate", data.issueDate);
    }
    if (data.expiryDate) {
      formData.append("expiryDate", data.expiryDate);
    }
    if (data.alertDays) {
      formData.append("alertDays", data.alertDays.toString());
    }
    if (data.notes) {
      formData.append("notes", data.notes);
    }
    if (data.source) {
      formData.append("source", data.source);
    }

    const response = await api.post<ApiResponse<AssetAttachment[]>>(
      `/modules/assets/assets/${assetId}/attachments`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to upload attachments",
      );
    }

    return response.data.data!;
  },

  /**
   * List attachments for asset
   */
  async listAttachments(assetId: string): Promise<AssetAttachment[]> {
    const response = await api.get<ApiResponse<AssetAttachment[]>>(
      `/modules/assets/attachments`,
      {
        params: { assetId },
      },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch attachments",
      );
    }

    return response.data.data!;
  },

  /**
   * Delete attachment
   */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(
      `/modules/assets/attachments/${attachmentId}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to delete attachment",
      );
    }
  },

  /**
   * Import assets from CSV file
   */
  async importCSV(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<ApiResponse<ImportResult>>(
      "/modules/assets/assets/import",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to import assets from CSV",
      );
    }

    return response.data.data!;
  },
};

export interface ImportResult {
  success: boolean;
  created: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
  summary: string;
}
