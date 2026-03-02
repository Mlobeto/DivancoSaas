/**
 * CONTRACT CLAUSE SERVICE
 * Gestión de cláusulas modulares para contratos de alquiler
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";

// ============================================
// TYPES
// ============================================

export interface ContractClause {
  id: string;
  tenantId: string;
  businessUnitId?: string | null;
  code: string;
  name: string;
  category: string;
  content: string;
  order: number;
  applicableAssetTypes: string[];
  requiresOperator: boolean;
  minimumValue?: Decimal | null;
  isActive: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClauseParams {
  tenantId: string;
  businessUnitId?: string;
  code: string;
  name: string;
  category: string;
  content: string;
  order?: number;
  applicableAssetTypes: string[];
  requiresOperator?: boolean;
  minimumValue?: number;
  metadata?: any;
}

export interface UpdateClauseParams {
  name?: string;
  category?: string;
  content?: string;
  order?: number;
  applicableAssetTypes?: string[];
  requiresOperator?: boolean;
  minimumValue?: number;
  isActive?: boolean;
  metadata?: any;
}

export interface ClauseApplicabilityContext {
  assetTypes: string[]; // Tipos únicos de assets en el contrato
  hasOperatorAssets: boolean; // ¿Hay assets que requieren operario?
  contractValue: number; // estimatedTotal del contrato
}

// ============================================
// SERVICE
// ============================================

export class ContractClauseService {
  /**
   * Crear cláusula
   */
  async createClause(params: CreateClauseParams): Promise<ContractClause> {
    const clause = await prisma.contractClause.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        code: params.code,
        name: params.name,
        category: params.category,
        content: params.content,
        order: params.order ?? 0,
        applicableAssetTypes: params.applicableAssetTypes,
        requiresOperator: params.requiresOperator ?? false,
        minimumValue: params.minimumValue
          ? new Decimal(params.minimumValue)
          : null,
        metadata: params.metadata,
      },
    });

    return clause as ContractClause;
  }

  /**
   * Obtener cláusula por ID
   */
  async getClauseById(clauseId: string): Promise<ContractClause | null> {
    const clause = await prisma.contractClause.findUnique({
      where: { id: clauseId },
    });

    return clause as ContractClause | null;
  }

  /**
   * Obtener cláusula por código
   */
  async getClauseByCode(
    tenantId: string,
    code: string,
  ): Promise<ContractClause | null> {
    const clause = await prisma.contractClause.findUnique({
      where: {
        tenantId_code: { tenantId, code },
      },
    });

    return clause as ContractClause | null;
  }

  /**
   * Listar cláusulas
   */
  async listClauses(filters: {
    tenantId: string;
    businessUnitId?: string;
    category?: string;
    isActive?: boolean;
  }): Promise<ContractClause[]> {
    const where: any = {
      tenantId: filters.tenantId,
    };

    if (filters.businessUnitId !== undefined) {
      where.businessUnitId = filters.businessUnitId;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const clauses = await prisma.contractClause.findMany({
      where,
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });

    return clauses as ContractClause[];
  }

  /**
   * Actualizar cláusula
   */
  async updateClause(
    clauseId: string,
    params: UpdateClauseParams,
  ): Promise<ContractClause> {
    const data: any = {};

    if (params.name !== undefined) data.name = params.name;
    if (params.category !== undefined) data.category = params.category;
    if (params.content !== undefined) data.content = params.content;
    if (params.order !== undefined) data.order = params.order;
    if (params.applicableAssetTypes !== undefined)
      data.applicableAssetTypes = params.applicableAssetTypes;
    if (params.requiresOperator !== undefined)
      data.requiresOperator = params.requiresOperator;
    if (params.minimumValue !== undefined) {
      data.minimumValue = params.minimumValue
        ? new Decimal(params.minimumValue)
        : null;
    }
    if (params.isActive !== undefined) data.isActive = params.isActive;
    if (params.metadata !== undefined) data.metadata = params.metadata;

    const clause = await prisma.contractClause.update({
      where: { id: clauseId },
      data,
    });

    return clause as ContractClause;
  }

  /**
   * Eliminar cláusula
   */
  async deleteClause(clauseId: string): Promise<void> {
    await prisma.contractClause.delete({
      where: { id: clauseId },
    });
  }

  /**
   * Obtener cláusulas aplicables para un contrato
   * Esta es la función CORE que decide qué cláusulas incluir en el PDF
   */
  async getApplicableClauses(
    tenantId: string,
    context: ClauseApplicabilityContext,
  ): Promise<ContractClause[]> {
    // 1. Buscar todas las cláusulas activas que matcheen con algún assetType
    const candidateClauses = await prisma.contractClause.findMany({
      where: {
        tenantId,
        isActive: true,
        OR: [
          // Cláusulas que aplican a tipos específicos de assets
          ...context.assetTypes.map((type) => ({
            applicableAssetTypes: { has: type },
          })),
          // Cláusulas generales (applicableAssetTypes vacío = aplica a todos)
          { applicableAssetTypes: { isEmpty: true } },
        ],
      },
      orderBy: { order: "asc" },
    });

    // 2. Filtrar por condiciones adicionales
    const applicableClauses = candidateClauses.filter((clause) => {
      // Condición: requiere operario
      if (clause.requiresOperator && !context.hasOperatorAssets) {
        return false;
      }

      // Condición: valor mínimo
      if (clause.minimumValue) {
        const minValue = Number(clause.minimumValue);
        if (context.contractValue < minValue) {
          return false;
        }
      }

      return true;
    });

    return applicableClauses as ContractClause[];
  }

  /**
   * Construir contexto de aplicabilidad desde un contrato
   */
  async buildContextFromContract(
    contractId: string,
  ): Promise<ClauseApplicabilityContext> {
    const contract = await prisma.rentalContract.findUnique({
      where: { id: contractId },
      include: {
        quotation: {
          include: {
            items: {
              include: { asset: true },
            },
          },
        },
      },
    });

    if (!contract) {
      throw new Error(`Contract ${contractId} not found`);
    }

    // Extraer tipos únicos de assets
    const assetTypes = [
      ...new Set(
        contract.quotation?.items
          .filter((item) => item.assetId && item.asset)
          .map((item) => item.asset!.assetType) || [],
      ),
    ];

    // Detectar si hay assets que requieren operario
    const hasOperatorAssets =
      contract.quotation?.items.some(
        (item) => item.asset?.requiresOperator === true,
      ) ?? false;

    // Valor del contrato
    const contractValue = Number(contract.estimatedTotal ?? 0);

    return {
      assetTypes,
      hasOperatorAssets,
      contractValue,
    };
  }
}

export const contractClauseService = new ContractClauseService();
