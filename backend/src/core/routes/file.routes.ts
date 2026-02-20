/**
 * File Storage Routes
 * Endpoints para gestión de archivos (upload, download, delete, SAS tokens)
 */

import { Router, Request, Response } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";
import { fileStorageService } from "../services/file-storage.service";

// Extender Request con user
interface AuthenticatedRequest extends Request {
  user?: {
    tenantId: string;
    userId: string;
    role: string;
  };
}

const router = Router();

// Configuración de multer para almacenamiento en memoria
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
});

/**
 * @swagger
 * /api/files/upload:
 *   post:
 *     summary: Sube un archivo al storage
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - container
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               container:
 *                 type: string
 *                 example: "documents"
 *               folder:
 *                 type: string
 *                 example: "invoices/2024"
 *               processImage:
 *                 type: boolean
 *                 example: true
 *               resize:
 *                 type: string
 *                 example: "800x600"
 *               format:
 *                 type: string
 *                 enum: [jpeg, png, webp, avif]
 *               quality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *               generateThumbnail:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Archivo subido exitosamente
 *       400:
 *         description: Error de validación
 *       401:
 *         description: No autorizado
 */
router.post(
  "/upload",
  authenticate as any,
  upload.single("file"),
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { businessUnitId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      if (typeof businessUnitId !== "string") {
        return res.status(400).json({ error: "businessUnitId is required" });
      }

      // Validar autenticación
      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const {
        container,
        folder,
        processImage,
        resize,
        format,
        quality,
        generateThumbnail,
      } = req.body;

      if (!container) {
        return res.status(400).json({ error: "container is required" });
      }

      // Preparar opciones de procesamiento de imagen
      let imageOptions = undefined;
      if (processImage === "true" || processImage === true) {
        imageOptions = {
          resize: resize
            ? {
                width: parseInt(resize.split("x")[0]),
                height: parseInt(resize.split("x")[1]),
              }
            : undefined,
          format: format as "jpeg" | "png" | "webp" | "avif" | undefined,
          quality: quality ? parseInt(quality) : undefined,
          thumbnail:
            generateThumbnail === "true" || generateThumbnail === true
              ? { width: 200, height: 200 }
              : undefined,
        };
      }

      const result = await fileStorageService.uploadFile({
        file: file.buffer,
        fileName: file.originalname,
        mimeType: file.mimetype,
        container,
        folder,
        tenantId: req.user.tenantId,
        businessUnitId,
        processImage:
          processImage === "true" ||
          processImage === true ||
          imageOptions !== undefined,
        imageOptions,
      });

      res.json(result);
    } catch (error: any) {
      console.error("[FileRoutes] Upload error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

/**
 * @swagger
 * /api/files/download:
 *   get:
 *     summary: Descarga un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: blobName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: container
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo descargado
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Archivo no encontrado
 */
router.get(
  "/download",
  authenticate as any,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { blobName, container, businessUnitId } = req.query;

      if (
        typeof blobName !== "string" ||
        typeof container !== "string" ||
        typeof businessUnitId !== "string"
      ) {
        return res.status(400).json({
          error: "blobName, container, and businessUnitId are required",
        });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const result = await fileStorageService.downloadFile({
        blobName,
        container,
        tenantId: req.user.tenantId,
        businessUnitId,
      });

      res.setHeader("Content-Type", result.contentType);
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${blobName}"`,
      );
      res.send(result.buffer);
    } catch (error: any) {
      console.error("[FileRoutes] Download error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

/**
 * @swagger
 * /api/files/delete:
 *   delete:
 *     summary: Elimina un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: blobName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: container
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Archivo eliminado
 *       404:
 *         description: Archivo no encontrado
 */
router.delete(
  "/delete",
  authenticate as any,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { blobName, container, businessUnitId } = req.query;

      if (
        typeof blobName !== "string" ||
        typeof container !== "string" ||
        typeof businessUnitId !== "string"
      ) {
        return res.status(400).json({
          error: "blobName, container, and businessUnitId are required",
        });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await fileStorageService.deleteFile({
        blobName,
        container,
        tenantId: req.user.tenantId,
        businessUnitId,
      });

      res.json({ success: true, message: "File deleted successfully" });
    } catch (error: any) {
      console.error("[FileRoutes] Delete error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

/**
 * @swagger
 * /api/files/sas-token:
 *   post:
 *     summary: Genera una URL firmada temporal (SAS token)
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - blobName
 *               - container
 *               - businessUnitId
 *             properties:
 *               blobName:
 *                 type: string
 *               container:
 *                 type: string
 *               businessUnitId:
 *                 type: string
 *               expiresIn:
 *                 type: integer
 *                 description: Duración en minutos
 *                 default: 60
 *               permissions:
 *                 type: string
 *                 enum: [read, write, delete, list]
 *                 default: read
 *     responses:
 *       200:
 *         description: SAS token generado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                 expiresAt:
 *                   type: string
 *                   format: date-time
 */
router.post(
  "/sas-token",
  authenticate as any,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const {
        blobName,
        container,
        businessUnitId,
        expiresIn = 60,
        permissions = "read",
      } = req.body;

      if (
        typeof blobName !== "string" ||
        typeof container !== "string" ||
        typeof businessUnitId !== "string"
      ) {
        return res.status(400).json({
          error: "blobName, container, and businessUnitId are required",
        });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const url = await fileStorageService.generateSasToken({
        blobName,
        container,
        expiresIn,
        permissions,
        tenantId: req.user.tenantId,
        businessUnitId,
      });

      res.json({
        url,
        expiresAt: new Date(Date.now() + expiresIn * 60 * 1000).toISOString(),
      });
    } catch (error: any) {
      console.error("[FileRoutes] SAS token error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

/**
 * @swagger
 * /api/files/list:
 *   get:
 *     summary: Lista archivos en un container
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: container
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxResults
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de archivos
 */
router.get(
  "/list",
  authenticate as any,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { container, businessUnitId, prefix, maxResults } = req.query;

      if (typeof container !== "string" || typeof businessUnitId !== "string") {
        return res
          .status(400)
          .json({ error: "container and businessUnitId are required" });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const files = await fileStorageService.listFiles({
        container,
        prefix: typeof prefix === "string" ? prefix : undefined,
        maxResults:
          typeof maxResults === "string" ? parseInt(maxResults) : undefined,
        tenantId: req.user.tenantId,
        businessUnitId,
      });

      res.json({ files });
    } catch (error: any) {
      console.error("[FileRoutes] List error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

/**
 * @swagger
 * /api/files/exists:
 *   get:
 *     summary: Verifica si un archivo existe
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: blobName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: container
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de la verificación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 */
router.get(
  "/exists",
  authenticate as any,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { blobName, container, businessUnitId } = req.query;

      if (
        typeof blobName !== "string" ||
        typeof container !== "string" ||
        typeof businessUnitId !== "string"
      ) {
        return res.status(400).json({
          error: "blobName, container, and businessUnitId are required",
        });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const exists = await fileStorageService.fileExists(
        blobName,
        container,
        req.user.tenantId,
        businessUnitId,
      );

      res.json({ exists });
    } catch (error: any) {
      console.error("[FileRoutes] Exists error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

/**
 * @swagger
 * /api/files/metadata:
 *   get:
 *     summary: Obtiene metadata de un archivo
 *     tags: [Files]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: blobName
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: container
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: businessUnitId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Metadata del archivo
 */
router.get(
  "/metadata",
  authenticate as any,
  async (req: AuthenticatedRequest, res: Response): Promise<any> => {
    try {
      const { blobName, container, businessUnitId } = req.query;

      if (
        typeof blobName !== "string" ||
        typeof container !== "string" ||
        typeof businessUnitId !== "string"
      ) {
        return res.status(400).json({
          error: "blobName, container, and businessUnitId are required",
        });
      }

      if (!req.user || !req.user.tenantId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const metadata = await fileStorageService.getFileMetadata(
        blobName,
        container,
        req.user.tenantId,
        businessUnitId,
      );

      res.json(metadata);
    } catch (error: any) {
      console.error("[FileRoutes] Metadata error:", error);
      res.status(500).json({ error: error.message });
    }
  } as any,
);

export { router as fileRouter };
