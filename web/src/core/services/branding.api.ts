/**
 * Branding API Client
 * API client for Business Unit branding configuration
 */

import api from "@/lib/api";
import type {
  BusinessUnitBranding,
  CreateBrandingDTO,
  UpdateBrandingDTO,
  PreviewOptions,
} from "../types/branding.types";

export const brandingApi = {
  /**
   * Get branding configuration for a business unit
   */
  async get(businessUnitId: string): Promise<BusinessUnitBranding> {
    const response = await api.get<{
      success: boolean;
      data: BusinessUnitBranding;
    }>(`/branding/${businessUnitId}`);
    return response.data.data;
  },

  /**
   * Create branding configuration
   */
  async create(data: CreateBrandingDTO): Promise<BusinessUnitBranding> {
    const response = await api.post<{
      success: boolean;
      data: BusinessUnitBranding;
    }>("/branding", data);
    return response.data.data;
  },

  /**
   * Update branding configuration
   */
  async update(
    businessUnitId: string,
    data: UpdateBrandingDTO,
  ): Promise<BusinessUnitBranding> {
    const response = await api.put<{
      success: boolean;
      data: BusinessUnitBranding;
    }>(`/branding/${businessUnitId}`, data);
    return response.data.data;
  },

  /**
   * Delete branding configuration
   */
  async delete(businessUnitId: string): Promise<void> {
    await api.delete(`/branding/${businessUnitId}`);
  },

  /**
   * Generate preview PDF with current branding
   */
  async preview(
    businessUnitId: string,
    options: PreviewOptions = {},
  ): Promise<Blob> {
    const response = await api.post(
      `/branding/${businessUnitId}/preview`,
      options,
      {
        responseType: "blob",
        headers: {
          Accept: "application/pdf",
        },
      },
    );

    console.log("[brandingApi] Response headers:", response.headers);
    console.log("[brandingApi] Response data type:", typeof response.data);
    console.log(
      "[brandingApi] Response data size:",
      response.data?.size || response.data?.length,
    );

    return response.data;
  },

  /**
   * Get test HTML (for development/debugging)
   */
  async getTestHTML(
    businessUnitId: string,
    options: { documentType?: string; sampleData?: any } = {},
  ): Promise<string> {
    const response = await api.post<{ success: boolean; html: string }>(
      `/branding/${businessUnitId}/test-html`,
      options,
    );
    return response.data.html;
  },

  /**
   * Upload logo for business unit branding
   */
  async uploadLogo(
    businessUnitId: string,
    file: File,
  ): Promise<{ logoUrl: string; blobName: string; size: number }> {
    const formData = new FormData();
    formData.append("logo", file);

    const response = await api.post<{
      success: boolean;
      data: { logoUrl: string; blobName: string; size: number };
    }>(`/branding/${businessUnitId}/upload-logo`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.data;
  },
};
