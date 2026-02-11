/**
 * Assets Module
 *
 * Rental Equipment Management Module
 * Manages assets, maintenance, usage tracking, and attachments
 */

import { Router } from "express";
import {
  ModuleContract,
  ModulePermission,
  ModuleWorkflow,
} from "@core/contracts/module.contract";
import {
  AssetsController,
  upload,
  uploadDocuments,
} from "./controllers/assets.controller";
import { RentalController } from "./controllers/rental.controller";
import { SupplyController } from "./controllers/supply.controller";
import { IncidentController } from "./controllers/incident.controller";
import assetTemplateRoutes from "./routes/asset-template.routes";

export class AssetsModule implements ModuleContract {
  readonly name = "assets";
  readonly version = "1.0.0";

  async initialize(): Promise<void> {
    console.log(`[Module] ${this.name} v${this.version} initialized`);
  }

  getRoutes(): Router {
    const router = Router();

    // ========== ASSET TEMPLATES ==========
    router.use("/templates", assetTemplateRoutes);

    // ========== ASSETS ==========
    router.post("/assets", AssetsController.createAsset);
    router.get("/assets", AssetsController.listAssets);
    router.get("/assets/:assetId", AssetsController.getAsset);
    router.patch("/assets/:assetId", AssetsController.updateAsset);
    router.delete("/assets/:assetId", AssetsController.deleteAsset);
    router.post("/assets/:assetId/state", AssetsController.updateAssetState);
    router.post(
      "/assets/:assetId/decommission",
      AssetsController.decommissionAsset,
    );
    router.get("/assets/:assetId/events", AssetsController.getAssetEvents);

    // ========== ASSET IMAGE UPLOAD ==========
    router.post(
      "/assets/:assetId/image",
      upload.single("image"),
      AssetsController.uploadMainImage,
    );
    router.delete("/assets/:assetId/image", AssetsController.deleteMainImage);

    // ========== ASSET ATTACHMENTS (Multiple documents/photos) ==========
    router.post(
      "/assets/:assetId/attachments",
      uploadDocuments.array("files", 10),
      AssetsController.uploadMultipleAttachments,
    );

    // ========== MAINTENANCE ==========
    router.post("/maintenance", AssetsController.createMaintenance);
    router.get("/maintenance/active", AssetsController.getActiveMaintenance);
    router.get("/maintenance/:maintenanceId", AssetsController.getMaintenance);
    router.patch(
      "/maintenance/:maintenanceId",
      AssetsController.updateMaintenance,
    );
    router.get(
      "/assets/:assetId/maintenance",
      AssetsController.listMaintenanceByAsset,
    );

    // ========== USAGE ==========
    router.post("/usage", AssetsController.recordUsage);
    router.get("/usage", AssetsController.listUsage);
    router.get("/usage/:usageId", AssetsController.getUsage);
    router.delete("/usage/:usageId", AssetsController.deleteUsage);
    router.get(
      "/assets/:assetId/usage/summary",
      AssetsController.getAssetUsageSummary,
    );
    router.post(
      "/usage/:usageId/evidence",
      upload.array("files", 5),
      AssetsController.uploadUsageEvidence,
    );

    // ========== ATTACHMENTS ==========
    router.post("/attachments", AssetsController.createAttachment);
    router.get("/attachments", AssetsController.listAttachments);
    router.get("/attachments/:attachmentId", AssetsController.getAttachment);
    router.delete(
      "/attachments/:attachmentId",
      AssetsController.deleteAttachment,
    );

    // ========== DOCUMENT TYPES ==========
    router.post("/document-types", AssetsController.createDocumentType);
    router.get("/document-types", AssetsController.listDocumentTypes);
    router.get(
      "/document-types/:documentTypeId",
      AssetsController.getDocumentType,
    );
    router.patch(
      "/document-types/:documentTypeId",
      AssetsController.updateDocumentType,
    );
    router.delete(
      "/document-types/:documentTypeId",
      AssetsController.deleteDocumentType,
    );

    // ========== RENTAL CONTRACTS ==========
    router.post("/rental/contracts", RentalController.createContract);
    router.get("/rental/contracts", RentalController.listContracts);
    router.get("/rental/contracts/:contractId", RentalController.getContract);
    router.patch(
      "/rental/contracts/:contractId",
      RentalController.updateContract,
    );
    router.post(
      "/rental/contracts/:contractId/assign-asset",
      RentalController.assignAsset,
    );
    router.post(
      "/rental/contracts/:contractId/finalize",
      RentalController.finalizeContract,
    );

    // ========== USAGE REPORTS ==========
    router.post("/rental/usage-reports", RentalController.recordUsageReport);
    router.get("/rental/usage-reports", RentalController.listUsageReports);

    // ========== AVAILABILITY PROJECTION ==========
    router.get(
      "/rental/availability/:assetId",
      RentalController.projectAssetAvailability,
    );
    router.get(
      "/rental/availability/type/:assetTypeId",
      RentalController.projectAvailabilityByType,
    );
    router.post(
      "/rental/assets/:assetId/evaluate-post-obra",
      RentalController.evaluatePostObra,
    );
    router.get(
      "/rental/contract-assets/:contractAssetId/usage-variance",
      RentalController.getUsageVariance,
    );

    // ========== SUPPLIES ==========
    router.post("/supplies", SupplyController.createSupply);
    router.get("/supplies", SupplyController.listSupplies);
    router.get("/supplies/:supplyId", SupplyController.getSupply);
    router.patch("/supplies/:supplyId", SupplyController.updateSupply);
    router.post("/supplies/usage", SupplyController.recordUsage);
    router.post("/supplies/:supplyId/discard", SupplyController.discardSupply);

    // ========== PREVENTIVE CONFIGURATION ==========
    router.post(
      "/assets/:assetId/preventive-config",
      SupplyController.configurePreventive,
    );
    router.patch(
      "/assets/:assetId/preventive-config",
      SupplyController.updatePreventiveConfig,
    );
    router.get(
      "/assets/:assetId/preventive-config",
      SupplyController.getPreventiveConfig,
    );

    // ========== MAINTENANCE EVENTS ==========
    router.post(
      "/assets/:assetId/maintenance/preventive",
      SupplyController.executePreventive,
    );
    router.post(
      "/assets/:assetId/maintenance/post-obra",
      SupplyController.executePostObra,
    );
    router.get(
      "/assets/:assetId/maintenance/history",
      SupplyController.getMaintenanceHistory,
    );

    // ========== INCIDENTS ==========
    router.post("/incidents", IncidentController.reportIncident);
    router.get("/incidents", IncidentController.listIncidents);
    router.get("/incidents/active", IncidentController.getActiveIncidents);
    router.get("/incidents/:incidentId", IncidentController.getIncident);
    router.post(
      "/incidents/:incidentId/resolve",
      IncidentController.resolveIncident,
    );

    return router;
  }

