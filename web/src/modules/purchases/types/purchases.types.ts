/**
 * PURCHASES MODULE - FRONTEND TYPES
 * Tipos para gestión de proveedores, cotizaciones y órdenes de compra
 */

// ============================================
// SUPPLIER TYPES
// ============================================

export enum SupplierStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  BLOCKED = "BLOCKED",
}

export interface Supplier {
  id: string;
  tenantId: string;
  businessUnitId: string;
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
  currency: string;
  creditLimit?: number;
  status: SupplierStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  contacts?: SupplierContact[];
  accountBalance?: number;
}

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

export interface UpdateSupplierDTO extends Partial<CreateSupplierDTO> {
  status?: SupplierStatus;
}

export interface SupplierFilters {
  status?: SupplierStatus;
  search?: string;
  country?: string;
  page?: number;
  limit?: number;
}

// ============================================
// SUPPLIER CONTACT TYPES
// ============================================

export interface SupplierContact {
  id: string;
  supplierId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierContactDTO {
  name: string;
  role?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
}

export interface UpdateSupplierContactDTO extends Partial<CreateSupplierContactDTO> {}

// ============================================
// SUPPLIER ACCOUNT TYPES
// ============================================

export enum AccountEntryType {
  DEBIT = "DEBIT",
  CREDIT = "CREDIT",
}

export interface SupplierAccountEntry {
  id: string;
  supplierId: string;
  type: AccountEntryType;
  amount: number;
  reference?: string;
  description?: string;
  dueDate?: string;
  purchaseOrderId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountEntryDTO {
  type: AccountEntryType;
  amount: number;
  reference?: string;
  description?: string;
  dueDate?: string;
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

export interface SupplyQuote {
  id: string;
  tenantId: string;
  businessUnitId: string;
  supplierId: string;
  supplyId: string;
  unitPrice: number;
  quantity?: number;
  currency: string;
  validFrom: string;
  validUntil?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  supply?: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
}

export interface CreateSupplyQuoteDTO {
  supplierId: string;
  supplyId: string;
  unitPrice: number;
  quantity?: number;
  currency?: string;
  validFrom: string;
  validUntil?: string;
  notes?: string;
}

export interface UpdateSupplyQuoteDTO extends Partial<CreateSupplyQuoteDTO> {
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
    validUntil?: string;
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

export enum PurchaseOrderStatus {
  DRAFT = "DRAFT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  PARTIALLY_RECEIVED = "PARTIALLY_RECEIVED",
  COMPLETED = "COMPLETED",
}

export interface PurchaseOrderItem {
  id: string;
  purchaseOrderId: string;
  supplyId: string;
  quantity: number;
  unitPrice: number;
  receivedQty: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supply?: {
    id: string;
    name: string;
    code: string;
    unit: string;
  };
}

export interface PurchaseOrder {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  supplierId: string;
  status: PurchaseOrderStatus;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  total?: number;
}

export interface CreatePurchaseOrderDTO {
  code: string;
  supplierId: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    supplyId: string;
    quantity: number;
    unitPrice: number;
  }>;
}

export interface UpdatePurchaseOrderDTO {
  expectedDate?: string;
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
  receivedDate?: string;
}

export interface PurchaseOrderFilters {
  supplierId?: string;
  status?: PurchaseOrderStatus;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
