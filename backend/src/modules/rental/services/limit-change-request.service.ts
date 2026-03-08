/**
 * LIMIT CHANGE REQUEST SERVICE
 * Gestión de solicitudes de ampliación de límites de crédito/tiempo (Master Contract System v7.0)
 *
 * Flujo de aprobación:
 * 1. Usuario de entregas solicita ampliación (pending)
 * 2. Owner/Admin revisa y aprueba/rechaza
 * 3. Si se aprueba, se actualizan los límites de la cuenta
 * 4. Se registra auditoría de cambios
 */

import prisma from "@config/database";
import { Decimal } from "@prisma/client/runtime/library";
import type { LimitChangeRequest } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface CreateLimitChangeRequestParams {
  tenantId: string;
  businessUnitId: string;
  clientAccountId: string;
  requestedBy: string; // userId del solicitante

  // Límites solicitados
  requestedCreditLimit?: number;
  requestedTimeLimit?: number;

  // Justificación
  reason: string;
  urgency?: "low" | "normal" | "high" | "urgent";

  metadata?: any;
}

export interface ReviewLimitChangeRequestParams {
  requestId: string;
  reviewedBy: string; // userId del revisor (owner/admin)
  status: "approved" | "rejected";

  // Límites aprobados (pueden diferir de los solicitados)
  approvedCreditLimit?: number;
  approvedTimeLimit?: number;

  reviewNotes?: string;
}

export interface ListLimitChangeRequestsParams {
  tenantId: string;
  businessUnitId?: string;
  clientAccountId?: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  urgency?: string;
  requestedBy?: string;
}

// ============================================
// SERVICE
// ============================================