  getRequiredPermissions(): ModulePermission[] {
    return [
      // Assets
      {
        resource: "assets",
        action: "create",
        description: "Create new assets",
      },
      {
        resource: "assets",
        action: "read",
        description: "View assets",
      },
      {
        resource: "assets",
        action: "update",
        description: "Edit assets",
      },
      {
        resource: "assets",
        action: "delete",
        description: "Delete assets",
      },
      {
        resource: "assets",
        action: "update-state",
        description: "Update asset state",
      },

      // Maintenance
      {
        resource: "maintenance",
        action: "create",
        description: "Create maintenance records",
      },
      {
        resource: "maintenance",
        action: "read",
        description: "View maintenance records",
      },
      {
        resource: "maintenance",
        action: "update",
        description: "Update maintenance records",
      },

      // Usage
      {
        resource: "usage",
        action: "create",
        description: "Record asset usage",
      },
      {
        resource: "usage",
        action: "read",
        description: "View usage records",
      },
      {
        resource: "usage",
        action: "delete",
        description: "Delete usage records",
      },

      // Attachments
      {
        resource: "attachments",
        action: "create",
        description: "Upload attachments",
      },
      {
        resource: "attachments",
        action: "read",
        description: "View attachments",
      },
      {
        resource: "attachments",
        action: "delete",
        description: "Delete attachments",
      },

      // Rental Contracts
      {
        resource: "rental-contracts",
        action: "create",
        description: "Create rental contracts",
      },
      {
        resource: "rental-contracts",
        action: "read",
        description: "View rental contracts",
      },
      {
        resource: "rental-contracts",
        action: "update",
        description: "Update rental contracts",
      },
      {
        resource: "rental-contracts",
        action: "assign-asset",
        description: "Assign assets to contracts",
      },
      {
        resource: "rental-contracts",
        action: "finalize",
        description: "Finalize rental contracts",
      },

      // Usage Reports
      {
        resource: "usage-reports",
        action: "create",
        description: "Record usage reports",
      },
      {
        resource: "usage-reports",
        action: "read",
        description: "View usage reports",
      },

      // Supplies
      {
        resource: "supplies",
        action: "create",
        description: "Create supplies",
      },
      {
        resource: "supplies",
        action: "read",
        description: "View supplies",
      },
      {
        resource: "supplies",
        action: "update",
        description: "Update supplies",
      },
      {
        resource: "supplies",
        action: "usage",
        description: "Record supply usage",
      },

      // Preventive Maintenance
      {
        resource: "preventive-maintenance",
        action: "configure",
        description: "Configure preventive maintenance",
      },
      {
        resource: "preventive-maintenance",
        action: "execute",
        description: "Execute preventive maintenance",
      },
      {
        resource: "preventive-maintenance",
        action: "read",
        description: "View maintenance history",
      },

      // Incidents
      {
        resource: "incidents",
        action: "create",
        description: "Report incidents",
      },
      {
        resource: "incidents",
        action: "read",
        description: "View incidents",
      },
      {
        resource: "incidents",
        action: "resolve",
        description: "Resolve incidents",
      },
    ];
  }

