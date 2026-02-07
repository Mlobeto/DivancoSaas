/**
 * Supply Controller
 *
 * HTTP handlers for supply and maintenance operations
 * Implements workflows 1, 4, 7, 8
 */

import { Request, Response, NextFunction } from "express";
import { SupplyService } from "../services/supply.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const supplyService = new SupplyService(prisma);

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

/**
 * Helper to validate and extract a required path parameter
 */
function validatePathParam(
  req: Request,
  res: Response,
  paramName: string,
): string | null {
  const paramValue = req.params[paramName];

  if (!paramValue || typeof paramValue !== "string") {
    res.status(400).json({
      success: false,
      error: `${paramName} is required`,
    });
    return null;
  }

  return paramValue;
}

export class SupplyController {
  // ========== SUPPLIES (INSUMOS) ==========

  /**
   * Create supply
   * POST /api/v1/supplies
   */
  static async createSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;

      const supply = await supplyService.createSupply(
        context.tenantId,
        context.businessUnitId,
        data,
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
   * Get supply by ID
   * GET /api/v1/supplies/:supplyId
   */
  static async getSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = validatePathParam(req, res, "supplyId");
      if (!supplyId) return;

      const supply = await supplyService.getSupplyById(
        context.tenantId,
        context.businessUnitId,
        supplyId,
      );

      if (!supply) {
        return res.status(404).json({
          success: false,
          error: "Supply not found",
        });
      }

      res.json({
        success: true,
        data: supply,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List supplies
   * GET /api/v1/supplies
   */
  static async listSupplies(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        search: req.query.search as string | undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await supplyService.listSupplies(
        context.tenantId,
        context.businessUnitId,
        filters,
        pagination,
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
   * Update supply
   * PATCH /api/v1/supplies/:supplyId
   */
  static async updateSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = validatePathParam(req, res, "supplyId");
      if (!supplyId) return;

      const data = req.body;

      const supply = await supplyService.updateSupply(
        context.tenantId,
        context.businessUnitId,
        supplyId,
        data,
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
   * Record supply usage
   * POST /api/v1/supplies/usage
   */
  static async recordUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;

      const usage = await supplyService.recordSupplyUsage(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Discard supply (Workflow 8)
   * POST /api/v1/supplies/:supplyId/discard
   */
  static async discardSupply(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplyId = validatePathParam(req, res, "supplyId");
      if (!supplyId) return;

      const { quantity, reason, assetId } = req.body;

      if (!quantity || !reason) {
        return res.status(400).json({
          success: false,
          error: "quantity and reason are required",
        });
      }

      const usage = await supplyService.discardSupply(
        context.tenantId,
        context.businessUnitId,
        supplyId,
        quantity,
        reason,
        assetId,
      );

      res.status(201).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== PREVENTIVE CONFIGURATION (Workflow 1) ==========

  /**
   * Configure preventive maintenance
   * POST /api/v1/assets/:assetId/preventive-config
   */
  static async configurePreventive(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const data = {
        ...req.body,
        assetId,
      };

      const config = await supplyService.configurePreventiveMaintenance(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update preventive configuration
   * PATCH /api/v1/assets/:assetId/preventive-config
   */
  static async updatePreventiveConfig(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const data = req.body;

      const config = await supplyService.updatePreventiveConfig(
        context.tenantId,
        context.businessUnitId,
        assetId,
        data,
      );

      res.status(201).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get latest preventive configuration
   * GET /api/v1/assets/:assetId/preventive-config
   */
  static async getPreventiveConfig(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const config = await supplyService.getLatestPreventiveConfig(
        context.tenantId,
        context.businessUnitId,
        assetId,
      );

      if (!config) {
        return res.status(404).json({
          success: false,
          error: "No preventive configuration found for this asset",
        });
      }

      res.json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== MAINTENANCE EVENTS (Workflows 4, 7) ==========

  /**
   * Execute preventive maintenance in obra (Workflow 4)
   * POST /api/v1/assets/:assetId/maintenance/preventive
   */
  static async executePreventive(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const data = {
        ...req.body,
        assetId,
      };

      const event = await supplyService.executePreventiveMaintenance(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute post-obra maintenance (Workflow 7)
   * POST /api/v1/assets/:assetId/maintenance/post-obra
   */
  static async executePostObra(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const data = {
        ...req.body,
        assetId,
      };

      const event = await supplyService.executePostObraMaintenance(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: event,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get maintenance history
   * GET /api/v1/assets/:assetId/maintenance/history
   */
  static async getMaintenanceHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const history = await supplyService.getMaintenanceHistory(
        context.tenantId,
        context.businessUnitId,
        assetId,
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
