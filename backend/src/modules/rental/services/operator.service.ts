/**
 * Operator Profile Service
 *
 * Business logic for operator profile management
 * Handles CRUD operations for operators and their assignments
 */

import {
  PrismaClient,
  OperatorProfile,
  OperatorDocument,
  OperatorAssignment,
  OperatorDailyReport,
  OperatorExpense,
  OperatorDocumentType,
  AssignmentStatus,
  AssetCondition,
  ExpenseType,
} from "@prisma/client";
import {
  CreateOperatorProfileDTO,
  UpdateOperatorProfileDTO,
  OperatorProfileFilters,
  CreateOperatorDocumentDTO,
  UpdateOperatorDocumentDTO,
  CreateOperatorAssignmentDTO,
  UpdateOperatorAssignmentDTO,
  CreateDailyReportDTO,
  CreateOperatorExpenseDTO,
  ApproveExpenseDTO,
  OperatorProfileWithUser,
  PaginationParams,
  PaginatedResponse,
} from "../types/operator.types";

export class OperatorProfileService {
  constructor(private readonly prisma: PrismaClient) {}

  // ============================================
  // OPERATOR PROFILE CRUD
  // ============================================

  /**
   * Create operator profile for a user
   */
  async createProfile(
    tenantId: string,
    businessUnitId: string,
    data: CreateOperatorProfileDTO,
  ): Promise<OperatorProfile> {
    // Validate user exists and belongs to tenant
    const user = await this.prisma.user.findFirst({
      where: {
        id: data.userId,
        tenantId,
      },
    });

    if (!user) {
      throw new Error("User not found or does not belong to this tenant");
    }

    // Check if user already has operator profile
    const existingProfile = await this.prisma.operatorProfile.findUnique({
      where: { userId: data.userId },
    });

    if (existingProfile) {
      throw new Error("User already has an operator profile");
    }

    // Check document uniqueness within tenant/BU
    const existingDocument = await this.prisma.operatorProfile.findFirst({
      where: {
        tenantId,
        businessUnitId,
        document: data.document,
      },
    });

    if (existingDocument) {
      throw new Error("Document already exists for another operator");
    }

    return this.prisma.operatorProfile.create({
      data: {
        userId: data.userId,
        tenantId,
        businessUnitId,
        document: data.document,
        phone: data.phone,
        employeeCode: data.employeeCode,
        hireDate: data.hireDate,
        endDate: data.endDate,
        operatorType: data.operatorType ?? "GENERAL",
        defaultRateType: data.defaultRateType,
        defaultRate: data.defaultRate,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get operator profile by ID
   */
  async getProfile(
    tenantId: string,
    profileId: string,
  ): Promise<OperatorProfileWithUser | null> {
    return this.prisma.operatorProfile.findFirst({
      where: {
        id: profileId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          orderBy: { uploadedAt: "desc" },
        },
        assignments: {
          where: { status: "ACTIVE" },
          include: {
            asset: {
              select: {
                code: true,
                name: true,
              },
            },
            rentalContract: {
              select: {
                code: true,
                client: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }) as any;
  }

  /**
   * Get operator profile by user ID
   */
  async getProfileByUserId(
    tenantId: string,
    userId: string,
  ): Promise<OperatorProfileWithUser | null> {
    return this.prisma.operatorProfile.findFirst({
      where: {
        userId,
        tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }) as any;
  }

  /**
   * List operator profiles with filters and pagination
   */
  async listProfiles(
    tenantId: string,
    businessUnitId: string,
    filters: OperatorProfileFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<OperatorProfileWithUser>> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      businessUnitId,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.operatorType) {
      where.operatorType = filters.operatorType;
    }

    if (filters.search) {
      where.OR = [
        { document: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
        { employeeCode: { contains: filters.search, mode: "insensitive" } },
        {
          user: {
            OR: [
              {
                firstName: { contains: filters.search, mode: "insensitive" },
              },
              { lastName: { contains: filters.search, mode: "insensitive" } },
              { email: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.operatorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.operatorProfile.count({ where }),
    ]);

    return {
      data: data as any,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update operator profile
   */
  async updateProfile(
    tenantId: string,
    profileId: string,
    data: UpdateOperatorProfileDTO,
  ): Promise<OperatorProfile> {
    const profile = await this.prisma.operatorProfile.findFirst({
      where: {
        id: profileId,
        tenantId,
      },
    });

    if (!profile) {
      throw new Error("Operator profile not found");
    }

    // Check document uniqueness if being updated
    if (data.document && data.document !== profile.document) {
      const existingDocument = await this.prisma.operatorProfile.findFirst({
        where: {
          tenantId,
          businessUnitId: profile.businessUnitId,
          document: data.document,
          id: { not: profileId },
        },
      });

      if (existingDocument) {
        throw new Error("Document already exists for another operator");
      }
    }

    return this.prisma.operatorProfile.update({
      where: { id: profileId },
      data,
    });
  }

  /**
   * Delete operator profile
   */
  async deleteProfile(tenantId: string, profileId: string): Promise<void> {
    const profile = await this.prisma.operatorProfile.findFirst({
      where: {
        id: profileId,
        tenantId,
      },
    });

    if (!profile) {
      throw new Error("Operator profile not found");
    }

    // Check for active assignments
    const activeAssignments = await this.prisma.operatorAssignment.count({
      where: {
        profileId,
        status: "ACTIVE",
      },
    });

    if (activeAssignments > 0) {
      throw new Error(
        "Cannot delete operator with active assignments. Complete or cancel assignments first.",
      );
    }

    await this.prisma.operatorProfile.delete({
      where: { id: profileId },
    });
  }

  // ============================================
  // OPERATOR DOCUMENTS
  // ============================================

  /**
   * Add document to operator profile
   */
  async addDocument(
    tenantId: string,
    profileId: string,
    data: CreateOperatorDocumentDTO,
  ): Promise<OperatorDocument> {
    const profile = await this.prisma.operatorProfile.findFirst({
      where: {
        id: profileId,
        tenantId,
      },
    });

    if (!profile) {
      throw new Error("Operator profile not found");
    }

    return this.prisma.operatorDocument.create({
      data: {
        profileId,
        type: data.type as OperatorDocumentType,
        name: data.name,
        documentNumber: data.documentNumber,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate,
        fileUrl: data.fileUrl,
        notes: data.notes,
      },
    });
  }

  /**
   * Update operator document
   */
  async updateDocument(
    tenantId: string,
    documentId: string,
    data: UpdateOperatorDocumentDTO,
    verifiedBy?: string,
  ): Promise<OperatorDocument> {
    const document = await this.prisma.operatorDocument.findFirst({
      where: {
        id: documentId,
        profile: { tenantId },
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    const updateData: any = { ...data };

    // If status is being set to APPROVED, record verifier
    if (data.status === "APPROVED" && verifiedBy) {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = verifiedBy;
    }

    return this.prisma.operatorDocument.update({
      where: { id: documentId },
      data: updateData,
    });
  }

  /**
   * Delete operator document
   */
  async deleteDocument(tenantId: string, documentId: string): Promise<void> {
    const document = await this.prisma.operatorDocument.findFirst({
      where: {
        id: documentId,
        profile: { tenantId },
      },
    });

    if (!document) {
      throw new Error("Document not found");
    }

    await this.prisma.operatorDocument.delete({
      where: { id: documentId },
    });
  }

  // ============================================
  // OPERATOR ASSIGNMENTS
  // ============================================

  /**
   * Create assignment (assign operator to rental contract + asset)
   */
  async createAssignment(
    tenantId: string,
    data: CreateOperatorAssignmentDTO,
  ): Promise<OperatorAssignment> {
    // Validate profile exists
    const profile = await this.prisma.operatorProfile.findFirst({
      where: {
        id: data.profileId,
        tenantId,
      },
    });

    if (!profile) {
      throw new Error("Operator profile not found");
    }

    // Validate contract and asset exist
    const [contract, asset] = await Promise.all([
      this.prisma.rentalContract.findFirst({
        where: {
          id: data.rentalContractId,
          tenantId,
        },
      }),
      this.prisma.asset.findFirst({
        where: {
          id: data.assetId,
          tenantId,
        },
      }),
    ]);

    if (!contract) {
      throw new Error("Rental contract not found");
    }

    if (!asset) {
      throw new Error("Asset not found");
    }

    // Check for overlapping active assignments on same asset
    const overlappingAssignment =
      await this.prisma.operatorAssignment.findFirst({
        where: {
          assetId: data.assetId,
          status: "ACTIVE",
          OR: [
            {
              AND: [
                { startDate: { lte: data.startDate } },
                {
                  OR: [{ endDate: { gte: data.startDate } }, { endDate: null }],
                },
              ],
            },
            {
              AND: [
                { startDate: { lte: data.endDate ?? new Date("2099-12-31") } },
                {
                  OR: [
                    {
                      endDate: { gte: data.endDate ?? new Date("2099-12-31") },
                    },
                    { endDate: null },
                  ],
                },
              ],
            },
          ],
        },
      });

    if (overlappingAssignment) {
      throw new Error("Asset already has an active assignment in this period");
    }

    return this.prisma.operatorAssignment.create({
      data: {
        tenantId,
        profileId: data.profileId,
        rentalContractId: data.rentalContractId,
        assetId: data.assetId,
        startDate: data.startDate,
        endDate: data.endDate,
        rateType: data.rateType,
        rate: data.rate,
        allowExpenses: data.allowExpenses ?? true,
        dailyExpenseLimit: data.dailyExpenseLimit,
        createdBy: data.createdBy,
      },
      include: {
        profile: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        asset: true,
        rentalContract: {
          include: {
            client: true,
          },
        },
      },
    });
  }

  /**
   * Update assignment
   */
  async updateAssignment(
    tenantId: string,
    assignmentId: string,
    data: UpdateOperatorAssignmentDTO,
  ): Promise<OperatorAssignment> {
    const assignment = await this.prisma.operatorAssignment.findFirst({
      where: {
        id: assignmentId,
        tenantId,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    return this.prisma.operatorAssignment.update({
      where: { id: assignmentId },
      data: {
        ...data,
        status: data.status as AssignmentStatus | undefined,
      },
    });
  }

  /**
   * Get assignments for operator
   */
  async getAssignments(
    tenantId: string,
    profileId: string,
    activeOnly = false,
  ): Promise<OperatorAssignment[]> {
    const where: any = {
      tenantId,
      profileId,
    };

    if (activeOnly) {
      where.status = "ACTIVE";
    }

    return this.prisma.operatorAssignment.findMany({
      where,
      include: {
        asset: true,
        rentalContract: {
          include: {
            client: true,
          },
        },
      },
      orderBy: { startDate: "desc" },
    });
  }

  // ============================================
  // DAILY REPORTS (Mobile)
  // ============================================

  /**
   * Create daily report from mobile app
   */
  async createDailyReport(
    tenantId: string,
    data: CreateDailyReportDTO,
  ): Promise<OperatorDailyReport> {
    // Validate assignment exists and is active
    const assignment = await this.prisma.operatorAssignment.findFirst({
      where: {
        id: data.assignmentId,
        tenantId,
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw new Error("Active assignment not found");
    }

    // Check if report for this date already exists
    const existingReport = await this.prisma.operatorDailyReport.findUnique({
      where: {
        assignmentId_date: {
          assignmentId: data.assignmentId,
          date: data.date,
        },
      },
    });

    if (existingReport) {
      throw new Error("Report for this date already exists");
    }

    return this.prisma.operatorDailyReport.create({
      data: {
        tenantId,
        profileId: data.profileId,
        assignmentId: data.assignmentId,
        assetId: data.assetId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        workHours: data.workHours,
        hourMeter: data.hourMeter,
        odometer: data.odometer,
        fuelLevel: data.fuelLevel,
        locationLat: data.locationLat,
        locationLon: data.locationLon,
        locationName: data.locationName,
        assetCondition: (data.assetCondition as AssetCondition) ?? "GOOD",
        notes: data.notes,
        incidentReported: data.incidentReported ?? false,
        maintenanceRequired: data.maintenanceRequired ?? false,
      },
    });
  }

  /**
   * Get daily reports for operator
   */
  async getDailyReports(
    tenantId: string,
    profileId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<OperatorDailyReport[]> {
    const where: any = {
      tenantId,
      profileId,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    return this.prisma.operatorDailyReport.findMany({
      where,
      include: {
        assignment: {
          include: {
            asset: true,
          },
        },
        photos: true,
      },
      orderBy: { date: "desc" },
    });
  }

  // ============================================
  // EXPENSES (Mobile)
  // ============================================

  /**
   * Create expense from mobile app
   */
  async createExpense(
    tenantId: string,
    data: CreateOperatorExpenseDTO,
  ): Promise<OperatorExpense> {
    // Validate assignment
    const assignment = await this.prisma.operatorAssignment.findFirst({
      where: {
        id: data.assignmentId,
        tenantId,
        profileId: data.profileId,
      },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (!assignment.allowExpenses) {
      throw new Error("Expenses not allowed for this assignment");
    }

    // Check daily limit
    if (assignment.dailyExpenseLimit) {
      const todayExpenses = await this.prisma.operatorExpense.aggregate({
        where: {
          assignmentId: data.assignmentId,
          date: data.date,
          status: { in: ["PENDING", "APPROVED"] },
        },
        _sum: {
          amount: true,
        },
      });

      const totalToday = todayExpenses._sum.amount?.toNumber() ?? 0;
      if (totalToday + data.amount > assignment.dailyExpenseLimit.toNumber()) {
        throw new Error(
          `Daily expense limit exceeded. Limit: ${assignment.dailyExpenseLimit}, Used: ${totalToday}`,
        );
      }
    }

    return this.prisma.operatorExpense.create({
      data: {
        tenantId,
        profileId: data.profileId,
        assignmentId: data.assignmentId,
        date: data.date,
        type: data.type as ExpenseType,
        description: data.description,
        amount: data.amount,
        receiptUrl: data.receiptUrl,
      },
    });
  }

  /**
   * Approve or reject expense
   */
  async approveExpense(
    tenantId: string,
    expenseId: string,
    approved: boolean,
    data: ApproveExpenseDTO,
  ): Promise<OperatorExpense> {
    const expense = await this.prisma.operatorExpense.findFirst({
      where: {
        id: expenseId,
        tenantId,
        status: "PENDING",
      },
    });

    if (!expense) {
      throw new Error("Expense not found or already processed");
    }

    return this.prisma.operatorExpense.update({
      where: { id: expenseId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        approvedAt: new Date(),
        approvedBy: data.approvedBy,
        rejectionReason: approved ? null : data.rejectionReason,
      },
    });
  }

  /**
   * Get expenses for operator
   */
  async getExpenses(
    tenantId: string,
    profileId: string,
    status?: string,
  ): Promise<OperatorExpense[]> {
    const where: any = {
      tenantId,
      profileId,
    };

    if (status) {
      where.status = status;
    }

    return this.prisma.operatorExpense.findMany({
      where,
      include: {
        assignment: {
          include: {
            asset: true,
          },
        },
      },
      orderBy: { submittedAt: "desc" },
    });
  }
}
