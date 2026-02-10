/**
 * PURCHASES MODULE - TYPES
 * Tipos para gestión de proveedores, cotizaciones y órdenes de compra
 */

import {
  SupplierStatus,
  AccountEntryType,
  PurchaseOrderStatus,
  TransactionType,
  SupplyCategoryType,
} from "@prisma/client";

// ============================================
// SUPPLY CATEGORY TYPES
// ============================================

export interface CreateSupplyCategoryDTO {
  code: string;
  name: string;
  description?: string;
  type: SupplyCategoryType;
  color?: string;
  icon?: string;
  requiresStockControl?: boolean;
  allowNegativeStock?: boolean;
}

export interface UpdateSupplyCategoryDTO {
  code?: string;
  name?: string;
  description?: string;
  type?: SupplyCategoryType;
  color?: string;
  icon?: string;
  requiresStockControl?: boolean;
  allowNegativeStock?: boolean;
  isActive?: boolean;
}

export interface SupplyCategoryFilters {
  type?: SupplyCategoryType;
  search?: string; // Busca en code, name, description
  isActive?: boolean;
}

// ============================================
// SUPPLIER TYPES
// ============================================

export interface CreateSupplierDTO {
  code: string;
  name: string;
  tradeName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  paymentTerms?: string;
  currency?: string;
  creditLimit?: number;
  notes?: string;
}

export interface UpdateSupplierDTO {
  code?: string;
  name?: string;
  tradeName?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  paymentTerms?: string;
  currency?: string;
  creditLimit?: number;
  status?: SupplierStatus;
  notes?: string;
}

export interface SupplierFilters {
  status?: SupplierStatus;
  search?: string; // Busca en name, tradeName, taxId
  country?: string;
  page?: number;
  limit?: number;
}

// ============================================
// SUPPLIER CONTACT TYPES
// ============================================

export interface CreateSupplierContactDTO {
  supplierId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface UpdateSupplierContactDTO {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

// ============================================
// SUPPLIER ACCOUNT TYPES
// ============================================

export interface CreateAccountEntryDTO {
  supplierId: string;
  type: AccountEntryType;
  amount: number;
  reference?: string;
  description?: string;
  dueDate?: Date;
  purchaseOrderId?: string;
}

export interface AccountBalance {
  balance: number;
  currency: string;
  overdueAmount: number;
  currentAmount: number;
}

// ============================================
// SUPPLY QUOTE TYPES
// ============================================

export interface CreateSupplyQuoteDTO {
  supplierId: string;
  supplyId: string;
  unitPrice: number;
  quantity?: number;
  currency?: string;
  validFrom: Date;
  validUntil?: Date;
  notes?: string;
}

export interface UpdateSupplyQuoteDTO {
  unitPrice?: number;
  quantity?: number;
  currency?: string;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
  isActive?: boolean;
}

export interface QuoteComparison {
  supplyId: string;
  supplyName: string;
  quotes: Array<{
    supplierId: string;
    supplierName: string;
    unitPrice: number;
    currency: string;
    validUntil?: Date;
    isActive: boolean;
  }>;
  bestPrice: {
    supplierId: string;
    supplierName: string;
    unitPrice: number;
  };
}

// ============================================
// PURCHASE ORDER TYPES
// ============================================

export interface CreatePurchaseOrderDTO {
  code: string;
  supplierId: string;
  expectedDate?: Date;
  notes?: string;
  items: Array<{
    supplyId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdatePurchaseOrderDTO {
  expectedDate?: Date;
  notes?: string;
  status?: PurchaseOrderStatus;
}

export interface AddPurchaseOrderItemDTO {
  supplyId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface UpdatePurchaseOrderItemDTO {
  quantity?: number;
  unitPrice?: number;
  notes?: string;
}

export interface ReceivePurchaseOrderDTO {
  items: Array<{
    itemId: string;
    receivedQty: number;
  }>;
  receivedDate?: Date;
}

export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

// ============================================
// STOCK TRANSACTION TYPES
// ============================================

export interface CreateStockTransactionDTO {
  supplyId: string;
  type: TransactionType;
  quantity: number;
  unitCost?: number;
  purchaseOrderId?: string;
  maintenanceRecordId?: string;
  assetId?: string;
  reason?: string;
  notes?: string;
}

export interface StockTransactionFilters {
  supplyId?: string;
  type?: TransactionType;
  assetId?: string;
  maintenanceRecordId?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export interface StockMovementReport {
  supplyId: string;
  supplyName: string;
  initialStock: number;
  purchases: number;
  maintenanceUses: number;
  discards: number;
  adjustments: number;
  returns: number;
  finalStock: number;
  totalCost: number;
}

// ============================================
// COST ANALYSIS TYPES
// ============================================

export interface AssetCostAnalysis {
  assetId: string;
  assetCode: string;
  assetName: string;
  totalMaintenanceCost: number;
  costBySupply: Array<{
    supplyId: string;
    supplyName: string;
    quantity: number;
    totalCost: number;
  }>;
  costByPeriod: Array<{
    period: string; // YYYY-MM
    cost: number;
  }>;
}

export interface SupplierPerformanceReport {
  supplierId: string;
  supplierName: string;
  totalOrders: number;
  totalAmount: number;
  onTimeDeliveries: number;
  lateDeliveries: number;
  averageDeliveryTime: number; // días
  averagePriceComparison: number; // % vs mercado
}
