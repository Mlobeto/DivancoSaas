/**
 * Branding Routes
 * API endpoints for Business Unit branding configuration
 */

import { Router } from "express";
import { brandingController } from "../controllers/branding.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/branding/:businessUnitId
 * Get branding configuration for a business unit
 */
router.get("/:businessUnitId", (req, res) =>
  brandingController.getBranding(req, res),
);

/**
 * POST /api/branding
 * Create branding configuration
 */
router.post("/", (req, res) => brandingController.createBranding(req, res));

/**
 * PUT /api/branding/:businessUnitId
 * Update branding configuration
 */
router.put("/:businessUnitId", (req, res) =>
  brandingController.updateBranding(req, res),
);

/**
 * DELETE /api/branding/:businessUnitId
 * Delete branding configuration
 */
router.delete("/:businessUnitId", (req, res) =>
  brandingController.deleteBranding(req, res),
);

/**
 * POST /api/branding/:businessUnitId/preview
 * Generate preview PDF with current branding
 * Body: { documentType?: "quotation" | "contract" | "receipt", format?: "A4" | "ticket", sampleData?: any }
 */
router.post("/:businessUnitId/preview", (req, res) =>
  brandingController.generatePreview(req, res),
);

/**
 * POST /api/branding/:businessUnitId/test-html
 * Get HTML for testing (without generating PDF)
 * Body: { documentType?: string, sampleData?: any }
 */
router.post("/:businessUnitId/test-html", (req, res) =>
  brandingController.getTestHTML(req, res),
);

export default router;
