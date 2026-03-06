/**
 * Warehouse Controller
 *
 * HTTP handlers for warehouse operations (bodegas y talleres)
 */

import { Request, Response, NextFunction } from "express";
import { WarehouseService } from "../services/warehouse.service";

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

export class WarehouseController {
  /**
   * List all warehouses
   * GET /api/warehouses
   */
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const result = await WarehouseService.list(
        context.tenantId,
        context.businessUnitId,
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get warehouse by ID
   * GET /api/warehouses/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { id } = req.params;

      const warehouse = await WarehouseService.getById(
        id,
        context.tenantId,
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create warehouse
   * POST /api/warehouses
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const warehouse = await WarehouseService.create(
        context.tenantId,
        context.businessUnitId,
        req.body,
      );

      res.status(201).json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update warehouse
   * PUT /api/warehouses/:id
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { id } = req.params;

      const warehouse = await WarehouseService.update(
        id,
        context.tenantId,
        context.businessUnitId,
        req.body,
      );

      res.json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete warehouse
   * DELETE /api/warehouses/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { id } = req.params;

      const result = await WarehouseService.delete(
        id,
        context.tenantId,
        context.businessUnitId,
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
}
