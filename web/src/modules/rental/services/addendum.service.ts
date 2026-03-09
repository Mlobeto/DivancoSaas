/**
 * ADDENDUM SERVICE (Frontend)
 * Servicio para gestión de addendums de contratos master
 */

import apiClient from "@/lib/api";

export interface AddendumItem {
  id: string;
  addendumId: string;
  assetRentalId: string;
  assetId: string;
  quantity: number;
  expectedReturnDate?: string;
  estimatedDailyRate?: number;
  estimatedHourlyRate?: number;
  operatorId?: string;
  initialHourometer?: number;
  initialOdometer?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;

  // Relaciones
  asset?: {
    id: string;
    name: string;
    internalCode?: string;
  };
  assetRental?: {
    id: string;
    status: string;
    actualReturnDate?: string;
  };
}

export interface ContractAddendum {
  id: string;
  code: string;
  contractId: string;
  tenantId: string;
  businessUnitId: string;
  status: "draft" | "delivered" | "completed" | "cancelled";

  deliveryDate?: string;
  estimatedAmount?: number;
  actualAmount?: number;
  currency: string;

  pdfUrl?: string;
  notes?: string;
  metadata?: Record<string, any>;

  createdAt: string;
  updatedAt: string;

  // Relaciones
  items?: AddendumItem[];
  contract?: {
    id: string;
    code: string;
    clientId: string;
  };
}

export interface CreateAddendumDTO {
  items: {
    assetId: string;
    quantity: number;
    expectedReturnDate?: string;
    estimatedDailyRate?: number;
    estimatedHourlyRate?: number;
    operatorId?: string;
    initialHourometer?: number;
    initialOdometer?: number;
    notes?: string;
  }[];
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdateAddendumDTO {
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CompleteAddendumDTO {
  actualAmount?: number;
  notes?: string;
}

const BASE = "/rental";

export const addendumService = {
  /**
   * Crear addendum para contrato
   */
  async create(
    contractId: string,
    data: CreateAddendumDTO,
  ): Promise<ContractAddendum> {
    const res = await apiClient.post(
      `${BASE}/contracts/${contractId}/addendums`,
      data,
    );
    return res.data.data ?? res.data;
  },

  /**
   * Listar addendums de un contrato
   */
  async listByContract(contractId: string): Promise<ContractAddendum[]> {
    const res = await apiClient.get(
      `${BASE}/contracts/${contractId}/addendums`,
    );
    return res.data.data ?? res.data;
  },

  /**
   * Obtener addendum por ID
   */
  async getById(addendumId: string): Promise<ContractAddendum> {
    const res = await apiClient.get(`${BASE}/addendums/${addendumId}`);
    return res.data.data ?? res.data;
  },

  /**
   * Actualizar addendum
   */
  async update(
    addendumId: string,
    data: UpdateAddendumDTO,
  ): Promise<ContractAddendum> {
    const res = await apiClient.put(`${BASE}/addendums/${addendumId}`, data);
    return res.data.data ?? res.data;
  },

  /**
   * Completar addendum (finalizar entrega)
   */
  async complete(
    addendumId: string,
    data: CompleteAddendumDTO,
  ): Promise<ContractAddendum> {
    const res = await apiClient.post(
      `${BASE}/addendums/${addendumId}/complete`,
      data,
    );
    return res.data.data ?? res.data;
  },

  /**
   * Cancelar addendum
   */
  async cancel(addendumId: string, reason?: string): Promise<ContractAddendum> {
    const res = await apiClient.post(`${BASE}/addendums/${addendumId}/cancel`, {
      reason,
    });
    return res.data.data ?? res.data;
  },
};
