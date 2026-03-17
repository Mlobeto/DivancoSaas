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
  addendumType: string;
  status:
    | "pending_preparation"
    | "ready_to_ship"
    | "delivered"
    | "completed"
    | "cancelled";

  issueDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  estimatedDays?: number;
  currency: string;

  // Operario
  hasOperator?: boolean;
  operatorLicenseUrl?: string;
  operatorCertificationUrl?: string;
  operatorInsuranceUrl?: string;
  operatorDocumentationNotes?: string;

  // Transporte
  transportType?: string;
  vehicleId?: string;
  driverName?: string;
  transportNotes?: string;

  // Fechas de workflow
  preparedAt?: string;
  deliveredAt?: string;
  completedAt?: string;

  pdfUrl?: string;
  notes?: string;
  metadata?: Record<string, any>;

  // items es el JSON raw (los items originales al crear)
  items?: any;

  createdAt: string;
  updatedAt: string;

  // Relaciones
  rentals?: Array<{
    id: string;
    assetId: string;
    trackingType: string;
    withdrawalDate: string;
    actualReturnDate?: string;
    totalCost?: number;
    periodType?: string;
    asset: {
      id: string;
      code: string;
      name: string;
    };
  }>;
  contract?: {
    id: string;
    code: string;
    clientId: string;
    client?: {
      id?: string;
      name?: string;
      displayName?: string;
      email?: string;
    };
  };
  preparedBy?: { id: string; firstName: string; lastName: string };
  deliveredBy?: { id: string; firstName: string; lastName: string };
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
  // Operario
  hasOperator?: boolean;
  operatorLicenseUrl?: string;
  operatorCertificationUrl?: string;
  operatorInsuranceUrl?: string;
  operatorDocumentationNotes?: string;
  // Transporte
  transportType?: string;
  vehicleId?: string;
  driverName?: string;
  transportNotes?: string;
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

  /**
   * Confirmar preparación (mantenimiento)
   */
  async confirmPreparation(
    addendumId: string,
    notes?: string,
  ): Promise<ContractAddendum> {
    const res = await apiClient.post(
      `${BASE}/addendums/${addendumId}/confirm-preparation`,
      { notes },
    );
    return res.data.data ?? res.data;
  },

  /**
   * Confirmar entrega al cliente
   */
  async confirmDelivery(
    addendumId: string,
    notes?: string,
  ): Promise<ContractAddendum> {
    const res = await apiClient.post(
      `${BASE}/addendums/${addendumId}/confirm-delivery`,
      { notes },
    );
    return res.data.data ?? res.data;
  },

  /**
   * Obtener entregas pendientes de preparación (pending_preparation)
   */
  async getPendingDeliveries(): Promise<ContractAddendum[]> {
    const res = await apiClient.get(
      `${BASE}/addendums?status=pending_preparation`,
    );
    return res.data.data ?? res.data;
  },

  /**
   * Obtener entregas listas para enviar (ready_to_ship)
   */
  async getReadyToShipDeliveries(): Promise<ContractAddendum[]> {
    const res = await apiClient.get(`${BASE}/addendums?status=ready_to_ship`);
    return res.data.data ?? res.data;
  },
};
