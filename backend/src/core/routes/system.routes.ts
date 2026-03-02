/**
 * SYSTEM ROUTES
 * Rutas para health checks, debug y mantenimiento del sistema
 */

import { Router, Request, Response } from "express";
import prisma from "@config/database";
import { authorize } from "@core/middlewares/auth.middleware";

const router = Router();

/**
 * @openapi
 * /system/health:
 *   get:
 *     tags: [System]
 *     summary: Health check del sistema
 *     description: Verifica si la base de datos tiene los datos base necesarios
 *     responses:
 *       200:
 *         description: Estado del sistema
 */
router.get("/health", async (req: Request, res: Response) => {
  try {
    // Verificar roles del sistema
    const rolesCount = await prisma.role.count({
      where: { isSystem: true },
    });

    // Verificar business units
    const businessUnitsCount = await prisma.businessUnit.count();

    // Verificar tenants
    const tenantsCount = await prisma.tenant.count();

    // Verificar usuarios
    const usersCount = await prisma.user.count();

    const isHealthy =
      rolesCount >= 5 && businessUnitsCount > 0 && tenantsCount > 0;

    res.json({
      success: true,
      data: {
        status: isHealthy ? "healthy" : "missing_seed_data",
        database: {
          systemRoles: rolesCount,
          businessUnits: businessUnitsCount,
          tenants: tenantsCount,
          users: usersCount,
        },
        recommendations: !isHealthy
          ? [
              rolesCount < 5
                ? "⚠️ Faltan roles del sistema (debe haber al menos 5)"
                : null,
              businessUnitsCount === 0
                ? "⚠️ No hay Business Units creadas"
                : null,
              tenantsCount === 0 ? "⚠️ No hay Tenants creados" : null,
            ].filter(Boolean)
          : [],
        seedRequired: !isHealthy,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: "HEALTH_CHECK_FAILED",
        message: error.message,
      },
    });
  }
});

/**
 * @openapi
 * /system/seed-status:
 *   get:
 *     tags: [System]
 *     summary: Verificar estado del seed
 *     description: Indica si se necesita ejecutar el seed
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del seed
 */
router.get(
  "/seed-status",
  authorize("system:read"),
  async (req: Request, res: Response) => {
    try {
      const roles = await prisma.role.findMany({
        where: { isSystem: true },
        select: { id: true, name: true },
      });

      const businessUnits = await prisma.businessUnit.findMany({
        take: 5,
        select: { id: true, name: true, slug: true },
      });

      const tenants = await prisma.tenant.findMany({
        take: 5,
        select: { id: true, name: true, slug: true },
      });

      const needsSeed =
        roles.length < 5 || businessUnits.length === 0 || tenants.length === 0;

      res.json({
        success: true,
        data: {
          needsSeed,
          roles: {
            count: roles.length,
            expected: 5,
            names: roles.map((r) => r.name),
            missing: 5 - roles.length,
          },
          businessUnits: {
            count: businessUnits.length,
            list: businessUnits,
          },
          tenants: {
            count: tenants.length,
            list: tenants,
          },
          seedCommand: needsSeed ? "npx prisma db seed" : null,
          message: needsSeed
            ? "⚠️ Base de datos incompleta. Ejecuta el seed."
            : "✅ Base de datos correctamente inicializada.",
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "SEED_STATUS_CHECK_FAILED",
          message: error.message,
        },
      });
    }
  },
);

export default router;
