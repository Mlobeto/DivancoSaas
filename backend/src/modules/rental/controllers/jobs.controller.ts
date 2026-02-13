/**
 * JOBS CONTROLLER
 * Controller para ejecución manual de cron jobs (testing/admin)
 */

import { Request, Response } from "express";
import { autoChargeService } from "../services/auto-charge.service";

export class JobsController {
  /**
   * @swagger
   * /api/v1/rental/jobs/process-tools:
   *   post:
   *     tags: [Jobs]
   *     summary: Ejecutar cargo automático de herramientas (manual)
   *     security:
   *       - AdminKey: []
   *     responses:
   *       200:
   *         description: Job ejecutado exitosamente
   */
  async processTools(req: Request, res: Response): Promise<void> {
    try {
      const startTime = Date.now();
      const result = await autoChargeService.processToolCharges();
      const executionTime = ((Date.now() - startTime) / 1000).toFixed(1);

      res.json({
        success: true,
        data: {
          ...result,
          executionTime: `${executionTime}s`,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "JOB_EXECUTION_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/jobs/notify-missing:
   *   post:
   *     tags: [Jobs]
   *     summary: Enviar notificaciones de reportes faltantes
   *     security:
   *       - AdminKey: []
   *     responses:
   *       200:
   *         description: Notificaciones enviadas
   */
  async notifyMissing(req: Request, res: Response): Promise<void> {
    try {
      const result = await autoChargeService.notifyMissingReports();

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "NOTIFICATION_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/jobs/send-statements:
   *   post:
   *     tags: [Jobs]
   *     summary: Enviar estados de cuenta programados
   *     security:
   *       - AdminKey: []
   *     responses:
   *       200:
   *         description: Estados de cuenta enviados
   */
  async sendStatements(req: Request, res: Response): Promise<void> {
    try {
      const result = await autoChargeService.sendScheduledStatements();

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "STATEMENTS_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/jobs/check-alerts:
   *   post:
   *     tags: [Jobs]
   *     summary: Verificar alertas de saldo bajo
   *     security:
   *       - AdminKey: []
   *     responses:
   *       200:
   *         description: Alertas verificadas
   */
  async checkAlerts(req: Request, res: Response): Promise<void> {
    try {
      const result = await autoChargeService.checkLowBalanceAlerts();

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: "ALERTS_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const jobsController = new JobsController();
