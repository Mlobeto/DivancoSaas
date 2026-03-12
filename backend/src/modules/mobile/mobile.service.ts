/**
 * MOBILE SERVICE
 *
 * Lógica de negocio para el flujo de evidencias de operários desde la app mobile.
 *
 * Flujo:
 *  1. El operario ve sus contratos activos (donde es OperatorAssignment)
 *  2. Selecciona un contrato y ve las evidencias del día (apertura / cierre / adhoc)
 *  3. Sube fotos + texto para cada requerimiento
 *  4. El sistema notifica a OWNER y usuarios con permiso operators:review
 */

import prisma from "@config/database";
import { notificationService } from "@core/services/notification.service";
import { BlobServiceClient } from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// ─── TYPES ────────────────────────────────────────────────────

export type EvidencePhotoType =
  | "ASSET_START" // Apertura: foto maquinaria al iniciar
  | "HOUROMETER" // Apertura: foto horómetro/odómetro
  | "ASSET_END" // Cierre: foto maquinaria al finalizar
  | "WORK_PROGRESS" // Cierre: foto avance de obra
  | "INCIDENT" // Adhoc: incidente o daño
  | "OTHER"; // Adhoc genérico

export interface EvidenceGroup {
  type: "START" | "END" | "ADHOC";
  label: string;
  items: EvidenceItem[];
}

export interface EvidenceItem {
  photoType: EvidencePhotoType;
  label: string;
  required: boolean;
  submitted?: SubmittedEvidence;
}

export interface SubmittedEvidence {
  id: string;
  photoUrl: string;
  notes: string | null;
  submittedAt: string;
  submittedBy: string;
}

export interface SubmitEvidenceDTO {
  assignmentId: string;
  photoType: EvidencePhotoType;
  notes?: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  latitude?: number;
  longitude?: number;
}

// ─── HELPERS ──────────────────────────────────────────────────

const EVIDENCE_GROUPS: Omit<EvidenceItem, "submitted">[][] = [
  // START group
  [
    {
      photoType: "ASSET_START",
      label: "Foto maquinaria (inicio)",
      required: true,
    },
    {
      photoType: "HOUROMETER",
      label: "Foto horómetro/odómetro",
      required: true,
    },
  ],
  // END group
  [
    {
      photoType: "ASSET_END",
      label: "Foto maquinaria (cierre)",
      required: true,
    },
    {
      photoType: "WORK_PROGRESS",
      label: "Foto avance de obra",
      required: false,
    },
  ],
];

function photoTypeToGroup(t: EvidencePhotoType): "START" | "END" | "ADHOC" {
  if (t === "ASSET_START" || t === "HOUROMETER") return "START";
  if (t === "ASSET_END" || t === "WORK_PROGRESS") return "END";
  return "ADHOC";
}

