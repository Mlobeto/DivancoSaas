/**
 * ACCOUNT CONTROLLER
 * Controller para gestión de ClientAccount (cuentas compartidas)
 */

import { Request, Response } from "express";
import { accountService } from "../services/account.service";

export class AccountController {
  /**
   * @swagger
   * /api/v1/rental/accounts:
   *   post:
   *     tags: [Accounts]
   *     summary: Crear cuenta de cliente (se auto-crea al crear primer contrato)
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - clientId
   *             properties:
   *               clientId:
   *                 type: string
   *                 format: uuid
   *               initialBalance:
   *                 type: number
   *                 example: 1000000
   *               alertAmount:
   *                 type: number
   *                 example: 100000
   *               statementFrequency:
   *                 type: string
   *                 enum: [weekly, biweekly, monthly, manual]
   *               notes:
   *                 type: string
   *     responses:
   *       201:
   *         description: Cuenta creada exitosamente
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId } = req.context || {};
      const {
        clientId,
        initialBalance,
        alertAmount,
        statementFrequency,
        notes,
      } = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const account = await accountService.createAccount({
        tenantId,
        clientId,
        initialBalance: initialBalance || 0,
        alertAmount: alertAmount || 0,
        statementFrequency,
        notes,
      });

      res.status(201).json({
        success: true,
        data: account,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: error.code || "ACCOUNT_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/accounts/{id}:
   *   get:
   *     tags: [Accounts]
   *     summary: Obtener cuenta con movimientos recientes
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Cuenta encontrada
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const account = await accountService.getAccountById(id as string);

      if (!account) {
        res.status(404).json({
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: `Account with id '${id}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: account,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/accounts/client/{clientId}:
   *   get:
   *     tags: [Accounts]
   *     summary: Obtener cuenta por clientId
   *     parameters:
   *       - in: path
   *         name: clientId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Cuenta encontrada
   */
  async getByClientId(req: Request, res: Response): Promise<void> {
    try {
      const { clientId } = req.params;

      const account = await accountService.getAccountByClientId(
        clientId as string,
      );

      if (!account) {
        res.status(404).json({
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: `Account for client '${clientId}' not found`,
          },
        });
        return;
      }

      res.json({
        success: true,
        data: account,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "ACCOUNT_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/accounts/{id}/reload:
   *   post:
   *     tags: [Accounts]
   *     summary: Recargar saldo a la cuenta
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - amount
   *             properties:
   *               amount:
   *                 type: number
   *                 example: 500000
   *               description:
   *                 type: string
   *               paymentReference:
   *                 type: string
   *               notes:
   *                 type: string
   *     responses:
   *       200:
   *         description: Saldo recargado exitosamente
   */
  async reload(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { userId } = req.context || {};
      const { amount, description, paymentReference, notes } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing user context" },
        });
        return;
      }

      if (!amount || amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "Amount must be greater than 0",
          },
        });
        return;
      }

      const result = await accountService.reloadCredit({
        accountId: id as string,
        amount,
        description:
          description || `Recarga ${new Date().toLocaleDateString()}`,
        createdBy: userId,
        paymentMethod: paymentReference ? "MANUAL" : undefined,
        referenceNumber: paymentReference,
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      res.status(error.code === "INSUFFICIENT_BALANCE" ? 409 : 400).json({
        success: false,
        error: {
          code: error.code || "RELOAD_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/accounts/{id}/balance:
   *   get:
   *     tags: [Accounts]
   *     summary: Consulta rápida de saldo
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Saldo actual
   */
  async getBalance(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const balance = await accountService.getClientBalance(id as string);

      res.json({
        success: true,
        data: balance,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "BALANCE_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/accounts/{id}/movements:
   *   get:
   *     tags: [Accounts]
   *     summary: Historial de movimientos con filtros
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: endDate
   *         schema:
   *           type: string
   *           format: date-time
   *       - in: query
   *         name: movementType
   *         schema:
   *           type: string
   *           enum: [INITIAL_CREDIT, CREDIT_RELOAD, DAILY_CHARGE, ADJUSTMENT, WITHDRAWAL_START, RETURN_END]
   *       - in: query
   *         name: contractId
   *         schema:
   *           type: string
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 50
   *     responses:
   *       200:
   *         description: Lista de movimientos
   */
  async getMovements(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const {
        startDate,
        endDate,
        movementType,
        contractId,
        page = 1,
        limit = 50,
      } = req.query;

      const account = await accountService.getAccountById(id as string);
      if (!account) {
        res.status(404).json({
          success: false,
          error: {
            code: "ACCOUNT_NOT_FOUND",
            message: `Account with id '${id}' not found`,
          },
        });
        return;
      }

      // Filtrar movimientos
      let movements = account.movements || [];

      if (startDate) {
        const start = new Date(startDate as string);
        movements = movements.filter((m) => m.createdAt >= start);
      }

      if (endDate) {
        const end = new Date(endDate as string);
        movements = movements.filter((m) => m.createdAt <= end);
      }

      if (movementType) {
        movements = movements.filter((m) => m.movementType === movementType);
      }

      if (contractId) {
        movements = movements.filter((m) => m.contractId === contractId);
      }

      // Paginación
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const total = movements.length;
      const pages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const endIndex = startIndex + limitNum;
      const paginatedMovements = movements.slice(startIndex, endIndex);

      // Calcular resumen
      const totalDebits = movements
        .filter((m) => Number(m.amount) < 0)
        .reduce((sum, m) => sum + Number(m.amount), 0);
      const totalCredits = movements
        .filter((m) => Number(m.amount) > 0)
        .reduce((sum, m) => sum + Number(m.amount), 0);

      res.json({
        success: true,
        data: {
          movements: paginatedMovements,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages,
          },
          summary: {
            totalDebits,
            totalCredits,
            netChange: totalCredits + totalDebits,
          },
        },
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "MOVEMENTS_FETCH_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * @swagger
   * /api/v1/rental/accounts/{id}/statement:
   *   get:
   *     tags: [Accounts]
   *     summary: Generar estado de cuenta (PDF o JSON)
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: startDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: endDate
   *         required: true
   *         schema:
   *           type: string
   *           format: date
   *       - in: query
   *         name: format
   *         schema:
   *           type: string
   *           enum: [pdf, json]
   *           default: json
   *     responses:
   *       200:
   *         description: Estado de cuenta generado
   */
  async getStatement(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate, format = "json" } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_DATES",
            message: "startDate and endDate are required",
          },
        });
        return;
      }

      const statement = await accountService.getAccountStatement(
        id as string,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      if (format === "pdf") {
        // TODO: Generar PDF usando puppeteer o similar
        res.status(501).json({
          success: false,
          error: {
            code: "PDF_NOT_IMPLEMENTED",
            message: "PDF generation not yet implemented",
          },
        });
        return;
      }

      res.json({
        success: true,
        data: statement,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "STATEMENT_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const accountController = new AccountController();
