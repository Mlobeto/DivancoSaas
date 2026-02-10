/**
 * ASSET TEMPLATE SERVICE
 * Gestión de plantillas de activos personalizables
 */

import { prisma } from "@config/database";
import { AppError } from "@core/middlewares/error.middleware";

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
  MACHINERY = "MACHINERY", // Maquinaria pesada
  IMPLEMENT = "IMPLEMENT", // Implementos (andamios, herramientas)
  VEHICLE = "VEHICLE", // Vehículos
  TOOL = "TOOL", // Herramientas menores
}

export interface CustomField {
  key: string; // "brand", "oil_change_km"
  label: string; // "Marca", "Kilómetros para cambio de aceite"
  type: FieldType;
  section: string; // "Información Técnica", "Dimensiones"
  order: number; // Para ordenar visualmente
  required: boolean;
  validations?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[]; // Para SELECT/MULTISELECT
  };
  placeholder?: string;
  helperText?: string;
}

export interface CreateTemplateInput {
  name: string;
  category: AssetCategory;
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance: boolean;
  customFields: CustomField[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  icon?: string;
  requiresPreventiveMaintenance?: boolean;
  customFields?: CustomField[];
}

export interface ListTemplatesOptions {
  category?: AssetCategory;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================
// SERVICE
// ============================================

export class AssetTemplateService {
  /**
   * Listar plantillas de una BusinessUnit
   */
  async listTemplates(
    businessUnitId: string,
    options: ListTemplatesOptions = {},
  ) {
    const { category, search, page = 1, limit = 50 } = options;

    const where: any = {
      businessUnitId,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [templates, total] = await Promise.all([
      prisma.assetTemplate.findMany({
        where,
        orderBy: [{ category: "asc" }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: {
            select: { assets: true },
          },
        },
      }),
      prisma.assetTemplate.count({ where }),
    ]);

    return {
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(templateId: string, businessUnitId: string) {
    const template = await prisma.assetTemplate.findFirst({
      where: { id: templateId, businessUnitId },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    if (!template) {
      throw new AppError(404, "TEMPLATE_NOT_FOUND", "Asset template not found");
    }

    return template;
  }

  /**
   * Crear nueva plantilla
   */
  async createTemplate(data: CreateTemplateInput, businessUnitId: string) {
    // Validar que no exista una plantilla con el mismo nombre
    const existing = await prisma.assetTemplate.findUnique({
      where: {
        businessUnitId_name: {
          businessUnitId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new AppError(
        409,
        "TEMPLATE_EXISTS",
        "A template with this name already exists in this business unit",
      );
    }

    // Validar customFields
    this.validateCustomFields(data.customFields);

    const template = await prisma.assetTemplate.create({
      data: {
        businessUnitId,
        name: data.name,
        category: data.category,
        description: data.description,
        icon: data.icon,
        requiresPreventiveMaintenance: data.requiresPreventiveMaintenance,
        customFields: data.customFields as any,
      },
    });

    return template;
  }

  /**
   * Actualizar plantilla
   */
  async updateTemplate(
    templateId: string,
    data: UpdateTemplateInput,
    businessUnitId: string,
  ) {
    // Verificar que la plantilla existe y pertenece a la BU
    const existing = await prisma.assetTemplate.findFirst({
      where: { id: templateId, businessUnitId },
    });

    if (!existing) {
      throw new AppError(404, "TEMPLATE_NOT_FOUND", "Asset template not found");
    }

    // Si se actualiza el nombre, validar que no exista otro con ese nombre
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.assetTemplate.findUnique({
        where: {
          businessUnitId_name: {
            businessUnitId,
            name: data.name,
          },
        },
      });

      if (duplicate) {
        throw new AppError(
          409,
          "TEMPLATE_EXISTS",
          "A template with this name already exists",
        );
      }
    }

    // Validar customFields si se proporcionan
    if (data.customFields) {
      this.validateCustomFields(data.customFields);
    }

    const template = await prisma.assetTemplate.update({
      where: { id: templateId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.icon !== undefined && { icon: data.icon }),
        ...(data.requiresPreventiveMaintenance !== undefined && {
          requiresPreventiveMaintenance: data.requiresPreventiveMaintenance,
        }),
        ...(data.customFields && { customFields: data.customFields as any }),
      },
    });

    return template;
  }

  /**
   * Eliminar plantilla
   * Solo si no tiene activos asociados
   */
  async deleteTemplate(templateId: string, businessUnitId: string) {
    const template = await prisma.assetTemplate.findFirst({
      where: { id: templateId, businessUnitId },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    if (!template) {
      throw new AppError(404, "TEMPLATE_NOT_FOUND", "Asset template not found");
    }

    if (template._count.assets > 0) {
      throw new AppError(
        400,
        "TEMPLATE_HAS_ASSETS",
        `Cannot delete template with ${template._count.assets} associated assets`,
      );
    }

    await prisma.assetTemplate.delete({
      where: { id: templateId },
    });

    return { message: "Template deleted successfully" };
  }

  /**
   * Validar estructura de customFields
   */
  private validateCustomFields(fields: CustomField[]) {
    if (!Array.isArray(fields)) {
      throw new AppError(
        400,
        "INVALID_CUSTOM_FIELDS",
        "customFields must be an array",
      );
    }

    const keys = new Set<string>();

    for (const field of fields) {
      // Validar campos requeridos
      if (!field.key || !field.label || !field.type || !field.section) {
        throw new AppError(
          400,
          "INVALID_FIELD",
          "Each field must have key, label, type, and section",
        );
      }

      // Validar que las keys sean únicas
      if (keys.has(field.key)) {
        throw new AppError(
          400,
          "DUPLICATE_KEY",
          `Duplicate field key: ${field.key}`,
        );
      }
      keys.add(field.key);

      // Validar tipo de campo
      if (!Object.values(FieldType).includes(field.type)) {
        throw new AppError(
          400,
          "INVALID_FIELD_TYPE",
          `Invalid field type: ${field.type}`,
        );
      }

      // Validar que SELECT/MULTISELECT tengan opciones
      if (
        (field.type === FieldType.SELECT ||
          field.type === FieldType.MULTISELECT) &&
        (!field.validations?.options || field.validations.options.length === 0)
      ) {
        throw new AppError(
          400,
          "MISSING_OPTIONS",
          `Field ${field.key} requires options array`,
        );
      }

      // Validar order
      if (field.order === undefined || field.order < 0) {
        throw new AppError(
          400,
          "INVALID_ORDER",
          `Field ${field.key} must have a valid order number`,
        );
      }
    }
  }

  /**
   * Duplicar plantilla (útil para crear variaciones)
   */
  async duplicateTemplate(
    templateId: string,
    newName: string,
    businessUnitId: string,
  ) {
    const original = await this.getTemplateById(templateId, businessUnitId);

    const duplicate = await this.createTemplate(
      {
        name: newName,
        category: original.category as AssetCategory,
        description: original.description || undefined,
        icon: original.icon || undefined,
        requiresPreventiveMaintenance: original.requiresPreventiveMaintenance,
        customFields: original.customFields as unknown as CustomField[],
      },
      businessUnitId,
    );

    return duplicate;
  }

  /**
   * Obtener estadísticas de uso de plantillas
   */
  async getTemplateStats(businessUnitId: string) {
    const templates = await prisma.assetTemplate.findMany({
      where: { businessUnitId },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const byCategory = templates.reduce(
      (acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalAssets = templates.reduce((sum, t) => sum + t._count.assets, 0);

    return {
      totalTemplates: templates.length,
      totalAssets,
      byCategory,
      templates: templates.map((t) => ({
        id: t.id,
        name: t.name,
        category: t.category,
        assetsCount: t._count.assets,
      })),
    };
  }
}
