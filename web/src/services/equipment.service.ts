import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/types/api.types";

export interface Equipment {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  category: string;
  description?: string;
  specifications?: any;
  dailyRate: number;
  weeklyRate: number;
  monthlyRate: number;
  status:
    | "AVAILABLE"
    | "RENTED"
    | "MAINTENANCE"
    | "OUT_OF_SERVICE"
    | "RESERVED";
  condition: "EXCELLENT" | "GOOD" | "FAIR" | "POOR";
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentFilters {
  q?: string;
  status?: Equipment["status"];
  condition?: Equipment["condition"];
  category?: string;
  page?: number;
  limit?: number;
}

export interface CreateEquipmentData {
  code: string;
  name: string;
  category: string;
  description?: string;
  specifications?: any;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  status?: Equipment["status"];
  condition?: Equipment["condition"];
}

export type UpdateEquipmentData = Partial<CreateEquipmentData>;

export const equipmentService = {
  async list(
    filters: EquipmentFilters = {},
  ): Promise<PaginatedResponse<Equipment>> {
    const response = await api.get<
      ApiResponse<Equipment[]> & PaginatedResponse<Equipment>
    >("/equipment", { params: filters });

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch equipment",
      );
    }

    return {
      data: response.data.data!,
      pagination: response.data.pagination!,
    };
  },

  async getById(id: string): Promise<Equipment> {
    const response = await api.get<ApiResponse<Equipment>>(`/equipment/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Equipment not found");
    }

    return response.data.data!;
  },

  async create(data: CreateEquipmentData): Promise<Equipment> {
    const response = await api.post<ApiResponse<Equipment>>("/equipment", data);

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to create equipment",
      );
    }

    return response.data.data!;
  },

  async update(id: string, data: UpdateEquipmentData): Promise<Equipment> {
    const response = await api.put<ApiResponse<Equipment>>(
      `/equipment/${id}`,
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to update equipment",
      );
    }

    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/equipment/${id}`);

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to delete equipment",
      );
    }
  },
};
