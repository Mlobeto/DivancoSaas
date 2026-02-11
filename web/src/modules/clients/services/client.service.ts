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
  GlobalClientSearchResult,
} from "../types/client.types";

const BASE_URL = "/modules/clients";

export const clientService = {
  async searchGlobal(search: string): Promise<GlobalClientSearchResult[]> {
    const params = new URLSearchParams();
    params.append("search", search);
    const response = await apiClient.get(
      `${BASE_URL}/global-search?${params.toString()}`,
    );
    return response.data.data;
  },

  async link(clientId: string): Promise<void> {
    await apiClient.post(`${BASE_URL}/clients/${clientId}/link`);
  },

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

  async create(data: Partial<Client>): Promise<Client> {
    const response = await apiClient.post(`${BASE_URL}/clients`, data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Client>): Promise<Client> {
    const response = await apiClient.put(`${BASE_URL}/clients/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/clients/${id}`);
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
