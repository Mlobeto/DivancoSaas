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
import { AssetsController } from "./controllers/assets.controller";

export class AssetsModule implements ModuleContract {
  readonly name = "assets";
  readonly version = "1.0.0";

  async initialize(): Promise<void> {
    console.log(`[Module] ${this.name} v${this.version} initialized`);
  }

  getRoutes(): Router {
    const router = Router();

    // ========== ASSETS ==========
    router.post("/assets", AssetsController.createAsset);
    router.get("/assets", AssetsController.listAssets);
    router.get("/assets/:assetId", AssetsController.getAsset);
    router.patch("/assets/:assetId", AssetsController.updateAsset);
    router.delete("/assets/:assetId", AssetsController.deleteAsset);
    router.post("/assets/:assetId/state", AssetsController.updateAssetState);
    router.get("/assets/:assetId/events", AssetsController.getAssetEvents);

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

    // ========== ATTACHMENTS ==========
    router.post("/attachments", AssetsController.createAttachment);
    router.get("/attachments", AssetsController.listAttachments);
    router.get("/attachments/:attachmentId", AssetsController.getAttachment);
    router.delete(
      "/attachments/:attachmentId",
      AssetsController.deleteAttachment,
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
