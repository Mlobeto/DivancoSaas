/**
 * Rental Module Types
 *
 * DTOs para workflows de alquiler de implementos
 */

// ============================================
// SUPPLIES (Insumos)
// ============================================

export interface CreateSupplyDTO {
  name: string;
  unit: string; // litros, unidades, kg
  stock: number;
}

export interface UpdateSupplyDTO {
  name?: string;
  unit?: string;
  stock?: number;
}

export interface SupplyFilters {
  search?: string;
}

export interface CreateSupplyUsageDTO {
  supplyId: string;
  assetId?: string;
  quantity: number;
  reason: string; // preventive, post_obra, discard
  notes?: string;
}

// ============================================
// RENTAL CONTRACTS
// ============================================

export interface CreateRentalContractDTO {
  clientId: string; // UUID o referencia externa
  status?: string; // DRAFT por defecto
}

export interface UpdateRentalContractDTO {
  clientId?: string;
  status?: string; // DRAFT, ACTIVE, PAUSED, FINISHED
}

export interface RentalContractFilters {
  clientId?: string;
  status?: string;
}

// ============================================
// CONTRACT ASSETS (Asignación)
// ============================================

export interface AssignAssetToContractDTO {
  contractId: string;
  assetId: string;
  obra: string;
  estimatedStart: Date;
  estimatedEnd: Date;
  estimatedHours?: number;
  estimatedDays?: number;
}

export interface UpdateContractAssetDTO {
  actualEnd?: Date;
  actualHours?: number;
  needsPostObraMaintenance?: boolean;
}

// ============================================
// USAGE REPORTS (Uso Diario)
// ============================================

export interface CreateUsageReportDTO {
  assetId: string;
  contractId: string;
  metric: string; // horas, km, ciclos
  value: number;
  reportedBy: string; // operarioId o nombre
  notes?: string;
  evidenceUrls?: string[];
}

export interface UsageReportFilters {
  assetId?: string;
  contractId?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// ============================================
// INCIDENTS
// ============================================

export interface CreateIncidentDTO {
  assetId: string;
  contractId: string;
  description: string;
}

export interface ResolveIncidentDTO {
  decision: string; // REPLACE, PAUSE, CONTINUE
  resolution: string;
}

export interface IncidentFilters {
  assetId?: string;
  contractId?: string;
  resolved?: boolean;
}

// ============================================
// PREVENTIVE CONFIG
// ============================================

export interface CreatePreventiveConfigDTO {
  assetId: string;
  suppliesConfig: Record<string, any>; // { "supplyId": { "quantity": 5, "frequency": "cada 100 horas" } }
  notes?: string;
}

export interface UpdatePreventiveConfigDTO {
  suppliesConfig?: Record<string, any>;
  notes?: string;
}

// ============================================
// MAINTENANCE EVENTS
// ============================================

export interface CreateMaintenanceEventDTO {
  assetId: string;
  type: string; // PREVENTIVE | POST_OBRA
  context: string; // OBRA | TALLER
  notes?: string;
  suppliesUsed?: Record<string, any>;
}

// ============================================
// COMMON
// ============================================

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

// ============================================
// AVAILABILITY PROJECTION
// ============================================

export interface AvailabilityProjection {
  assetId: string;
  currentState: string;
  estimatedAvailableDate?: Date;
  status:
    | "AVAILABLE_NOW"
    | "IN_USE"
    | "MAINTENANCE"
    | "INCIDENT"
    | "INDETERMINATE";
  details?: string;
}
