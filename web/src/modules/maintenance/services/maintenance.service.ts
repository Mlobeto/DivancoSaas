import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface MaintenanceAsset {
  id: string;
  code: string;
  name: string;
  assetType: string;
  imageUrl?: string;
  currentLocation?: string;
  updatedAt: string;
  state?: {
    currentState: string;
    updatedAt: string;
  };
  maintenanceEvents?: Array<{
    id: string;
    type: string;
    context: string;
    notes?: string;
    createdAt: string;
  }>;
  assetRentals?: Array<{
    actualReturnDate?: string;
    contract?: { client?: { name: string } };
  }>;
  preventiveConfigs?: Array<{
    id: string;
    intervalHours?: number;
  }> | null;
}

export interface MaintenanceDashboard {
  pendingMaintenance: MaintenanceAsset[];
  inMaintenance: MaintenanceAsset[];
  outOfService: MaintenanceAsset[];
  completedThisMonth: number;
  summary: {
    totalPending: number;
    totalInMaintenance: number;
    totalOutOfService: number;
    completedThisMonth: number;
  };
}

export interface MaintenanceHistory {
  id: string;
  type: string;
  context: string;
  notes?: string;
  suppliesUsed?: Array<{ supplyId: string; quantity: number }>;
  evidenceUrls?: string[];
  createdAt: string;
}

export interface Supply {
  id: string;
  code: string;
  name: string;
  unit: string;
  stock: number;
  minStock?: number;
}

export interface PostObraPayload {
  assetId: string;
  notes?: string;
  suppliesUsed: Array<{ supplyId: string; quantity: number }>;
  evidenceUrls?: string[];
  contractId?: string; // Contrato al que se carga
  chargedTo?: "CLIENT" | "BUSINESS"; // Por defecto CLIENT
  costAmount?: number; // Costo estimado del mantenimiento
}

export interface PreventivePayload {
  assetId: string;
  context?: "OBRA" | "TALLER";
  notes?: string;
  suppliesUsed: Array<{ supplyId: string; quantity: number }>;
  evidenceUrls?: string[];
}

export interface StartMaintenancePayload {
  assetId: string;
  notes?: string;
}

export interface DecommissionPayload {
  assetId: string;
  reason: string;
  notes?: string;
}

export interface LastRentalInfo {
  id: string;
  contractId: string;
  actualReturnDate: string;
  contract: {
    id: string;
    code: string;
    clientId: string;
    client: { name: string };
  };
}

// ─── Service ─────────────────────────────────────────────────────────────────

class MaintenanceService {
  /** GET /modules/assets/maintenance/dashboard */
  async getDashboard(): Promise<MaintenanceDashboard> {
    const res = await api.get<ApiResponse<MaintenanceDashboard>>(
      "/modules/assets/maintenance/dashboard",
    );
    if (!res.data.data) throw new Error("No dashboard data");
    return res.data.data;
  }

  /** GET /modules/assets/assets/:assetId/last-rental */
  async getLastRental(assetId: string): Promise<LastRentalInfo | null> {
    const res = await api.get<ApiResponse<LastRentalInfo | null>>(
      `/modules/assets/assets/${assetId}/last-rental`,
    );
    return res.data.data ?? null;
  }

  /** GET /modules/assets/assets/:assetId/maintenance/history */
  async getMaintenanceHistory(assetId: string): Promise<MaintenanceHistory[]> {
    const res = await api.get<ApiResponse<MaintenanceHistory[]>>(
      `/modules/assets/assets/${assetId}/maintenance/history`,
    );
    return res.data.data ?? [];
  }

  /** POST /modules/assets/assets/:assetId/maintenance/evidence */
  async uploadEvidence(assetId: string, files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((f) => formData.append("evidence", f));
    const res = await api.post<ApiResponse<{ evidenceUrls: string[] }>>(
      `/modules/assets/assets/${assetId}/maintenance/evidence`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data?.evidenceUrls ?? [];
  }

  /** POST /modules/assets/assets/:assetId/maintenance/post-obra */
  async executePostObra(payload: PostObraPayload): Promise<void> {
    await api.post(
      `/modules/assets/assets/${payload.assetId}/maintenance/post-obra`,
      {
        notes: payload.notes,
        suppliesUsed: payload.suppliesUsed,
        evidenceUrls: payload.evidenceUrls,
        contractId: payload.contractId,
        chargedTo: payload.chargedTo ?? "CLIENT",
        costAmount: payload.costAmount,
      },
    );
  }

  /** POST /modules/assets/assets/:assetId/decommission */
  async decommissionAsset(payload: DecommissionPayload): Promise<void> {
    await api.post(`/modules/assets/assets/${payload.assetId}/decommission`, {
      reason: payload.reason,
      notes: payload.notes,
    });
  }

  /** GET /modules/assets/supplies */
  async listSupplies(): Promise<Supply[]> {
    const res = await api.get<ApiResponse<Supply[]>>(
      "/modules/assets/supplies",
    );
    return res.data.data ?? [];
  }
}

export const maintenanceService = new MaintenanceService();
