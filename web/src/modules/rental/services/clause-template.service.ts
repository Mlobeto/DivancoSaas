/**
 * CLAUSE TEMPLATE SERVICE
 * Servicio para gestión de plantillas de cláusulas de contrato
 */

import apiClient from "@/lib/api";

// ============================================
// TYPES
// ============================================

export interface ClauseTemplate {
  id: string;
  tenantId: string;
  businessUnitId?: string;
  name: string;
  category: string;
  content: string;
  applicableAssetTypes: string[];
  applicableContractTypes: string[];
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClauseTemplateDTO {
  businessUnitId?: string;
  name: string;
  category: string;
  content: string;
  applicableAssetTypes?: string[];
  applicableContractTypes?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface UpdateClauseTemplateDTO {
  name?: string;
  category?: string;
  content?: string;
  applicableAssetTypes?: string[];
  applicableContractTypes?: string[];
  isActive?: boolean;
  isDefault?: boolean;
  displayOrder?: number;
}

export interface ListClauseTemplatesParams {
  businessUnitId?: string;
  category?: string;
  isActive?: boolean;
  isDefault?: boolean;
  assetType?: string;
  contractType?: string;
  search?: string;
}

export interface InterpolateClauseParams {
  contractId: string;
  variables?: Record<string, any>;
}

export interface InterpolateClauseResponse {
  originalContent: string;
  interpolatedContent: string;
  variables: Record<string, any>;
}

// Categorías de cláusulas
export const CLAUSE_CATEGORIES = [
  {
    value: "general",
    label: "General",
    description: "Cláusulas generales del contrato",
  },
  {
    value: "safety",
    label: "Seguridad",
    description: "Normas de seguridad y operación",
  },
  {
    value: "maintenance",
    label: "Mantenimiento",
    description: "Cuidado y mantenimiento del equipo",
  },
  {
    value: "insurance",
    label: "Seguro",
    description: "Cobertura y responsabilidad",
  },
  {
    value: "liability",
    label: "Responsabilidad",
    description: "Daños y sanciones",
  },
  {
    value: "termination",
    label: "Terminación",
    description: "Devolución y finalización",
  },
  {
    value: "custom",
    label: "Personalizada",
    description: "Cláusulas específicas del cliente",
  },
] as const;

// Tipos de activos comunes
export const COMMON_ASSET_TYPES = [
  { value: "excavadora", label: "Excavadora" },
  { value: "retroexcavadora", label: "Retroexcavadora" },
  { value: "minicargador", label: "Minicargador" },
  { value: "grúa", label: "Grúa" },
  { value: "montacargas", label: "Montacargas" },
  { value: "camioneta", label: "Camioneta" },
  { value: "compresor", label: "Compresor" },
  { value: "planta_electrica", label: "Planta Eléctrica" },
  { value: "andamio", label: "Andamio" },
  { value: "herramienta_menor", label: "Herramienta Menor" },
] as const;

// Tipos de contrato
export const CONTRACT_TYPES = [
  { value: "master", label: "Contrato Marco" },
  { value: "specific", label: "Contrato Específico" },
] as const;

// ============================================
// SERVICE
// ============================================

class ClauseTemplateService {
  /**
   * Listar plantillas de cláusulas
   */
  async list(params?: ListClauseTemplatesParams): Promise<ClauseTemplate[]> {
    const { data } = await apiClient.get<{ data: ClauseTemplate[] }>(
      "/rental/clause-templates",
      { params },
    );
    return data.data;
  }

  /**
   * Obtener plantilla por ID
   */
  async getById(id: string): Promise<ClauseTemplate> {
    const { data } = await apiClient.get<{ data: ClauseTemplate }>(
      `/rental/clause-templates/${id}`,
    );
    return data.data;
  }

  /**
   * Crear plantilla
   */
  async create(dto: CreateClauseTemplateDTO): Promise<ClauseTemplate> {
    const { data } = await apiClient.post<{ data: ClauseTemplate }>(
      "/rental/clause-templates",
      dto,
    );
    return data.data;
  }

  /**
   * Actualizar plantilla
   */
  async update(
    id: string,
    dto: UpdateClauseTemplateDTO,
  ): Promise<ClauseTemplate> {
    const { data } = await apiClient.put<{ data: ClauseTemplate }>(
      `/rental/clause-templates/${id}`,
      dto,
    );
    return data.data;
  }

  /**
   * Eliminar plantilla
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/rental/clause-templates/${id}`);
  }

  /**
   * Activar/Desactivar plantilla
   */
  async toggleActive(id: string, isActive: boolean): Promise<ClauseTemplate> {
    return this.update(id, { isActive });
  }

  /**
   * Duplicar plantilla
   */
  async duplicate(id: string, newName: string): Promise<ClauseTemplate> {
    const original = await this.getById(id);

    return this.create({
      businessUnitId: original.businessUnitId,
      name: newName,
      category: original.category,
      content: original.content,
      applicableAssetTypes: original.applicableAssetTypes,
      applicableContractTypes: original.applicableContractTypes,
      isActive: true,
      isDefault: false,
      displayOrder: original.displayOrder,
    });
  }

  /**
   * Interpolar cláusula con variables de un contrato
   */
  async interpolate(
    id: string,
    params: InterpolateClauseParams,
  ): Promise<InterpolateClauseResponse> {
    const { data } = await apiClient.post<{ data: InterpolateClauseResponse }>(
      `/rental/clause-templates/${id}/interpolate`,
      params,
    );
    return data.data;
  }

  /**
   * Obtener cláusulas aplicables a un tipo de activo
   */
  async getApplicableToAsset(assetType: string): Promise<ClauseTemplate[]> {
    return this.list({ assetType, isActive: true });
  }

  /**
   * Obtener cláusulas por defecto
   */
  async getDefaults(): Promise<ClauseTemplate[]> {
    return this.list({ isDefault: true, isActive: true });
  }

  /**
   * Reordenar cláusulas
   */
  async reorder(clauseIds: string[]): Promise<void> {
    const updates = clauseIds.map((id, index) =>
      this.update(id, { displayOrder: index + 1 }),
    );
    await Promise.all(updates);
  }
}

export const clauseTemplateService = new ClauseTemplateService();
