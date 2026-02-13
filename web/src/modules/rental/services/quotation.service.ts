/**
 * QUOTATION SERVICE
 * Servicio para gestión de cotizaciones
 */

import apiClient from "@/lib/api";
import type {
  Quotation,
  CreateQuotationDTO,
  UpdateQuotationItemPriceDTO,
} from "../types/quotation.types";

const BASE_URL = "/rental";

export const quotationService = {
  /**
   * Listar cotizaciones
   */
  async list(
    filters: {
      status?: string;
      clientId?: string;
      page?: number;
      limit?: number;
    } = {},
  ): Promise<{
    data: Quotation[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.clientId) params.append("clientId", filters.clientId);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(
      `${BASE_URL}/quotations?${params.toString()}`,
    );
    return response.data;
  },

  /**
   * Obtener cotización por ID
   */
  async getById(id: string): Promise<Quotation> {
    const response = await apiClient.get(`${BASE_URL}/quotations/${id}`);
    return response.data.data;
  },

  /**
   * Crear cotización con auto-cálculo de precios
   */
  async create(data: CreateQuotationDTO): Promise<Quotation> {
    const response = await apiClient.post(`${BASE_URL}/quotations`, data);
    return response.data.data;
  },

  /**
   * Actualizar precios de items (override manual)
   */
  async updateItemPrices(
    quotationId: string,
    itemUpdates: UpdateQuotationItemPriceDTO[],
  ): Promise<Quotation> {
    const response = await apiClient.patch(
      `${BASE_URL}/quotations/${quotationId}/update-prices`,
      { itemUpdates },
    );
    return response.data.data;
  },

  /**
   * Generar PDF de la cotización
   */
  async generatePDF(quotationId: string): Promise<{ pdfUrl: string }> {
    const response = await apiClient.post(
      `${BASE_URL}/quotations/${quotationId}/generate-pdf`,
    );
    return response.data.data;
  },

  /**
   * Solicitar firma digital
   */
  async requestSignature(
    quotationId: string,
    signers: Array<{
      name: string;
      email: string;
      role: string;
    }>,
  ): Promise<{
    id: string;
    status: string;
    signUrl: string;
  }> {
    const response = await apiClient.post(
      `${BASE_URL}/quotations/${quotationId}/request-signature`,
      { signers },
    );
    return response.data.data;
  },

  /**
   * Crear contrato desde cotización firmada
   */
  async createContract(quotationId: string): Promise<{
    quotationContract: any;
    rentalContract?: any;
    hasRentalAssets: boolean;
  }> {
    const response = await apiClient.post(
      `${BASE_URL}/quotations/${quotationId}/create-contract`,
    );
    return response.data.data;
  },
};
