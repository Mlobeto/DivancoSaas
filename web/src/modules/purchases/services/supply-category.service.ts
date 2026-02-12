import apiClient from "@/lib/api";
import type {
  SupplyCategory,
  CreateSupplyCategoryDto,
  UpdateSupplyCategoryDto,
} from "../types/supply-category.types";

const BASE_URL = "/modules/purchases/supply-categories";

export const supplyCategoryService = {
  /**
   * Get all categories for current BusinessUnit
   */
  async getAll(): Promise<SupplyCategory[]> {
    try {
      const { data } = await apiClient.get<{
        success: boolean;
        data: SupplyCategory[];
      }>(BASE_URL);
      return data.data ?? [];
    } catch (error: any) {
      // Si el backend devolviera 404 por no tener categorías, devolvemos []
      if (error?.response?.status === 404) {
        return [];
      }
      throw error;
    }
  },

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<SupplyCategory> {
    const { data } = await apiClient.get<{
      success: boolean;
      data: SupplyCategory;
    }>(`${BASE_URL}/${id}`);
    return data.data;
  },

  /**
   * Create new category
   */
  async create(dto: CreateSupplyCategoryDto): Promise<SupplyCategory> {
    const { data } = await apiClient.post<{
      success: boolean;
      data: SupplyCategory;
    }>(BASE_URL, dto);
    return data.data;
  },

  /**
   * Update existing category
   */
  async update(
    id: string,
    dto: UpdateSupplyCategoryDto,
  ): Promise<SupplyCategory> {
    const { data } = await apiClient.put<{
      success: boolean;
      data: SupplyCategory;
    }>(`${BASE_URL}/${id}`, dto);
    return data.data;
  },

  /**
   * Delete category
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Toggle category active status
   */
  async toggleActive(id: string): Promise<SupplyCategory> {
    const { data } = await apiClient.patch<{
      success: boolean;
      data: SupplyCategory;
    }>(`${BASE_URL}/${id}/toggle-active`);
    return data.data;
  },

  /**
   * Import categories from CSV file
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
