/**
 * Asset Module Types
 *
 * Tipos sin enums hardcodeados - workflow-driven
 */

export interface CreateAssetDTO {
  name: string;
  assetType: string; // String libre: machine, implement, vehicle, etc
  acquisitionCost?: number;
  origin?: string;
  requiresOperator?: boolean;
  requiresTracking?: boolean;
}

export interface UpdateAssetDTO {
  name?: string;
  assetType?: string;
  acquisitionCost?: number;
  origin?: string;
  requiresOperator?: boolean;
  requiresTracking?: boolean;
}

export interface AssetFilters {
  assetType?: string;
  requiresOperator?: boolean;
  requiresTracking?: boolean;
  search?: string;
}

export interface AssetStateDTO {
  workflowId: string;
  currentState: string; // Workflow-driven state
}

export interface AssetEventDTO {
  eventType: string; // String libre: created, rented, returned, etc
  payload: Record<string, any>;
  source: string; // web, mobile, whatsapp, system
}

export interface CreateMaintenanceDTO {
  assetId: string;
  description?: string;
  startedAt: Date;
  endedAt?: Date;
}

export interface UpdateMaintenanceDTO {
  description?: string;
  endedAt?: Date;
}

export interface CreateUsageDTO {
  assetId: string;
  date: Date;
  hoursUsed: number;
  standbyHours?: number;
  reportedByUserId?: string;
  source: string; // APP, WHATSAPP, API, SYSTEM
  notes?: string;
}

export interface UsageFilters {
  assetId?: string;
  dateFrom?: Date;
  dateTo?: Date;
  reportedByUserId?: string;
  source?: string;
}

export interface CreateAttachmentDTO {
  assetId: string;
  type: string; // PHOTO, PDF, VIDEO, etc
  url: string;
  source: string; // WHATSAPP, APP, SYSTEM
}

export interface AttachmentFilters {
  assetId: string;
  type?: string;
  source?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
