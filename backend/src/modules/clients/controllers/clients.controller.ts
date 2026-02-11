import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ClientsService } from "../services/clients.service";

const prisma = new PrismaClient();
const clientsService = new ClientsService(prisma);

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

export class ClientsController {
  static async listClients(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { page = "1", limit = "20", search, status } = req.query;

      const result = await clientsService.listClients(context, {
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        search: search as string | undefined,
        status: status as string | undefined,
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async createClient(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const client = await clientsService.createClient(context, req.body);

      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async getClientById(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;

      const client = await clientsService.getClientById(context, clientId);

      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async updateClient(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;

      const client = await clientsService.updateClient(
        context,
        clientId,
        req.body,
      );

      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  static async deleteClient(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;

      await clientsService.deleteClient(context, clientId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  static async searchGlobalClients(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const { q } = req.query;
      if (typeof q !== "string") {
        res
          .status(400)
          .json({ success: false, error: "Query param q is required" });
        return;
      }

      const results = await clientsService.searchGlobalClients(context, q);
      res.json({ success: true, data: results });
    } catch (error) {
      next(error);
    }
  }

  static async linkClient(req: Request, res: Response, next: NextFunction) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;
      await clientsService.linkClientToBusinessUnit(context, clientId);

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  static async getClientSummary(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;

      const summary = await clientsService.getClientSummary(context, clientId);

      res.json({ success: true, data: summary });
    } catch (error) {
      next(error);
    }
  }

  static async getClientRiskProfile(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;

      const riskProfile = await clientsService.getClientRiskProfile(
        context,
        clientId,
      );

      res.json({ success: true, data: riskProfile });
    } catch (error) {
      next(error);
    }
  }

  static async listAccountMovements(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;
      const { page = "1", limit = "20" } = req.query;

      const result = await clientsService.listAccountMovements(context, {
        clientId,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      });

      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async createAccountMovement(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const clientId = req.params.clientId as string;

      const movement = await clientsService.createAccountMovement(
        context,
        clientId,
        req.body,
      );

      res.status(201).json({ success: true, data: movement });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrentConfig(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const config = await clientsService.getCurrentConfig(context);

      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }

  static async updateCurrentConfig(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    try {
      const context = validateBusinessUnitContext(req, res);
      if (!context) return;

      const config = await clientsService.updateCurrentConfig(
        context,
        req.body,
      );

      res.json({ success: true, data: config });
    } catch (error) {
      next(error);
    }
  }
}
