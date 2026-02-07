/**
 * Rental Controller
 *
 * HTTP handlers for rental contract operations
 * Implements workflows 2, 3, 6, 9
 */

import { Request, Response, NextFunction } from "express";
import { RentalService } from "../services/rental.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const rentalService = new RentalService(prisma);

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

export class RentalController {
  // ========== RENTAL CONTRACTS ==========

  /**
   * Create rental contract
   * POST /api/v1/rental/contracts
   */
  static async createContract(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;

      const contract = await rentalService.createContract(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get rental contract by ID
   * GET /api/v1/rental/contracts/:contractId
   */
  static async getContract(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contractId = validatePathParam(req, res, "contractId");
      if (!contractId) return;

      const contract = await rentalService.getContractById(
        context.tenantId,
        context.businessUnitId,
        contractId,
      );

      if (!contract) {
        return res.status(404).json({
          success: false,
          error: "Contract not found",
        });
      }

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List rental contracts
   * GET /api/v1/rental/contracts
   */
  static async listContracts(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        status: req.query.status as string | undefined,
        clientId: req.query.clientId as string | undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await rentalService.listContracts(
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
   * Update rental contract
   * PATCH /api/v1/rental/contracts/:contractId
   */
  static async updateContract(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contractId = validatePathParam(req, res, "contractId");
      if (!contractId) return;

      const data = req.body;

      const contract = await rentalService.updateContract(
        context.tenantId,
        context.businessUnitId,
        contractId,
        data,
      );

      res.json({
        success: true,
        data: contract,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign asset to contract (Workflow 2)
   * POST /api/v1/rental/contracts/:contractId/assign-asset
   */
  static async assignAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contractId = validatePathParam(req, res, "contractId");
      if (!contractId) return;

      const data = {
        ...req.body,
        contractId,
      };

      const assignment = await rentalService.assignAssetToContract(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Finalize contract (Workflow 6)
   * POST /api/v1/rental/contracts/:contractId/finalize
   */
  static async finalizeContract(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contractId = validatePathParam(req, res, "contractId");
      if (!contractId) return;

      const result = await rentalService.finalizeContract(
        context.tenantId,
        context.businessUnitId,
        contractId,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ========== USAGE REPORTS (Workflow 3) ==========

  /**
   * Record usage report
   * POST /api/v1/rental/usage-reports
   */
  static async recordUsageReport(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;

      const report = await rentalService.recordUsageReport(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List usage reports
   * GET /api/v1/rental/usage-reports
   */
  static async listUsageReports(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        assetId: req.query.assetId as string | undefined,
        contractId: req.query.contractId as string | undefined,
        startDate: req.query.startDate
          ? new Date(req.query.startDate as string)
          : undefined,
        endDate: req.query.endDate
          ? new Date(req.query.endDate as string)
          : undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await rentalService.listUsageReports(
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

  // ========== AVAILABILITY PROJECTION (Workflow 9) ==========

  /**
   * Project asset availability
   * GET /api/v1/rental/availability/:assetId
   */
  static async projectAssetAvailability(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const projection = await rentalService.projectAssetAvailability(
        context.tenantId,
        context.businessUnitId,
        assetId,
      );

      res.json({
        success: true,
        data: projection,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Project availability by asset type
   * GET /api/v1/rental/availability/type/:assetTypeId
   */
  static async projectAvailabilityByType(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetTypeId = validatePathParam(req, res, "assetTypeId");
      if (!assetTypeId) return;

      const projections = await rentalService.projectAvailabilityByType(
        context.tenantId,
        context.businessUnitId,
        assetTypeId,
      );

      res.json({
        success: true,
        data: projections,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Evaluate asset post obra
   * POST /api/v1/rental/assets/:assetId/evaluate-post-obra
   */
  static async evaluatePostObra(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const { needsMaintenance } = req.body;

      const result = await rentalService.evaluateAssetPostObra(
        context.tenantId,
        context.businessUnitId,
        assetId,
        needsMaintenance,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get usage variance (real vs estimated)
   * GET /api/v1/rental/contract-assets/:contractAssetId/usage-variance
   */
  static async getUsageVariance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contractAssetId = validatePathParam(req, res, "contractAssetId");
      if (!contractAssetId) return;

      const variance = await rentalService.getUsageVariance(
        context.tenantId,
        context.businessUnitId,
        contractAssetId,
      );

      res.json({
        success: true,
        data: variance,
      });
    } catch (error) {
      next(error);
    }
  }
}
