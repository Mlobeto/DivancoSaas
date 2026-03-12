/**
 * MOBILE CONTROLLER
 *
 * REST controller para el flujo de evidencias de operarios desde la app mobile.
 * Todas las rutas requieren autenticación JWT.
 */

import { Request, Response } from "express";
import { mobileService } from "./mobile.service";

export class MobileController {
  /**
   * GET /api/v1/mobile/my-assignments
   *
   * Retorna los contratos activos del operario logueado.
   */
  async getMyAssignments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { businessUnitId } = req.context || {};

      if (!userId || !businessUnitId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing auth context" },
        });
        return;
      }

      const assignments = await mobileService.getMyAssignments(
        userId,
        businessUnitId,
      );

      res.json({ success: true, data: assignments });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: { code: "ASSIGNMENTS_ERROR", message: error.message },
      });
    }
  }

  /**
   * GET /api/v1/mobile/assignments/:id/evidence
   *
   * Retorna las evidencias del día para un assignment específico,
   * agrupadas en START / END / ADHOC.
   */
  async getDayEvidence(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id: assignmentId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const evidence = await mobileService.getDayEvidence(assignmentId, userId);

      res.json({ success: true, data: evidence });
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        error: { code: "EVIDENCE_ERROR", message: error.message },
      });
    }
  }

  /**
   * POST /api/v1/mobile/assignments/:id/evidence
   *
   * Sube una foto de evidencia para un assignment.
   * Requiere multipart/form-data con campos: photoType, notes (opcional).
   */
  async submitEvidence(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id: assignmentId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: { code: "NO_FILE", message: "Foto requerida" },
        });
        return;
      }

      const { photoType, notes, latitude, longitude } = req.body;

      const validTypes = [
        "ASSET_START",
        "HOUROMETER",
        "ASSET_END",
        "WORK_PROGRESS",
        "INCIDENT",
        "OTHER",
      ];

      if (!photoType || !validTypes.includes(photoType)) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PHOTO_TYPE",
            message: `photoType must be one of: ${validTypes.join(", ")}`,
          },
        });
        return;
      }

      const result = await mobileService.submitEvidence(userId, {
        assignmentId,
        photoType,
        notes,
        fileBuffer: req.file.buffer,
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
      });

      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        error: { code: "SUBMIT_EVIDENCE_ERROR", message: error.message },
      });
    }
  }

  /**
   * GET /api/v1/mobile/assignments/:id/summary
   *
   * Resumen del progreso diario:
   * cuántas evidencias requeridas están completas vs pendientes.
   */
  async getDaySummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const { id: assignmentId } = req.params;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Not authenticated" },
        });
        return;
      }

      const summary = await mobileService.getDaySummary(assignmentId, userId);

      res.json({ success: true, data: summary });
    } catch (error: any) {
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        error: { code: "SUMMARY_ERROR", message: error.message },
      });
    }
  }
}

export const mobileController = new MobileController();
