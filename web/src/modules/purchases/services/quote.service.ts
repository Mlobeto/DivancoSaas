/**
 * PURCHASES MODULE - QUOTES SERVICE
 * Servicio para gestión de cotizaciones de insumos
 */

import apiClient from "@/lib/api";
import type {
  SupplyQuote,
  CreateSupplyQuoteDTO,
  UpdateSupplyQuoteDTO,
  QuoteComparison,
} from "../types/purchases.types";

const BASE_URL = "/modules/purchases/quotes";

export const quoteService = {
  /**
   * Listar cotizaciones
   */
  async list(
    filters: {
      supplierId?: string;
      supplyId?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: SupplyQuote[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters.supplierId) params.append("supplierId", filters.supplierId);
    if (filters.supplyId) params.append("supplyId", filters.supplyId);
    if (filters.isActive !== undefined)
      params.append("isActive", filters.isActive.toString());
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener una cotización por ID
   */
  async getById(id: string): Promise<SupplyQuote> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Crear cotización
   */
  async create(data: CreateSupplyQuoteDTO): Promise<SupplyQuote> {
    const response = await apiClient.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Actualizar cotización
   */
  async update(id: string, data: UpdateSupplyQuoteDTO): Promise<SupplyQuote> {
    const response = await apiClient.put(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar cotización
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Comparar cotizaciones para un insumo
   */
  async compare(supplyId: string): Promise<QuoteComparison> {
    const response = await apiClient.get(`${BASE_URL}/compare/${supplyId}`);
    return response.data.data;
  },

  /**
   * Obtener cotizaciones activas de un proveedor
   */
  async getActiveQuotesBySupplierId(
    supplierId: string,
  ): Promise<SupplyQuote[]> {
    const response = await apiClient.get(
      `/modules/purchases/suppliers/${supplierId}/active-quotes`,
    );
    return response.data.data;
  },

  /**
   * Desactivar cotizaciones vencidas
   */
  async deactivateExpired(): Promise<{ deactivated: number }> {
    const response = await apiClient.post(`${BASE_URL}/deactivate-expired`);
    return response.data.data;
  },
};
