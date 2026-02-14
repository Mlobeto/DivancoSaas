import { Request, Response, NextFunction } from "express";
import {
  requestContext,
  RequestContextData,
} from "@shared/context/request-context";

/**
 * Context Injector Middleware
 *
 * Inyecta el contexto de la request (tenantId, businessUnitId, userId)
 * en AsyncLocalStorage para que esté disponible en toda la cadena de ejecución.
 *
 * DEBE ejecutarse DESPUÉS del middleware `authenticate`.
 *
 * Beneficios:
 * - No necesitas pasar tenantId/businessUnitId manualmente por todos los servicios
 * - Prisma middleware puede filtrar automáticamente por tenant
 * - Previene errores de cross-tenant data leakage
 *
 * @example
 * // En app.ts:
 * app.use(authenticate);
 * app.use(contextInjector);
 * app.use("/api", routes);
 */
export function contextInjector(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Si no hay contexto de autenticación, continuar sin AsyncLocalStorage
  // (útil para endpoints públicos como /health o /docs)
  if (!req.context) {
    next();
    return;
  }

  // Construir el contexto para AsyncLocalStorage
  const contextData: RequestContextData = {
    tenantId: req.context.tenantId,
    businessUnitId: req.context.businessUnitId,
    userId: req.context.userId,
    userRoles: req.context.role ? [req.context.role] : undefined,
  };

  // Ejecutar todo el request handler dentro del contexto
  requestContext.run(contextData, () => {
    next();
  });
}

/**
 * Optional Context Injector - HARDENED
 *
 * For webhooks, background jobs, or system operations where there's no
 * authenticated user but tenant context is known.
 *
 * SECURITY RULES:
 * 1. NEVER trust raw headers blindly
 * 2. Validate tenant via API key, signed payload, or database lookup
 * 3. Only use for specific endpoints (webhooks, cron jobs)
 * 4. Add rate limiting per tenant
 *
 * USAGE:
 * - Webhook endpoints with signature validation
 * - Internal cron jobs with service account
 * - Background workers with verified tenant context
 *
 * WARNING: Do NOT use this on public endpoints!
 *
 * @example
 * // For signed webhooks:
 * webhookRouter.use(verifyWebhookSignature); // Validate first!
 * webhookRouter.use(optionalContextInjector);
 *
 * // For internal cron:
 * cronRouter.use(requireServiceAccount); // Validate first!
 * cronRouter.use(optionalContextInjector);
 */
export function optionalContextInjector(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Priority 1: Use authenticated context if available
  if (req.context) {
    const contextData: RequestContextData = {
      tenantId: req.context.tenantId,
      businessUnitId: req.context.businessUnitId,
      userId: req.context.userId,
      userRoles: req.context.role ? [req.context.role] : undefined,
    };

    requestContext.run(contextData, () => {
      next();
    });
    return;
  }

  // Priority 2: Try to extract from validated headers
  const tenantId = req.headers["x-tenant-id"] as string | undefined;
  const businessUnitId = req.headers["x-business-unit-id"] as
    | string
    | undefined;

  // SECURITY: Validate tenant exists and is active
  // TODO: Add actual validation logic here
  // For now, we require that the tenant header is present and non-empty
  if (tenantId && tenantId.trim() !== "") {
    // TODO: Add validation:
    // 1. Verify tenant exists in database
    // 2. Verify tenant status is ACTIVE
    // 3. Verify API key matches tenant (if applicable)
    // 4. Check rate limits for this tenant

    console.warn(
      `[Context] Using optional context from headers for tenant: ${tenantId}. ` +
        `Ensure this endpoint has proper authentication/authorization.`,
    );

    const contextData: RequestContextData = {
      tenantId,
      businessUnitId,
      userId: "system", // System user for background operations
    };

    requestContext.run(contextData, () => {
      next();
    });
    return;
  }

  // No valid context available - continue without AsyncLocalStorage
  // Prisma middleware will throw error if tenant-scoped models are accessed
  next();
}

/**
 * Validate Tenant Middleware (to be used BEFORE optionalContextInjector)
 *
 * Validates that the tenant from headers actually exists and is active.
 * Use this as a security gate for webhook/background endpoints.
 *
 * @example
 * webhookRouter.use(validateTenantHeader);
 * webhookRouter.use(optionalContextInjector);
 */
export async function validateTenantHeader(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const tenantId = req.headers["x-tenant-id"] as string | undefined;

  if (!tenantId) {
    res.status(400).json({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message: "X-Tenant-ID header is required",
      },
    });
    return;
  }

  try {
    // Import prismaBase to avoid circular dependency and bypass tenant filtering
    const { prismaBase } = await import("@config/database");

    const tenant = await prismaBase.tenant.findUnique({
      where: { id: tenantId },
      select: { id: true, status: true },
    });

    if (!tenant) {
      res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Tenant not found",
        },
      });
      return;
    }

    if (tenant.status !== "ACTIVE") {
      res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Tenant is not active",
        },
      });
      return;
    }

    next();
  } catch (error) {
    console.error("[validateTenantHeader] Error validating tenant:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to validate tenant",
      },
    });
  }
}
