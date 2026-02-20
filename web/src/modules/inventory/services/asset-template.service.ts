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
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance: boolean;
  requiresDocumentation: boolean;

  // Nuevos campos RENTAL
  attachments?: TemplateAttachments;
  presentation?: ProductPresentation;
  technicalSpecs?: Record<string, any>;
  compatibleWith?: CompatibilityConfig;
  businessRules?: BusinessRules;
  rentalPricing?: RentalPricing; // Precios de alquiler y peso
  hasExpiryDate: boolean;
  requiresLotTracking: boolean;
  isDangerous: boolean;
  hazardClass?: string;

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

export interface RentalPricing {
  // Peso (para cálculo de transporte)
  weight?: number; // kg

  // Precios de alquiler (solo para MACHINERY, IMPLEMENT, VEHICLE, TOOL)
  pricePerHour?: number; // Para MACHINERY principalmente
  minDailyHours?: number; // STANDBY: horas mínimas garantizadas/día
  pricePerDay?: number; // Para todos los alquilables
  pricePerWeek?: number; // Opcional
  pricePerMonth?: number; // Opcional

  // Costo de operario
  operatorCostType?: "PER_DAY" | "PER_HOUR"; // null = sin operario
  operatorCostRate?: number; // Tarifa del operario

  // Transporte
  pricePerKm?: number; // Costo por km de transporte (opcional)
}

export interface CreateTemplateInput {
  name: string;
  category: AssetCategory;
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance: boolean;
  requiresDocumentation: boolean;

  // Nuevos campos RENTAL
  attachments?: TemplateAttachments;
  presentation?: ProductPresentation;
  technicalSpecs?: Record<string, any>;
  compatibleWith?: CompatibilityConfig;
  businessRules?: BusinessRules;
  rentalPricing?: RentalPricing; // Precios de alquiler y peso
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
  requiresPreventiveMaintenance?: boolean;
  requiresDocumentation?: boolean;

  // Nuevos campos RENTAL
  attachments?: TemplateAttachments;
  presentation?: ProductPresentation;
  technicalSpecs?: Record<string, any>;
  compatibleWith?: CompatibilityConfig;
  businessRules?: BusinessRules;
  rentalPricing?: RentalPricing; // Precios de alquiler y peso
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
      data: AssetTemplate[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }>(`${this.basePath}?${params}`);

    console.log("Asset Templates API Response:", response.data); // Debug log
    return response.data;
  }

  /**
   * Obtener plantilla por ID
   */
  async getById(id: string) {
    const response = await api.get<{
      success: boolean;
      data: AssetTemplate;
    }>(`${this.basePath}/${id}`);

    return response.data.data;
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
