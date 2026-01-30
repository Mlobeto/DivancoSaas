import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "@config/database";
import { config } from "@config/index";
import { AppError } from "@core/middlewares/error.middleware";

const router = Router();

// Schemas de validación
const registerSchema = z.object({
  tenantName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  tenantSlug: z.string().optional(),
});

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Registrar nuevo tenant con usuario admin
 *     description: Crea un nuevo tenant en la plataforma y un usuario administrador. Este es el primer paso para usar el SaaS.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantName, email, password, firstName, lastName]
 *             properties:
 *               tenantName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Constructora ABC"
 *                 description: Nombre de la empresa/tenant
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@constructora-abc.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: "SecurePass123!"
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Juan"
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 example: "Pérez"
 *     responses:
 *       201:
 *         description: Tenant y usuario creados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     email: { type: string }
 *                     firstName: { type: string }
 *                     lastName: { type: string }
 *                     tenantId: { type: string, format: uuid }
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     name: { type: string }
 *                     slug: { type: string }
 *                     plan: { type: string, example: "free" }
 *       400:
 *         description: Datos inválidos o tenant ya existe
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/register", async (req, res) => {
  const data = registerSchema.parse(req.body);

  // Generar slug único para el tenant
  const slug = generateSlug(data.tenantName);

  // Verificar que no exista
  const existingTenant = await prisma.tenant.findUnique({
    where: { slug },
  });

  if (existingTenant) {
    throw new AppError(400, "TENANT_EXISTS", "Tenant already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Crear tenant, usuario admin y rol en una transacción
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear tenant
    const tenant = await tx.tenant.create({
      data: {
        name: data.tenantName,
        slug,
        status: "ACTIVE",
        plan: "free",
      },
    });

    // 2. Crear rol admin
    const adminRole = await tx.role.create({
      data: {
        name: "Admin",
        description: "Administrator with full access",
        isSystem: true,
      },
    });

    // 3. Crear permisos básicos
    const permissions = await createBasicPermissions(tx);

    // 4. Asignar todos los permisos al admin
    await tx.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: adminRole.id,
        permissionId: p.id,
      })),
    });

    // 5. Crear usuario admin
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        status: "ACTIVE",
      },
    });

    // 6. Crear business unit por defecto
    const businessUnit = await tx.businessUnit.create({
      data: {
        tenantId: tenant.id,
        name: "Default",
        slug: "default",
        description: "Default business unit",
      },
    });

    // 7. Asignar usuario a la BU con rol admin
    await tx.userBusinessUnit.create({
      data: {
        userId: user.id,
        businessUnitId: businessUnit.id,
        roleId: adminRole.id,
      },
    });

    return { tenant, user, businessUnit };
  });

  // Generar token
  const token = jwt.sign(
    {
      userId: result.user.id,
      tenantId: result.tenant.id,
      businessUnitId: result.businessUnit.id,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any,
  );

  res.status(201).json({
    success: true,
    data: {
      token,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      },
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      businessUnit: {
        id: result.businessUnit.id,
        name: result.businessUnit.name,
      },
    },
  });
});

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login de usuario existente
 *     description: Autenticación de usuario con email y password. Devuelve JWT para usar en requests posteriores.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "admin@constructora-abc.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "SecurePass123!"
 *               tenantSlug:
 *                 type: string
 *                 example: "constructora-abc"
 *                 description: Opcional - slug del tenant si el usuario pertenece a múltiples tenants
 *     responses:
 *       200:
 *         description: Login exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: JWT Bearer token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string, format: uuid }
 *                     email: { type: string }
 *                     tenantId: { type: string, format: uuid }
 *                 tenant:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     slug: { type: string }
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Usuario o tenant no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/login", async (req, res) => {
  const data = loginSchema.parse(req.body);

  // Buscar usuario por email
  let user = await prisma.user.findFirst({
    where: {
      email: data.email,
      status: "ACTIVE",
    },
    include: {
      tenant: true,
      businessUnits: {
        include: {
          businessUnit: true,
          role: true,
        },
      },
    },
  });

  // Si se especificó tenantSlug, filtrar por él
  if (data.tenantSlug && user) {
    if (user.tenant.slug !== data.tenantSlug) {
      user = null as any;
    }
  }

  if (!user) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Verificar password
  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  // Actualizar último login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Si tiene múltiples business units, retornar lista para que elija
  if (user.businessUnits.length > 1) {
    return res.json({
      success: true,
      data: {
        requiresBusinessUnitSelection: true,
        businessUnits: user.businessUnits.map((bu) => ({
          id: bu.businessUnit.id,
          name: bu.businessUnit.name,
          role: bu.role.name,
        })),
        userId: user.id,
        tenantId: user.tenantId,
      },
    });
  }

  // Usuario debe tener al menos una business unit
  if (user.businessUnits.length === 0) {
    throw new AppError(
      500,
      "NO_BUSINESS_UNIT",
      "User has no business unit assigned",
    );
  }

  // Generar token con la primera BU (ya validamos que existe)
  const businessUnit = user.businessUnits[0]!;
  const token = jwt.sign(
    {
      userId: user.id,
      tenantId: user.tenantId,
      businessUnitId: businessUnit.businessUnit.id,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any,
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
      },
      businessUnit: {
        id: businessUnit.businessUnit.id,
        name: businessUnit.businessUnit.name,
      },
      role: businessUnit.role.name,
    },
  });
});

/**
 * POST /api/v1/auth/login/business-unit
 * Generar token para una business unit específica
 */
router.post("/login/business-unit", async (req, res) => {
  const { userId, tenantId, businessUnitId } = z
    .object({
      userId: z.string().uuid(),
      tenantId: z.string().uuid(),
      businessUnitId: z.string().uuid(),
    })
    .parse(req.body);

  // Verificar acceso
  const userBU = await prisma.userBusinessUnit.findFirst({
    where: {
      userId,
      businessUnitId,
      user: { tenantId },
    },
    include: {
      user: true,
      businessUnit: true,
      role: true,
    },
  });

  if (!userBU) {
    throw new AppError(403, "FORBIDDEN", "Access denied to this business unit");
  }

  // Generar token
  const token = jwt.sign(
    { userId, tenantId, businessUnitId },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn } as any,
  );

  res.json({
    success: true,
    data: {
      token,
      user: {
        id: userBU.user.id,
        email: userBU.user.email,
        firstName: userBU.user.firstName,
        lastName: userBU.user.lastName,
      },
      businessUnit: {
        id: userBU.businessUnit.id,
        name: userBU.businessUnit.name,
      },
      role: userBU.role.name,
    },
  });
});

// ============================================
// HELPERS
// ============================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .substring(0, 50);
}

async function createBasicPermissions(tx: any) {
  const resources = [
    "users",
    "roles",
    "business-units",
    "modules",
    "workflows",
    "settings",
  ];
  const actions = ["create", "read", "update", "delete"];

  const permissions = [];

  for (const resource of resources) {
    for (const action of actions) {
      const permission = await tx.permission.create({
        data: {
          resource,
          action,
          scope: "BUSINESS_UNIT",
          description: `${action} ${resource}`,
        },
      });
      permissions.push(permission);
    }
  }

  return permissions;
}

export default router;
