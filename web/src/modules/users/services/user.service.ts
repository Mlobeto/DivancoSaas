import api from "@/lib/api";
import type { ApiResponse, User } from "@/core/types/api.types";

export interface CreateUserData {
  tenantId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

export interface UpdateUserData {
  email?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface AssignUserToBusinessUnitData {
  businessUnitId: string;
  roleId: string;
}

export const userService = {
  /**
   * Lista todos los usuarios de un tenant
   */
  async list(tenantId: string): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>("/users", {
      params: { tenantId },
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to fetch users");
    }

    return response.data.data || [];
  },

  /**
   * Obtiene un usuario por ID
   */
  async getById(userId: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/users/${userId}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "User not found");
    }

    return response.data.data!;
  },

  /**
   * Crea un nuevo usuario en el tenant
   */
  async create(data: CreateUserData): Promise<User> {
    const response = await api.post<ApiResponse<User>>("/users", data);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to create user");
    }

    return response.data.data!;
  },

  /**
   * Actualiza un usuario
   */
  async update(userId: string, data: UpdateUserData): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/users/${userId}`, data);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to update user");
    }

    return response.data.data!;
  },

  /**
   * Elimina un usuario (soft delete)
   */
  async delete(userId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/users/${userId}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to delete user");
    }
  },

  /**
   * Asigna un usuario a una Business Unit con un rol
   */
  async assignToBusinessUnit(
    userId: string,
    data: AssignUserToBusinessUnitData,
  ): Promise<void> {
    const response = await api.post<ApiResponse<void>>(
      `/users/${userId}/business-units`,
      data,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message ||
          "Failed to assign user to business unit",
      );
    }
  },

  /**
   * Remueve un usuario de una Business Unit
   */
  async removeFromBusinessUnit(
    userId: string,
    businessUnitId: string,
  ): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(
      `/users/${userId}/business-units/${businessUnitId}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message ||
          "Failed to remove user from business unit",
      );
    }
  },
};
