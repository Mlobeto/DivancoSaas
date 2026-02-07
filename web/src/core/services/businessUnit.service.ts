import api from "@/lib/api";
import type { ApiResponse, BusinessUnit } from "@/core/types/api.types";

export interface CreateBusinessUnitData {
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
}

export type UpdateBusinessUnitData = Partial<
  Omit<CreateBusinessUnitData, "tenantId">
>;

export const businessUnitService = {
  /**
   * Lista todas las Business Units de un tenant
   */
  async list(tenantId: string): Promise<BusinessUnit[]> {
    const response = await api.get<ApiResponse<BusinessUnit[]>>(
      `/business-units`,
      { params: { tenantId } },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch business units",
      );
    }

    return response.data.data || [];
  },

  /**
   * Obtiene una Business Unit por ID
   */
  async getById(businessUnitId: string): Promise<BusinessUnit> {
    const response = await api.get<ApiResponse<BusinessUnit>>(
      `/business-units/${businessUnitId}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Business unit not found",
      );
    }

    return response.data.data!;
  },

  /**
   * Crea una nueva Business Unit
   */
  async create(data: CreateBusinessUnitData): Promise<BusinessUnit> {
    const response = await api.post<ApiResponse<BusinessUnit>>(
      "/business-units",
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to create business unit",
      );
    }

    return response.data.data!;
  },

  /**
   * Actualiza una Business Unit
   */
  async update(
    businessUnitId: string,
    data: UpdateBusinessUnitData,
  ): Promise<BusinessUnit> {
    const response = await api.put<ApiResponse<BusinessUnit>>(
      `/business-units/${businessUnitId}`,
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to update business unit",
      );
    }

    return response.data.data!;
  },

  /**
   * Elimina una Business Unit (y todos sus datos)
   */
  async delete(businessUnitId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(
      `/business-units/${businessUnitId}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to delete business unit",
      );
    }
  },

  /**
   * Obtiene las Business Units del usuario actual (con sus roles)
   */
  async getMyBusinessUnits(): Promise<BusinessUnit[]> {
    const response =
      await api.get<ApiResponse<BusinessUnit[]>>("/business-units/my");

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch user business units",
      );
    }

    return response.data.data || [];
  },
};
