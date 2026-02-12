/**
 * SUPPLY CATEGORY CONTROLLER
 * HTTP handlers para gestión de categorías de insumos
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { SupplyCategoryService } from "../services/supply-category.service";
import { SupplyCategoryImportService } from "../services/supply-category-import.service";
import multer from "multer";

const prisma = new PrismaClient();
const supplyCategoryService = new SupplyCategoryService(prisma);
const importService = new SupplyCategoryImportService(prisma);

// Configure multer for file upload (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

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

export class SupplyCategoryController {
  /**
   * Crear categoría de insumo
   * POST /api/v1/modules/purchases/supply-categories
   */
  static async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const category = await supplyCategoryService.createCategory(
        context.tenantId,
        context.businessUnitId,
        req.body,
      );

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar categorías
   * GET /api/v1/modules/purchases/supply-categories
   */
  static async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        type: req.query.type as any,
        search: req.query.search as string,
        isActive:
          req.query.isActive === "true"
            ? true
            : req.query.isActive === "false"
              ? false
              : undefined,
      };

      const categories = await supplyCategoryService.listCategories(
        context.tenantId,
        context.businessUnitId,
        filters,
      );

      res.json({
        success: true,
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener categoría por ID
   * GET /api/v1/modules/purchases/supply-categories/:categoryId
   */
  static async getCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const categoryId = req.params.categoryId as string;

      const category = await supplyCategoryService.getCategoryById(
        context.tenantId,
        context.businessUnitId,
        categoryId,
      );

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar categoría
   * PUT /api/v1/modules/purchases/supply-categories/:categoryId
   */
  static async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const categoryId = req.params.categoryId as string;

      const category = await supplyCategoryService.updateCategory(
        context.tenantId,
        context.businessUnitId,
        categoryId,
        req.body,
      );

      res.json({
        success: true,
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar categoría
   * DELETE /api/v1/modules/purchases/supply-categories/:categoryId
   */
  static async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const categoryId = req.params.categoryId as string;

      const result = await supplyCategoryService.deleteCategory(
        context.tenantId,
        context.businessUnitId,
        categoryId,
      );

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activar/Desactivar categoría
   * PATCH /api/v1/modules/purchases/supply-categories/:categoryId/toggle-active
   */
  static async toggleActive(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const categoryId = req.params.categoryId as string;

      const category = await supplyCategoryService.toggleActiveCategory(
        context.tenantId,
        context.businessUnitId,
        categoryId,
      );

      res.json({
        success: true,
        data: category,
        message: `Category ${category.isActive ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener estadísticas
   * GET /api/v1/modules/purchases/supply-categories/stats
   */
  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const stats = await supplyCategoryService.getCategoryStats(
        context.tenantId,
        context.businessUnitId,
      );

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Importar categorías desde CSV
   * POST /api/v1/modules/purchases/supply-categories/import
   */
  static async importCSV(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "CSV file is required",
        });
        return;
      }

      const result = await importService.importFromCSV(
        context.tenantId,
        context.businessUnitId,
        req.file.buffer,
      );

      const statusCode = result.success ? 200 : 400;
      res.status(statusCode).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get multer upload middleware
   */
  static getUploadMiddleware() {
    return upload.single("file");
  }
}
