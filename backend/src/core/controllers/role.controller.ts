import { Request, Response } from "express";
import { permissionService } from "@core/services/permission.service";
import prisma from "@config/database";

/**
 * RoleController
 *
 * Gestión de roles y permisos del sistema RBAC
 */
export class RoleController {
  /**
   * GET /api/v1/roles
   * Lista todos los roles disponibles (system roles + custom roles del tenant)
   *
   * @swagger
   * /api/v1/roles:
   *   get:
   *     summary: Listar roles disponibles
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de roles con sus permisos
   */
  static async list(req: Request, res: Response) {
    try {
      const { tenantId } = req.context!;

      // Buscar roles del sistema (isSystem=true) + roles custom del tenant
      const roles = await prisma.role.findMany({
        where: {
          isSystem: true, // Por ahora solo roles del sistema (OWNER, ADMIN, MANAGER)
          // Futuro: agregar OR con roles custom por tenant
          // OR: [
          //   { isSystem: true },
          //   { tenantId: tenantId }
          // ]
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userBusinessUnits: true, // Contar cuántos usuarios tienen este rol
            },
          },
        },
        orderBy: [
          { isSystem: "desc" }, // System roles primero
          { name: "asc" },
        ],
      });

      // Transformar permisos a formato "resource:action"
      const rolesWithPermissions = roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        usersCount: role._count.userBusinessUnits,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.permission.scope,
          description: rp.permission.description,
          key: `${rp.permission.resource}:${rp.permission.action}`, // Para UI
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));

      res.json({
        success: true,
        data: rolesWithPermissions,
      });
    } catch (error) {
      console.error("Error listing roles:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to list roles",
        },
      });
    }
  }

  /**
   * GET /api/v1/roles/:id
   * Obtiene un rol específico con todos sus permisos
   *
   * @swagger
   * /api/v1/roles/{id}:
   *   get:
   *     summary: Obtener rol por ID
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Rol encontrado
   *       404:
   *         description: Rol no encontrado
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const role = await prisma.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
          _count: {
            select: {
              userBusinessUnits: true,
            },
          },
        },
      });

      if (!role) {
        return res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Role not found",
          },
        });
      }

      const roleWithPermissions = {
        id: role.id,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        usersCount: role._count.userBusinessUnits,
        permissions: role.permissions.map((rp) => ({
          id: rp.permission.id,
          resource: rp.permission.resource,
          action: rp.permission.action,
          scope: rp.permission.scope,
          description: rp.permission.description,
          key: `${rp.permission.resource}:${rp.permission.action}`,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      };

      res.json({
        success: true,
        data: roleWithPermissions,
      });
    } catch (error) {
      console.error("Error getting role:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get role",
        },
      });
    }
  }

  /**
   * GET /api/v1/roles/:id/permissions
   * Obtiene solo los permisos de un rol (más ligero que getById)
   *
   * @swagger
   * /api/v1/roles/{id}/permissions:
   *   get:
   *     summary: Obtener permisos de un rol
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Lista de permisos del rol
   */
  static async getPermissions(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const permissions = await permissionService.getRolePermissions(id);

      const formattedPermissions = permissions.map((p) => ({
        id: p.id,
        resource: p.resource,
        action: p.action,
        scope: p.scope,
        description: p.description,
        key: `${p.resource}:${p.action}`,
      }));

      res.json({
        success: true,
        data: formattedPermissions,
      });
    } catch (error) {
      console.error("Error getting role permissions:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to get role permissions",
        },
      });
    }
  }

  /**
   * GET /api/v1/permissions
   * Lista todos los permisos disponibles en el sistema
   * (útil para asignar permisos a roles custom en el futuro)
   *
   * @swagger
   * /api/v1/permissions:
   *   get:
   *     summary: Listar todos los permisos disponibles
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Lista de permisos agrupados por recurso
   */
  static async listPermissions(req: Request, res: Response) {
    try {
      const permissions = await permissionService.getAllPermissions();

      // Agrupar por recurso para mejor UX
      const groupedByResource: Record<string, any[]> = {};

      permissions.forEach((p) => {
        if (!groupedByResource[p.resource]) {
          groupedByResource[p.resource] = [];
        }
        groupedByResource[p.resource].push({
          id: p.id,
          action: p.action,
          scope: p.scope,
          description: p.description,
          key: `${p.resource}:${p.action}`,
        });
      });

      res.json({
        success: true,
        data: {
          permissions,
          grouped: groupedByResource,
        },
      });
    } catch (error) {
      console.error("Error listing permissions:", error);
      res.status(500).json({
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to list permissions",
        },
      });
    }
  }
}
