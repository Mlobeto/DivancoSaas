/**
 * Asset Module Types
 *
 * Tipos sin enums hardcodeados - workflow-driven
 */

export interface CreateAssetDTO {
  code: string; // Código único del activo (ej: MACH-001, IMPL-045)
  name: string;
  assetType: string; // String libre: machine, implement, vehicle, etc
  acquisitionCost?: number;
  origin?: string;
  currentLocation?: string; // Ubicación actual (obra, taller, bodega)
  requiresOperator?: boolean;
  requiresTracking?: boolean;
  requiresClinic?: boolean; // Requiere historia clínica de mantenimiento

  // Integración con compras
  templateId?: string; // Template del activo
  customData?: any; // Datos del template
  imageUrl?: string;
  purchaseOrderId?: string; // Orden de compra origen
  supplierId?: string; // Proveedor
  purchaseDate?: Date; // Fecha de compra
  purchasePrice?: number; // Precio de compra

  // ═══════════════════════════════════════
  // RENTAL: Tipo de tracking y precios
  // ═══════════════════════════════════════
  trackingType?: "MACHINERY" | "TOOL" | null; // Tipo de activo para rental

  // Para MACHINERY (maquinaria pesada con operario)
  pricePerHour?: number; // ej: 625 ($/hora)
  minDailyHours?: number; // ej: 3.0 (standby - mínimo horas/día)
  pricePerKm?: number; // ej: 5 ($/km) - opcional para vehículos

  // Para TOOL (herramientas/equipos sin operario)
  pricePerDay?: number; // ej: 200 ($/día)
  pricePerWeek?: number; // ej: 1200 ($/semana) - opcional
  pricePerMonth?: number; // ej: 4500 ($/mes) - opcional

  // Costos de operador (si aplica)
  operatorCostType?: "PER_DAY" | "PER_HOUR" | null; // Tipo de cobro del operario
  operatorCostRate?: number; // ej: 3000/día o 375/hora

  // Costos de mantenimiento diario
  maintenanceCostDaily?: number; // ej: 50 ($/día)
}

export interface UpdateAssetDTO {
  name?: string;
  assetType?: string;
  acquisitionCost?: number;
  origin?: string;
  currentLocation?: string;
  requiresOperator?: boolean;
  requiresTracking?: boolean;
  requiresClinic?: boolean;
  customData?: any;
  imageUrl?: string;
  supplierId?: string;
  purchaseDate?: Date;
  purchasePrice?: number;

  // RENTAL: Precios y tracking
  trackingType?: "MACHINERY" | "TOOL" | null;
  pricePerHour?: number;
  minDailyHours?: number;
  pricePerKm?: number;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  operatorCostType?: "PER_DAY" | "PER_HOUR" | null;
  operatorCostRate?: number;
  maintenanceCostDaily?: number;
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

export interface DecommissionAssetDTO {
  reason: string; // Motivo obligatorio del descarte
  notes?: string; // Notas adicionales
  attributableToClient?: boolean; // Si el daño es atribuible al cliente
  clientId?: string; // Cliente responsable si aplica
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
