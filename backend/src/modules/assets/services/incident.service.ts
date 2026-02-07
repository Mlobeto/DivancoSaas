/**
 * Incident Service
 *
 * Maneja incidentes en obra
 * Implementa workflow 5 del documento de workflows
 */

import { PrismaClient, Incident } from "@prisma/client";
import {
  CreateIncidentDTO,
  ResolveIncidentDTO,
  IncidentFilters,
  PaginationParams,
  PaginatedResponse,
} from "../types/rental.types";

export class IncidentService {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Report an incident
   * Workflow 5: Incidente en Obra - Step 1
   */
  async reportIncident(
    tenantId: string,
    businessUnitId: string,
    data: CreateIncidentDTO,
  ): Promise<Incident> {
    // 1. Verify asset exists and is in use
    const asset = await this.prisma.asset.findFirst({
      where: {
        id: data.assetId,
        tenantId,
        businessUnitId,
      },
      include: { state: true },
    });

    if (!asset) {
      throw new Error("Asset not found");
    }

    // 2. Verify contract exists and is active
    const contract = await this.prisma.rentalContract.findFirst({
      where: {
        id: data.contractId,
        tenantId,
        businessUnitId,
        status: "ACTIVE",
      },
    });

    if (!contract) {
      throw new Error("Contract not found or not active");
    }

    // 3. Change asset state to INCIDENT
    await this.prisma.assetState.update({
      where: { assetId: data.assetId },
      data: {
        currentState: "INCIDENT",
      },
    });

    // 4. Create incident record
    const incident = await this.prisma.incident.create({
      data: {
        assetId: data.assetId,
        contractId: data.contractId,
        description: data.description,
        resolved: false,
      },
    });

    // 5. Emit event (external system can send notifications)
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: data.assetId,
        eventType: "asset.incident_reported",
        source: "system",
        payload: {
          incidentId: incident.id,
          contractId: data.contractId,
          description: data.description,
        },
      },
    });

    return incident;
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(
    tenantId: string,
    businessUnitId: string,
    incidentId: string,
  ) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        asset: {
          include: {
            state: true,
          },
        },
        contract: true,
      },
    });

    if (!incident) {
      throw new Error("Incident not found");
    }

    // Verify tenant ownership
    if (
      incident.asset.tenantId !== tenantId ||
      incident.asset.businessUnitId !== businessUnitId
    ) {
      throw new Error("Incident not found");
    }

    return incident;
  }

  /**
   * List incidents with filters
   */
  async listIncidents(
    tenantId: string,
    businessUnitId: string,
    filters: IncidentFilters = {},
    pagination: PaginationParams = {},
  ): Promise<PaginatedResponse<Incident>> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      asset: {
        tenantId,
        businessUnitId,
      },
      ...(filters.assetId && { assetId: filters.assetId }),
      ...(filters.contractId && { contractId: filters.contractId }),
      ...(filters.resolved !== undefined && { resolved: filters.resolved }),
    };

    const [incidents, total] = await Promise.all([
      this.prisma.incident.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          asset: {
            select: {
              id: true,
              name: true,
              assetType: true,
            },
          },
          contract: {
            select: {
              id: true,
              clientId: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.incident.count({ where }),
    ]);

    return {
      data: incidents,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Resolve incident with decision
   * Workflow 5: Incidente en Obra - Step 4
   */
  async resolveIncident(
    tenantId: string,
    businessUnitId: string,
    incidentId: string,
    data: ResolveIncidentDTO,
  ): Promise<Incident> {
    // 1. Get incident
    const incident = await this.getIncidentById(
      tenantId,
      businessUnitId,
      incidentId,
    );

    if (!incident) {
      throw new Error("Incident not found");
    }

    if (incident.resolved) {
      throw new Error("Incident already resolved");
    }

    const { decision, resolution } = data;

    // 2. Execute decision
    switch (decision) {
      case "REPLACE":
        // Desasociar activo del contrato
        await this.prisma.assetState.update({
          where: { assetId: incident.assetId },
          data: {
            currentState: "MAINTENANCE",
          },
        });

        // Emit event suggesting replacement
        await this.prisma.assetEvent.create({
          data: {
            tenantId,
            businessUnitId,
            assetId: incident.assetId,
            eventType: "asset.incident_resolved_replace",
            source: "system",
            payload: {
              incidentId,
              decision,
              requiresReplacement: true,
            },
          },
        });
        break;

      case "PAUSE":
        // Pausar contrato
        await this.prisma.rentalContract.update({
          where: { id: incident.contractId },
          data: {
            status: "PAUSED",
          },
        });

        // Asset stays in INCIDENT state
        await this.prisma.assetEvent.create({
          data: {
            tenantId,
            businessUnitId,
            assetId: incident.assetId,
            eventType: "asset.incident_resolved_pause",
            source: "system",
            payload: {
              incidentId,
              decision,
              contractPaused: true,
            },
          },
        });
        break;

      case "CONTINUE":
        // Continuar con el activo
        await this.prisma.assetState.update({
          where: { assetId: incident.assetId },
          data: {
            currentState: "IN_USE",
          },
        });

        await this.prisma.assetEvent.create({
          data: {
            tenantId,
            businessUnitId,
            assetId: incident.assetId,
            eventType: "asset.incident_resolved_continue",
            source: "system",
            payload: {
              incidentId,
              decision,
              continuedUse: true,
            },
          },
        });
        break;

      default:
        throw new Error(
          `Invalid decision: ${decision}. Must be REPLACE, PAUSE, or CONTINUE`,
        );
    }

    // 3. Update incident
    const resolvedIncident = await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        resolved: true,
        resolution,
        decision,
        resolvedAt: new Date(),
      },
    });

    // 4. Emit final resolution event
    await this.prisma.assetEvent.create({
      data: {
        tenantId,
        businessUnitId,
        assetId: incident.assetId,
        eventType: "asset.incident_resolved",
        source: "system",
        payload: {
          incidentId,
          decision,
          resolution,
        },
      },
    });

    return resolvedIncident;
  }

  /**
   * Get active (unresolved) incidents
   */
  async getActiveIncidents(tenantId: string, businessUnitId: string) {
    return this.listIncidents(
      tenantId,
      businessUnitId,
      { resolved: false },
      { limit: 100 },
    );
  }
}