  getDefaultWorkflows(): ModuleWorkflow[] {
    return [
      {
        name: "asset-lifecycle",
        description: "Default asset lifecycle workflow",
        states: [
          {
            id: "available",
            name: "Available",
            color: "#10b981",
            order: 1,
            isInitial: true,
          },
          {
            id: "reserved",
            name: "Reserved",
            color: "#3b82f6",
            order: 2,
          },
          {
            id: "in-use",
            name: "In Use",
            color: "#f59e0b",
            order: 3,
          },
          {
            id: "maintenance",
            name: "Maintenance",
            color: "#ef4444",
            order: 4,
          },
          {
            id: "out-of-service",
            name: "Out of Service",
            color: "#6b7280",
            order: 5,
            isFinal: true,
          },
        ],
        transitions: [
          { from: "available", to: "reserved", label: "Reserve" },
          { from: "reserved", to: "in-use", label: "Start Use" },
          { from: "reserved", to: "available", label: "Cancel Reservation" },
          { from: "in-use", to: "available", label: "Return" },
          { from: "in-use", to: "maintenance", label: "Send to Maintenance" },
          {
            from: "available",
            to: "maintenance",
            label: "Send to Maintenance",
          },
          {
            from: "maintenance",
            to: "available",
            label: "Complete Maintenance",
          },
          {
            from: "maintenance",
            to: "out-of-service",
            label: "Decommission",
            requiredRole: "Admin",
          },
          {
            from: "available",
            to: "out-of-service",
            label: "Decommission",
            requiredRole: "Admin",
          },
        ],
      },
    ];
  }

  async cleanup(): Promise<void> {
    console.log(`[Module] ${this.name} cleanup completed`);
  }
}
