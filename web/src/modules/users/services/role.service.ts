import api from "@/lib/api";
import type { ApiResponse } from "@/core/types/api.types";

export interface Role {
  id: string;
  name: string;
  description?: string;
  isSystem: boolean;
  businessUnitId?: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string;
}

export interface CreateRoleData {
  businessUnitId?: string;
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export const roleService = {
  /**
   * Lista todos los roles de una Business Unit
   */
  async list(businessUnitId?: string): Promise<Role[]> {
    const response = await api.get<ApiResponse<Role[]>>("/roles", {
      params: businessUnitId ? { businessUnitId } : undefined,
    });

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to fetch roles");
    }

    return response.data.data || [];
  },

  /**
   * Obtiene un rol por ID
   */
  async getById(roleId: string): Promise<Role> {
    const response = await api.get<ApiResponse<Role>>(`/roles/${roleId}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Role not found");
    }

    return response.data.data!;
  },

  /**
   * Crea un nuevo rol personalizado
   */
  async create(data: CreateRoleData): Promise<Role> {
    const response = await api.post<ApiResponse<Role>>("/roles", data);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to create role");
    }

    return response.data.data!;
  },

  /**
   * Actualiza un rol
   */
  async update(roleId: string, data: UpdateRoleData): Promise<Role> {
    const response = await api.put<ApiResponse<Role>>(`/roles/${roleId}`, data);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to update role");
    }

    return response.data.data!;
  },

  /**
   * Elimina un rol (solo si no es sistema y no tiene usuarios asignados)
   */
  async delete(roleId: string): Promise<void> {
    const response = await api.delete<ApiResponse<void>>(`/roles/${roleId}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || "Failed to delete role");
    }
  },

  /**
   * Lista todos los permisos disponibles
   */
  async listPermissions(): Promise<Permission[]> {
    const response = await api.get<ApiResponse<Permission[]>>("/permissions");

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch permissions",
      );
    }

    return response.data.data || [];
  },

  /**
   * Lista permisos por módulo
   */
  async listPermissionsByModule(module: string): Promise<Permission[]> {
    const response = await api.get<ApiResponse<Permission[]>>(
      `/permissions/by-module/${module}`,
    );

    if (!response.data.success) {
      throw new Error(
        response.data.error?.message || "Failed to fetch module permissions",
      );
    }

    return response.data.data || [];
  },
};
