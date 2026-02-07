import api from "@/lib/api";
import type { ApiResponse, PaginatedResponse } from "@/core/types/api.types";

export interface Machinery {
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

export interface MachineryFilters {
  q?: string;
  status?: Machinery["status"];
  condition?: Machinery["condition"];
  category?: string;
  page?: number;
  limit?: number;
}

export interface CreateMachineryData {
  code: string;
  name: string;
  category: string;
  description?: string;
  specifications?: any;
  dailyRate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  status?: Machinery["status"];
  condition?: Machinery["condition"];
}

export type UpdateMachineryData = Partial<CreateMachineryData>;

export const machineryService = {
  async list(
    filters: MachineryFilters = {},
  ): Promise<PaginatedResponse<Machinery>> {
    const response = await api.get<
      ApiResponse<Machinery[]> & PaginatedResponse<Machinery>
    >("/equipment", { params: filters });

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch machinery",
      );
    }

    return {
      data: response.data.data!,
      pagination: response.data.pagination!,
    };
  },

  async getById(id: string): Promise<Machinery> {
    const response = await api.get<ApiResponse<Machinery>>(`/equipment/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Machinery not found");
    }

    return response.data.data!;
  },

  async create(data: CreateMachineryData): Promise<Machinery> {
    const response = await api.post<ApiResponse<Machinery>>("/equipment", data);

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to create machinery",
      );
    }

    return response.data.data!;
  },

  async update(id: string, data: UpdateMachineryData): Promise<Machinery> {
    const response = await api.put<ApiResponse<Machinery>>(
      `/equipment/${id}`,
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to update machinery",
      );
    }

    return response.data.data!;
  },

  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/equipment/${id}`);

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to delete machinery",
      );
    }
  },
};
