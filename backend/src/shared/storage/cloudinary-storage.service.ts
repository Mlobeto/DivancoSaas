/**
 * CLOUDINARY STORAGE SERVICE
 * Reemplaza AzureBlobStorageService para subir PDFs, contratos y documentos.
 * Mantiene la misma interfaz pública para compatibilidad con los servicios existentes.
 */

import { v2 as cloudinary } from "cloudinary";
import { v4 as uuidv4 } from "uuid";

export interface UploadFileParams {
  file: Buffer;
  fileName: string;
  contentType?: string;
  folder?: string; // ej: "quotations", "contracts", "invoices"
  tenantId: string;
  businessUnitId?: string;
}

export interface UploadFileResult {
  url: string;
  blobName: string; // public_id en Cloudinary
  containerName: string; // carpeta raíz usada
  size: number;
}

export class CloudinaryStorageService {
  private readonly rootFolder: string;
  private isReady: boolean = false;

  constructor() {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    this.rootFolder = process.env.CLOUDINARY_ROOT_FOLDER || "divancosaas";

    if (!cloudName || !apiKey || !apiSecret) {
      console.warn(
        "⚠️  CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET not configured. File uploads will fail.",
      );
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.isReady = true;
    console.log(
      `✅ Cloudinary Storage initialized: rootFolder="${this.rootFolder}"`,
    );
  }

  /**
   * Subir archivo a Cloudinary
   */
  async uploadFile(params: UploadFileParams): Promise<UploadFileResult> {
    if (!this.isReady) {
      throw new Error("Cloudinary Storage not configured");
    }

    const folder = this.buildFolder(
      params.tenantId,
      params.businessUnitId,
      params.folder,
    );

    const publicId = this.buildPublicId(params.fileName);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: "auto",
            overwrite: false,
          },
          (error: any, result: any) => {
            if (error) reject(error);
            else resolve(result);
          },
        )
        .end(params.file);
    });

    return {
      url: result.secure_url,
      blobName: result.public_id,
      containerName: folder,
      size: result.bytes,
    };
  }

  /**
   * Generar URL de acceso (Cloudinary URLs son públicas por defecto)
   * Para archivos privados usa signed URLs con expiración
   */
  async generateSasUrl(
    _containerName: string,
    blobName: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    if (!this.isReady) {
      throw new Error("Cloudinary Storage not configured");
    }

    // Detectar si es PDF/documento (raw) o imagen
    // El public_id puede contener pistas: pdfs tienen "pdf" en el path
    const isPdf =
      blobName.toLowerCase().includes("/pdf") ||
      blobName.toLowerCase().includes("quotation") ||
      blobName.toLowerCase().includes("contract") ||
      blobName.toLowerCase().includes("invoice") ||
      blobName.toLowerCase().includes("document");
    const resourceType = isPdf ? "raw" : "image";

    const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

    return cloudinary.url(blobName, {
      resource_type: resourceType,
      sign_url: true,
      expires_at: expiresAt,
      secure: true,
    });
  }

  /**
   * Descargar archivo como Buffer
   */
  async downloadFile(blobName: string): Promise<Buffer> {
    if (!this.isReady) {
      throw new Error("Cloudinary Storage not configured");
    }

    const resource = await cloudinary.api.resource(blobName, {
      resource_type: "auto",
    });

    const response = await fetch(resource.secure_url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Eliminar archivo
   */
  async deleteFile(blobName: string): Promise<void> {
    if (!this.isReady) {
      throw new Error("Cloudinary Storage not configured");
    }

    await cloudinary.uploader.destroy(blobName, { resource_type: "auto" });
  }

  /**
   * Verificar si un archivo existe
   */
  async fileExists(blobName: string): Promise<boolean> {
    if (!this.isReady) return false;

    try {
      await cloudinary.api.resource(blobName, { resource_type: "auto" });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Listar archivos de un tenant/folder
   */
  async listFiles(
    tenantId: string,
    folder?: string,
  ): Promise<Array<{ name: string; url: string; size: number }>> {
    if (!this.isReady) return [];

    const prefix = folder
      ? `${this.rootFolder}/tenant-${tenantId}/${folder}`
      : `${this.rootFolder}/tenant-${tenantId}`;

    const result = await cloudinary.api.resources({
      type: "upload",
      prefix,
      max_results: 100,
      resource_type: "auto",
    });

    return result.resources.map((r: any) => ({
      name: r.public_id,
      url: r.secure_url,
      size: r.bytes,
    }));
  }

  // ─────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────

  private buildFolder(
    tenantId: string,
    businessUnitId?: string,
    subFolder?: string,
  ): string {
    const parts = [this.rootFolder, `tenant-${tenantId}`];
    if (businessUnitId) parts.push(`bu-${businessUnitId}`);
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

// Singleton
export const cloudinaryStorageService = new CloudinaryStorageService();
