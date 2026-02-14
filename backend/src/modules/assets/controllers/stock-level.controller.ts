/**
 * Stock Level Controller
 *
 * HTTP handlers for BULK inventory management
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient, StockMovementType } from "@prisma/client";
import { StockLevelService } from "../services/stock-level.service";

const prisma = new PrismaClient();
const stockLevelService = new StockLevelService(prisma);

/**
 * Helper to validate business unit context
 */
function validateBusinessUnitContext(
  req: Request,
  res: Response,
): { tenantId: string; businessUnitId: string } | null {
  const context = req.context;

  if (!context || !context.tenantId || !context.businessUnitId) {
    res.status(400).json({
      success: false,
      error: "Business unit context is required",
    });
    return null;
  }

  return {
    tenantId: context.tenantId as string,
    businessUnitId: context.businessUnitId as string,
  };
}

export class StockLevelController {
  /**
   * Get stock level for a template
   * GET /stock-levels/:templateId
   */
  static async getStockLevel(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId } = req.params;
      const { location } = req.query;

      const stockLevel = await stockLevelService.getStockLevel(
        templateId as string,
        context.businessUnitId,
        location as string | undefined,
      );

      res.json({
        success: true,
        data: stockLevel,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all stock levels
   * GET /stock-levels
   */
  static async listStockLevels(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { lowStockOnly } = req.query;

      const stockLevels = await stockLevelService.listStockLevels(
        context.businessUnitId,
        {
          lowStockOnly: lowStockOnly === "true",
        },
      );

      res.json({
        success: true,
        data: stockLevels,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add stock (purchase, transfer in, etc.)
   * POST /stock-levels/add
   */
  static async addStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId, quantity, reason, reference, location } = req.body;

      if (!templateId || !quantity) {
        return res.status(400).json({
          success: false,
          error: "templateId and quantity are required",
        });
      }

      const stockLevel = await stockLevelService.addStock(
        {
          templateId,
          quantity: parseInt(quantity),
          reason,
          reference,
          location,
          createdBy: req.context?.userId,
        },
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stockLevel,
        message: `Added ${quantity} units to stock`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reserve stock (for quotations)
   * POST /stock-levels/reserve
   */
  static async reserveStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId, quantity, reference, location } = req.body;

      if (!templateId || !quantity) {
        return res.status(400).json({
          success: false,
          error: "templateId and quantity are required",
        });
      }

      const stockLevel = await stockLevelService.reserveStock(
        {
          templateId,
          quantity: parseInt(quantity),
          reference,
          location,
          createdBy: req.context?.userId,
        },
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stockLevel,
        message: `Reserved ${quantity} units`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unreserve stock (cancel quotation)
   * POST /stock-levels/unreserve
   */
  static async unreserveStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId, quantity, reference, location } = req.body;

      if (!templateId || !quantity) {
        return res.status(400).json({
          success: false,
          error: "templateId and quantity are required",
        });
      }

      const stockLevel = await stockLevelService.unreserveStock(
        templateId,
        parseInt(quantity),
        context.businessUnitId,
        reference,
        location,
        req.context?.userId,
      );

      res.json({
        success: true,
        data: stockLevel,
        message: `Unreserved ${quantity} units`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Rent out stock
   * POST /stock-levels/rent
   */
  static async rentOutStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId, quantity, fromReserved, reference, location } =
        req.body;

      if (!templateId || !quantity) {
        return res.status(400).json({
          success: false,
          error: "templateId and quantity are required",
        });
      }

      const stockLevel = await stockLevelService.rentOutStock(
        {
          templateId,
          quantity: parseInt(quantity),
          fromReserved: fromReserved === true,
          reference,
          location,
          createdBy: req.context?.userId,
        },
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stockLevel,
        message: `Rented out ${quantity} units`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return rented stock
   * POST /stock-levels/return
   */
  static async returnStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId, quantity, reference, location } = req.body;

      if (!templateId || !quantity) {
        return res.status(400).json({
          success: false,
          error: "templateId and quantity are required",
        });
      }

      const stockLevel = await stockLevelService.returnStock(
        {
          templateId,
          quantity: parseInt(quantity),
          reference,
          location,
          createdBy: req.context?.userId,
        },
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stockLevel,
        message: `Returned ${quantity} units`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adjust stock (manual correction)
   * POST /stock-levels/adjust
   */
  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId, quantityDelta, reason, notes, location } = req.body;

      if (!templateId || quantityDelta === undefined || !reason) {
        return res.status(400).json({
          success: false,
          error: "templateId, quantityDelta, and reason are required",
        });
      }

      const stockLevel = await stockLevelService.adjustStock(
        {
          templateId,
          quantityDelta: parseInt(quantityDelta),
          reason,
          notes,
          location,
          createdBy: req.context?.userId,
        },
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stockLevel,
        message: `Adjusted stock by ${quantityDelta}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update stock level settings
   * PATCH /stock-levels/:templateId
   */
  static async updateStockLevel(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId } = req.params;
      const { location } = req.query;
      const {
        pricePerDay,
        pricePerWeek,
        pricePerMonth,
        minStock,
        maxStock,
        notes,
      } = req.body;

      const stockLevel = await stockLevelService.updateStockLevel(
        templateId as string,
        context.businessUnitId,
        {
          pricePerDay,
          pricePerWeek,
          pricePerMonth,
          minStock,
          maxStock,
          notes,
        },
        location as string | undefined,
      );

      res.json({
        success: true,
        data: stockLevel,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock movements history
   * GET /stock-levels/:templateId/movements
   */
  static async getStockMovements(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { templateId } = req.params;
      const { location, type, limit } = req.query;

      const movements = await stockLevelService.getStockMovements(
        templateId as string,
        context.businessUnitId,
        {
          location: location as string | undefined,
          type: type as StockMovementType | undefined,
          limit: limit ? parseInt(limit as string) : undefined,
        },
      );

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get stock statistics
   * GET /stock-levels/stats
   */
  static async getStockStats(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const stats = await stockLevelService.getStockStats(
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}
