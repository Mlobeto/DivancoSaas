/**
 * OPERATOR CONTROLLER
 * Controller for operator profile management
 */

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { OperatorProfileService } from "../services/operator.service";

const prisma = new PrismaClient();
const operatorService = new OperatorProfileService(prisma);

export class OperatorController {
  /**
   * Create operator profile
   * POST /api/v1/rental/operators
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId } = req.context || {};
      const data = req.body;

      if (!tenantId || !businessUnitId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Convert date strings to Date objects
      if (data.hireDate) data.hireDate = new Date(data.hireDate);
      if (data.endDate) data.endDate = new Date(data.endDate);

      const profile = await operatorService.createProfile(
        tenantId,
        businessUnitId,
        data,
      );

      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "OPERATOR_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * List operator profiles
   * GET /api/v1/rental/operators
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, businessUnitId } = req.context || {};
      const { status, operatorType, search, page = 1, limit = 20 } = req.query;

      if (!tenantId || !businessUnitId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const result = await operatorService.listProfiles(
        tenantId,
        businessUnitId,
        {
          status: status as any,
          operatorType: operatorType as any,
          search: search as string,
        },
        {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
        },
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "OPERATOR_LIST_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Get operator profile by ID
   * GET /api/v1/rental/operators/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const profile = await operatorService.getProfile(tenantId, id);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: { code: "NOT_FOUND", message: "Operator profile not found" },
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "OPERATOR_GET_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Update operator profile
   * PATCH /api/v1/rental/operators/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;
      const data = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Convert date strings to Date objects
      if (data.hireDate) data.hireDate = new Date(data.hireDate);
      if (data.endDate) data.endDate = new Date(data.endDate);

      const profile = await operatorService.updateProfile(tenantId, id, data);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "OPERATOR_UPDATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Delete operator profile
   * DELETE /api/v1/rental/operators/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      await operatorService.deleteProfile(tenantId, id);

      res.json({
        success: true,
        message: "Operator profile deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "OPERATOR_DELETE_ERROR",
          message: error.message,
        },
      });
    }
  }

  // ============================================
  // DOCUMENTS
  // ============================================

  /**
   * Add document to operator
   * POST /api/v1/rental/operators/:id/documents
   */
  async addDocument(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;
      const data = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Convert date strings
      if (data.issueDate) data.issueDate = new Date(data.issueDate);
      if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);

      const document = await operatorService.addDocument(tenantId, id, data);

