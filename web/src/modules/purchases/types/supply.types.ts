/**
 * SUPPLY TYPES (Frontend)
 * Tipos para gestión de suministros
 */

// ============================================
// SUPPLY TYPES
// ============================================

export interface Supply {
  id: string;
  tenantId: string;
  businessUnitId: string;
  categoryId?: string;
  code?: string;
  name: string;
  unit: string; // litros, unidades, kg, metros, etc.
  stock: number;
  costPerUnit?: number;
  minStock?: number;
  maxStock?: number;
  sku?: string;
  barcode?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    code: string;
    name: string;
    type: string;
    color?: string;
    icon?: string;
  };
}

export interface CreateSupplyDTO {
  code?: string;
  name: string;
  unit: string;
  categoryId?: string;
  costPerUnit?: number;
  minStock?: number;
  maxStock?: number;
  sku?: string;
  barcode?: string;
  notes?: string;
}

export interface UpdateSupplyDTO {
  code?: string;
  name?: string;
  unit?: string;
  categoryId?: string;
  costPerUnit?: number;
  minStock?: number;
  maxStock?: number;
  sku?: string;
  barcode?: string;
  notes?: string;
  isActive?: boolean;
}

export interface SupplyFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  page?: number;
  limit?: number;
}

export interface SupplyListResponse {
  success: boolean;
  data: Supply[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
