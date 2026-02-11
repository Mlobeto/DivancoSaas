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
import { azureBlobStorageService } from "@shared/storage/azure-blob-storage.service";
import multer from "multer";

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

  /**
   * Upload evidence for usage record (odometer/hourometer photos)
   * POST /usage/:usageId/evidence
   */
  static async uploadUsageEvidence(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const usageId = validatePathParam(req, res, "usageId");
      if (!usageId) return;

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          error: "At least one evidence file is required",
        });
        return;
      }

      // Verificar que el usage record existe
      const usage = await usageService.getUsageById(
        context.tenantId,
        context.businessUnitId,
        usageId,
      );

      if (!usage) {
        res.status(404).json({
          success: false,
          error: "Usage record not found",
        });
        return;
      }

      // Upload each evidence file to Azure Blob Storage
      const evidenceUrls = await Promise.all(
        req.files.map(async (file) => {
          const uploadResult = await azureBlobStorageService.uploadFile({
            file: file.buffer,
            fileName: file.originalname,
            contentType: file.mimetype,
            folder: "usage-evidence",
            tenantId: context.tenantId,
            businessUnitId: context.businessUnitId,
          });

          return uploadResult.url;
        }),
      );

      // Update usage record with evidence URLs
      const updatedUsage = await usageService.uploadEvidence(
        context.tenantId,
        context.businessUnitId,
        usageId,
        evidenceUrls,
      );

      res.json({
        success: true,
        data: updatedUsage,
        message: `${evidenceUrls.length} evidence file(s) uploaded successfully`,
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

  // ========== IMAGE UPLOAD ==========

  /**
   * Upload main image for asset
   * POST /assets/:assetId/image
   */
  static async uploadMainImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "Image file is required",
        });
        return;
      }

      // Verificar que el asset existe
      const asset = await assetService.getAssetById(
        context.tenantId,
        context.businessUnitId,
        assetId,
      );

      if (!asset) {
        res.status(404).json({
          success: false,
          error: "Asset not found",
        });
        return;
      }

      // Subir imagen a Azure Blob Storage
      const uploadResult = await azureBlobStorageService.uploadFile({
        file: req.file.buffer,
        fileName: req.file.originalname,
        contentType: req.file.mimetype,
        folder: "assets",
        tenantId: context.tenantId,
        businessUnitId: context.businessUnitId,
      });

      // Actualizar asset con URL de imagen
      const updatedAsset = await assetService.uploadMainImage(
        context.tenantId,
        context.businessUnitId,
        assetId,
        uploadResult.url,
      );

      res.json({
        success: true,
        data: {
          asset: updatedAsset,
          imageUrl: uploadResult.url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete main image
   * DELETE /assets/:assetId/image
   */
  static async deleteMainImage(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      const updatedAsset = await assetService.deleteMainImage(
        context.tenantId,
        context.businessUnitId,
        assetId,
      );

      res.json({
        success: true,
        data: updatedAsset,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload multiple attachments (documents/photos)
   * POST /assets/:assetId/attachments
   * Body: { documentTypeId?, issueDate?, expiryDate?, alertDays?, notes? }
   */
  static async uploadMultipleAttachments(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const assetId = validatePathParam(req, res, "assetId");
      if (!assetId) return;

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          error: "At least one file is required",
        });
        return;
      }

      // Verificar que el asset existe
      const asset = await assetService.getAssetById(
        context.tenantId,
        context.businessUnitId,
        assetId,
      );

      if (!asset) {
        res.status(404).json({
          success: false,
          error: "Asset not found",
        });
        return;
      }

      // Parse optional fields from body
      const {
        documentTypeId,
        issueDate,
        expiryDate,
        alertDays,
        notes,
        source = "web",
      } = req.body;

      // Upload each file and create attachments
      const uploadedAttachments = await Promise.all(
        req.files.map(async (file) => {
          // Subir a Azure Blob Storage
          const uploadResult = await azureBlobStorageService.uploadFile({
            file: file.buffer,
            fileName: file.originalname,
            contentType: file.mimetype,
            folder: "attachments",
            tenantId: context.tenantId,
            businessUnitId: context.businessUnitId,
          });

          // Determinar tipo de attachment
          let type = "unknown";
          if (file.mimetype.startsWith("image/")) {
            type = "image";
          } else if (file.mimetype === "application/pdf") {
            type = "pdf";
          } else if (
            file.mimetype.includes("word") ||
            file.mimetype.includes("document")
          ) {
            type = "document";
          }

          // Crear attachment en DB con metadata de vencimiento
          const attachment = await attachmentService.createAttachmentWithFile(
            context.tenantId,
            context.businessUnitId,
            assetId,
            {
              type,
              url: uploadResult.url,
              fileName: file.originalname,
              source,
              documentTypeId: documentTypeId || undefined,
              issueDate: issueDate ? new Date(issueDate) : undefined,
              expiryDate: expiryDate ? new Date(expiryDate) : undefined,
              alertDays: alertDays ? parseInt(alertDays) : undefined,
              notes: notes || undefined,
            },
          );

          return attachment;
        }),
      );

      res.json({
        success: true,
        data: uploadedAttachments,
        message: `${uploadedAttachments.length} attachment(s) uploaded successfully`,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Configurar multer para imágenes de maquinarias (5MB)
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo imágenes
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Configurar multer para documentos/attachments (10MB, múltiples archivos)
export const uploadDocuments = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB por archivo
    files: 10, // Máximo 10 archivos
  },
  fileFilter: (req, file, cb) => {
    // Aceptar imágenes, PDFs, Word, Excel
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only images, PDF, Word and Excel files are allowed for documents",
        ),
      );
    }
  },
});
