/**
 * Vertical Validation Middleware
 *
 * Validates that the tenant has a specific vertical enabled
 * before allowing access to vertical-specific features.
 */

import { Request, Response, NextFunction } from "express";
import prisma from "@config/database";
import { AppError } from "@core/middlewares/error.middleware";

/**
 * Middleware to require a specific vertical
 * @param requiredVertical - The vertical ID required (e.g., "rental")
 */
export function requireVertical(requiredVertical: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = req.context;

      if (!context || !context.businessUnitId) {
        throw new AppError(
          400,
          "MISSING_CONTEXT",
          "Business unit context is required",
        );
      }

      // Load BusinessUnit to get vertical from settings
      const businessUnit = await prisma.businessUnit.findUnique({
        where: { id: context.businessUnitId },
        select: { settings: true, tenantId: true },
      });

      if (!businessUnit) {
        throw new AppError(
          404,
          "BUSINESS_UNIT_NOT_FOUND",
          "Business unit not found",
        );
      }

      // Extract vertical from settings (JSON field)
      const settings = (businessUnit.settings as any) || {};
      const vertical = settings.vertical || null;

      // Check if the required vertical matches
      if (vertical !== requiredVertical) {
        throw new AppError(
          403,
          "VERTICAL_NOT_ENABLED",
          `This feature requires the '${requiredVertical}' vertical to be enabled`,
          { requiredVertical, currentVertical: vertical },
        );
      }

      // Vertical validation passed
      next();
    } catch (error) {
      next(error);
    }
  };
}
