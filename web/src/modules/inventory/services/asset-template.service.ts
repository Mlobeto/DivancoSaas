/**
 * ASSET TEMPLATE SERVICE
 * Cliente para consumir API de plantillas de activos
 */

import api from "@/lib/api";

// ============================================
// TYPES
// ============================================

export enum FieldType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  SELECT = "SELECT",
  MULTISELECT = "MULTISELECT",
  BOOLEAN = "BOOLEAN",
  TEXTAREA = "TEXTAREA",
}

export enum AssetCategory {
  // Equipos
  MACHINERY = "MACHINERY",
  IMPLEMENT = "IMPLEMENT",
  VEHICLE = "VEHICLE",
  TOOL = "TOOL",
  // Insumos
  SUPPLY_FUEL = "SUPPLY_FUEL",
  SUPPLY_OIL = "SUPPLY_OIL",
  SUPPLY_PAINT = "SUPPLY_PAINT",
  SUPPLY_SPARE_PART = "SUPPLY_SPARE_PART",
  SUPPLY_CONSUMABLE = "SUPPLY_CONSUMABLE",
  SUPPLY_SAFETY = "SUPPLY_SAFETY",
}

export const AssetCategoryLabels: Record<AssetCategory, string> = {
  [AssetCategory.MACHINERY]: "Maquinaria Pesada",
  [AssetCategory.IMPLEMENT]: "Implementos",
  [AssetCategory.VEHICLE]: "Vehículos",
  [AssetCategory.TOOL]: "Herramientas",
  [AssetCategory.SUPPLY_FUEL]: "Combustibles",
  [AssetCategory.SUPPLY_OIL]: "Aceites y Lubricantes",
  [AssetCategory.SUPPLY_PAINT]: "Pinturas y Solventes",
  [AssetCategory.SUPPLY_SPARE_PART]: "Repuestos y Partes",
  [AssetCategory.SUPPLY_CONSUMABLE]: "Consumibles Generales",
  [AssetCategory.SUPPLY_SAFETY]: "Equipo de Seguridad",
};

/** Determina si una categoría es alquilable (equipo/vehículo, no insumo) */
export const isRentableCategory = (cat: AssetCategory) =>
  [
    AssetCategory.MACHINERY,
    AssetCategory.IMPLEMENT,
    AssetCategory.VEHICLE,
    AssetCategory.TOOL,
  ].includes(cat);

/** Determina si una categoría es insumo/consumible */
export const isSupplyCategory = (cat: AssetCategory) =>
  cat.startsWith("SUPPLY_");

export const FieldTypeLabels: Record<FieldType, string> = {
  [FieldType.TEXT]: "Texto",
  [FieldType.NUMBER]: "Número",
  [FieldType.DATE]: "Fecha",
  [FieldType.SELECT]: "Selección",
  [FieldType.MULTISELECT]: "Selección múltiple",
  [FieldType.BOOLEAN]: "Sí/No",
  [FieldType.TEXTAREA]: "Texto largo",
};

export interface CustomField {
  key: string;
  label: string;
  type: FieldType;
  section: string;
  order: number;
  required: boolean;
  validations?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  placeholder?: string;
  helperText?: string;
}

export interface AssetTemplate {
  id: string;
  businessUnitId: string;
  name: string;
  category: AssetCategory;
  managementType: "UNIT" | "BULK";
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance: boolean;
  requiresDocumentation: boolean;

  // Stock
  minStockLevel?: number;
  requiresWeight?: boolean; // Si al registrar el activo se debe ingresar su peso

  // Nuevos campos RENTAL
  presentation?: ProductPresentation;
  technicalSpecs?: Record<string, any>;
  compatibleWith?: CompatibilityConfig;
  businessRules?: BusinessRules;
  rentalRules?: RentalRules; // Modalidades y reglas de alquiler
  hasExpiryDate: boolean;
  requiresLotTracking: boolean;
  isDangerous: boolean;
  hazardClass?: string;

  // Relación de partes y mantenimiento preventivo
  machineParts?: MachinePart[];
  maintenanceSchedule?: MaintenanceScheduleItem[];

