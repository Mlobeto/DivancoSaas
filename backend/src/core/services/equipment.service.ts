import { prisma } from "@config/database";
import { EquipmentCondition, EquipmentStatus } from "@prisma/client";
import { buildPaginationMeta, toSkipTake } from "@core/utils/pagination";

export class EquipmentService {
  async listEquipment(
    tenantId: string,
    businessUnitId: string,
    options: {
      q?: string;
      status?: EquipmentStatus;
      condition?: EquipmentCondition;
      category?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const { skip, take } = toSkipTake({ page, limit });

    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (options.status) where.status = options.status;
    if (options.condition) where.condition = options.condition;
    if (options.category) {
      where.category = { contains: options.category, mode: "insensitive" };
    }

    if (options.q) {
      const q = options.q.trim();
      if (q.length > 0) {
        where.OR = [
          { code: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }
    }

    const [rows, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          tenantId: true,
          businessUnitId: true,
          code: true,
          name: true,
          category: true,
          description: true,
          specifications: true,
          dailyRate: true,
          weeklyRate: true,
          monthlyRate: true,
          status: true,
          condition: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.equipment.count({ where }),
    ]);

    return {
      data: rows,
      pagination: buildPaginationMeta({ page, limit }, total),
    };
  }
  async createEquipment(
    tenantId: string,
    businessUnitId: string,
    data: {
      code: string;
      name: string;
      category: string;
      description?: string;
      specifications?: any;
      dailyRate?: number;
      weeklyRate?: number;
      monthlyRate?: number;
      status?: EquipmentStatus;
      condition?: EquipmentCondition;
    },
  ) {
    return prisma.equipment.create({
      data: {
        tenantId,
        businessUnitId,
        code: data.code,
        name: data.name,
        category: data.category,
        description: data.description,
        specifications: data.specifications || {},
        dailyRate: data.dailyRate || 0,
        weeklyRate: data.weeklyRate || 0,
        monthlyRate: data.monthlyRate || 0,
        status: data.status || EquipmentStatus.AVAILABLE,
        condition: data.condition || EquipmentCondition.GOOD,
      },
    });
  }

  async getEquipmentById(tenantId: string, businessUnitId: string, id: string) {
    return prisma.equipment.findFirst({
      where: { id, tenantId, businessUnitId },
    });
  }

  async updateEquipment(
    tenantId: string,
    businessUnitId: string,
    id: string,
    data: {
      code?: string;
      name?: string;
      category?: string;
      description?: string;
      specifications?: any;
      dailyRate?: number;
      weeklyRate?: number;
      monthlyRate?: number;
      status?: EquipmentStatus;
      condition?: EquipmentCondition;
    },
  ) {
    return prisma.equipment.update({
      where: { id, tenantId, businessUnitId },
      data,
    });
  }

  async deleteEquipment(tenantId: string, businessUnitId: string, id: string) {
    return prisma.equipment.delete({
      where: { id, tenantId, businessUnitId },
    });
  }
}
