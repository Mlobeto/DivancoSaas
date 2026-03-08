/**
 * CONTRACT CLAUSE TEMPLATE SERVICE
 * Gestión de plantillas de cláusulas reutilizables (Master Contract System v7.0)
 *
 * Características:
 * - Plantillas con variables interpolables: {{clientName}}, {{contractCode}}, etc.
 * - Categorización de cláusulas
 * - Filtrado por tipo de activo
 * - Sistema de cláusulas por defecto para generación automática
 * - Orden personalizable
 */

import prisma from "@config/database";
import type { ContractClauseTemplate } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface CreateClauseTemplateParams {
  tenantId: string;
  businessUnitId?: string;

  // Contenido
  name: string;
  content: string; // Puede incluir variables: {{clientName}}, {{contractCode}}, etc.
  category: string; // general, safety, maintenance, insurance, liability, termination, etc.

  // Opciones
  isDefault?: boolean; // Si se incluye automáticamente en nuevos contratos
  displayOrder?: number;
  applicableAssetTypes?: string[]; // null = aplica a todos

  metadata?: any;
}

export interface UpdateClauseTemplateParams {
  templateId: string;
  name?: string;
  content?: string;
  category?: string;
  isDefault?: boolean;
  displayOrder?: number;
  applicableAssetTypes?: string[];
  isActive?: boolean;
  metadata?: any;
}

export interface ListClauseTemplatesParams {
  tenantId: string;
  businessUnitId?: string;
  category?: string;
  isDefault?: boolean;
  isActive?: boolean;
  assetType?: string; // Filtrar por tipo de activo aplicable
}

export interface InterpolateClauseParams {
  content: string;
  variables: Record<string, string>;
}

// ============================================
// SERVICE
// ============================================

export class ContractClauseTemplateService {
  /**
   * Crear plantilla de cláusula
   */
  async createTemplate(
    params: CreateClauseTemplateParams,
  ): Promise<ContractClauseTemplate> {
    // 1. Validar que no existe template con el mismo nombre
    const existingTemplate = await prisma.contractClauseTemplate.findFirst({
      where: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        name: params.name,
      },
    });

    if (existingTemplate) {
      throw new Error(
        `A clause template with name "${params.name}" already exists`,
      );
    }

    // 2. Si no se especifica displayOrder, usar el siguiente disponible
    let displayOrder = params.displayOrder;
    if (displayOrder === undefined) {
      const maxOrder = await prisma.contractClauseTemplate.aggregate({
        where: {
          tenantId: params.tenantId,
          businessUnitId: params.businessUnitId,
        },
        _max: {
          displayOrder: true,
        },
      });

      displayOrder = (maxOrder._max.displayOrder || 0) + 1;
    }

