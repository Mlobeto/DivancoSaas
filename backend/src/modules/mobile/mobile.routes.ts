/**
 * MOBILE ROUTES
 *
 * Endpoints para el flujo de evidencias de operarios desde la app mobile.
 * Todos los endpoints requieren autenticación JWT.
 * El campo de photo se llama "photo" en multipart/form-data.
 *
 * Registro en app.ts:
 *   import { mobileRouter } from "./modules/mobile/mobile.routes";
 *   app.use("/api/v1/mobile", mobileRouter);
 */

import { Router } from "express";
import multer from "multer";
import { authenticate } from "@core/middlewares/auth.middleware";
import { mobileController } from "./mobile.controller";

const router = Router();

// Only images accepted for evidence photos (max 10 MB)
const photoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are accepted for evidence"));
    }
  },
});

// All mobile routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/mobile/branding
 * Returns logo and brand colors for the logged-in user's business unit.
 */
router.get("/branding", mobileController.getBranding.bind(mobileController));

/**
 * GET /api/v1/mobile/my-assignments
 * Returns active rental contracts assigned to the logged-in operator.
 */
router.get(
  "/my-assignments",
  mobileController.getMyAssignments.bind(mobileController),
);

/**
 * GET /api/v1/mobile/assignments/:id/evidence
 * Returns today's evidence groups (START / END / ADHOC) for an assignment.
 */
router.get(
  "/assignments/:id/evidence",
  mobileController.getDayEvidence.bind(mobileController),
);

/**
 * POST /api/v1/mobile/assignments/:id/evidence
 * Uploads a single evidence photo for an assignment.
 *
 * Body (multipart/form-data):
 *   photo      — image file (required)
 *   photoType  — one of ASSET_START | HOUROMETER | ASSET_END | WORK_PROGRESS | INCIDENT | OTHER
 *   notes      — text notes (optional)
 *   latitude   — GPS latitude (optional)
 *   longitude  — GPS longitude (optional)
 */
router.post(
  "/assignments/:id/evidence",
  photoUpload.single("photo"),
  mobileController.submitEvidence.bind(mobileController),
);

/**
 * GET /api/v1/mobile/assignments/:id/summary
 * Returns the day's progress: which required evidence is done vs pending.
 */
router.get(
  "/assignments/:id/summary",
  mobileController.getDaySummary.bind(mobileController),
);

export { router as mobileRouter };
