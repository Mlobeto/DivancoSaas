/**
 * WAREHOUSE SERVICE
 * API client para gestión de bodegas y talleres
 */

import api from "@/lib/api";

// ============================================
// TYPES
// ============================================

export enum WarehouseType {
  BODEGA = "BODEGA",
  TALLER = "TALLER",
  OBRA = "OBRA",
}

export interface Warehouse {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  type: WarehouseType;
  address?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface CreateWarehouseData {
  code: string;
  name: string;
  type: WarehouseType;
  address?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWarehouseData {
  name?: string;
  type?: WarehouseType;
  address?: string;
  description?: string;
  isActive?: boolean;
}

// ============================================
// SERVICE
// ============================================

export const warehouseService = {
  /**
   * List all warehouses
   */
  async list() {
    const response = await api.get("/modules/assets/warehouses");
    return response.data;
  },

  /**
   * Get warehouse by ID
   */
  async getById(id: string) {
    const response = await api.get(`/modules/assets/warehouses/${id}`);
    return response.data.data;
  },

  /**
   * Create new warehouse
   */
  async create(data: CreateWarehouseData) {
    const response = await api.post("/modules/assets/warehouses", data);
    return response.data.data;
  },

  /**
   * Update warehouse
   */
  async update(id: string, data: UpdateWarehouseData) {
    const response = await api.put(`/modules/assets/warehouses/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete warehouse
   */
  async delete(id: string) {
    const response = await api.delete(`/modules/assets/warehouses/${id}`);
    return response.data;
  },
};
