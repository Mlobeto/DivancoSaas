/**
 * USER SERVICE
 * Servicio para gestión de usuarios del sistema (Core)
 */

import apiClient from "@/lib/api";

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  businessUnitId?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  search?: string;
  page?: number;
  limit?: number;
}

export interface UserListResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  businessUnitId: string;
  roleId: string;
  password?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

const BASE_URL = "/users";

export const userService = {
  /**
   * Listar usuarios del tenant con filtros
   */
  async list(filters: UserFilters = {}): Promise<UserListResponse> {
    const params = new URLSearchParams();
    if (filters.businessUnitId)
      params.append("businessUnitId", filters.businessUnitId);
    if (filters.status) params.append("status", filters.status);
    if (filters.search) params.append("search", filters.search);
    if (filters.page) params.append("page", filters.page.toString());
    if (filters.limit) params.append("limit", filters.limit.toString());

    const response = await apiClient.get(`${BASE_URL}?${params.toString()}`);
    return response.data;
  },

  /**
   * Obtener usuario por ID
   */
  async getById(id: string): Promise<User> {
    const response = await apiClient.get(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Crear usuario
   */
  async create(data: CreateUserData): Promise<User> {
    const response = await apiClient.post(BASE_URL, data);
    return response.data.data;
  },

  /**
   * Actualizar usuario
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    const response = await apiClient.patch(`${BASE_URL}/${id}`, data);
    return response.data.data;
  },

  /**
   * Eliminar usuario (soft delete)
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`${BASE_URL}/${id}`);
  },

  /**
   * Reactivar usuario suspendido
   */
  async reactivate(id: string): Promise<User> {
    const response = await apiClient.post(`${BASE_URL}/${id}/reactivate`);
    return response.data.data;
  },

  /**
   * Cambiar contraseña del usuario
   */
  async changePassword(
    userId: string,
    data: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    await apiClient.post(`${BASE_URL}/${userId}/change-password`, data);
  },
};
