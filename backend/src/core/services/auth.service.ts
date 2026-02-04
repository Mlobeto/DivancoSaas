/**
 * AUTH SERVICE
 * Servicio centralizado para autenticación y gestión de usuarios
 * v2.0 - Railway cache fix
 */

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import prisma from "@config/database";
import { config } from "@config/index";
import { AppError } from "@core/middlewares/error.middleware";
import { emailService } from "./email.service";

interface RegisterInput {
  tenantName: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  country?: string;
  businessUnitName?: string;
}

interface LoginInput {
  email: string;
  password: string;
  tenantSlug?: string;
}

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    tenantId: string;
  };
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
  };
  businessUnits: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export class AuthService {
  /**
   * Genera slug único a partir de un nombre
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  /**
   * Verifica si un slug está disponible
   */
  private async isSlugAvailable(
    slug: string,
    model: "tenant" | "businessUnit",
  ): Promise<boolean> {
    if (model === "tenant") {
      const existing = await prisma.tenant.findUnique({ where: { slug } });
      return !existing;
    } else {
      const existing = await prisma.businessUnit.findFirst({
        where: { slug },
      });
      return !existing;
    }
  }

  /**
   * Genera slug único con sufijo numérico si es necesario
   */
  private async generateUniqueSlug(
    name: string,
    model: "tenant" | "businessUnit",
  ): Promise<string> {
    let slug = this.generateSlug(name);
    let counter = 1;

    while (!(await this.isSlugAvailable(slug, model))) {
      slug = `${this.generateSlug(name)}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Registra un nuevo tenant con usuario admin y primera Business Unit
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const {
      tenantName,
      email,
      password,
      firstName,
      lastName,
      country,
      businessUnitName,
    } = input;

    // 1. Validar que el email no exista
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(400, "EMAIL_EXISTS", "Email already registered");
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generar slugs únicos
    const tenantSlug = await this.generateUniqueSlug(tenantName, "tenant");
    const buName = businessUnitName || "Principal";
    const buSlug = await this.generateUniqueSlug(buName, "businessUnit");

    // 4. Determinar payment provider según país
    let preferredPaymentProvider = "stripe"; // default
    if (country === "CO") {
      preferredPaymentProvider = "wompi"; // Colombia → Wompi (3DS)
    } else if (["AR", "MX", "BR", "CL", "PE"].includes(country || "")) {
      preferredPaymentProvider = "mercadopago"; // Latam → MercadoPago
    }

    // 5. Crear tenant, business unit, rol admin y usuario en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear tenant
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          status: "ACTIVE",
          plan: "free",
          country: country || null,
          preferredPaymentProvider,
        },
      });

      // Crear primera Business Unit
      const businessUnit = await tx.businessUnit.create({
        data: {
          name: buName,
          slug: buSlug,
          tenantId: tenant.id,
        },
      });

      // Buscar o crear rol "admin" global
      let adminRole = await tx.role.findFirst({
        where: { name: "admin", isSystem: true },
      });

      if (!adminRole) {
        adminRole = await tx.role.create({
          data: {
            name: "admin",
            description: "Administrador con permisos completos",
            isSystem: true,
          },
        });
      }

      // Crear usuario
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          status: "ACTIVE",
          lastLoginAt: new Date(),
        },
      });

      // Asignar usuario a la BU con rol admin
      await tx.userBusinessUnit.create({
        data: {
          userId: user.id,
          businessUnitId: businessUnit.id,
          roleId: adminRole.id,
        },
      });

      return { tenant, user, businessUnit };
    });

    // 6. Enviar email de bienvenida (async, no bloqueante)
    emailService
      .sendWelcomeEmail(result.businessUnit.id, email, firstName, tenantName)
      .catch((err) => console.error("Failed to send welcome email:", err));

    // 7. Generar tokens
    const tokens = this.generateTokens(
      result.user.id,
      result.tenant.id,
      result.user.email,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        tenantId: result.tenant.id,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        plan: result.tenant.plan,
      },
      businessUnits: [
        {
          id: result.businessUnit.id,
          name: result.businessUnit.name,
          slug: result.businessUnit.slug,
        },
      ],
    };
  }

  /**
   * Login de usuario
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password, tenantSlug } = input;

    // 1. Buscar usuario
    let user;
    if (tenantSlug) {
      // Login con tenant específico
      user = await prisma.user.findFirst({
        where: {
          email,
          tenant: { slug: tenantSlug },
        },
        include: {
          tenant: true,
          businessUnits: {
            include: {
              businessUnit: true,
            },
          },
        },
      });
    } else {
      // Buscar por email (puede tener múltiples tenants)
      const users = await prisma.user.findMany({
        where: { email },
        include: {
          tenant: true,
          businessUnits: {
            include: {
              businessUnit: true,
            },
          },
        },
      });

      if (users.length === 0) {
        throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
      }

      if (users.length > 1) {
        // Usuario existe en múltiples tenants, debe especificar
        throw new AppError(
          400,
          "MULTIPLE_TENANTS",
          "Multiple accounts found. Please specify tenant slug",
          {
            tenants: users.map((u) => ({
              tenantId: u.tenant.id,
              tenantName: u.tenant.name,
              tenantSlug: u.tenant.slug,
            })),
          },
        );
      }

      user = users[0]!;
    }

    if (!user) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    // 2. Verificar status
    if (user.status !== "ACTIVE") {
      throw new AppError(403, "ACCOUNT_INACTIVE", "Account is not active");
    }

    if (user.tenant.status !== "ACTIVE") {
      throw new AppError(
        403,
        "TENANT_SUSPENDED",
        "Tenant account is suspended",
      );
    }

    // 3. Verificar password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new AppError(401, "INVALID_CREDENTIALS", "Invalid credentials");
    }

    // 4. Actualizar lastLoginAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 5. Generar JWT (access token y refresh token)
    const firstBusinessUnitId = user.businessUnits[0]?.businessUnit.id;
    const tokens = this.generateTokens(
      user.id,
      user.tenant.id,
      user.email,
      firstBusinessUnitId,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        tenantId: user.tenant.id,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        plan: user.tenant.plan,
      },
      businessUnits: user.businessUnits.map((ubu) => ({
        id: ubu.businessUnit.id,
        name: ubu.businessUnit.name,
        slug: ubu.businessUnit.slug,
      })),
    };
  }

  /**
   * Solicita recuperación de contraseña
   */
  async forgotPassword(email: string, tenantSlug?: string): Promise<void> {
    // 1. Buscar usuario
    let user;
    if (tenantSlug) {
      user = await prisma.user.findFirst({
        where: {
          email,
          tenant: { slug: tenantSlug },
        },
      });
    } else {
      const users = await prisma.user.findMany({
        where: { email },
      });

      if (users.length > 1) {
        throw new AppError(
          400,
          "MULTIPLE_TENANTS",
          "Multiple accounts found. Please specify tenant slug",
        );
      }

      user = users[0];
    }

    // Por seguridad, no revelar si el usuario existe o no
    if (!user) {
      return;
    }

    // 2. Generar token de reset (válido 1 hora)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    const resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hora

    // 3. Guardar en BD
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    // 4. Enviar email (usar la primera BU del usuario como default)
    const userBU = await prisma.userBusinessUnit.findFirst({
      where: { userId: user.id },
      select: { businessUnitId: true },
    });

    if (userBU) {
      await emailService.sendPasswordResetEmail(
        userBU.businessUnitId,
        user.email,
        resetToken, // Enviamos el token sin hashear
        user.firstName,
      );
    }
  }

  /**
   * Resetea la contraseña con el token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // 1. Hashear el token recibido
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // 2. Buscar usuario con token válido
    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken,
        resetPasswordExpires: {
          gt: new Date(), // Token no expirado
        },
      },
    });

    if (!user) {
      throw new AppError(
        400,
        "INVALID_TOKEN",
        "Invalid or expired reset token",
      );
    }

    // 3. Hash nueva password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar password y limpiar token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });
  }

  /**
   * Cambia la contraseña del usuario autenticado
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, "USER_NOT_FOUND", "User not found");
    }

    // 2. Verificar contraseña actual
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new AppError(
        401,
        "INVALID_PASSWORD",
        "Current password is incorrect",
      );
    }

    // 3. Hash nueva password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * Obtiene información completa del usuario actual
   * Incluye: user, tenant, businessUnits, roles y permisos
   */
  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true,
        businessUnits: {
          include: {
            businessUnit: true,
            role: {
              include: {
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

    // Type assertion para incluidos de Prisma
    const userWithRelations = user as any;

    // Mapear business units con sus roles
    const businessUnits = userWithRelations.businessUnits.map((ubu: any) => ({
      id: ubu.businessUnit.id,
      name: ubu.businessUnit.name,
      slug: ubu.businessUnit.slug,
      description: ubu.businessUnit.description,
      roleId: ubu.role.id,
      roleName: ubu.role.name,
    }));

    // Extraer roles únicos
    const rolesMap = new Map();
    userWithRelations.businessUnits.forEach((ubu: any) => {
      if (!rolesMap.has(ubu.role.id)) {
        rolesMap.set(ubu.role.id, {
          id: ubu.role.id,
          name: ubu.role.name,
          displayName: ubu.role.displayName,
          isSystemRole: ubu.role.isSystemRole,
        });
      }
    });
    const roles = Array.from(rolesMap.values());

    // Agregar permisos únicos desde todos los roles
    const permissionsSet = new Set<string>();
    userWithRelations.businessUnits.forEach((ubu: any) => {
      ubu.role.permissions.forEach((rp: any) => {
        permissionsSet.add(rp.permission.name);
      });
    });
    const permissions = Array.from(permissionsSet);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        status: user.status,
        tenantId: user.tenantId,
        lastLoginAt: user.lastLoginAt,
      },
      tenant: {
        id: userWithRelations.tenant.id,
        name: userWithRelations.tenant.name,
        slug: userWithRelations.tenant.slug,
        plan: userWithRelations.tenant.plan,
        status: userWithRelations.tenant.status,
        country: userWithRelations.tenant.country,
      },
      businessUnits,
      roles,
      permissions,
    };
  }

  /**
   * Genera access token y refresh token
   */
  generateTokens(
    userId: string,
    tenantId: string,
    email: string,
    businessUnitId?: string,
  ) {
    const accessToken = jwt.sign(
      { userId, tenantId, email, businessUnitId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as any,
    );

    // Usar un secret diferente para refresh token si está disponible
    const refreshSecret = process.env.JWT_REFRESH_SECRET || config.jwt.secret;
    const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";

    const refreshToken = jwt.sign(
      { userId, tenantId, email, businessUnitId, type: "refresh" },
      refreshSecret,
      { expiresIn: refreshExpiresIn } as any,
    );

    return { accessToken, refreshToken };
  }

  /**
   * Renueva access token usando refresh token válido
   */
  async refreshAccessToken(refreshToken: string) {
    try {
      // Verificar refresh token
      const refreshSecret = process.env.JWT_REFRESH_SECRET || config.jwt.secret;

      const decoded = jwt.verify(refreshToken, refreshSecret) as {
        userId: string;
        tenantId: string;
        email: string;
        type: string;
      };

      // Validar que sea un refresh token
      if (decoded.type !== "refresh") {
        throw new AppError(
          401,
          "INVALID_TOKEN_TYPE",
          "Token is not a refresh token",
        );
      }

      // Validar que el usuario siga existiendo y activo
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { tenant: true },
      });

      if (!user) {
        throw new AppError(401, "USER_NOT_FOUND", "User not found");
      }

      if (user.status !== "ACTIVE") {
        throw new AppError(403, "ACCOUNT_INACTIVE", "Account is not active");
      }

      if (user.tenant.status !== "ACTIVE") {
        throw new AppError(
          403,
          "TENANT_SUSPENDED",
          "Tenant account is suspended",
        );
      }

      // Generar nuevo access token
      const accessToken = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenantId,
          email: user.email,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn } as any,
      );

      return {
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          tenantId: user.tenantId,
        },
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(401, "INVALID_REFRESH_TOKEN", "Invalid token");
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(401, "REFRESH_TOKEN_EXPIRED", "Token expired");
      }
      throw error;
    }
  }
}

export const authService = new AuthService();
