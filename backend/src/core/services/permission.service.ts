import prisma from "@config/database";
import type { Permission, PermissionScope } from "@prisma/client";

/**
 * Permission Service
 *
 * Manages RBAC permissions for roles and users
 */
export class PermissionService {
  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    return rolePermissions.map((rp) => rp.permission);
  }

  /**
   * Get all permissions for a user in a specific business unit
   * Combines role permissions + user-specific  additional permissions
   */
  async getUserPermissions(
    userId: string,
    businessUnitId: string,
  ): Promise<string[]> {
    // Get user's role in the business unit
    const userBU = await prisma.userBusinessUnit.findFirst({
      where: {
        userId,
        businessUnitId,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        businessUnit: {
          select: {
            settings: true,
          },
        },
      },
    });

    if (!userBU || !userBU.role) {
      return [];
    }

    // SPECIAL CASE: OWNER role gets all permissions automatically
    // This is the business owner who should have full access
    if (userBU.role.name === "OWNER") {
      const settings = (userBU.businessUnit.settings as any) || {};
      const enabledModules = settings.enabledModules || [];

      // Generate full permissions for enabled modules
      const ownerPermissions: string[] = [];

      // Add permissions for each enabled module
      enabledModules.forEach((module: string) => {
        ownerPermissions.push(
          `${module}:create`,
          `${module}:read`,
          `${module}:update`,
          `${module}:delete`,
        );
      });

      // Add general permissions
      ownerPermissions.push(
        "settings:read",
        "settings:update",
        "users:create",
        "users:read",
        "users:update",
        "users:delete",
        "dashboard:read",
      );

      return ownerPermissions;
    }

    // Extract permissions from role as "resource:action" strings
    const rolePermissions = userBU.role.permissions.map((rp) => {
      const p = rp.permission;
      return `${p.resource}:${p.action}`;
    });

    // Get additional user-specific permissions
    const userAdditionalPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        businessUnitId,
      },
      include: {
        permission: true,
      },
    });

    const additionalPermissions = userAdditionalPermissions.map((up) => {
      const p = up.permission;
      return `${p.resource}:${p.action}`;
    });

    // Combine and deduplicate permissions
    const allPermissions = [
      ...new Set([...rolePermissions, ...additionalPermissions]),
    ];

    return allPermissions;
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    businessUnitId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId, businessUnitId);
    return permissions.includes(`${resource}:${action}`);
  }

  /**
   * Create or update a permission
   */
  async upsertPermission(
    resource: string,
    action: string,
    description?: string,
    scope: PermissionScope = "BUSINESS_UNIT",
  ): Promise<Permission> {
    return await prisma.permission.upsert({
      where: {
        resource_action: {
          resource,
          action,
        },
      },
      create: {
        resource,
        action,
        description,
        scope,
      },
      update: {
        description,
        scope,
      },
    });
  }

  /**
   * Assign permission to role
   */
  async assignPermissionToRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
      create: {
        roleId,
        permissionId,
      },
      update: {},
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
  ): Promise<void> {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId,
        permissionId,
      },
    });
  }

  /**
   * Assign multiple permissions to a role
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const data = permissionIds.map((permissionId) => ({
      roleId,
      permissionId,
    }));

    await prisma.rolePermission.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return await prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }

  /**
   * Get permissions for a specific resource
   */
  async getResourcePermissions(resource: string): Promise<Permission[]> {
    return await prisma.permission.findMany({
      where: { resource },
      orderBy: { action: "asc" },
    });
  }

  // ============================================
  // USER-SPECIFIC ADDITIONAL PERMISSIONS
  // ============================================

  /**
   * Grant additional permission to a specific user
   * These permissions are added ON TOP of role permissions
   */
  async grantUserPermission(
    userId: string,
    businessUnitId: string,
    permissionId: string,
    grantedBy?: string,
  ): Promise<void> {
    await prisma.userPermission.create({
      data: {
        userId,
        businessUnitId,
        permissionId,
        createdBy: grantedBy,
      },
    });
  }

  /**
   * Revoke additional permission from a specific user
   */
  async revokeUserPermission(
    userId: string,
    businessUnitId: string,
    permissionId: string,
  ): Promise<void> {
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        businessUnitId,
        permissionId,
      },
    });
  }

  /**
   * Get all additional permissions for a user
   * Returns only the ADDITIONAL permissions, not role permissions
   */
  async getUserAdditionalPermissions(
    userId: string,
    businessUnitId: string,
  ): Promise<Permission[]> {
    const userPermissions = await prisma.userPermission.findMany({
      where: {
        userId,
        businessUnitId,
      },
      include: {
        permission: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return userPermissions.map((up) => up.permission);
  }

  /**
   * Sync user additional permissions
   * Replaces all additional permissions with a new set
   */
  async syncUserPermissions(
    userId: string,
    businessUnitId: string,
    permissionIds: string[],
    grantedBy?: string,
  ): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Remove all existing additional permissions
      await tx.userPermission.deleteMany({
        where: {
          userId,
          businessUnitId,
        },
      });

      // Add new permissions
      if (permissionIds.length > 0) {
        await tx.userPermission.createMany({
          data: permissionIds.map((permissionId) => ({
            userId,
            businessUnitId,
            permissionId,
            createdBy: grantedBy,
          })),
          skipDuplicates: true,
        });
      }
    });
  }
}

export const permissionService = new PermissionService();
