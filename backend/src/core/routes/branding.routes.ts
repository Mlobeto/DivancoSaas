/**
 * Branding Routes
 * API endpoints for Business Unit branding configuration
 */

import { Router } from "express";
import multer from "multer";
import { brandingController } from "../controllers/branding.controller";
import { emailTemplateController } from "../controllers/email-template.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { z } from "zod";

const router = Router();

const createEmailTemplateSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  emailType: z.string().min(2).max(100),
  subject: z.string().min(1).max(300),
  fromName: z.string().max(150).optional(),
  replyToEmail: z.string().email().optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  preheader: z.string().max(300).optional(),
  useBranding: z.boolean().optional(),
  customColors: z.record(z.string()).optional(),
  defaultAttachments: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const updateEmailTemplateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).optional(),
  subject: z.string().min(1).max(300).optional(),
  fromName: z.string().max(150).optional(),
  replyToEmail: z.string().email().optional(),
  htmlContent: z.string().min(1).optional(),
  textContent: z.string().optional(),
  preheader: z.string().max(300).optional(),
  useBranding: z.boolean().optional(),
  customColors: z.record(z.string()).optional(),
  defaultAttachments: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

const setActiveSchema = z.object({
  isActive: z.boolean(),
});

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

/**
 * Email template management (Branding Settings)
 */
router.get(
  "/:businessUnitId/email-templates",
  authorize("settings:read"),
  (req, res) => emailTemplateController.list(req, res),
);

router.get(
  "/:businessUnitId/email-templates/:templateId",
  authorize("settings:read"),
  (req, res) => emailTemplateController.get(req, res),
);

router.post(
  "/:businessUnitId/email-templates",
  authorize("settings:update"),
  (req, res) => {
    req.body = createEmailTemplateSchema.parse(req.body);
    return emailTemplateController.create(req, res);
  },
);

router.put(
  "/:businessUnitId/email-templates/:templateId",
  authorize("settings:update"),
  (req, res) => {
    req.body = updateEmailTemplateSchema.parse(req.body);
    return emailTemplateController.update(req, res);
  },
);

router.patch(
  "/:businessUnitId/email-templates/:templateId/default",
  authorize("settings:update"),
  (req, res) => emailTemplateController.setDefault(req, res),
);

router.patch(
  "/:businessUnitId/email-templates/:templateId/active",
  authorize("settings:update"),
  (req, res) => {
    req.body = setActiveSchema.parse(req.body);
    return emailTemplateController.setActive(req, res);
  },
);

router.delete(
  "/:businessUnitId/email-templates/:templateId",
  authorize("settings:update"),
  (req, res) => emailTemplateController.delete(req, res),
);

export default router;
