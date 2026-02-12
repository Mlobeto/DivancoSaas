import apiClient from "@/lib/api";
import type {
  Supply,
  CreateSupplyDTO,
  UpdateSupplyDTO,
  SupplyFilters,
  SupplyListResponse,
} from "../types/supply.types";

const BASE_URL = "/modules/purchases/supplies";

export const supplyService = {
  /**
   * Get all supplies for current BusinessUnit
   */
  async getAll(filters?: SupplyFilters): Promise<SupplyListResponse> {
    try {
      const params = new URLSearchParams();

      if (filters?.categoryId) params.append("categoryId", filters.categoryId);
      if (filters?.search) params.append("search", filters.search);
      if (filters?.isActive !== undefined)
        params.append("isActive", String(filters.isActive));
      if (filters?.lowStock) params.append("lowStock", "true");
      if (filters?.page) params.append("page", String(filters.page));
      if (filters?.limit) params.append("limit", String(filters.limit));

      const queryString = params.toString();
      const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

      const { data } = await apiClient.get<SupplyListResponse>(url);
      return data;
    } catch (error: any) {
      // Si el backend devolviera 404 por no tener supplies, devolvemos estructura vacía
      if (error?.response?.status === 404) {
        return {
          success: true,
          data: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
        };
      }
      throw error;
    }
  },

  /**
   * Get supply by ID
   */
  async getById(id: string): Promise<Supply> {
    const { data } = await apiClient.get<{
      success: boolean;
      data: Supply;
    }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  /**
   * Create new supply
   */
  async create(dto: CreateSupplyDTO): Promise<Supply> {
    const { data } = await apiClient.post<{
      success: boolean;
      data: Supply;
    }>(BASE_URL, dto);
    return data.data;
  },

  /**
   * Update existing supply
   */
  async update(id: string, dto: UpdateSupplyDTO): Promise<Supply> {
    const { data } = await apiClient.patch<{
      success: boolean;
      data: Supply;
    }>(`${BASE_URL}/${id}`, dto);
    return data.data;
  },

  /**
   * Delete supply
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Toggle supply active status
   */
  async toggleActive(id: string): Promise<Supply> {
    const { data } = await apiClient.patch<{
      success: boolean;
      data: Supply;
    }>(`${BASE_URL}/${id}/toggle-active`);
    return data.data;
  },

  /**
   * Adjust stock manually
   */
  async adjustStock(
    id: string,
    adjustment: number,
    reason: string,
  ): Promise<Supply> {
    const { data } = await apiClient.post<{
      success: boolean;
      data: Supply;
    }>(`${BASE_URL}/${id}/adjust-stock`, {
      adjustment,
      reason,
    });
    return data.data;
  },

  /**
   * Import supplies from CSV file
   */
  async importCSV(file: File): Promise<{
    success: boolean;
    created: number;
    errors: Array<{ row: number; error: string; data?: any }>;
    summary: string;
  }> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await apiClient.post(`${BASE_URL}/import`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  },
};
