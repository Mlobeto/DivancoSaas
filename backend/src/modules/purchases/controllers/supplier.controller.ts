/**
 * SUPPLIER CONTROLLER
 * HTTP handlers para gestión de proveedores
 */

import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { SupplierService } from "../services/supplier.service";

const prisma = new PrismaClient();
const supplierService = new SupplierService(prisma);

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

export class SupplierController {
  // ============================================
  // SUPPLIERS
  // ============================================

  /**
   * Crear proveedor
   * POST /api/v1/modules/purchases/suppliers
   */
  static async createSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplier = await supplierService.createSupplier(
        context.tenantId,
        context.businessUnitId,
        req.body,
      );

      res.status(201).json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listar proveedores
   * GET /api/v1/modules/purchases/suppliers
   */
  static async listSuppliers(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const filters = {
        status: req.query.status as any,
        search: req.query.search as string,
        country: req.query.country as string,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        limit: req.query.limit
          ? parseInt(req.query.limit as string)
          : undefined,
      };

      const result = await supplierService.listSuppliers(
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
   * Obtener proveedor por ID
   * GET /api/v1/modules/purchases/suppliers/:supplierId
   */
  static async getSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplier = await supplierService.getSupplierById(
        req.params.supplierId as string,
      );

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar proveedor
   * PUT /api/v1/modules/purchases/suppliers/:supplierId
   */
  static async updateSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const supplier = await supplierService.updateSupplier(
        req.params.supplierId as string,
        req.body,
      );

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar proveedor
   * DELETE /api/v1/modules/purchases/suppliers/:supplierId
   */
  static async deleteSupplier(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      await supplierService.deleteSupplier(req.params.supplierId as string);

      res.json({
        success: true,
        message: "Supplier deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // SUPPLIER CONTACTS
  // ============================================

  /**
   * Agregar contacto a proveedor
   * POST /api/v1/modules/purchases/suppliers/:supplierId/contacts
   */
  static async addContact(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contact = await supplierService.addContact({
        supplierId: req.params.supplierId as string,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualizar contacto
   * PUT /api/v1/modules/purchases/suppliers/contacts/:contactId
   */
  static async updateContact(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const contact = await supplierService.updateContact(
        req.params.contactId as string,
        req.body,
      );

      res.json({
        success: true,
        data: contact,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Eliminar contacto
   * DELETE /api/v1/modules/purchases/suppliers/contacts/:contactId
   */
  static async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      await supplierService.deleteContact(req.params.contactId as string);

      res.json({
        success: true,
        message: "Contact deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // SUPPLIER ACCOUNT (cuenta corriente)
  // ============================================

  /**
   * Obtener balance de cuenta corriente
   * GET /api/v1/modules/purchases/suppliers/:supplierId/account/balance
   */
  static async getAccountBalance(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const balance = await supplierService.getAccountBalance(
        req.params.supplierId as string,
      );

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtener historial de cuenta corriente
   * GET /api/v1/modules/purchases/suppliers/:supplierId/account/history
   */
  static async getAccountHistory(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const fromDate = req.query.fromDate
        ? new Date(req.query.fromDate as string)
        : undefined;
      const toDate = req.query.toDate
        ? new Date(req.query.toDate as string)
        : undefined;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

      const result = await supplierService.getAccountHistory(
        req.params.supplierId as string,
        fromDate,
        toDate,
        page,
        limit,
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
   * Crear entrada en cuenta corriente (pago, ajuste, etc.)
   * POST /api/v1/modules/purchases/suppliers/:supplierId/account/entries
   */
  static async createAccountEntry(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const entry = await supplierService.createAccountEntry(
        context.tenantId,
        context.businessUnitId,
        {
          supplierId: req.params.supplierId as string,
          ...req.body,
        },
        context.userId,
      );

      res.status(201).json({
        success: true,
        data: entry,
      });
    } catch (error) {
      next(error);
    }
  }
}
