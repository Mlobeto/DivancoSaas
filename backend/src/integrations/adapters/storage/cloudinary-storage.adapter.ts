/**
 * Cloudinary Storage Adapter
 * Implementación del contrato FileStorageProvider usando Cloudinary
 *
 * Documentación: https://cloudinary.com/documentation/node_integration
 *
 * Requisitos (variables de entorno):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 */

import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import sharp from "sharp";
import { logger } from "../../../core/utils/logger";
import {
  FileStorageProvider,
  UploadFileParams,
  UploadFileResult,
  DownloadFileParams,
  DownloadFileResult,
  DeleteFileParams,
  GenerateSasTokenParams,
  ProcessImageParams,
  ProcessedImageResult,
  ListFilesParams,
  FileMetadata,
} from "../../../core/contracts/file-storage.provider";

export interface CloudinaryStorageConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  /** Carpeta raíz en Cloudinary (ej: "divancosaas") */
  rootFolder?: string;
}

export class CloudinaryStorageAdapter implements FileStorageProvider {
  private readonly rootFolder: string;

  constructor(private config: CloudinaryStorageConfig) {
    this.rootFolder = config.rootFolder || "divancosaas";

    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: true,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // UPLOAD
  // ─────────────────────────────────────────────────────────────
  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    try {
      const folder = this.buildFolder(
        params.tenantId,
        params.businessUnitId,
        params.container,
        params.folder,
      );

      const publicId = this.buildPublicId(params.fileName);

      const options: UploadApiOptions = {
        folder,
        public_id: publicId,
        resource_type: "auto",
        overwrite: false,
        context: params.metadata
          ? Object.entries(params.metadata)
              .map(([k, v]) => `${k}=${v}`)
              .join("|")
          : undefined,
      };

      const result = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(options, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(params.file);
      });

      return {
        url: result.secure_url,
        blobName: result.public_id,
        size: result.bytes,
        mimeType:
          result.resource_type === "image"
            ? `image/${result.format}`
            : params.mimeType,
        uploadedAt: new Date(result.created_at),
      };
    } catch (error: any) {
      logger.error(
        { error, fileName: params.fileName },
        "[CloudinaryStorageAdapter] Upload error",
      );
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DOWNLOAD (descarga el buffer via URL pública)
  // ─────────────────────────────────────────────────────────────
  async downloadFile(params: DownloadFileParams): Promise<DownloadFileResult> {
    try {
      const result = await cloudinary.api.resource(params.blobName, {
        resource_type: "auto",
      });

      const response = await fetch(result.secure_url);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return {
        buffer,
        mimeType:
          result.resource_type === "image"
            ? `image/${result.format}`
            : "application/octet-stream",
        size: result.bytes,
      };
    } catch (error: any) {
      logger.error(
        { error, blobName: params.blobName },
        "[CloudinaryStorageAdapter] Download error",
      );
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────────────────────
  async deleteFile(params: DeleteFileParams): Promise<void> {
    try {
      await cloudinary.uploader.destroy(params.blobName, {
        resource_type: "auto",
      });
    } catch (error: any) {
      logger.error(
        { error, blobName: params.blobName },
        "[CloudinaryStorageAdapter] Delete error",
      );
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SIGNED URL (equivalente a SAS token)
  // Cloudinary genera URLs firmadas con tiempo de expiración
  // ─────────────────────────────────────────────────────────────
  async generateSasToken(params: GenerateSasTokenParams): Promise<string> {
    try {
      const expiresAt = Math.floor(Date.now() / 1000) + params.expiresIn;

      const signedUrl = cloudinary.url(params.blobName, {
        resource_type: "auto",
        type: "authenticated",
        sign_url: true,
        expires_at: expiresAt,
        secure: true,
      });

      return signedUrl;
    } catch (error: any) {
      logger.error(
        { error, blobName: params.blobName },
        "[CloudinaryStorageAdapter] Signed URL error",
      );
      throw new Error(`Failed to generate signed URL: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // IMAGE PROCESSING via Sharp
  // ─────────────────────────────────────────────────────────────
  async processImage(
    params: ProcessImageParams,
  ): Promise<ProcessedImageResult> {
    try {
      let sharpInstance = sharp(params.file);

      if (params.options.resize) {
        sharpInstance = sharpInstance.resize({
          width: params.options.resize.width,
          height: params.options.resize.height,
          fit: params.options.resize.fit || "cover",
        });
      }

      const format = params.options.format || "jpeg";
      const quality = params.options.quality || 80;

      switch (format) {
        case "jpeg":
          sharpInstance = sharpInstance.jpeg({ quality });
          break;
        case "png":
          sharpInstance = sharpInstance.png({ quality });
          break;
        case "webp":
          sharpInstance = sharpInstance.webp({ quality });
          break;
        case "avif":
          sharpInstance = sharpInstance.avif({ quality });
          break;
      }

      if (params.options.thumbnail) {
        sharpInstance = sharpInstance.resize({
          width: params.options.thumbnail.width,
          height: params.options.thumbnail.height,
          fit: "cover",
        });
      }

      const buffer = await sharpInstance.toBuffer();
      const metadata = await sharp(buffer).metadata();

      return {
        buffer,
        format: metadata.format || format,
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
      };
    } catch (error: any) {
      logger.error(
        { error },
        "[CloudinaryStorageAdapter] Image processing error",
      );
      throw new Error(`Failed to process image: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // LIST FILES
  // ─────────────────────────────────────────────────────────────
  async listFiles(params: ListFilesParams): Promise<FileMetadata[]> {
    try {
      const folder = this.buildFolder(
        params.tenantId,
        params.businessUnitId,
        params.container,
      );
      const prefix = params.prefix ? `${folder}/${params.prefix}` : folder;

      const result = await cloudinary.api.resources({
        type: "upload",
        prefix,
        max_results: params.maxResults || 100,
        resource_type: "auto",
      });

      return result.resources.map((r: any) => ({
        blobName: r.public_id,
        url: r.secure_url,
        size: r.bytes,
        mimeType:
          r.resource_type === "image"
            ? `image/${r.format}`
            : "application/octet-stream",
        lastModified: new Date(r.created_at),
      }));
    } catch (error: any) {
      logger.error({ error }, "[CloudinaryStorageAdapter] List files error");
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // FILE EXISTS
  // ─────────────────────────────────────────────────────────────
  async fileExists(blobName: string, _container: string): Promise<boolean> {
    try {
      await cloudinary.api.resource(blobName, { resource_type: "auto" });
      return true;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // GET FILE METADATA
  // ─────────────────────────────────────────────────────────────
  async getFileMetadata(
    blobName: string,
    _container: string,
  ): Promise<FileMetadata> {
    try {
      const r = await cloudinary.api.resource(blobName, {
        resource_type: "auto",
      });
      return {
        blobName: r.public_id,
        url: r.secure_url,
        size: r.bytes,
        mimeType:
          r.resource_type === "image"
            ? `image/${r.format}`
            : "application/octet-stream",
        lastModified: new Date(r.created_at),
      };
    } catch (error: any) {
      throw new Error(`Failed to get file metadata: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // IS CONFIGURED
  // ─────────────────────────────────────────────────────────────
  async isConfigured(
    _tenantId: string,
    _businessUnitId: string,
  ): Promise<boolean> {
    try {
      await cloudinary.api.ping();
      return true;
    } catch {
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────
  private buildFolder(
    tenantId: string,
    businessUnitId: string,
    container: string,
    subFolder?: string,
  ): string {
    const parts = [
      this.rootFolder,
      `tenant-${tenantId}`,
      `bu-${businessUnitId}`,
      container,
    ];
    if (subFolder) parts.push(subFolder);
    return parts.join("/");
  }

  private buildPublicId(fileName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const ext = fileName.split(".").pop();
    const base = fileName
      .replace(`.${ext}`, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-");
    return `${base}-${timestamp}-${random}`;
  }
}
