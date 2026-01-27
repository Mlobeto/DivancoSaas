import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@config/index';
import { RequestContext } from '@core/types';
import prisma from '@config/database';

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
 * Middleware de autenticación
 * Verifica JWT y carga el contexto del usuario
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
      return;
    }
    
    // Verificar token
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    // Cargar usuario y permisos
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        businessUnits: {
          where: payload.businessUnitId
            ? { businessUnitId: payload.businessUnitId }
            : undefined,
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
          },
        },
      },
    });
    
    if (!user || user.tenantId !== payload.tenantId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
        },
      });
      return;
    }
    
    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'User is not active',
        },
      });
      return;
    }
    
    // Construir contexto
    const businessUnit = user.businessUnits[0];
    const permissions = businessUnit?.role.permissions.map(
      (rp) => `${rp.permission.resource}:${rp.permission.action}`
    ) || [];
    
    req.context = {
      userId: user.id,
      tenantId: user.tenantId,
      businessUnitId: payload.businessUnitId,
      role: businessUnit?.role.name || 'guest',
      permissions,
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid token',
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
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
      return;
    }
    
    // Verificar permisos
    const hasPermission = requiredPermissions.some((permission) =>
      context.permissions.includes(permission)
    );
    
    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
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
  next: NextFunction
): void {
  if (!req.context?.businessUnitId) {
    res.status(400).json({
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message: 'Business unit context required',
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
  
  const [type, token] = authHeader.split(' ');
  
  if (type !== 'Bearer' || !token) {
    return null;
  }
  
  return token;
}
