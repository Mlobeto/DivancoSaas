/**
 * USAGE REPORT CONTROLLER
 * Controller para reportes diarios del operario (mobile app)
 */

import { Request, Response } from "express";
import { usageReportService } from "../services/usage-report.service";
import prisma from "@config/database";

export class UsageReportController {
  /**
   * @swagger
   * /api/v1/rental/usage-reports/validate:
   *   post:
   *     tags: [Usage Reports]
   *     summary: Pre-validar reporte antes de enviarlo (offline mobile)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rentalId
   *               - reportedBy
   *               - metricType
   *               - evidenceUrls
   *             properties:
   *               rentalId:
   *                 type: string
   *               reportedBy:
   *                 type: string
   *               metricType:
   *                 type: string
   *                 enum: [HOUROMETER, ODOMETER, BOTH]
   *               hourometerStart:
   *                 type: number
   *               hourometerEnd:
   *                 type: number
   *               odometerStart:
   *                 type: number
   *               odometerEnd:
   *                 type: number
   *               evidenceUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       200:
   *         description: Validación exitosa con estimación de costos
   */
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const validation = await usageReportService.validateUsageReport(req.body);

      res.json({
        success: true,
        data: {
          validation,
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "VALIDATION_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/usage-reports:
   *   post:
   *     tags: [Usage Reports]
   *     summary: Crear reporte de uso diario (procesa y cobra)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - rentalId
   *               - date
   *               - hourometerStart
   *               - hourometerEnd
   *               - evidenceUrls
   *             properties:
   *               rentalId:
   *                 type: string
   *               date:
   *                 type: string
   *                 format: date
   *               hourometerStart:
   *                 type: number
   *               hourometerEnd:
   *                 type: number
   *               odometerStart:
   *                 type: number
   *               odometerEnd:
   *                 type: number
   *               evidenceUrls:
   *                 type: array
   *                 items:
   *                   type: string
   *               notes:
   *                 type: string
   *               createdAtDevice:
   *                 type: string
   *                 format: date-time
   *     responses:
   *       201:
   *         description: Reporte procesado y cargo aplicado
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.context || {};
      const data = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      const result = await usageReportService.processUsageReport({
        ...data,
        reportedBy: userId,
        date: data.date ? new Date(data.date) : new Date(),
        createdAtDevice: data.createdAtDevice
          ? new Date(data.createdAtDevice)
          : undefined,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      const statusCode =
        error.code === "INSUFFICIENT_BALANCE"
          ? 409
          : error.code === "RENTAL_NOT_FOUND"
            ? 404
            : 400;

      res.status(statusCode).json({
        success: false,
        error: {
          code: error.code || "USAGE_REPORT_ERROR",
          message: error.message,
          details: error.details,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/usage-reports/rental/{rentalId}:
   *   get:
   *     tags: [Usage Reports]
   *     summary: Listar reportes de un rental
   *     parameters:
   *       - in: path
   *         name: rentalId
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *           enum: [pending, processed, rejected]
   *     responses:
   *       200:
   *         description: Lista de reportes
   */
  async listByRental(req: Request, res: Response): Promise<void> {
    try {
      const { rentalId } = req.params;
      const { startDate, endDate, status } = req.query;

      let reports = await usageReportService.getUsageReports(
        rentalId as string,
      );

      // Filtrar por fecha y status si se proporcionan
      if (startDate) {
        const start = new Date(startDate as string);
        reports = reports.filter((r: any) => new Date(r.date) >= start);
      }

      if (endDate) {
        const end = new Date(endDate as string);
        reports = reports.filter((r: any) => new Date(r.date) <= end);
      }

      if (status) {
        reports = reports.filter((r: any) => r.status === status);
      }

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "REPORTS_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/usage-reports/{id}:
   *   get:
   *     tags: [Usage Reports]
   *     summary: Obtener reporte específico con evidencias
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Reporte encontrado
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const report = await prisma.assetUsage.findUnique({
        where: { id: id as string },
        include: {
          rental: {
            include: {
              asset: true,
            },
          },
        },
      });

      if (!report) {
        res.status(404).json({
          success: false,
          error: {
            code: "REPORT_NOT_FOUND",
            message: `Usage report with id '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "REPORT_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/usage-reports/stats/{rentalId}:
   *   get:
   *     tags: [Usage Reports]
   *     summary: Estadísticas de uso con standby
   *     parameters:
   *       - in: path
   *         name: rentalId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Estadísticas calculadas
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const { rentalId } = req.params;

      const stats = await usageReportService.getAssetUsageStats(
        rentalId as string,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "STATS_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const usageReportController = new UsageReportController();