async function uploadToAzure(
  buffer: Buffer,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const connStr = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME || "evidence";

  if (!connStr) {
    throw new Error("AZURE_STORAGE_CONNECTION_STRING not configured");
  }

  const blobServiceClient = BlobServiceClient.fromConnectionString(connStr);
  const containerClient = blobServiceClient.getContainerClient(containerName);

  // Ensure container exists
  await containerClient.createIfNotExists({ access: "blob" });

  const ext = path.extname(fileName) || ".jpg";
  const blobName = `mobile-evidence/${uuidv4()}${ext}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);

  await blockBlobClient.upload(buffer, buffer.length, {
    blobHTTPHeaders: { blobContentType: mimeType },
  });

  return blockBlobClient.url;
}

// ─── SERVICE ──────────────────────────────────────────────────

export const mobileService = {
  /**
   * Retorna los contratos activos donde el usuario logueado
   * tiene una OperatorAssignment activa.
   */
  async getMyAssignments(userId: string, businessUnitId: string) {
    const assignments = await prisma.operatorAssignment.findMany({
      where: {
        status: "ACTIVE",
        profile: {
          userId,
          businessUnitId,
        },
      },
      include: {
        rentalContract: {
          select: {
            id: true,
            code: true,
            status: true,
            startDate: true,
            estimatedEndDate: true,
            client: {
              select: { id: true, name: true },
            },
          },
        },
        asset: {
          select: {
            id: true,
            name: true,
            code: true,
            template: { select: { name: true } },
          },
        },
      },
      orderBy: { startDate: "desc" },
    });

    // Attach today's summary to each assignment
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Promise.all(
      assignments.map(async (a) => {
        const todayPhotos = await prisma.operatorPhoto.findMany({
          where: {
            report: {
              assignmentId: a.id,
              date: { gte: today },
            },
          },
          select: { type: true },
        });

        const submitted = todayPhotos.map((p) => p.type);

        return {
          id: a.id,
          contract: a.rentalContract,
          asset: a.asset,
          startDate: a.startDate,
          endDate: a.endDate,
          today: {
            startComplete:
              submitted.includes("ASSET_START") &&
              submitted.includes("HOUROMETER"),
            endComplete: submitted.includes("ASSET_END"),
            adhocCount: todayPhotos.filter(
              (p) => p.type === "INCIDENT" || p.type === "OTHER",
            ).length,
          },
        };
      }),
    );
  },

  /**
   * Retorna las evidencias del día agrupadas en START / END / ADHOC
   * para un assignment específico.
   */
  async getDayEvidence(assignmentId: string, userId: string) {
    // Verify ownership
    const assignment = await prisma.operatorAssignment.findFirst({
      where: {
        id: assignmentId,
        profile: { userId },
      },
    });

    if (!assignment) throw new Error("Assignment not found or access denied");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create today's report
    let report = await prisma.operatorDailyReport.findFirst({
      where: { assignmentId, date: { gte: today } },
      include: {
        photos: {
          select: {
            id: true,
            type: true,
            fileUrl: true,
            description: true,
            takenAt: true,
          },
        },
      },
    });

    const submittedPhotos = report?.photos ?? [];

    const buildGroup = (
      groupType: "START" | "END" | "ADHOC",
      label: string,
      items: Omit<EvidenceItem, "submitted">[],
    ): EvidenceGroup => ({
      type: groupType,
      label,
      items: items.map((item) => {
        const photo = submittedPhotos.find((p) => p.type === item.photoType);
        return {
          ...item,
          submitted: photo
            ? {
                id: photo.id,
                photoUrl: photo.fileUrl,
                notes: photo.description,
                submittedAt: photo.takenAt.toISOString(),
                submittedBy: userId,
              }
            : undefined,
        };
      }),
    });

    const adhocPhotos = submittedPhotos.filter(
      (p) => p.type === "INCIDENT" || p.type === "OTHER",
    );

    return {
      reportId: report?.id ?? null,
      date: today.toISOString(),
      groups: [
        buildGroup("START", "Apertura del día", EVIDENCE_GROUPS[0]),
        buildGroup("END", "Cierre del día", EVIDENCE_GROUPS[1]),
        {
          type: "ADHOC" as const,
          label: "Reportes adicionales",
          items: adhocPhotos.map((p) => ({
            photoType: p.type as EvidencePhotoType,
            label: p.type === "INCIDENT" ? "Incidente" : "Otro",
            required: false,
            submitted: {
              id: p.id,
              photoUrl: p.fileUrl,
              notes: p.description,
              submittedAt: p.takenAt.toISOString(),
              submittedBy: userId,
            },
          })),
        },
      ],
    };
  },

  /**
   * Sube una evidencia (foto + texto) para un assignment.
   * Crea el OperatorDailyReport del día si no existe.
   * Dispara notificación al OWNER / operadores con permiso operators:review.
   */
  async submitEvidence(userId: string, dto: SubmitEvidenceDTO) {
    // Verify assignment belongs to this user
    const assignment = await prisma.operatorAssignment.findFirst({
      where: {
        id: dto.assignmentId,
        profile: { userId },
      },
      include: {
        profile: {
          include: { user: { select: { firstName: true, lastName: true } } },
        },
        rentalContract: {
          select: {
            id: true,
            code: true,
            businessUnitId: true,
            businessUnit: { select: { tenantId: true } },
          },
        },
        asset: { select: { name: true, code: true } },
      },
    });

    if (!assignment) throw new Error("Assignment not found or access denied");

    const { rentalContract, asset, profile: operatorProfile } = assignment;
    const businessUnitId = rentalContract.businessUnitId;
    const tenantId = rentalContract.businessUnit.tenantId;
    const operatorName =
      `${operatorProfile.user?.firstName ?? ""} ${operatorProfile.user?.lastName ?? ""}`.trim();

    // Upload photo to Azure
    const fileUrl = await uploadToAzure(
      dto.fileBuffer,
      dto.fileName,
      dto.mimeType,
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get or create daily report
    let report = await prisma.operatorDailyReport.findFirst({
      where: { assignmentId: dto.assignmentId, date: { gte: today } },
    });

    if (!report) {
      report = await prisma.operatorDailyReport.create({
        data: {
          assignmentId: dto.assignmentId,
          profileId: operatorProfile.id,
          tenantId,
          assetId: assignment.assetId,
          date: today,
          syncStatus: "SYNCED",
        },
      });
    }

    // Save photo record
    const photo = await prisma.operatorPhoto.create({
      data: {
        reportId: report.id,
        type: dto.photoType,
        description: dto.notes ?? null,
        fileUrl,
        fileName: dto.fileName,
        mimeType: dto.mimeType,
        fileSize: dto.fileBuffer.length,
        latitude: dto.latitude ? dto.latitude : null,
        longitude: dto.longitude ? dto.longitude : null,
        takenAt: new Date(),
      },
    });

    // Update report flags
    const flagUpdates: Record<string, boolean> = {};
    if (dto.photoType === "INCIDENT") flagUpdates.incidentReported = true;
    if (Object.keys(flagUpdates).length > 0) {
      await prisma.operatorDailyReport.update({
        where: { id: report.id },
        data: flagUpdates,
      });
    }

    // ── Notify OWNER and users with operators:review permission ──
    const groupLabel =
      photoTypeToGroup(dto.photoType) === "START"
        ? "Apertura del día"
        : photoTypeToGroup(dto.photoType) === "END"
          ? "Cierre del día"
          : "Reporte adicional";

    const photoLabel: Record<EvidencePhotoType, string> = {
      ASSET_START: "foto de maquinaria (inicio)",
      HOUROMETER: "foto de horómetro",
      ASSET_END: "foto de maquinaria (cierre)",
      WORK_PROGRESS: "foto de avance de obra",
      INCIDENT: "reporte de incidente",
      OTHER: "evidencia adicional",
    };

    await notificationService.create({
      tenantId,
      businessUnitId,
      requiredPermission: "operators:read",
      type: "EVIDENCE_SUBMITTED",
      title: `Nueva evidencia — ${groupLabel}`,
      body: `${operatorName} subió ${photoLabel[dto.photoType]} para ${asset.name} (${asset.code}) en contrato ${rentalContract.code}.`,
      data: {
        photoId: photo.id,
        assignmentId: dto.assignmentId,
        contractId: rentalContract.id,
        photoType: dto.photoType,
        photoUrl: fileUrl,
      },
    });

    return {
      id: photo.id,
      photoUrl: fileUrl,
      photoType: dto.photoType,
      notes: dto.notes ?? null,
      submittedAt: photo.takenAt.toISOString(),
    };
  },

  /**
   * Resumen del progreso diario de un assignment:
   * cuántas evidencias requeridas están completas.
   */
  async getDaySummary(assignmentId: string, userId: string) {
    const assignment = await prisma.operatorAssignment.findFirst({
      where: { id: assignmentId, profile: { userId } },
      include: {
        rentalContract: { select: { code: true } },
        asset: { select: { name: true, code: true } },
      },
    });

    if (!assignment) throw new Error("Assignment not found or access denied");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const photos = await prisma.operatorPhoto.findMany({
      where: { report: { assignmentId, date: { gte: today } } },
      select: { type: true, id: true, fileUrl: true, takenAt: true },
    });

    const has = (t: string) => photos.some((p) => p.type === t);

    return {
      contract: assignment.rentalContract,
      asset: assignment.asset,
      date: today.toISOString(),
      start: {
        complete: has("ASSET_START") && has("HOUROMETER"),
        items: [
          { photoType: "ASSET_START", done: has("ASSET_START") },
          { photoType: "HOUROMETER", done: has("HOUROMETER") },
        ],
      },
      end: {
        complete: has("ASSET_END"),
        items: [
          { photoType: "ASSET_END", done: has("ASSET_END") },
          { photoType: "WORK_PROGRESS", done: has("WORK_PROGRESS") },
        ],
      },
      adhoc: photos.filter((p) => p.type === "INCIDENT" || p.type === "OTHER"),
    };
  },
};
