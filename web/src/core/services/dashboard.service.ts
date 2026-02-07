import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";

export interface TenantStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalBusinessUnits: number;
    activeModules: number;
  };
  recentActivity: {
    eventCount: number;
    pendingEvents: number;
    failedEvents: number;
  };
}

export interface BusinessUnitStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalBusinessUnits: number;
    activeModules: number;
  };
  equipment?: {
    total: number;
    available: number;
    rented: number;
    maintenance: number;
    outOfService: number;
  };
  recentActivity: {
    eventCount: number;
    pendingEvents: number;
    failedEvents: number;
  };
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
  async getTenantStats(): Promise<TenantStats> {
    const response = await api.get<ApiResponse<TenantStats>>(
      `/dashboard/tenant/stats`,
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

  async getRecentActivity(limit = 10): Promise<ActivityLog[]> {
    const response = await api.get<ApiResponse<ActivityLog[]>>(
      `/dashboard/activity`,
      {
        params: { limit },
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
