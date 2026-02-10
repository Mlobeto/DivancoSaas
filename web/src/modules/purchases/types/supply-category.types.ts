// Supply Category Types - Multitenant configurable categories

export enum SupplyCategoryType {
  CONSUMABLE = "CONSUMABLE",
  SPARE_PART = "SPARE_PART",
  RAW_MATERIAL = "RAW_MATERIAL",
  FINISHED_PRODUCT = "FINISHED_PRODUCT",
  TOOL = "TOOL",
  OTHER = "OTHER",
}

export interface SupplyCategory {
  id: string;
  tenantId: string;
  businessUnitId: string;
  code: string;
  name: string;
  description?: string;
  type: SupplyCategoryType;
  color?: string;
  icon?: string;
  requiresSerialTracking: boolean;
  requiresExpiryDate: boolean;
  allowsNegativeStock: boolean;
  defaultReorderPoint?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSupplyCategoryDto {
  code: string;
  name: string;
  description?: string;
  type: SupplyCategoryType;
  color?: string;
  icon?: string;
  requiresSerialTracking?: boolean;
  requiresExpiryDate?: boolean;
  allowsNegativeStock?: boolean;
  defaultReorderPoint?: number;
}

export interface UpdateSupplyCategoryDto extends Partial<CreateSupplyCategoryDto> {
  isActive?: boolean;
}
