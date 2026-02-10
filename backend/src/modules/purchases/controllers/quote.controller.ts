/**
 * QUOTE CONTROLLER
 * HTTP handlers para gestión de cotizaciones
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { QuoteService } from "../services/quote.service";

const prisma = new PrismaClient();
const quoteService = new QuoteService(prisma);

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

export class QuoteController {
  /**
   * Crear cotización
   * POST /api/v1/modules/purchases/quotes
   */
  static async createQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const quote = await quoteService.createQuote(
        context.tenantId,
        context.businessUnitId,
        req.body,
        context.userId,
      );

      res.status(201).json({
        success: true,
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar cotizaciones
   * GET /api/v1/modules/purchases/quotes
   */
  static async listQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        supplyId: req.query.supplyId as string,
        supplierId: req.query.supplierId as string,
        isActive: req.query.isActive === "true",
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await quoteService.listQuotes(
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
   * Obtener cotización por ID
   * GET /api/v1/modules/purchases/quotes/:quoteId
   */
  static async getQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const quote = await quoteService.getQuoteById(
        req.params.quoteId as string,
      );

      res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar cotización
   * PUT /api/v1/modules/purchases/quotes/:quoteId
   */
  static async updateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const quote = await quoteService.updateQuote(
        req.params.quoteId as string,
        req.body,
      );

      res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar cotización
   * DELETE /api/v1/modules/purchases/quotes/:quoteId
   */
  static async deleteQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      await quoteService.deleteQuote(req.params.quoteId as string);

      res.json({
        success: true,
        message: "Quote deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Comparar cotizaciones de un insumo
   * GET /api/v1/modules/purchases/quotes/compare/:supplyId
   */
  static async compareQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const comparison = await quoteService.compareQuotes(
        context.tenantId,
        context.businessUnitId,
        req.params.supplyId as string,
      );

      res.json({
        success: true,
        data: comparison,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener cotizaciones activas de un proveedor
   * GET /api/v1/modules/purchases/suppliers/:supplierId/active-quotes
   */
  static async getActiveQuotesBySupplierId(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const quotes = await quoteService.getActiveQuotesBySupplierId(
        context.tenantId,
        context.businessUnitId,
        req.params.supplierId as string,
      );

      res.json({
        success: true,
        data: quotes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desactivar cotizaciones vencidas
   * POST /api/v1/modules/purchases/quotes/deactivate-expired
   */
  static async deactivateExpiredQuotes(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const result = await quoteService.deactivateExpiredQuotes(
        context.tenantId,
        context.businessUnitId,
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