    // 3. Crear template
    const template = await prisma.contractClauseTemplate.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        name: params.name,
        content: params.content,
        category: params.category,
        isDefault: params.isDefault || false,
        displayOrder,
        applicableAssetTypes: params.applicableAssetTypes || [],
        isActive: true,
        metadata: params.metadata,
      },
    });

    return template;
  }

  /**
   * Actualizar plantilla de cláusula
   */
  async updateTemplate(
    params: UpdateClauseTemplateParams,
  ): Promise<ContractClauseTemplate> {
    // 1. Verificar que existe
    const template = await prisma.contractClauseTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      throw new Error("Contract clause template not found");
    }

    // 2. Si se cambia el nombre, verificar que no exista otro con ese nombre
    if (params.name && params.name !== template.name) {
      const existingTemplate = await prisma.contractClauseTemplate.findFirst({
        where: {
          tenantId: template.tenantId,
          businessUnitId: template.businessUnitId,
          name: params.name,
          id: { not: params.templateId },
        },
      });

      if (existingTemplate) {
        throw new Error(
          `A clause template with name "${params.name}" already exists`,
        );
      }
    }

    // 3. Actualizar
    const updatedTemplate = await prisma.contractClauseTemplate.update({
      where: { id: params.templateId },
      data: {
        name: params.name,
        content: params.content,
        category: params.category,
        isDefault: params.isDefault,
        displayOrder: params.displayOrder,
        applicableAssetTypes: params.applicableAssetTypes,
        isActive: params.isActive,
        metadata: params.metadata,
      },
    });

    return updatedTemplate;
  }

  /**
   * Obtener plantilla por ID
   */
  async getTemplateById(templateId: string) {
    const template = await prisma.contractClauseTemplate.findUnique({
      where: { id: templateId },
      include: {
        tenant: {
          select: {
            name: true,
          },
        },
        businessUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!template) {
      throw new Error("Contract clause template not found");
    }

    return template;
  }

  /**
   * Listar plantillas con filtros
   */
  async listTemplates(params: ListClauseTemplatesParams) {
    // Build where clause conditionally
    const where: any = {
      tenantId: params.tenantId,
      businessUnitId: params.businessUnitId,
      category: params.category,
      isDefault: params.isDefault,
      isActive: params.isActive,
    };

    // Filtrar por tipo de activo aplicable
    if (params.assetType) {
      where.OR = [
        { applicableAssetTypes: { isEmpty: true } },
        { applicableAssetTypes: { has: params.assetType } },
      ];
    }

    const templates = await prisma.contractClauseTemplate.findMany({
      where,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    });

    return templates;
  }

  /**
   * Obtener plantillas por defecto (para auto-incluir en contratos)
   */
  async getDefaultTemplates(
    tenantId: string,
    businessUnitId?: string,
    assetType?: string,
  ) {
    return this.listTemplates({
      tenantId,
      businessUnitId,
      isDefault: true,
      isActive: true,
      assetType,
    });
  }

  /**
   * Obtener plantillas por categoría
   */
  async getTemplatesByCategory(
    tenantId: string,
    category: string,
    businessUnitId?: string,
  ) {
    return this.listTemplates({
      tenantId,
      businessUnitId,
      category,
      isActive: true,
    });
  }

  /**
   * Interpolar variables en contenido de cláusula
   *
   * Variables disponibles:
   * - {{clientName}}, {{clientRfc}}, {{clientAddress}}
   * - {{contractCode}}, {{contractDate}}, {{contractAmount}}
   * - {{creditLimit}}, {{timeLimit}}
   * - {{ownerName}}, {{businessUnitName}}
   * - etc.
   */
  interpolateClause(params: InterpolateClauseParams): string {
    let interpolated = params.content;

    // Reemplazar cada variable
    Object.entries(params.variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      interpolated = interpolated.replace(regex, value);
    });

    // Advertir si quedan variables sin reemplazar
    const unreplacedVars = interpolated.match(/{{[^}]+}}/g);
    if (unreplacedVars) {
      console.warn(
        `Warning: Unresolved variables in clause: ${unreplacedVars.join(", ")}`,
      );
    }

    return interpolated;
  }

  /**
   * Generar cláusulas interpoladas para un contrato
   */
  async generateContractClauses(params: {
    tenantId: string;
    businessUnitId?: string;
    assetType?: string;
    variables: Record<string, string>;
  }) {
    // 1. Obtener plantillas por defecto
    const templates = await this.getDefaultTemplates(
      params.tenantId,
      params.businessUnitId,
      params.assetType,
    );

    // 2. Interpolar cada plantilla
    const clauses = templates.map((template) => ({
      name: template.name,
      content: this.interpolateClause({
        content: template.content,
        variables: params.variables,
      }),
      category: template.category,
      displayOrder: template.displayOrder,
      templateId: template.id,
    }));

    return clauses;
  }

  /**
   * Desactivar plantilla (soft delete)
   */
  async deactivateTemplate(templateId: string) {
    const template = await prisma.contractClauseTemplate.update({
      where: { id: templateId },
      data: { isActive: false },
    });

    return template;
  }

  /**
   * Reactivar plantilla
   */
  async activateTemplate(templateId: string) {
    const template = await prisma.contractClauseTemplate.update({
      where: { id: templateId },
      data: { isActive: true },
    });

    return template;
  }

  /**
   * Eliminar plantilla (hard delete)
   */
  async deleteTemplate(templateId: string) {
    // Verificar que no esté en uso
    // TODO: Agregar verificación cuando tengamos relación con contratos
    // const usageCount = await prisma.rentalContract.count({
    //   where: { clauseTemplates: { some: { id: templateId } } }
    // });
    //
    // if (usageCount > 0) {
    //   throw new Error('Cannot delete template that is in use by contracts');
    // }

    await prisma.contractClauseTemplate.delete({
      where: { id: templateId },
    });

    return { success: true };
  }

  /**
   * Reordenar plantillas
   */
  async reorderTemplates(params: {
    tenantId: string;
    businessUnitId?: string;
    templateIds: string[]; // Array de IDs en el nuevo orden
  }) {
    // Actualizar displayOrder de cada template
    await prisma.$transaction(
      params.templateIds.map((templateId, index) =>
        prisma.contractClauseTemplate.update({
          where: {
            id: templateId,
            tenantId: params.tenantId,
            businessUnitId: params.businessUnitId,
          },
          data: {
            displayOrder: index + 1,
          },
        }),
      ),
    );

    return { success: true };
  }

  /**
   * Duplicar plantilla
   */
  async duplicateTemplate(templateId: string, newName: string) {
    const original = await this.getTemplateById(templateId);

    const duplicate = await this.createTemplate({
      tenantId: original.tenantId,
      businessUnitId: original.businessUnitId || undefined,
      name: newName,
      content: original.content,
      category: original.category,
      isDefault: false, // Las duplicadas no son default por seguridad
      applicableAssetTypes: original.applicableAssetTypes || undefined,
      metadata: original.metadata,
    });

    return duplicate;
  }
}

export const contractClauseTemplateService =
  new ContractClauseTemplateService();
