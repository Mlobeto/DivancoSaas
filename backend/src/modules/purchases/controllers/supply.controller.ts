/**
 * SUPPLY CONTROLLER
 * HTTP handlers para gestión de suministros
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { SupplyService } from "../services/supply.service";

const prisma = new PrismaClient();
const supplyService = new SupplyService(prisma);

/**
 * Helper para validar contexto de BusinessUnit
 */
function validateBusinessUnitContext(req: Request, res: Response) {
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
    userId: context.userId as string | undefined,
  };
}

export class SupplyController {
  /**
   * Crear suministro
   * POST /api/v1/modules/purchases/supplies
   */
  static async createSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supply = await supplyService.createSupply(
        context.tenantId,
        context.businessUnitId,
        req.body,
      );

      res.status(201).json({
        success: true,
        data: supply,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar suministros
   * GET /api/v1/modules/purchases/supplies
   */
  static async listSupplies(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        categoryId: req.query.categoryId as string,
        search: req.query.search as string,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
        lowStock: req.query.lowStock === "true",
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await supplyService.listSupplies(
        context.tenantId,
        context.businessUnitId,
        filters,
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
   * Obtener suministro por ID
   * GET /api/v1/modules/purchases/supplies/:supplyId
   */
  static async getSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = String(req.params.supplyId);

      const supply = await supplyService.getSupplyById(
        context.tenantId,
        context.businessUnitId,
        supplyId,
      );

      res.json({
        success: true,
        data: supply,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar suministro
   * PATCH /api/v1/modules/purchases/supplies/:supplyId
   */
  static async updateSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = String(req.params.supplyId);

      const supply = await supplyService.updateSupply(
        context.tenantId,
        context.businessUnitId,
        supplyId,
        req.body,
      );

      res.json({
        success: true,
        data: supply,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar suministro
   * DELETE /api/v1/modules/purchases/supplies/:supplyId
   */
  static async deleteSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = String(req.params.supplyId);

      const result = await supplyService.deleteSupply(
        context.tenantId,
        context.businessUnitId,
        supplyId,
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
   * Toggle activo/inactivo
   * PATCH /api/v1/modules/purchases/supplies/:supplyId/toggle-active
   */
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = String(req.params.supplyId);

      const supply = await supplyService.toggleActive(
        context.tenantId,
        context.businessUnitId,
        supplyId,
      );

      res.json({
        success: true,
        data: supply,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Ajustar stock
   * POST /api/v1/modules/purchases/supplies/:supplyId/adjust-stock
   */
  static async adjustStock(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = String(req.params.supplyId);
      const { adjustment, reason } = req.body;

      if (typeof adjustment !== "number" || !reason) {
        res.status(400).json({
          success: false,
          error: "adjustment (number) and reason (string) are required",
        });
        return;
      }

      const supply = await supplyService.adjustStock(
        context.tenantId,
        context.businessUnitId,
        supplyId,
        adjustment,
        reason,
      );

      res.json({
        success: true,
        data: supply,
      });
    } catch (error) {
      next(error);
    }
  }
}
