/**
 * Branding Routes
 * API endpoints for Business Unit branding configuration
 */

import { Router } from "express";
import multer from "multer";
import { brandingController } from "../controllers/branding.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max for logos
  },
});

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/branding/:businessUnitId
 * Get branding configuration for a business unit
 */
router.get("/:businessUnitId", authorize("settings:read"), (req, res) =>
  brandingController.getBranding(req, res),
);

/**
 * POST /api/branding
 * Create branding configuration
 */
router.post("/", authorize("settings:update"), (req, res) =>
  brandingController.createBranding(req, res),
);

/**
 * PUT /api/branding/:businessUnitId
 * Update branding configuration
 */
router.put("/:businessUnitId", authorize("settings:update"), (req, res) =>
  brandingController.updateBranding(req, res),
);

/**
 * DELETE /api/branding/:businessUnitId
 * Delete branding configuration
 */
router.delete("/:businessUnitId", authorize("settings:update"), (req, res) =>
  brandingController.deleteBranding(req, res),
);

/**
 * POST /api/branding/:businessUnitId/preview
 * Generate preview PDF with current branding
 * Body: { documentType?: "quotation" | "contract" | "receipt", format?: "A4" | "ticket", sampleData?: any }
 */
router.post(
  "/:businessUnitId/preview",
  authorize("settings:read"),
  (req, res) => brandingController.generatePreview(req, res),
);

/**
 * POST /api/branding/:businessUnitId/test-html
 * Get HTML for testing (without generating PDF)
 * Body: { documentType?: string, sampleData?: any }
 */
router.post(
  "/:businessUnitId/test-html",
  authorize("settings:read"),
  (req, res) => brandingController.getTestHTML(req, res),
);

/**
 * POST /api/branding/:businessUnitId/upload-logo
 * Upload logo for business unit branding
 * Multipart/form-data with 'logo' field
 */
router.post(
  "/:businessUnitId/upload-logo",
  authorize("settings:update"),
  upload.single("logo"),
  (req, res) => brandingController.uploadLogo(req, res),
);

export default router;
