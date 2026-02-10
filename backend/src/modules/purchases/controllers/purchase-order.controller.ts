/**
 * PURCHASE ORDER CONTROLLER
 * HTTP handlers para gestión de órdenes de compra
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { PurchaseOrderService } from "../services/purchase-order.service";

const prisma = new PrismaClient();
const purchaseOrderService = new PurchaseOrderService(prisma);

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

export class PurchaseOrderController {
  /**
   * Crear orden de compra
   * POST /api/v1/modules/purchases/purchase-orders
   */
  static async createPurchaseOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const order = await purchaseOrderService.createPurchaseOrder(
        context.tenantId,
        context.businessUnitId,
        req.body,
        context.userId,
      );

      res.status(201).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar órdenes de compra
   * GET /api/v1/modules/purchases/purchase-orders
   */
  static async listPurchaseOrders(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        supplierId: req.query.supplierId as string,
        status: req.query.status as any,
        fromDate: req.query.fromDate
          ? new Date(req.query.fromDate as string)
          : undefined,
        toDate: req.query.toDate
          ? new Date(req.query.toDate as string)
          : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await purchaseOrderService.listPurchaseOrders(
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
   * Obtener orden de compra por ID
   * GET /api/v1/modules/purchases/purchase-orders/:orderId
   */
  static async getPurchaseOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const order = await purchaseOrderService.getPurchaseOrderById(
        req.params.orderId as string,
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar orden de compra
   * PUT /api/v1/modules/purchases/purchase-orders/:orderId
   */
  static async updatePurchaseOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const order = await purchaseOrderService.updatePurchaseOrder(
        req.params.orderId as string,
        req.body,
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirmar orden de compra (enviar al proveedor)
   * POST /api/v1/modules/purchases/purchase-orders/:orderId/confirm
   */
  static async confirmOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const order = await purchaseOrderService.confirmOrder(
        req.params.orderId as string,
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancelar orden de compra
   * POST /api/v1/modules/purchases/purchase-orders/:orderId/cancel
   */
  static async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const order = await purchaseOrderService.cancelOrder(
        req.params.orderId as string,
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Recibir mercadería (entrada a stock)
   * POST /api/v1/modules/purchases/purchase-orders/:orderId/receive
   */
  static async receivePurchaseOrder(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const order = await purchaseOrderService.receivePurchaseOrder(
        req.params.orderId as string,
        req.body,
        context.userId,
      );

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // ITEMS
  // ============================================

  /**
   * Agregar item a orden de compra
   * POST /api/v1/modules/purchases/purchase-orders/:orderId/items
   */
  static async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const item = await purchaseOrderService.addItem(
        req.params.orderId as string,
        req.body,
      );

      res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar item de orden de compra
   * PUT /api/v1/modules/purchases/purchase-orders/items/:itemId
   */
  static async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const item = await purchaseOrderService.updateItem(
        req.params.itemId as string,
        req.body,
      );

      res.json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar item de orden de compra
   * DELETE /api/v1/modules/purchases/purchase-orders/items/:itemId
   */
  static async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      await purchaseOrderService.deleteItem(req.params.itemId as string);

      res.json({
        success: true,
        message: "Item deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }
}
