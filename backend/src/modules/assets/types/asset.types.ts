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
  salePrice?: number; // OPCIONAL: Precio de venta (retail/liquidación)

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
  salePrice?: number;

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

// ============================================
// BULK INVENTORY TYPES
// ============================================

export enum AssetManagementType {
  UNIT = "UNIT", // Individual tracking - one DB row per physical unit
  BULK = "BULK", // Quantity-based inventory - stock levels only
}

export interface StockLevelDTO {
  id: string;
  businessUnitId: string;
  templateId: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityRented: number;
  location?: string;
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  minStock?: number;
  maxStock?: number;
  notes?: string;
}

export interface AddStockDTO {
  templateId: string;
  quantity: number;
  reason?: string;
  reference?: string; // Purchase order, etc.
  location?: string;
}

export interface ReserveStockDTO {
  templateId: string;
  quantity: number;
  reference?: string; // Quotation ID
  location?: string;
}

export interface RentOutStockDTO {
  templateId: string;
  quantity: number;
  fromReserved?: boolean; // true = from reserved, false = from available
  reference?: string; // Contract ID
  location?: string;
}

export interface ReturnStockDTO {
  templateId: string;
  quantity: number;
  reference?: string; // Contract ID
  location?: string;
}

export interface AdjustStockDTO {
  templateId: string;
  quantityDelta: number; // Positive or negative adjustment
  reason: string;
  notes?: string;
  location?: string;
}

export interface UpdateStockLevelDTO {
  pricePerDay?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;
  minStock?: number;
  maxStock?: number;
  notes?: string;
}

export interface StockMovementDTO {
  id: string;
  stockLevelId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  balanceAfter?: {
    available: number;
    reserved: number;
    rented: number;
  };
  notes?: string;
  createdAt: Date;
  createdBy?: string;
}

export enum StockMovementType {
  PURCHASE = "PURCHASE",
  RENTAL_OUT = "RENTAL_OUT",
  RENTAL_RETURN = "RENTAL_RETURN",
  SALE = "SALE",
  ADJUSTMENT = "ADJUSTMENT",
  LOSS = "LOSS",
  TRANSFER = "TRANSFER",
  RESERVE = "RESERVE",
  UNRESERVE = "UNRESERVE",
}

export interface StockStatsDTO {
  totalTemplates: number;
  totalAvailable: number;
  totalReserved: number;
  totalRented: number;
  totalUnits: number;
  lowStockCount: number;
  lowStockItems: Array<{
    templateId: string;
    templateName: string;
    available: number;
    minStock: number;
  }>;
}
