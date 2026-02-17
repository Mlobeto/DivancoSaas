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

    // Extract permissions as "resource:action" strings
    const permissions = userBU.role.permissions.map((rp) => {
      const p = rp.permission;
      return `${p.resource}:${p.action}`;
    });

    return permissions;
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
}

export const permissionService = new PermissionService();
