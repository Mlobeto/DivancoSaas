/**
 * USER SERVICE
 * Gestión de usuarios dentro de un tenant
 */

import { prisma } from "@config/database";
import bcrypt from "bcrypt";
import { AppError } from "@core/middlewares/error.middleware";
import { emailService } from "./email.service";

interface CreateUserInput {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  businessUnitId: string;
  roleId: string;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  status?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

interface AssignRoleInput {
  userId: string;
  businessUnitId: string;
  roleId: string;
}

export class UserService {
  /**
   * Listar usuarios del tenant con filtros
   */
  async listUsers(
    tenantId: string,
    options: {
      businessUnitId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { businessUnitId, status, search, page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filtro por Business Unit
    if (businessUnitId) {
      where.businessUnits = {
        some: { businessUnitId },
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          businessUnits: {
            include: {
              businessUnit: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtener un usuario por ID
   */
  async getUserById(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        businessUnits: {
          include: {
            businessUnit: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true,
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    return user;
  }

  /**
   * Crear un nuevo usuario (invitación)
   */
  async createUser(data: CreateUserInput, tenantId: string) {
    // Verificar si el usuario ya existe en el tenant
    const existingUser = await prisma.user.findFirst({
      where: { email: data.email, tenantId },
      include: {
        businessUnits: {
          where: { businessUnitId: data.businessUnitId },
        },
      },
    });

    // Si el usuario ya existe en esta Business Unit, rechazar
    if (existingUser && existingUser.businessUnits.length > 0) {
      throw new AppError(
        409,
        "USER_ALREADY_IN_BU",
        `El usuario ${data.email} ya está asignado a esta unidad de negocio`,
      );
    }

    // Validar que la Business Unit pertenezca al tenant
    const businessUnit = await prisma.businessUnit.findFirst({
      where: { id: data.businessUnitId, tenantId },
    });

    if (!businessUnit) {
      throw new AppError(
        404,
        "BUSINESS_UNIT_NOT_FOUND",
        "Business unit not found",
      );
    }

    // Validar que el rol exista
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new AppError(404, "ROLE_NOT_FOUND", "Role not found");
    }

    // Si el usuario ya existe pero en otra BU, solo agregarlo a esta BU
    if (existingUser) {
      await prisma.userBusinessUnit.create({
        data: {
          userId: existingUser.id,
          businessUnitId: data.businessUnitId,
          roleId: data.roleId,
        },
      });

      // Retornar el usuario existente con la nueva asignación
      const updatedUser = await prisma.user.findUnique({
        where: { id: existingUser.id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          status: true,
          createdAt: true,
          businessUnits: {
            include: {
              businessUnit: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return updatedUser;
    }

    // Usuario nuevo - crear con password temporal
    const temporaryPassword =
      data.password || `Temp${Math.random().toString(36).slice(-8)}!`;

    // Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Crear usuario y asignar a BU con rol
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        tenantId,
        businessUnits: {
          create: {
            businessUnitId: data.businessUnitId,
            roleId: data.roleId,
          },
        },
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        businessUnits: {
          include: {
            businessUnit: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // Enviar email de bienvenida (no crítico)
    try {
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });

      if (tenant) {
        await emailService.sendWelcomeEmail(
          data.businessUnitId,
          user.email,
          user.firstName,
          tenant.name,
        );
      }
    } catch (error) {
      console.error("Failed to send welcome email:", error);
    }

    return user;
  }

  /**
   * Actualizar información del usuario
   */
  async updateUser(userId: string, data: UpdateUserInput, tenantId: string) {
    // Verificar que el usuario existe y pertenece al tenant
    const existingUser = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!existingUser) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivateUser(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { status: "INACTIVE" },
    });

    return { message: "User deactivated successfully" };
  }

  /**
   * Eliminar usuario permanentemente
   */
  async deleteUser(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return { message: "User deleted successfully" };
  }

  /**
   * Asignar rol a usuario en una Business Unit
   */
  async assignRole(data: AssignRoleInput, tenantId: string) {
    // Validar que el usuario pertenece al tenant
    const user = await prisma.user.findFirst({
      where: { id: data.userId, tenantId },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    // Validar que la BU pertenece al tenant
    const businessUnit = await prisma.businessUnit.findFirst({
      where: { id: data.businessUnitId, tenantId },
    });

    if (!businessUnit) {
      throw new AppError(
        404,
        "BUSINESS_UNIT_NOT_FOUND",
        "Business unit not found",
      );
    }

    // Validar que el rol existe
    const role = await prisma.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new AppError(404, "ROLE_NOT_FOUND", "Role not found");
    }

    // Verificar si ya existe la asignación
    const existingAssignment = await prisma.userBusinessUnit.findUnique({
      where: {
        userId_businessUnitId: {
          userId: data.userId,
          businessUnitId: data.businessUnitId,
        },
      },
    });

    if (existingAssignment) {
      // Actualizar rol existente
      await prisma.userBusinessUnit.update({
        where: {
          userId_businessUnitId: {
            userId: data.userId,
            businessUnitId: data.businessUnitId,
          },
        },
        data: { roleId: data.roleId },
      });
    } else {
      // Crear nueva asignación
      await prisma.userBusinessUnit.create({
        data: {
          userId: data.userId,
          businessUnitId: data.businessUnitId,
          roleId: data.roleId,
        },
      });
    }

    return { message: "Role assigned successfully" };
  }

  /**
   * Remover usuario de una Business Unit
   */
  async removeFromBusinessUnit(
    userId: string,
    businessUnitId: string,
    tenantId: string,
  ) {
    // Validar que el usuario pertenece al tenant
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    // Verificar que tiene al menos 2 BUs (no puede quedarse sin ninguna)
    const userBUs = await prisma.userBusinessUnit.count({
      where: { userId },
    });

    if (userBUs <= 1) {
      throw new AppError(
        400,
        "LAST_BUSINESS_UNIT",
        "Cannot remove user from their last business unit",
      );
    }

    await prisma.userBusinessUnit.delete({
      where: {
        userId_businessUnitId: {
          userId,
          businessUnitId,
        },
      },
    });

    return { message: "User removed from business unit successfully" };
  }
}

export const userService = new UserService();
