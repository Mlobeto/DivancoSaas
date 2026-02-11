/**
 * CLIENTS MODULE - SERVICE
 */

import apiClient from "@/lib/api";
import type {
  Client,
  ClientFilters,
  ClientListResponse,
  ClientSummary,
  ClientAccountMovement,
  ClientRankingConfig,
} from "../types/client.types";

const BASE_URL = "/modules/clients";

export const clientService = {
  async list(filters: ClientFilters = {}): Promise<ClientListResponse> {
    const params = new URLSearchParams();
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(
      `${BASE_URL}/clients?${params.toString()}`,
    );
    return response.data;
  },

  async getById(id: string): Promise<Client> {
    const response = await apiClient.get(`${BASE_URL}/clients/${id}`);
    return response.data.data;
  },

  async getSummary(id: string): Promise<ClientSummary> {
    const response = await apiClient.get(`${BASE_URL}/clients/${id}/summary`);
    return response.data.data;
  },

  async listMovements(
    clientId: string,
    options: { page?: number; limit?: number } = {},
  ): Promise<{
    data: ClientAccountMovement[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const params = new URLSearchParams();
    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());

    const response = await apiClient.get(
      `${BASE_URL}/clients/${clientId}/account-movements?${params.toString()}`,
    );
    return response.data;
  },

  async getConfig(): Promise<ClientRankingConfig> {
    const response = await apiClient.get(`${BASE_URL}/config/current`);
    return response.data.data;
  },

  async updateConfig(
    payload: ClientRankingConfig,
  ): Promise<ClientRankingConfig> {
    const response = await apiClient.put(`${BASE_URL}/config/current`, payload);
    return response.data.data;
  },

  async createMovement(
    clientId: string,
    payload: Partial<ClientAccountMovement> & {
      amount: number;
      direction: "DEBIT" | "CREDIT";
      currency: string;
    },
  ): Promise<ClientAccountMovement> {
    const response = await apiClient.post(
      `${BASE_URL}/clients/${clientId}/account-movements`,
      payload,
    );
    return response.data.data;
  },
};
