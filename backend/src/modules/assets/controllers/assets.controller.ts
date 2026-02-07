/**
 * Assets Controller
 *
 * HTTP handlers for asset operations
 */

import { Request, Response, NextFunction } from "express";
import { AssetService } from "../services/asset.service";
import { MaintenanceService } from "../services/maintenance.service";
import { UsageService } from "../services/usage.service";
import { AttachmentService } from "../services/attachment.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const assetService = new AssetService(prisma);
const maintenanceService = new MaintenanceService(prisma);
const usageService = new UsageService(prisma);
const attachmentService = new AttachmentService(prisma);

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

export class AssetsController {
  // ========== ASSETS ==========

  static async createAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;

      const asset = await assetService.createAsset(
        context.tenantId,
        context.businessUnitId,
        data as any,
      );

      res.status(201).json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const asset = await assetService.getAssetById(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
      );

      if (!asset) {
        return res.status(404).json({
          success: false,
          error: "Asset not found",
        });
      }

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAssets(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const {
        assetType,
        requiresOperator,
        requiresTracking,
        search,
        page,
        limit,
      } = req.query;

      const filters = {
        assetType: assetType as string,
        requiresOperator:
          requiresOperator === "true"
            ? true
            : requiresOperator === "false"
              ? false
              : undefined,
        requiresTracking:
          requiresTracking === "true"
            ? true
            : requiresTracking === "false"
              ? false
              : undefined,
        search: search as string,
      };

      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      };

      const result = await assetService.listAssets(
        context.tenantId,
        context.businessUnitId,
        filters,
        pagination,
      );
      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;
      const data = req.body;

      const asset = await assetService.updateAsset(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
        data as any,
      );

      res.json({
        success: true,
        data: asset,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      await assetService.deleteAsset(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
      );

      res.json({
        success: true,
        message: "Asset deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Decommission asset (descarte con motivo)
   * POST /api/v1/assets/:assetId/decommission
   */
  static async decommissionAsset(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const { reason, notes, attributableToClient, clientId } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: "reason is required for asset decommission",
        });
      }

      await assetService.decommissionAsset(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
        { reason, notes, attributableToClient, clientId },
      );

      res.json({
        success: true,
        message: "Asset decommissioned successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAssetState(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;
      const { workflowId, currentState } = req.body;

      await assetService.updateAssetState(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
        workflowId,
        currentState,
      );

      res.json({
        success: true,
        message: "Asset state updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssetEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;
      const { limit } = req.query;

      const events = await assetService.getAssetEvents(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
        limit ? parseInt(limit as string) : 50,
      );

      res.json({
        success: true,
        data: events,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== MAINTENANCE ==========

  static async createMaintenance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;
      if (!data.assetId || typeof data.assetId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Asset ID is required in request body",
        });
      }

      const maintenance = await maintenanceService.createMaintenance(
        context.tenantId,
        context.businessUnitId,
        data as any,
      );

      res.status(201).json({
        success: true,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMaintenance(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const maintenanceId = validatePathParam(req, res, "maintenanceId");
      if (!maintenanceId) return;

      const maintenance = await maintenanceService.getMaintenanceById(
        context.tenantId,
        context.businessUnitId,
        maintenanceId as string,
      );

      if (!maintenance) {
        return res.status(404).json({
          success: false,
          error: "Maintenance record not found",
        });
      }

      res.json({
        success: true,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listMaintenanceByAsset(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const maintenanceRecords =
        await maintenanceService.listMaintenanceByAsset(
          context.tenantId,
          context.businessUnitId,
          assetId as string,
        );

      res.json({
        success: true,
        data: maintenanceRecords,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMaintenance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const maintenanceId = validatePathParam(req, res, "maintenanceId");
      if (!maintenanceId) return;
      const data = req.body;

      const maintenance = await maintenanceService.updateMaintenance(
        context.tenantId,
        context.businessUnitId,
        maintenanceId as string,
        data as any,
      );

      res.json({
        success: true,
        data: maintenance,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveMaintenance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const maintenanceRecords = await maintenanceService.getActiveMaintenance(
        context.tenantId,
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: maintenanceRecords,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== USAGE ==========

  static async recordUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;
      if (!data.assetId || typeof data.assetId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Asset ID is required in request body",
        });
      }

      const usage = await usageService.recordUsage(
        context.tenantId,
        context.businessUnitId,
        data as any,
      );

      res.status(201).json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const usageId = validatePathParam(req, res, "usageId");
      if (!usageId) return;

      const usage = await usageService.getUsageById(
        context.tenantId,
        context.businessUnitId,
        usageId as string,
      );

      if (!usage) {
        return res.status(404).json({
          success: false,
          error: "Usage record not found",
        });
      }

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const {
        assetId,
        reportedByUserId,
        source,
        dateFrom,
        dateTo,
        page,
        limit,
      } = req.query;

      const filters = {
        assetId: assetId as string,
        reportedByUserId: reportedByUserId as string,
        source: source as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
      };

      const pagination = {
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 50,
      };

      const result = await usageService.listUsage(
        context.tenantId,
        context.businessUnitId,
        filters as any,
        pagination,
      );

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAssetUsageSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;
      const { dateFrom, dateTo } = req.query;

      const summary = await usageService.getAssetUsageSummary(
        context.tenantId,
        context.businessUnitId,
        assetId as string,
        dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo ? new Date(dateTo as string) : undefined,
      );

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const usageId = validatePathParam(req, res, "usageId");
      if (!usageId) return;

      await usageService.deleteUsage(
        context.tenantId,
        context.businessUnitId,
        usageId as string,
      );

      res.json({
        success: true,
        message: "Usage record deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== ATTACHMENTS ==========

  static async createAttachment(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;
      if (!data.assetId || typeof data.assetId !== "string") {
        return res.status(400).json({
          success: false,
          error: "Asset ID is required in request body",
        });
      }

      const attachment = await attachmentService.createAttachment(
        context.tenantId,
        context.businessUnitId,
        data as any,
      );

      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAttachment(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const attachmentId = validatePathParam(req, res, "attachmentId");
      if (!attachmentId) return;

      const attachment = await attachmentService.getAttachmentById(
        context.tenantId,
        context.businessUnitId,
        attachmentId as string,
      );

      if (!attachment) {
        return res.status(404).json({
          success: false,
          error: "Attachment not found",
        });
      }

      res.json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAttachments(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { assetId, type, source } = req.query;

      const filters = {
        assetId: assetId as string,
        type: type as string,
        source: source as string,
      };

      const attachments = await attachmentService.listAttachments(
        context.tenantId,
        context.businessUnitId,
        filters,
      );

      res.json({
        success: true,
        data: attachments,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteAttachment(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const attachmentId = validatePathParam(req, res, "attachmentId");
      if (!attachmentId) return;

      await attachmentService.deleteAttachment(
        context.tenantId,
        context.businessUnitId,
        attachmentId as string,
      );

      res.json({
        success: true,
        message: "Attachment deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