  customFields: CustomField[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface TemplateAttachments {
  manuals?: AttachmentFile[];
  images?: AttachmentImage[];
  certifications?: AttachmentFile[];
  msds?: {
    url: string;
    version: string;
    updatedAt: string;
  };
}

export interface AttachmentFile {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

export interface AttachmentImage {
  url: string;
  description?: string;
  isPrimary?: boolean;
}

export interface ProductPresentation {
  unit?: string;
  containerSize?: number;
  containerType?: string;
}

export interface CompatibilityConfig {
  equipmentCategories?: AssetCategory[];
  equipmentIds?: string[];
}

export interface BusinessRules {
  requiresTransport?: boolean;
  requiresOperator?: boolean;
  requiresInsurance?: boolean;
  autoSuggestSupplies?: string[];
}

export interface RentalRules {
  // Modalidades habilitadas (los precios van en cada activo individual)
  allowsHourly: boolean;
  allowsDaily: boolean;
  allowsWeekly: boolean;
  allowsMonthly: boolean;

  // Standby: horas mínimas garantizadas por día
  // Aplica cuando se cobra por hora; en semana se calcula automáticamente
  minDailyHours?: number;

  // Operario
  requiresOperator: boolean;
  operatorBillingType?: "PER_DAY" | "PER_HOUR";

  // Transporte
  chargesKm: boolean;
}

export interface MachinePart {
  description: string;
  quantity: number;
  observations?: string;
}

export interface MaintenanceScheduleItem {
  periodicity: string; // Ej: "250 horas", "ANUAL", "SEMANAL"
  description: string;
  requiredItems?: string;
}

export interface CreateTemplateInput {
  name: string;
  category: AssetCategory;
  managementType?: "UNIT" | "BULK";
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance: boolean;
  requiresDocumentation: boolean;

  // Stock
  minStockLevel?: number; // Solo BULK: alerta mínima de stock
  requiresWeight?: boolean; // Si al crear el activo se debe registrar el peso

  // Relácion de partes y mantenimiento preventivo
  machineParts?: MachinePart[];
  maintenanceSchedule?: MaintenanceScheduleItem[];

  // Nuevos campos RENTAL
  presentation?: ProductPresentation;
  technicalSpecs?: Record<string, any>;
  compatibleWith?: CompatibilityConfig;
  businessRules?: BusinessRules;
  rentalRules?: RentalRules; // Modalidades y reglas de alquiler
  hasExpiryDate?: boolean;
  requiresLotTracking?: boolean;
  isDangerous?: boolean;
  hazardClass?: string;

  customFields: CustomField[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  icon?: string;
  managementType?: "UNIT" | "BULK";
  requiresPreventiveMaintenance?: boolean;
  requiresDocumentation?: boolean;

  // Stock
  minStockLevel?: number;
  requiresWeight?: boolean;

  // Relación de partes y mantenimiento preventivo
  machineParts?: MachinePart[];
  maintenanceSchedule?: MaintenanceScheduleItem[];

  // Nuevos campos RENTAL
  presentation?: ProductPresentation;
  technicalSpecs?: Record<string, any>;
  compatibleWith?: CompatibilityConfig;
  businessRules?: BusinessRules;
  rentalRules?: RentalRules;
  hasExpiryDate?: boolean;
  requiresLotTracking?: boolean;
  isDangerous?: boolean;
  hazardClass?: string;

  customFields?: CustomField[];
}

export interface ListTemplatesOptions {
  category?: AssetCategory;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TemplateStats {
  totalTemplates: number;
  totalAssets: number;
  byCategory: Record<string, number>;
  templates: Array<{
    id: string;
    name: string;
    category: string;
    assetsCount: number;
  }>;
}

// ============================================
// SERVICE
// ============================================

class AssetTemplateService {
  private readonly basePath = "/modules/assets/templates";

  /** Mapea la respuesta cruda de la API al tipo AssetTemplate del frontend.
   *  La DB guarda el campo como `rentalPricing`; el frontend usa `rentalRules`. */
  private mapTemplate(raw: any): AssetTemplate {
    const { rentalPricing, ...rest } = raw;
    return {
      ...rest,
      rentalRules: rentalPricing ?? undefined,
    } as AssetTemplate;
  }

  /**
   * Listar plantillas
   */
  async list(options: ListTemplatesOptions = {}) {
    const params = new URLSearchParams();
    if (options.category) params.append("category", options.category);
    if (options.search) params.append("search", options.search);
    if (options.page) params.append("page", options.page.toString());
    if (options.limit) params.append("limit", options.limit.toString());

    const response = await api.get<{
      success: boolean;
      data: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${this.basePath}?${params}`);

    return {
      ...response.data,
      data: (response.data.data ?? []).map((t) => this.mapTemplate(t)),
    };
  }

  /**
   * Obtener plantilla por ID
   */
  async getById(id: string) {
    const response = await api.get<{
      success: boolean;
      data: any;
    }>(`${this.basePath}/${id}`);

    return this.mapTemplate(response.data.data);
  }

  /**
   * Crear plantilla
   */
  async create(data: CreateTemplateInput) {
    const response = await api.post<{
      success: boolean;
      data: AssetTemplate;
    }>(this.basePath, data);

    return response.data.data;
  }

  /**
   * Actualizar plantilla
   */
  async update(id: string, data: UpdateTemplateInput) {
    const response = await api.put<{
      success: boolean;
      data: AssetTemplate;
    }>(`${this.basePath}/${id}`, data);

    return response.data.data;
  }

  /**
   * Duplicar plantilla
   */
  async duplicate(id: string, newName: string) {
    const response = await api.post<{
      success: boolean;
      data: AssetTemplate;
    }>(`${this.basePath}/${id}/duplicate`, { name: newName });

    return response.data.data;
  }

  /**
   * Eliminar plantilla
   */
  async delete(id: string) {
    await api.delete(`${this.basePath}/${id}`);
  }

  /**
   * Obtener estadísticas
   */
  async getStats() {
    const response = await api.get<{
      success: boolean;
      data: TemplateStats;
    }>(`${this.basePath}/stats`);

    return response.data.data;
  }
}

export const assetTemplateService = new AssetTemplateService();
