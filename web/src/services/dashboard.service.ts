import api from "@/lib/api";
import type { ApiResponse } from "@/types/api.types";

export interface TenantStats {
  businessUnitsCount: number;
  usersCount: number;
  activeModulesCount: number;
}

export interface BusinessUnitStats {
  usersCount: number;
  activeModules: Array<{
    moduleId: string;
    moduleName: string;
    displayName: string;
  }>;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userName: string;
  timestamp: string;
}

export const dashboardService = {
  async getTenantStats(tenantId: string): Promise<TenantStats> {
    const response = await api.get<ApiResponse<TenantStats>>(
      `/dashboard/tenant/${tenantId}/stats`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch tenant stats",
      );
    }

    return response.data.data!;
  },

  async getBusinessUnitStats(
    businessUnitId: string,
  ): Promise<BusinessUnitStats> {
    const response = await api.get<ApiResponse<BusinessUnitStats>>(
      `/dashboard/business-unit/${businessUnitId}/stats`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch business unit stats",
      );
    }

    return response.data.data!;
  },

  async getRecentActivity(
    tenantId: string,
    limit = 10,
  ): Promise<ActivityLog[]> {
    const response = await api.get<ApiResponse<ActivityLog[]>>(
      `/dashboard/activity`,
      {
        params: { tenantId, limit },
      },
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch activity",
      );
    }

    return response.data.data!;
  },
};
