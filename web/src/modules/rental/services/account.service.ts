/**
 * RENTAL ACCOUNT SERVICE
 * Servicio para gestión de ClientAccount (cuentas compartidas de alquiler)
 */

import apiClient from "@/lib/api";

export interface ClientAccountInfo {
  hasAccount: boolean;
  accountId?: string;
  balance?: number;
  creditLimit?: number;
  timeLimit?: number;
  activeDays?: number;
  totalConsumed?: number;
  totalReloaded?: number;
  activeContracts?: number;
  activeRentals?: number;
  alertAmount?: number;
  alertTriggered?: boolean;
  statementFrequency?: string;
  currency?: string;
}

export interface AccountListItem {
  id: string;
  clientId: string;
  clientName: string;
  clientStatus: string;
  balance: number;
  creditLimit: number;
  timeLimit: number;
  activeDays: number;
  totalConsumed: number;
  totalReloaded: number;
  alertAmount: number;
  alertTriggered: boolean;
  currency: string;
  activeContracts: number;
  activeRentals: number;
  totalContracts: number;
  totalMovements: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccountMovement {
  id: string;
  clientAccountId: string;
  contractId?: string;
  movementType: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  machineryCost?: number;
  operatorCost?: number;
  toolCost?: number;
  description: string;
  evidenceUrls: string[];
  assetRentalId?: string;
  usageReportId?: string;
  notes?: string;
  metadata?: any;
  createdAt: string;
  createdBy?: string;
}

export interface ReloadBalanceParams {
  amount: number;
  description: string;
  paymentMethod?: string;
  referenceNumber?: string;
  proofFile?: File | null;
}

export interface CheckAvailabilityParams {
  clientId: string;
  items: Array<{
    assetId: string;
    estimatedDays: number;
    dailyRate: number;
  }>;
}

export interface AvailabilityResponse {
  canDeliver: boolean;
  estimatedCost: number;
  estimatedDays: number;
  currentBalance: number;
  remainingBalance: number;
  creditLimit: number;
  currentActiveDays: number;
  remainingDays: number;
  timeLimit: number;
  error?: string;
  errorCode?: string;
  shortfall?: number;
  options?: string[];
}

class AccountService {
  /**
   * Obtener todas las cuentas con filtros y paginación
   */
  async getAll(params?: {
    search?: string;
    status?: "active" | "inactive" | "alert";
    page?: number;
    limit?: number;
  }): Promise<{
    data: AccountListItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append("search", params.search);
    if (params?.status) queryParams.append("status", params.status);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: AccountListItem[];
      pagination: any;
    }>(`/rental/accounts?${queryParams.toString()}`);

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Obtener información de la cuenta por clientId
   */
  async getByClientId(clientId: string): Promise<ClientAccountInfo> {
    const response = await apiClient.get<{
      success: boolean;
      data: ClientAccountInfo;
    }>(`/rental/accounts/client/${clientId}`);
    return response.data.data;
  }

  /**
   * Obtener información de la cuenta por accountId
   */
  async getById(accountId: string): Promise<ClientAccountInfo> {
    const response = await apiClient.get<{
      success: boolean;
      data: ClientAccountInfo;
    }>(`/rental/accounts/${accountId}`);
    return response.data.data;
  }

  /**
   * Recargar saldo de una cuenta
   */
  async reloadBalance(
    accountId: string,
    params: ReloadBalanceParams,
  ): Promise<{ message: string; newBalance: number }> {
    // Si hay archivo, usar FormData
    if (params.proofFile) {
      const formData = new FormData();
      formData.append("amount", params.amount.toString());
      formData.append("description", params.description);
      if (params.paymentMethod) {
        formData.append("paymentMethod", params.paymentMethod);
      }
      if (params.referenceNumber) {
        formData.append("referenceNumber", params.referenceNumber);
      }
      formData.append("proofFile", params.proofFile);

      const response = await apiClient.post<{
        success: boolean;
        data: { message: string; newBalance: number };
      }>(`/rental/accounts/${accountId}/reload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data.data;
    }

    // Sin archivo, enviar JSON normal
    const response = await apiClient.post<{
      success: boolean;
      data: { message: string; newBalance: number };
    }>(`/rental/accounts/${accountId}/reload`, {
      amount: params.amount,
      description: params.description,
      paymentMethod: params.paymentMethod,
      referenceNumber: params.referenceNumber,
    });
    return response.data.data;
  }

  /**
   * Obtener movimientos de una cuenta
   */
  async getMovements(
    accountId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      movementType?: string;
      contractId?: string;
      page?: number;
      limit?: number;
    },
  ): Promise<{
    data: AccountMovement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.movementType)
      queryParams.append("movementType", params.movementType);
    if (params?.contractId) queryParams.append("contractId", params.contractId);
    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());

    const response = await apiClient.get<{
      success: boolean;
      data: AccountMovement[];
      pagination: any;
    }>(`/rental/accounts/${accountId}/movements?${queryParams.toString()}`);

    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  }

  /**
   * Verificar disponibilidad para una entrega (saldo y tiempo)
   */
  async checkAvailability(
    params: CheckAvailabilityParams,
  ): Promise<AvailabilityResponse> {
    const response = await apiClient.post<{
      success: boolean;
      data: AvailabilityResponse;
    }>("/rental/deliveries/check-availability", params);
    return response.data.data;
  }
}

export const accountService = new AccountService();
