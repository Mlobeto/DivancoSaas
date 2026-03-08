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
  getCSVUploadMiddleware,
} from "./controllers/assets.controller";
import { RentalController } from "./controllers/rental.controller";
import { SupplyController } from "./controllers/supply.controller";
import { IncidentController } from "./controllers/incident.controller";
import { StockLevelController } from "./controllers/stock-level.controller";
import { WarehouseController } from "./controllers/warehouse.controller";
import { authorize } from "@core/middlewares/auth.middleware";
import { requireVertical } from "@core/middlewares/vertical.middleware";
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

    // ========== WAREHOUSES (Bodegas y Talleres) - RENTAL VERTICAL ONLY ==========
    router.get(
      "/warehouses",
      authorize("assets:read"),
      requireVertical("rental"),
      WarehouseController.list,
    );
    router.post(
      "/warehouses",
      authorize("assets:create"),
      requireVertical("rental"),
      WarehouseController.create,
    );
    router.get(
      "/warehouses/:id",
      authorize("assets:read"),
      requireVertical("rental"),
      WarehouseController.getById,
    );
    router.put(
      "/warehouses/:id",
      authorize("assets:update"),
      requireVertical("rental"),
      WarehouseController.update,
    );
    router.delete(
      "/warehouses/:id",
      authorize("assets:delete"),
      requireVertical("rental"),
      WarehouseController.delete,
    );

    // ========== STOCK LEVELS (BULK INVENTORY) ==========
    router.get(
      "/stock-levels/stats",
      authorize("assets:read"),
      StockLevelController.getStockStats,
    ); // Before :templateId
    router.get(
      "/stock-levels",
      authorize("assets:read"),
      StockLevelController.listStockLevels,
    );
    router.get(
      "/stock-levels/:templateId",
      authorize("assets:read"),
      StockLevelController.getStockLevel,
    );
    router.patch(
      "/stock-levels/:templateId",
      authorize("assets:update"),
      StockLevelController.updateStockLevel,
    );
    router.get(
      "/stock-levels/:templateId/movements",
      authorize("assets:read"),
      StockLevelController.getStockMovements,
    );
    router.post(
      "/stock-levels/add",
      authorize("assets:update"),
      StockLevelController.addStock,
    );
    router.post(
      "/stock-levels/reserve",
      authorize("assets:update"),
      StockLevelController.reserveStock,
    );
    router.post(
      "/stock-levels/unreserve",
      authorize("assets:update"),
      StockLevelController.unreserveStock,
    );
    router.post(
      "/stock-levels/rent",
      authorize("assets:update"),
      StockLevelController.rentOutStock,
    );
    router.post(
      "/stock-levels/return",
      authorize("assets:update"),
      StockLevelController.returnStock,
    );
    router.post(
      "/stock-levels/adjust",
      authorize("assets:update"),
      StockLevelController.adjustStock,
    );

    // ========== ASSETS ==========
    router.post(
      "/assets/import",
      authorize("assets:create"),
      getCSVUploadMiddleware(),
      AssetsController.importCSV,
    );
    router.post(
      "/assets",
      authorize("assets:create"),
      AssetsController.createAsset,
    );
    router.get(
      "/assets/next-code",
      authorize("assets:read"),
      AssetsController.getNextCode,
    ); // Before :assetId to avoid conflict
    router.get(
      "/assets",
      authorize("assets:read"),
      AssetsController.listAssets,
    );
    router.get(
      "/assets/:assetId",
      authorize("assets:read"),
      AssetsController.getAsset,
    );
    router.patch(
      "/assets/:assetId",
      authorize("assets:update"),
      AssetsController.updateAsset,
    );
    router.delete(
      "/assets/:assetId",
      authorize("assets:delete"),
      AssetsController.deleteAsset,
    );
    router.post(
      "/assets/:assetId/state",
      authorize("assets:update"),
      AssetsController.updateAssetState,
    );
    router.post(
      "/assets/:assetId/decommission",
      authorize("assets:delete"),
      AssetsController.decommissionAsset,
    );
    router.get(
      "/assets/:assetId/events",
      authorize("assets:read"),
      AssetsController.getAssetEvents,
    );

    // ========== ASSET IMAGE UPLOAD ==========
    router.post(
      "/assets/:assetId/image",
      authorize("assets:update"),
      upload.single("image"),
      AssetsController.uploadMainImage,
    );
    router.delete(
      "/assets/:assetId/image",
      authorize("assets:update"),
      AssetsController.deleteMainImage,
    );

    // ========== ASSET ATTACHMENTS (Multiple documents/photos) ==========
    router.post(
      "/assets/:assetId/attachments",
      authorize("assets:update"),
      uploadDocuments.array("files", 10),
      AssetsController.uploadMultipleAttachments,
    );

    // ========== MAINTENANCE ==========
    router.post(
      "/maintenance",
      authorize("assets:update"),
      AssetsController.createMaintenance,
    );
    router.get(
      "/maintenance/active",
      authorize("assets:read"),
      AssetsController.getActiveMaintenance,
    );
    router.get(
      "/maintenance/:maintenanceId",
      authorize("assets:read"),
      AssetsController.getMaintenance,
    );
    router.patch(
      "/maintenance/:maintenanceId",
      authorize("assets:update"),
      AssetsController.updateMaintenance,
    );
    router.get(
      "/assets/:assetId/maintenance",
      authorize("assets:read"),
      AssetsController.listMaintenanceByAsset,
    );

    // ========== USAGE ==========
    router.post(
      "/usage",
      authorize("assets:update"),
      AssetsController.recordUsage,
    );
    router.get("/usage", authorize("assets:read"), AssetsController.listUsage);
    router.get(
      "/usage/:usageId",
      authorize("assets:read"),
      AssetsController.getUsage,
    );
    router.delete(
      "/usage/:usageId",
      authorize("assets:delete"),
      AssetsController.deleteUsage,
    );
    router.get(
      "/assets/:assetId/usage/summary",
      authorize("assets:read"),
      AssetsController.getAssetUsageSummary,
    );
    router.post(
      "/usage/:usageId/evidence",
      authorize("assets:update"),
      upload.array("files", 5),
      AssetsController.uploadUsageEvidence,
    );

    // ========== ATTACHMENTS ==========
    router.post(
      "/attachments",
      authorize("assets:update"),
      AssetsController.createAttachment,
    );
    router.get(
      "/attachments",
      authorize("assets:read"),
      AssetsController.listAttachments,
    );
    router.get(
      "/attachments/:attachmentId",
      authorize("assets:read"),
      AssetsController.getAttachment,
    );
    router.delete(
      "/attachments/:attachmentId",
      authorize("assets:delete"),
      AssetsController.deleteAttachment,
    );

    // ========== DOCUMENT TYPES ==========
    router.post(
      "/document-types",
      authorize("assets:create"),
      AssetsController.createDocumentType,
    );
    router.get(
      "/document-types",
      authorize("assets:read"),
      AssetsController.listDocumentTypes,
    );
    router.get(
      "/document-types/:documentTypeId",
      authorize("assets:read"),
      AssetsController.getDocumentType,
    );
    router.patch(
      "/document-types/:documentTypeId",
      authorize("assets:update"),
      AssetsController.updateDocumentType,
    );
    router.delete(
      "/document-types/:documentTypeId",
      authorize("assets:delete"),
      AssetsController.deleteDocumentType,
    );

    // ========== QUOTATION SUPPORT ==========
    router.get(
      "/assets/:assetId/availability",
      authorize("assets:read"),
      AssetsController.getAssetAvailability,
    );
    router.get(
      "/search-for-quotation",
      authorize("assets:read"),
      AssetsController.searchAssetsForQuotation,
    );

    // ========== RENTAL CONTRACTS ==========
    router.post(
      "/rental/contracts",
      authorize("rental-contracts:create"),
      RentalController.createContract,
    );
    router.get(
      "/rental/contracts",
      authorize("rental-contracts:read"),
      RentalController.listContracts,
    );
    router.get(
      "/rental/contracts/:contractId",
      authorize("rental-contracts:read"),
      RentalController.getContract,
    );
    router.patch(
      "/rental/contracts/:contractId",
      authorize("rental-contracts:update"),
      RentalController.updateContract,
    );
    router.post(
      "/rental/contracts/:contractId/assign-asset",
      authorize("rental-contracts:update"),
      RentalController.assignAsset,
    );
    router.post(
      "/rental/contracts/:contractId/finalize",
      authorize("rental-contracts:update"),
      RentalController.finalizeContract,
    );

    // ========== USAGE REPORTS ==========
    router.post(
      "/rental/usage-reports",
      authorize("rental-contracts:update"),
      RentalController.recordUsageReport,
    );
    router.get(
      "/rental/usage-reports",
      authorize("rental-contracts:read"),
      RentalController.listUsageReports,
    );

    // ========== AVAILABILITY PROJECTION ==========
    router.get(
      "/rental/availability/:assetId",
      authorize("assets:read"),
      RentalController.projectAssetAvailability,
    );
    router.get(
      "/rental/availability/type/:assetTypeId",
      authorize("assets:read"),
      RentalController.projectAvailabilityByType,
    );
    router.post(
      "/rental/assets/:assetId/evaluate-post-obra",
      authorize("assets:update"),
      RentalController.evaluatePostObra,
    );
    router.get(
      "/rental/contract-assets/:contractAssetId/usage-variance",
      authorize("rental-contracts:read"),
      RentalController.getUsageVariance,
    );

    // ========== SUPPLIES ==========
    router.post(
      "/supplies",
      authorize("supplies:create"),
      SupplyController.createSupply,
    );
    router.get(
      "/supplies",
      authorize("supplies:read"),
      SupplyController.listSupplies,
    );
    router.get(
      "/supplies/:supplyId",
      authorize("supplies:read"),
      SupplyController.getSupply,
    );
    router.patch(
      "/supplies/:supplyId",
      authorize("supplies:update"),
      SupplyController.updateSupply,
    );
    router.post(
      "/supplies/usage",
      authorize("supplies:update"),
      SupplyController.recordUsage,
    );
    router.post(
      "/supplies/:supplyId/discard",
      authorize("supplies:update"),
      SupplyController.discardSupply,
    );

    // ========== PREVENTIVE CONFIGURATION ==========
    router.post(
      "/assets/:assetId/preventive-config",
      authorize("assets:update"),
      SupplyController.configurePreventive,
    );
    router.patch(
      "/assets/:assetId/preventive-config",
      authorize("assets:update"),
      SupplyController.updatePreventiveConfig,
    );
    router.get(
      "/assets/:assetId/preventive-config",
      authorize("assets:read"),
      SupplyController.getPreventiveConfig,
    );

    // ========== MAINTENANCE EVENTS ==========
    router.post(
      "/assets/:assetId/maintenance/preventive",
      authorize("assets:update"),
      SupplyController.executePreventive,
    );
    router.post(
      "/assets/:assetId/maintenance/post-obra",
      authorize("assets:update"),
      SupplyController.executePostObra,
    );
    router.get(
      "/assets/:assetId/maintenance/history",
      authorize("assets:read"),
      SupplyController.getMaintenanceHistory,
    );

    // ========== INCIDENTS ==========
    router.post(
      "/incidents",
      authorize("assets:create"),
      IncidentController.reportIncident,
    );
    router.get(
      "/incidents",
      authorize("assets:read"),
      IncidentController.listIncidents,
    );
    router.get(
      "/incidents/active",
      authorize("assets:read"),
      IncidentController.getActiveIncidents,
    );
    router.get(
      "/incidents/:incidentId",
      authorize("assets:read"),
      IncidentController.getIncident,
    );
    router.post(
      "/incidents/:incidentId/resolve",
      authorize("assets:update"),
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

      // Asset Templates
      {
        resource: "asset-templates",
        action: "create",
        description: "Create asset templates",
      },
      {
        resource: "asset-templates",
        action: "read",
        description: "View asset templates",
      },
      {
        resource: "asset-templates",
        action: "update",
        description: "Update asset templates",
      },
      {
        resource: "asset-templates",
        action: "delete",
        description: "Delete asset templates",
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
