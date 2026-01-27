import { Request, Response, NextFunction } from 'express';
import prisma from '@config/database';

/**
 * Middleware de auditoría
 * Registra todas las acciones importantes en audit_logs
 */
export function auditLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const originalSend = res.json;
  
  res.json = function (data: any): Response {
    // Solo auditar operaciones exitosas de modificación
    if (
      data?.success &&
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      req.context
    ) {
      // Ejecutar en background
      createAuditLog(req, data).catch((error) => {
        console.error('Failed to create audit log:', error);
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}

async function createAuditLog(req: Request, responseData: any): Promise<void> {
  const { context } = req;
  
  if (!context) return;
  
  const action = getActionFromMethod(req.method);
  const entity = extractEntityFromPath(req.path);
  
  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      entity,
      entityId: responseData.data?.id,
      action,
      newData: responseData.data,
      metadata: {
        path: req.path,
        method: req.method,
        query: req.query,
        businessUnitId: context.businessUnitId,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    },
  });
}

function getActionFromMethod(method: string): string {
  const map: Record<string, string> = {
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  };
  
  return map[method] || 'unknown';
}

function extractEntityFromPath(path: string): string {
  // Extraer entidad de la ruta, ej: /api/v1/projects -> projects
  const segments = path.split('/').filter(Boolean);
  return segments[segments.length - 1] || 'unknown';
}