      res.status(201).json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DOCUMENT_ADD_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Update document
   * PATCH /api/v1/rental/operators/documents/:documentId
   */
  async updateDocument(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { documentId } = req.params;
      const data = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Convert date strings
      if (data.issueDate) data.issueDate = new Date(data.issueDate);
      if (data.expiryDate) data.expiryDate = new Date(data.expiryDate);

      const document = await operatorService.updateDocument(
        tenantId,
        documentId,
        data,
        userId,
      );

      res.json({
        success: true,
        data: document,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DOCUMENT_UPDATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Delete document
   * DELETE /api/v1/rental/operators/documents/:documentId
   */
  async deleteDocument(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { documentId } = req.params;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      await operatorService.deleteDocument(tenantId, documentId);

      res.json({
        success: true,
        message: "Document deleted successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DOCUMENT_DELETE_ERROR",
          message: error.message,
        },
      });
    }
  }

  // ============================================
  // ASSIGNMENTS
  // ============================================

  /**
   * Create assignment
   * POST /api/v1/rental/operators/:id/assignments
   */
  async createAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { id } = req.params;
      const data = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Convert dates
      if (data.startDate) data.startDate = new Date(data.startDate);
      if (data.endDate) data.endDate = new Date(data.endDate);

      const assignment = await operatorService.createAssignment(tenantId, {
        ...data,
        profileId: id,
        createdBy: userId,
      });

      res.status(201).json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "ASSIGNMENT_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Get assignments for operator
   * GET /api/v1/rental/operators/:id/assignments
   */
  async getAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { id } = req.params;
      const { activeOnly = "false" } = req.query;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const assignments = await operatorService.getAssignments(
        tenantId,
        id,
        activeOnly === "true",
      );

      res.json({
        success: true,
        data: assignments,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "ASSIGNMENTS_GET_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Update assignment
   * PATCH /api/v1/rental/operators/assignments/:assignmentId
   */
  async updateAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId } = req.context || {};
      const { assignmentId } = req.params;
      const data = req.body;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Convert dates
      if (data.endDate) data.endDate = new Date(data.endDate);

      const assignment = await operatorService.updateAssignment(
        tenantId,
        assignmentId,
        data,
      );

      res.json({
        success: true,
        data: assignment,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "ASSIGNMENT_UPDATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  // ============================================
  // DAILY REPORTS (Mobile)
  // ============================================

  /**
   * Create daily report
   * POST /api/v1/rental/operators/my/daily-reports
   */
  async createDailyReport(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const data = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      // Get operator profile for this user
      const profile = await operatorService.getProfileByUserId(
        tenantId,
        userId,
      );

      if (!profile) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Operator profile not found for this user",
          },
        });
        return;
      }

      // Convert dates
      if (data.date) data.date = new Date(data.date);
      if (data.startTime) data.startTime = new Date(data.startTime);
      if (data.endTime) data.endTime = new Date(data.endTime);

      const report = await operatorService.createDailyReport(tenantId, {
        ...data,
        profileId: profile.id,
      });

      res.status(201).json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DAILY_REPORT_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Get my daily reports
   * GET /api/v1/rental/operators/my/daily-reports
   */
  async getMyDailyReports(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { startDate, endDate } = req.query;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const profile = await operatorService.getProfileByUserId(
        tenantId,
        userId,
      );

      if (!profile) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Operator profile not found for this user",
          },
        });
        return;
      }

      const reports = await operatorService.getDailyReports(
        tenantId,
        profile.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
      );

      res.json({
        success: true,
        data: reports,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "DAILY_REPORTS_GET_ERROR",
          message: error.message,
        },
      });
    }
  }

  // ============================================
  // EXPENSES (Mobile)
  // ============================================

  /**
   * Create expense
   * POST /api/v1/rental/operators/my/expenses
   */
  async createExpense(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const data = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const profile = await operatorService.getProfileByUserId(
        tenantId,
        userId,
      );

      if (!profile) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Operator profile not found for this user",
          },
        });
        return;
      }

      // Convert date
      if (data.date) data.date = new Date(data.date);

      const expense = await operatorService.createExpense(tenantId, {
        ...data,
        profileId: profile.id,
      });

      res.status(201).json({
        success: true,
        data: expense,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "EXPENSE_CREATE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Get my expenses
   * GET /api/v1/rental/operators/my/expenses
   */
  async getMyExpenses(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { status } = req.query;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const profile = await operatorService.getProfileByUserId(
        tenantId,
        userId,
      );

      if (!profile) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Operator profile not found for this user",
          },
        });
        return;
      }

      const expenses = await operatorService.getExpenses(
        tenantId,
        profile.id,
        status as string,
      );

      res.json({
        success: true,
        data: expenses,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "EXPENSES_GET_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Approve/Reject expense (Admin)
   * POST /api/v1/rental/operators/expenses/:expenseId/approve
   */
  async approveExpense(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};
      const { expenseId } = req.params;
      const { approved, rejectionReason } = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const expense = await operatorService.approveExpense(
        tenantId,
        expenseId,
        approved,
        {
          approvedBy: userId,
          rejectionReason,
        },
      );

      res.json({
        success: true,
        data: expense,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "EXPENSE_APPROVE_ERROR",
          message: error.message,
        },
      });
    }
  }

  /**
   * Get my profile (Mobile)
   * GET /api/v1/rental/operators/my/profile
   */
  async getMyProfile(req: Request, res: Response): Promise<void> {
    try {
      const { tenantId, userId } = req.context || {};

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: "UNAUTHORIZED", message: "Missing tenant context" },
        });
        return;
      }

      const profile = await operatorService.getProfileByUserId(
        tenantId,
        userId,
      );

      if (!profile) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Operator profile not found for this user",
          },
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: "PROFILE_GET_ERROR",
          message: error.message,
        },
      });
    }
  }
}

export const operatorController = new OperatorController();
