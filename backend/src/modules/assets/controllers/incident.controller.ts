/**
 * Incident Controller
 *
 * HTTP handlers for incident management operations
 * Implements workflow 5
 */

import { Request, Response, NextFunction } from "express";
import { IncidentService } from "../services/incident.service";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const incidentService = new IncidentService(prisma);

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

export class IncidentController {
  // ========== INCIDENT REPORTING (Workflow 5) ==========

  /**
   * Report incident
   * POST /api/v1/incidents
   */
  static async reportIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const data = req.body;

      const incident = await incidentService.reportIncident(
        context.tenantId,
        context.businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get incident by ID
   * GET /api/v1/incidents/:incidentId
   */
  static async getIncident(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const incidentId = validatePathParam(req, res, "incidentId");
      if (!incidentId) return;

      const incident = await incidentService.getIncidentById(
        context.tenantId,
        context.businessUnitId,
        incidentId,
      );

      if (!incident) {
        return res.status(404).json({
          success: false,
          error: "Incident not found",
        });
      }

      res.json({
        success: true,
        data: incident,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List incidents
   * GET /api/v1/incidents
   */
  static async listIncidents(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        assetId: req.query.assetId as string | undefined,
        contractId: req.query.contractId as string | undefined,
        resolved:
          req.query.resolved === "true"
            ? true
            : req.query.resolved === "false"
              ? false
              : undefined,
      };

      const pagination = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await incidentService.listIncidents(
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
   * Get active incidents (unresolved)
   * GET /api/v1/incidents/active
   */
  static async getActiveIncidents(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const incidents = await incidentService.getActiveIncidents(
        context.tenantId,
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: incidents,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve incident with decision
   * POST /api/v1/incidents/:incidentId/resolve
   */
  static async resolveIncident(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const incidentId = validatePathParam(req, res, "incidentId");
      if (!incidentId) return;

      const data = req.body;

      if (
        !data.decision ||
        !["REPLACE", "PAUSE", "CONTINUE"].includes(data.decision)
      ) {
        return res.status(400).json({
          success: false,
          error: "decision must be REPLACE, PAUSE, or CONTINUE",
        });
      }

      const result = await incidentService.resolveIncident(
        context.tenantId,
        context.businessUnitId,
        incidentId,
        data,
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
