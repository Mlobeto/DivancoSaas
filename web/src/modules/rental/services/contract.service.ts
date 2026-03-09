/**
 * CONTRACT SERVICE (Frontend)
 * Servicio para gestión de contratos de renta
 */

import apiClient from "@/lib/api";

export interface RentalContract {
  id: string;
  code: string;
  tenantId: string;
  businessUnitId: string;
  quotationId?: string;
  clientId: string;
  status: "active" | "suspended" | "completed" | "cancelled";

  startDate: string;
  estimatedEndDate?: string;
  actualEndDate?: string;

  totalConsumed: number;
  estimatedTotal?: number;
  currency: string;

  pdfUrl?: string;
  signedPdfUrl?: string;
  receiptToken?: string;
  receiptUploadedAt?: string;

  notes?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Relaciones
  client?: {
    id: string;
    name: string;
    businessName: string;
    email?: string;
    phone?: string;
  };
  clientAccount?: {
    id: string;
    balance: number;
    balanceLimit: number;
    timeLimit: number;
  };
  activeRentals?: Array<{
    id: string;
    asset?: { id: string; name: string; internalCode?: string };
  }>;
}

const BASE = "/rental";

export const contractService = {
  /**
   * Listar contratos con filtros opcionales
   */
  async list(
    filters: {
      status?: string;
      clientId?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{ data: RentalContract[] }> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.clientId) params.append("clientId", filters.clientId);
    if (filters.page) params.append("page", String(filters.page));
    if (filters.limit) params.append("limit", String(filters.limit));

    const res = await apiClient.get(`${BASE}/contracts?${params}`);
    // El backend devuelve { success, data: [...] }
    return { data: res.data.data ?? res.data };
  },

  /**
   * Obtener contrato por ID
   */
  async getById(id: string): Promise<RentalContract> {
    const res = await apiClient.get(`${BASE}/contracts/${id}`);
    return res.data.data ?? res.data;
  },

  /**
   * Completar contrato (finalizar)
   */
  async complete(id: string): Promise<RentalContract> {
    const res = await apiClient.post(`${BASE}/contracts/${id}/complete`);
    return res.data.data ?? res.data;
  },

  /**
   * Suspender contrato
   */
  async suspend(id: string, reason?: string): Promise<RentalContract> {
    const res = await apiClient.post(`${BASE}/contracts/${id}/suspend`, {
      reason,
    });
    return res.data.data ?? res.data;
  },

  /**
   * Reactivar contrato suspendido
   */
  async reactivate(id: string): Promise<RentalContract> {
    const res = await apiClient.post(`${BASE}/contracts/${id}/reactivate`);
    return res.data.data ?? res.data;
  },
};