export class LimitChangeRequestService {
  /**
   * Crear solicitud de ampliación de límites
   */
  async createRequest(
    params: CreateLimitChangeRequestParams,
  ): Promise<LimitChangeRequest> {
    // 1. Verificar que la cuenta existe
    const account = await prisma.clientAccount.findUnique({
      where: { id: params.clientAccountId },
      include: {
        client: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (!account) {
      throw new Error("Client account not found");
    }

    // 2. Validar que se está solicitando al menos un límite
    if (!params.requestedCreditLimit && !params.requestedTimeLimit) {
      throw new Error(
        "Must request at least one limit change (credit or time)",
      );
    }

    // 3. Validar que los límites solicitados son mayores a los actuales
    if (
      params.requestedCreditLimit &&
      new Decimal(params.requestedCreditLimit).lessThanOrEqualTo(
        account.creditLimit,
      )
    ) {
      throw new Error(
        `Requested credit limit ($${params.requestedCreditLimit}) must be greater than current limit ($${account.creditLimit})`,
      );
    }

    if (
      params.requestedTimeLimit &&
      params.requestedTimeLimit <= account.timeLimit
    ) {
      throw new Error(
        `Requested time limit (${params.requestedTimeLimit} days) must be greater than current limit (${account.timeLimit} days)`,
      );
    }

    // 4. Verificar que no hay solicitudes pendientes para esta cuenta
    const pendingRequests = await prisma.limitChangeRequest.findFirst({
      where: {
        clientAccountId: params.clientAccountId,
        status: "pending",
      },
    });

    if (pendingRequests) {
      throw new Error(
        "There is already a pending limit change request for this account",
      );
    }

    // 5. Crear solicitud
    const request = await prisma.limitChangeRequest.create({
      data: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientAccountId: params.clientAccountId,
        requestedBy: params.requestedBy,

        // Límites actuales
        currentCreditLimit: account.creditLimit,
        currentTimeLimit: account.timeLimit,

        // Límites solicitados
        requestedCreditLimit: params.requestedCreditLimit
          ? new Decimal(params.requestedCreditLimit)
          : null,
        requestedTimeLimit: params.requestedTimeLimit,

        // Justificación
        reason: params.reason,
        urgency: params.urgency || "normal",

        status: "pending",
        metadata: params.metadata,
      },
      include: {
        clientAccount: {
          include: {
            client: {
              select: {
                displayName: true,
              },
            },
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // TODO: Enviar notificación a owners/admins
    // await notificationService.notifyLimitChangeRequest(request);

    return request;
  }

  /**
   * Revisar solicitud (aprobar/rechazar)
   */
  async reviewRequest(
    params: ReviewLimitChangeRequestParams,
  ): Promise<LimitChangeRequest> {
    // 1. Verificar que la solicitud existe y está pendiente
    const request = await prisma.limitChangeRequest.findUnique({
      where: { id: params.requestId },
      include: {
        clientAccount: true,
      },
    });

    if (!request) {
      throw new Error("Limit change request not found");
    }

    if (request.status !== "pending") {
      throw new Error(
        `Cannot review request with status: ${request.status}. Only pending requests can be reviewed.`,
      );
    }

    // 2. Si se aprueba, actualizar límites de la cuenta
    if (params.status === "approved") {
      await prisma.$transaction(async (tx) => {
        // Actualizar solicitud
        await tx.limitChangeRequest.update({
          where: { id: params.requestId },
          data: {
            status: "approved",
            reviewedBy: params.reviewedBy,
            reviewedAt: new Date(),
            approvedCreditLimit: params.approvedCreditLimit
              ? new Decimal(params.approvedCreditLimit)
              : request.requestedCreditLimit,
            approvedTimeLimit:
              params.approvedTimeLimit || request.requestedTimeLimit,
            reviewNotes: params.reviewNotes,
          },
        });

        // Actualizar límites en la cuenta
        const newCreditLimit =
          params.approvedCreditLimit ||
          request.requestedCreditLimit?.toNumber();
        const newTimeLimit =
          params.approvedTimeLimit || request.requestedTimeLimit;

        // Build update data conditionally to avoid null
        const updateData: any = {
          limitsOverridden: true,
          overriddenBy: params.reviewedBy,
          overriddenAt: new Date(),
          overrideReason: `Approved request: ${params.reviewNotes || request.reason}`,
        };

        if (newCreditLimit) {
          updateData.creditLimit = new Decimal(newCreditLimit);
        }

        if (newTimeLimit) {
          updateData.timeLimit = newTimeLimit;
        }

        await tx.clientAccount.update({
          where: { id: request.clientAccountId },
          data: updateData,
        });
      });
    } else {
      // Rechazar solicitud
      await prisma.limitChangeRequest.update({
        where: { id: params.requestId },
        data: {
          status: "rejected",
          reviewedBy: params.reviewedBy,
          reviewedAt: new Date(),
          reviewNotes: params.reviewNotes,
        },
      });
    }

    // 3. Retornar solicitud actualizada
    const updatedRequest = await prisma.limitChangeRequest.findUnique({
      where: { id: params.requestId },
      include: {
        clientAccount: {
          include: {
            client: {
              select: {
                displayName: true,
              },
            },
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!updatedRequest) {
      throw new Error("Failed to retrieve updated request");
    }

    // TODO: Enviar notificación al solicitante
    // await notificationService.notifyLimitChangeRequestReviewed(updatedRequest);

    return updatedRequest;
  }

  /**
   * Obtener solicitud por ID
   */
  async getRequestById(requestId: string) {
    const request = await prisma.limitChangeRequest.findUnique({
      where: { id: requestId },
      include: {
        clientAccount: {
          include: {
            client: {
              select: {
                displayName: true,
                email: true,
              },
            },
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        tenant: {
          select: {
            name: true,
          },
        },
        businessUnit: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!request) {
      throw new Error("Limit change request not found");
    }

    return request;
  }

  /**
   * Listar solicitudes con filtros
   */
  async listRequests(params: ListLimitChangeRequestsParams) {
    const requests = await prisma.limitChangeRequest.findMany({
      where: {
        tenantId: params.tenantId,
        businessUnitId: params.businessUnitId,
        clientAccountId: params.clientAccountId,
        status: params.status,
        urgency: params.urgency,
        requestedBy: params.requestedBy,
      },
      include: {
        clientAccount: {
          include: {
            client: {
              select: {
                displayName: true,
              },
            },
          },
        },
        requester: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ urgency: "desc" }, { requestedAt: "desc" }],
    });

    return requests;
  }

  /**
   * Cancelar solicitud (solo el solicitante antes de que sea revisada)
   */
  async cancelRequest(requestId: string, cancelledBy: string) {
    const request = await prisma.limitChangeRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Limit change request not found");
    }

    if (request.status !== "pending") {
      throw new Error(
        `Cannot cancel request with status: ${request.status}. Only pending requests can be cancelled.`,
      );
    }

    if (request.requestedBy !== cancelledBy) {
      throw new Error(
        "Only the requester can cancel their own pending request",
      );
    }

    const updatedRequest = await prisma.limitChangeRequest.update({
      where: { id: requestId },
      data: {
        status: "cancelled",
        reviewNotes: "Cancelled by requester",
      },
    });

    return updatedRequest;
  }

  /**
   * Obtener estadísticas de solicitudes
   */
  async getRequestStats(tenantId: string, businessUnitId?: string) {
    const where = {
      tenantId,
      businessUnitId,
    };

    const [total, pending, approved, rejected, cancelled] = await Promise.all([
      prisma.limitChangeRequest.count({ where }),
      prisma.limitChangeRequest.count({
        where: { ...where, status: "pending" },
      }),
      prisma.limitChangeRequest.count({
        where: { ...where, status: "approved" },
      }),
      prisma.limitChangeRequest.count({
        where: { ...where, status: "rejected" },
      }),
      prisma.limitChangeRequest.count({
        where: { ...where, status: "cancelled" },
      }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
      cancelled,
      approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : "0.00",
    };
  }
}

export const limitChangeRequestService = new LimitChangeRequestService();
