import { prisma } from "@config/database";
import { toSkipTake, buildPaginationMeta } from "@core/utils/pagination";

export class ModuleService {
  async listModules(
    options: {
      search?: string;
      category?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const { skip, take } = toSkipTake({ page, limit });

    const where: any = {};

    if (typeof options.isActive === "boolean") {
      where.isActive = options.isActive;
    }

    if (options.category) {
      where.category = { equals: options.category, mode: "insensitive" };
    }

    if (options.search) {
      const q = options.search.trim();
      if (q.length > 0) {
        where.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { displayName: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
          { category: { contains: q, mode: "insensitive" } },
        ];
      }
    }

    const [modules, total] = await Promise.all([
      prisma.module.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          name: true,
          displayName: true,
          description: true,
          version: true,
          category: true,
          isActive: true,
          defaultConfig: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      }),
      prisma.module.count({ where }),
    ]);

    return {
      data: modules,
      pagination: buildPaginationMeta({ page, limit }, total),
    };
  }

  async listBusinessUnitModules(
    businessUnitId: string,
    options: {
      enabled?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 50;
    const { skip, take } = toSkipTake({ page, limit });

    const where: any = { businessUnitId };

    if (typeof options.enabled === "boolean") {
      where.isEnabled = options.enabled;
    }

    if (options.search) {
      const q = options.search.trim();
      if (q.length > 0) {
        where.module = {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        };
      }
    }

    const [rows, total] = await Promise.all([
      prisma.businessUnitModule.findMany({
        where,
        skip,
        take,
        select: {
          id: true,
          businessUnitId: true,
          moduleId: true,
          isEnabled: true,
          config: true,
          createdAt: true,
          updatedAt: true,
          module: {
            select: {
              name: true,
              displayName: true,
              description: true,
              version: true,
              category: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ createdAt: "desc" }],
      }),
      prisma.businessUnitModule.count({ where }),
    ]);

    return {
      data: rows.map((row) => ({
        id: row.id,
        businessUnitId: row.businessUnitId,
        moduleId: row.moduleId,
        isEnabled: row.isEnabled,
        configuration: row.config,
        activatedAt: row.createdAt,
        module: row.module,
      })),
      pagination: buildPaginationMeta({ page, limit }, total),
    };
  }

  async enableModule(businessUnitId: string, moduleId: string, config?: any) {
    // Verificar que el módulo existe y está activo
    const module = await prisma.module.findFirst({
      where: { id: moduleId, isActive: true },
    });

    if (!module) {
      throw new Error("Module not found or inactive");
    }

    // Verificar que la BU existe
    const bu = await prisma.businessUnit.findUnique({
      where: { id: businessUnitId },
    });

    if (!bu) {
      throw new Error("Business Unit not found");
    }

    // Verificar si ya está habilitado
    const existing = await prisma.businessUnitModule.findUnique({
      where: {
        businessUnitId_moduleId: {
          businessUnitId,
          moduleId,
        },
      },
    });

    if (existing) {
      if (existing.isEnabled) {
        throw new Error("Module already enabled");
      }

      // Reactivar módulo previamente deshabilitado
      return prisma.businessUnitModule.update({
        where: {
          businessUnitId_moduleId: {
            businessUnitId,
            moduleId,
          },
        },
        data: {
          isEnabled: true,
          config: config || existing.config,
        },
      });
    }

    // Crear nueva habilitación
    return prisma.businessUnitModule.create({
      data: {
        businessUnitId,
        moduleId,
        isEnabled: true,
        config: config || module.defaultConfig || {},
      },
    });
  }

  async disableModule(businessUnitId: string, moduleId: string) {
    const buModule = await prisma.businessUnitModule.findUnique({
      where: {
        businessUnitId_moduleId: {
          businessUnitId,
          moduleId,
        },
      },
    });

    if (!buModule) {
      throw new Error("Module not enabled in this Business Unit");
    }

    if (!buModule.isEnabled) {
      throw new Error("Module is already disabled");
    }

    return prisma.businessUnitModule.update({
      where: {
        businessUnitId_moduleId: {
          businessUnitId,
          moduleId,
        },
      },
      data: {
        isEnabled: false,
      },
    });
  }
}
