import { prisma } from "@config/database";
import { toSkipTake, buildPaginationMeta } from "@core/utils/pagination";

export class BusinessUnitService {
  async listBusinessUnits(
    tenantId: string,
    options: {
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const { skip, take } = toSkipTake({ page, limit });

    const where: any = { tenantId };

    if (options.search) {
      const q = options.search.trim();
      if (q.length > 0) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { slug: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ];
      }
    }

    const [businessUnits, total] = await Promise.all([
      prisma.businessUnit.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          tenantId: true,
          settings: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.businessUnit.count({ where }),
    ]);

    return {
      data: businessUnits,
      pagination: buildPaginationMeta({ page, limit }, total),
    };
  }

  async createBusinessUnit(
    tenantId: string,
    data: {
      name: string;
      slug: string;
      description?: string;
    },
  ) {
    // Validar que el slug no exista
    const existing = await prisma.businessUnit.findFirst({
      where: { tenantId, slug: data.slug },
    });

    if (existing) {
      throw new Error("Business Unit with this slug already exists");
    }

    return prisma.businessUnit.create({
      data: {
        tenantId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        settings: {},
      },
    });
  }

  async getBusinessUnitById(tenantId: string, id: string) {
    const businessUnit = await prisma.businessUnit.findFirst({
      where: { id, tenantId },
      include: {
        _count: {
          select: {
            userBusinessUnits: true,
          },
        },
      },
    });

    if (!businessUnit) {
      return null;
    }

    // Consultar módulos activos por separado
    const activeModules = await prisma.businessUnitModule.findMany({
      where: {
        businessUnitId: id,
        isEnabled: true,
      },
      include: {
        module: {
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
          },
        },
      },
    });

    return {
      id: businessUnit.id,
      name: businessUnit.name,
      slug: businessUnit.slug,
      description: businessUnit.description,
      tenantId: businessUnit.tenantId,
      settings: businessUnit.settings,
      createdAt: businessUnit.createdAt,
      updatedAt: businessUnit.updatedAt,
      usersCount: businessUnit._count.userBusinessUnits,
      activeModules: activeModules.map((bum) => ({
        moduleId: bum.module.id,
        moduleName: bum.module.name,
        displayName: bum.module.displayName,
        description: bum.module.description,
        isActive: bum.isEnabled,
        activatedAt: bum.createdAt,
      })),
    };
  }

  async updateBusinessUnit(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
    },
  ) {
    return prisma.businessUnit.update({
      where: { id, tenantId },
      data: {
        name: data.name,
        description: data.description,
      },
    });
  }

  async deleteBusinessUnit(tenantId: string, id: string) {
    // Verificar que la BU existe y pertenece al tenant
    const bu = await prisma.businessUnit.findFirst({
      where: { id, tenantId },
    });

    if (!bu) {
      throw new Error("Business Unit not found");
    }

    // Eliminar en cascada (Prisma maneja esto por las foreign keys)
    return prisma.businessUnit.delete({
      where: { id, tenantId },
    });
  }
}
