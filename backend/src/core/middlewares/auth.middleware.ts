import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "@config/index";
import { RequestContext } from "@core/types";
import prisma from "@config/database";

// Extender el tipo Request de Express
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

interface JwtPayload {
  userId: string;
  tenantId: string;
  businessUnitId?: string;
}

/**
 * Middleware de autenticación - HARDENED
 *
 * SECURITY ENHANCEMENTS:
 * 1. Validates businessUnit belongs to user's tenant
 * 2. Prevents cross-tenant access via BU manipulation
 * 3. Strict validation of tenant/BU ownership
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "No token provided",
        },
      });
      return;
    }

    // Verificar token
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;

    // Leer headers de contexto (tienen prioridad sobre el JWT payload)
    const tenantIdHeader = req.headers["x-tenant-id"] as string | undefined;
    const businessUnitIdHeader = req.headers["x-business-unit-id"] as
      | string
      | undefined;

    const tenantId = tenantIdHeader || payload.tenantId;
    const businessUnitId = businessUnitIdHeader || payload.businessUnitId;

    // Cargar usuario y permisos
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        businessUnits: {
          where: businessUnitId
            ? { businessUnitId: businessUnitId }
            : undefined,
          include: {
            businessUnit: true, // CRITICAL: Load BU to validate tenant ownership
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

    if (!user || user.tenantId !== tenantId) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
        },
      });
      return;
    }

    if (user.status !== "ACTIVE") {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "User is not active",
        },
      });
      return;
    }

    // SECURITY: Validate businessUnit belongs to user's tenant
    if (businessUnitId) {
      const userBU = user.businessUnits.find(
        (ub) => ub.businessUnitId === businessUnitId,
      );

      if (!userBU) {
        res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "User does not have access to this business unit",
          },
        });
        return;
      }

      // CRITICAL: Verify BU belongs to user's tenant
      if (userBU.businessUnit.tenantId !== user.tenantId) {
        console.error(
          `[SECURITY VIOLATION] BusinessUnit ${businessUnitId} belongs to tenant ${userBU.businessUnit.tenantId} ` +
            `but user ${user.id} belongs to tenant ${user.tenantId}. This should NEVER happen.`,
        );

        res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Business unit does not belong to your tenant",
          },
        });
        return;
      }
    }

    // Construir contexto
    const businessUnit = user.businessUnits[0];
    const permissions =
      businessUnit?.role.permissions.map(
        (rp) => `${rp.permission.resource}:${rp.permission.action}`,
      ) || [];

    req.context = {
      userId: user.id,
      tenantId: tenantId as string,
      businessUnitId: businessUnitId,
      role: businessUnit?.role.name || "guest",
      permissions,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token",
        },
      });
      return;
    }

    next(error);
  }
}

/**
 * Middleware de autorización
 * Verifica que el usuario tenga el permiso requerido
 */
export function authorize(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { context } = req;

    if (!context) {
      res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
      return;
    }

    // Verificar permisos
    const hasPermission = requiredPermissions.some((permission) =>
      context.permissions.includes(permission),
    );

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Insufficient permissions",
          details: {
            required: requiredPermissions,
            current: context.permissions,
          },
        },
      });
      return;
    }

    next();
  };
}

/**
 * Middleware para requerir businessUnitId en el contexto
 */
export function requireBusinessUnit(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.context?.businessUnitId) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "Business unit context required",
      },
    });
    return;
  }

  next();
}

/**
 * Extraer token del header Authorization
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [type, token] = authHeader.split(" ");

  if (type !== "Bearer" || !token) {
    return null;
  }

  return token;
}
