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
  MACHINERY = "MACHINERY",
  IMPLEMENT = "IMPLEMENT",
  VEHICLE = "VEHICLE",
  TOOL = "TOOL",
}

export const AssetCategoryLabels: Record<AssetCategory, string> = {
  [AssetCategory.MACHINERY]: "Maquinaria",
  [AssetCategory.IMPLEMENT]: "Implemento",
  [AssetCategory.VEHICLE]: "Vehículo",
  [AssetCategory.TOOL]: "Herramienta",
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
  customFields: CustomField[];
  createdAt: string;
  updatedAt: string;
  _count?: {
    assets: number;
  };
}

export interface CreateTemplateInput {
  name: string;
  category: AssetCategory;
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance: boolean;
  requiresDocumentation: boolean;
  customFields: CustomField[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance?: boolean;
  requiresDocumentation?: boolean;
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
